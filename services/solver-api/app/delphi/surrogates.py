"""Cubic interpolation and exact GP on normalized shared training data."""
from dataclasses import dataclass

import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.linalg import cholesky, cho_solve, solve_triangular
from scipy.optimize import minimize

from app.execution import check_execution
from app.delphi.contracts import GP_MAX_FIT_EVALUATIONS, GPSettings
from app.delphi.models import NumericalError, SampleSet
from app.delphi.preprocessing import TARGET_SCALE_FLOOR, TrainingTransform


def fit_spline(samples: SampleSet, transform: TrainingTransform) -> RegularGridInterpolator:
    check_execution()
    coordinates = transform.coordinates(samples.coordinates).reshape(*samples.shape, 2)
    return RegularGridInterpolator(
        (coordinates[:, 0, 1], coordinates[0, :, 0]),
        transform.targets(samples.values).reshape(samples.shape),
        method="cubic", bounds_error=False, fill_value=None,
        solver_args={"rtol": 1e-12, "atol": 1e-12},
    )


def rbf(left: np.ndarray, right: np.ndarray, scale: float | tuple[float, float]) -> np.ndarray:
    return np.exp(-.5 * np.sum(((left[:, None, :] - right[None, :, :]) / scale)**2, axis=2))


@dataclass
class GaussianProcess:
    x: np.ndarray
    factor: np.ndarray
    weights: np.ndarray
    length_scale: tuple[float, float]
    jitter: float
    regularization: float
    validation_rmse: float
    initial_validation_rmse: float
    validation_rmse_by_axis: tuple[float, float]
    fit_evaluations: int
    fit_converged: bool

    def predict(self, query: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
        means, variances = [], []
        for start in range(0, len(query), 256):
            check_execution()
            cross = rbf(query[start:start + 256], self.x, self.length_scale)
            projected = solve_triangular(self.factor, cross.T, lower=True)
            variance = 1 - np.sum(projected**2, axis=0)
            if np.any(variance < -1e-8) or not np.all(np.isfinite(variance)):
                raise NumericalError("invalid_gp_variance", "GP variance failed numerical checks")
            means.append(cross @ self.weights)
            variances.append(np.maximum(variance, 0))
        return np.concatenate(means), np.sqrt(np.concatenate(variances))


def _factor_gp(covariance: np.ndarray) -> tuple[np.ndarray, float]:
    for jitter in (1e-10, 1e-8, 1e-6, 1e-4):
        check_execution()
        try:
            factor = cholesky(covariance + np.eye(len(covariance)) * jitter, lower=True)
            return factor, jitter
        except np.linalg.LinAlgError:
            continue
    raise NumericalError("gp_factorization", "GP covariance could not be factored with bounded jitter")


@dataclass(frozen=True)
class GPValidationFold:
    axis: int
    training_indices: np.ndarray
    validation_indices: np.ndarray
    training_distances: np.ndarray
    validation_distances: np.ndarray
    training_targets: np.ndarray
    validation_targets: np.ndarray
    observation_variances: np.ndarray
    scale_ratio: float


def _gp_validation_folds(samples: SampleSet, transform: TrainingTransform) -> tuple[GPValidationFold, ...]:
    """Two interior-stripe holdouts per axis; boundary levels stay in training."""
    x = transform.coordinates(samples.coordinates)
    values, errors = np.asarray(samples.values), np.asarray(samples.standard_errors)
    folds = []
    for axis in (0, 1):
        interior = np.unique(x[:, axis])[1:-1]
        for parity in (0, 1):
            check_execution()
            held = np.isin(x[:, axis], interior[parity::2])
            kept = ~held
            mean = float(np.mean(values[kept]))
            scale = max(float(np.std(values[kept])), TARGET_SCALE_FLOOR)
            folds.append(GPValidationFold(
                axis=axis, training_indices=np.flatnonzero(kept), validation_indices=np.flatnonzero(held),
                training_distances=(x[kept, None, :] - x[None, kept, :])**2,
                validation_distances=(x[held, None, :] - x[None, kept, :])**2,
                training_targets=(values[kept] - mean) / scale,
                validation_targets=(values[held] - mean) / scale,
                observation_variances=(errors[kept] / scale)**2,
                scale_ratio=scale / transform.scale,
            ))
    return tuple(folds)


def _gp_validation_objective(parameters: np.ndarray, folds: tuple[GPValidationFold, ...]) -> tuple[float, np.ndarray, np.ndarray]:
    """Balanced spatial validation MSE and its log-parameter gradient.

    Fold fits use retained targets only. The full training scale is just a
    common score unit; it cancels when restoring validation RMSE to physical units.
    """
    scales, regularization = np.exp(parameters[:2]), float(np.exp(parameters[2]))
    axis_losses, gradient = np.zeros(2), np.zeros(3)
    for fold in folds:
        check_execution()
        distances, cross_distances = fold.training_distances, fold.validation_distances
        kernel = np.exp(-.5 * np.sum(distances / scales**2, axis=2))
        cross = np.exp(-.5 * np.sum(cross_distances / scales**2, axis=2))
        factor, _ = _factor_gp(kernel + np.diag(fold.observation_variances + regularization**2))
        weights = cho_solve((factor, True), fold.training_targets)
        errors = cross @ weights - fold.validation_targets
        # Two folds per axis, with equal total weight for spot and maturity.
        weight = fold.scale_ratio**2 / len(folds)
        axis_losses[fold.axis] += 2 * weight * np.mean(errors**2)
        for parameter in range(3):
            if parameter < 2:
                kernel_derivative = kernel * distances[:, :, parameter] / scales[parameter]**2
                cross_derivative = cross * cross_distances[:, :, parameter] / scales[parameter]**2
                derivative = cross_derivative @ weights - cross @ cho_solve((factor, True), kernel_derivative @ weights)
            else:
                derivative = -cross @ cho_solve((factor, True), 2 * regularization**2 * weights)
            gradient[parameter] += 2 * weight * np.mean(errors * derivative)
    return float(np.mean(axis_losses)), gradient, axis_losses


class _GPFitBudgetReached(Exception):
    pass


def fit_gp(samples: SampleSet, transform: TrainingTransform, settings: GPSettings) -> GaussianProcess:
    check_execution()
    x, y = transform.coordinates(samples.coordinates), transform.targets(samples.values)
    observation_variances = (np.asarray(samples.standard_errors) / transform.scale)**2
    folds = _gp_validation_folds(samples, transform)
    bounds = np.log([[.05, 2], [.05, 2], [settings.noise_floor, .5]])
    best_value, best_parameters = float("inf"), None
    best_axis_losses = None
    evaluations, converged_values = 0, []
    initial_value = None

    def objective(parameters):
        nonlocal best_value, best_parameters, best_axis_losses, evaluations, initial_value
        check_execution()
        if evaluations >= GP_MAX_FIT_EVALUATIONS:
            raise _GPFitBudgetReached
        evaluations += 1
        value, gradient, axis_losses = _gp_validation_objective(parameters, folds)
        if not np.isfinite(value) or not np.all(np.isfinite(gradient)):
            raise NumericalError("gp_fit", "GP spatial validation failed numerical checks")
        if initial_value is None:
            initial_value = value
        if value < best_value:
            best_value, best_parameters = value, parameters.copy()
            best_axis_losses = axis_losses.copy()
        return value, gradient

    # Fixed starts keep identical training sets reproducible. Neither the query
    # grid nor evaluation targets participate in fitting or model selection.
    for start in (.001, .03):
        parameters = np.log([settings.length_scale, settings.length_scale, max(start, settings.noise_floor)])
        try:
            result = minimize(objective, parameters, jac=True, method="L-BFGS-B", bounds=bounds,
                              options={"maxiter": 40, "maxfun": GP_MAX_FIT_EVALUATIONS // 2,
                                       "maxls": 20, "ftol": 1e-9, "gtol": 1e-7})
            if result.success:
                converged_values.append(float(result.fun))
        except _GPFitBudgetReached:
            break
    if best_parameters is None or best_axis_losses is None or initial_value is None:
        raise NumericalError("gp_fit", "GP fitting did not produce a finite candidate")
    scales = tuple(float(value) for value in np.exp(best_parameters[:2]))
    regularization = float(np.exp(best_parameters[2]))
    covariance = rbf(x, x, scales) + np.diag(observation_variances + regularization**2)
    factor, jitter = _factor_gp(covariance)
    return GaussianProcess(
        x=x, factor=factor, weights=cho_solve((factor, True), y), length_scale=scales, jitter=jitter,
        regularization=regularization, validation_rmse=float(np.sqrt(best_value) * transform.scale),
        initial_validation_rmse=float(np.sqrt(initial_value) * transform.scale),
        validation_rmse_by_axis=tuple(float(np.sqrt(value) * transform.scale) for value in best_axis_losses),
        fit_evaluations=evaluations,
        fit_converged=any(np.isclose(best_value, value, rtol=1e-7, atol=1e-7) for value in converged_values),
    )
