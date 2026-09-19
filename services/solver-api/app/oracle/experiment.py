"""Fit each model on one immutable sample set, then score on common masks."""
import logging
from time import perf_counter

import numpy as np

from app.execution import ExecutionStopped, check_execution
from app.oracle import mlp
from app.oracle.baseline import BASELINE_VERSION, evaluate_baseline, reconstruct, residual_targets
from app.oracle.contracts import Diagnostics, ExperimentRequest, ExperimentResult, Snapshot, SurrogateResult
from app.oracle.evaluation import evaluate_predictions
from app.oracle.implied_volatility import build_target
from app.oracle.models import NumericalError, content_id
from app.oracle.preprocessing import training_transform
from app.oracle.sampling import sample_training
from app.oracle.surrogates import fit_gp, fit_spline

logger = logging.getLogger("ithaca.oracle")


def matrix(values, shape, valid):
    data = np.asarray(values).reshape(shape)
    return [[float(value) if valid[row][column] else None for column, value in enumerate(values_row)] for row, values_row in enumerate(data)]


def run_experiment(request: ExperimentRequest) -> ExperimentResult:
    started = perf_counter()
    check_execution()
    reference = request.reference
    target = build_target(reference, request.target)
    sampling_started = perf_counter()
    samples = sample_training(target, request.sampling)
    sampling_ms = (perf_counter() - sampling_started) * 1000
    spot, tau = np.meshgrid(reference.axes.spots, reference.axes.times_to_maturity)
    coordinates = np.column_stack((spot.ravel(), tau.ravel()))
    shape, valid = target.axes.shape, np.asarray(target.valid_mask)
    results, evaluation_ms = [], 0.0
    for method in request.methods:
        check_execution()
        try:
            fit_started = perf_counter()
            residual = method == "residual_mlp"
            values = None
            if residual:
                baseline_train = evaluate_baseline(samples.coordinates, reference.configuration.market, reference.configuration.option_side, request.target)
                values = residual_targets(np.asarray(samples.values), baseline_train)
            transform = training_transform(samples, values)
            diagnostics = {"model": method, "target_scale_floored": transform.scale_floored}
            if method == "cubic_spline":
                fitted = fit_spline(samples, transform)
            elif method == "gaussian_process":
                fitted = fit_gp(samples, transform, request.settings.gp)
                diagnostics["jitter"] = fitted.jitter
            else:
                fitted = mlp.train(transform.coordinates(samples.coordinates), transform.targets(samples.values if values is None else values), request.settings.mlp, request.training_seed)
                diagnostics.update(epochs=fitted.epochs, initial_loss=fitted.initial_loss, final_loss=fitted.final_loss)
                if residual:
                    diagnostics["baseline"] = BASELINE_VERSION
            fit_ms = (perf_counter() - fit_started) * 1000
            inference_started = perf_counter()
            query = transform.coordinates(coordinates)
            uncertainty = None
            if method == "cubic_spline":
                predictions = np.empty(len(query))
                for start in range(0, len(query), 256):
                    check_execution()
                    predictions[start:start + 256] = fitted(query[start:start + 256, ::-1])
            elif method == "gaussian_process":
                predictions, uncertainty = fitted.predict(query)
                uncertainty = transform.restore_stddev(uncertainty)
            else:
                predictions = mlp.predict(fitted.parameters, query)
            predictions = transform.restore(predictions)
            baseline_query = None
            if residual:
                baseline_query = evaluate_baseline(coordinates, reference.configuration.market, reference.configuration.option_side, request.target)
                predictions = reconstruct(baseline_query, predictions)
            predictions = predictions.reshape(shape)
            inference_ms = (perf_counter() - inference_started) * 1000
            check_execution()
            evaluation_started = perf_counter()
            evaluation = evaluate_predictions(target, samples, predictions)
            baseline_metrics = evaluate_predictions(target, samples, baseline_query.reshape(shape)) if residual else None
            evaluation_ms += (perf_counter() - evaluation_started) * 1000
            warnings = []
            diagnostics["extrapolated_nodes"] = evaluation.outside.count
            if evaluation.outside.count:
                warnings.append({"code": "extrapolation", "message": f"{evaluation.outside.count} valid nodes lie outside the training region. Extrapolation can be unreliable."})
            if request.target == "price":
                market = reference.configuration.market
                ds, dk = spot * np.exp(-market.dividend * tau), market.strike * np.exp(-market.rate * tau)
                lower = np.maximum(ds - dk, 0) if reference.configuration.option_side == "call" else np.maximum(dk - ds, 0)
                upper = ds if reference.configuration.option_side == "call" else dk
                violations = valid & ((predictions < lower - 1e-8) | (predictions > upper + 1e-8))
            else:
                violations = valid & (predictions < 0)
            diagnostics["bounds_violations"] = int(np.sum(violations))
            if np.any(violations):
                warnings.append({"code": "bounds_violations", "message": f"{int(np.sum(violations))} predictions violate financial bounds. Raw predictions are retained for evaluation."})
            if method in ("mlp", "residual_mlp"):
                warnings.append({"code": "epoch_budget", "message": f"Training stopped at the fixed {fitted.epochs}-epoch budget; convergence is not guaranteed."})
            if residual:
                warnings.append({"code": "gbm_residual", "message": "Black–Scholes is the analytical GBM expectation. This correction primarily fits Monte Carlo sampling error."})
            results.append(SurrogateResult(method=method, status="complete", training_count=samples.count,
                predictions=matrix(predictions, shape, valid), predictive_stddev=matrix(uncertainty, shape, valid) if uncertainty is not None else None,
                evaluation=evaluation, baseline_metrics=baseline_metrics, diagnostics=Diagnostics(**diagnostics),
                timing={"fit_ms": fit_ms, "inference_ms": inference_ms, "prediction_count": len(coordinates)}, warnings=warnings))
        except ExecutionStopped:
            raise
        except (ValueError, FloatingPointError, np.linalg.LinAlgError) as error:
            logger.warning("Oracle method %s failed: %s", method, error)
            results.append(SurrogateResult(method=method, status="failed", training_count=samples.count,
                error={"code": getattr(error, "code", "numerical_failure"), "message": str(error) if isinstance(error, NumericalError) else "Numerical fit failed. Check the domain or reduce model settings."}))
    check_execution()
    snapshot = Snapshot(reference=reference.configuration, target=request.target, sampling=request.sampling, methods=request.methods, settings=request.settings, training_seed=request.training_seed)
    identity = {"version": "oracle-fit-v1", "reference_id": reference.reference_id, "sample_set_id": samples.sample_set_id, "configuration": snapshot.model_dump(mode="json")}
    return ExperimentResult(experiment_id=content_id(identity), reference_id=reference.reference_id, sample_set_id=samples.sample_set_id,
        configuration_snapshot=snapshot, axes=reference.axes, target=target, samples=samples, methods=results,
        timings={"iv_conversion_ms": target.conversion_ms, "sampling_ms": sampling_ms, "evaluation_ms": evaluation_ms, "request_compute_ms": (perf_counter() - started) * 1000},
        warnings=target.warnings)
