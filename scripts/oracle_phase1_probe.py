"""Reproducible phase-1 feasibility probe; surrogate probes are NOT product models.

Run with services/solver-api/.venv/Scripts/python.exe from the repository root.
The repository service is explicitly prepended so an old installed app cannot win.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
import json
from pathlib import Path
import platform
import sys
from time import monotonic, perf_counter, sleep
from threading import Thread
import tracemalloc

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "solver-api"))

import numpy as np
import scipy
from scipy.interpolate import RegularGridInterpolator
from scipy.linalg import cholesky, cho_solve, solve_triangular

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.oracle.baseline import evaluate_baseline
from app.oracle.implied_volatility import build_target
from app.oracle.models import BUDGET_SHAPES, ReferenceRequest, SamplingRequest, default_reference_request
from app.oracle.preprocessing import training_transform
from app.oracle.reference import generate_reference
from app.oracle.sampling import sample_training


def timed(function):
    start = perf_counter()
    result = function()
    return result, (perf_counter() - start) * 1000


def initialize(width=32):
    generator = np.random.default_rng(np.random.SeedSequence([42, 1]))
    dimensions = (2, width, width, 1)
    parameters = []
    for source, destination in zip(dimensions, dimensions[1:]):
        bound = np.sqrt(6 / (source + destination))
        parameters.extend((generator.uniform(-bound, bound, (source, destination)), np.zeros(destination)))
    return parameters


def network(parameters, x):
    hidden1 = np.tanh(x @ parameters[0] + parameters[1])
    hidden2 = np.tanh(hidden1 @ parameters[2] + parameters[3])
    return (hidden2 @ parameters[4] + parameters[5]).ravel()


def loss_gradient(parameters, x, y, regularization=1e-4):
    hidden1 = np.tanh(x @ parameters[0] + parameters[1])
    hidden2 = np.tanh(hidden1 @ parameters[2] + parameters[3])
    errors = (hidden2 @ parameters[4] + parameters[5]).ravel() - y
    # Loss = mean(error^2) + lambda * sum(weight^2); biases are not regularized.
    loss = np.mean(errors**2) + regularization * sum(np.sum(parameters[i]**2) for i in (0, 2, 4))
    output_gradient = (2 * errors / len(y))[:, None]
    hidden2_gradient = (output_gradient @ parameters[4].T) * (1 - hidden2**2)
    hidden1_gradient = (hidden2_gradient @ parameters[2].T) * (1 - hidden1**2)
    gradient = [x.T @ hidden1_gradient, hidden1_gradient.sum(axis=0), hidden1.T @ hidden2_gradient,
                hidden2_gradient.sum(axis=0), hidden2.T @ output_gradient, output_gradient.sum(axis=0)]
    for i in (0, 2, 4):
        gradient[i] += 2 * regularization * parameters[i]
    return float(loss), gradient


def train(x, y, width=32, epochs=300):
    parameters = initialize(width)
    first = [np.zeros_like(p) for p in parameters]
    second = [np.zeros_like(p) for p in parameters]
    initial = loss_gradient(parameters, x, y)[0]
    for step in range(1, epochs + 1):
        _, gradients = loss_gradient(parameters, x, y)
        for index, gradient in enumerate(gradients):
            first[index] = .9 * first[index] + .1 * gradient
            second[index] = .999 * second[index] + .001 * gradient**2
            parameters[index] -= .01 * (first[index] / (1 - .9**step)) / (np.sqrt(second[index] / (1 - .999**step)) + 1e-8)
    return parameters, initial, loss_gradient(parameters, x, y)[0]


def check_gradient():
    x = np.array([[.1, .2], [.3, .7], [.9, .4]])
    y = np.array([.2, .8, -.1])
    parameters = initialize(3)
    _, gradients = loss_gradient(parameters, x, y)
    largest = 0
    for parameter, gradient in zip(parameters, gradients):
        for index in np.ndindex(parameter.shape):
            original = parameter[index]
            parameter[index] = original + 1e-6
            upper = loss_gradient(parameters, x, y)[0]
            parameter[index] = original - 1e-6
            lower = loss_gradient(parameters, x, y)[0]
            parameter[index] = original
            largest = max(largest, abs((upper - lower) / 2e-6 - gradient[index]))
    assert largest < 1e-7, largest
    return largest


def kernel(left, right):
    distances = np.sum(((left[:, None, :] - right[None, :, :]) / .35)**2, axis=2)
    return np.exp(-.5 * distances)


def gp_fit(x, y, noise):
    covariance = kernel(x, x) + np.diag(noise**2 + 1e-10)
    factor, factor_ms = timed(lambda: cholesky(covariance, lower=True))
    return (factor, cho_solve((factor, True), y), x), factor_ms


def gp_predict(fit, query):
    factor, weights, x = fit
    means, variances = [], []
    for start in range(0, len(query), 256):
        cross = kernel(query[start:start + 256], x)
        projected = solve_triangular(factor, cross.T, lower=True)
        means.extend(cross @ weights)
        variances.extend(1 - np.sum(projected**2, axis=0))
    return np.array(means), np.array(variances)


def gp_fixture():
    x, query = np.array([[0., 0.], [1., 1.]]), np.array([[.25, .25]])
    y, noise = np.array([1., -1.]), np.array([.1, .2])
    (fit, _), _ = timed(lambda: gp_fit(x, y, noise))
    mean, variance = gp_predict(fit, query)
    covariance = kernel(x, x) + np.diag(noise**2 + 1e-10)
    # Independent 2x2 closed-form inverse, used only as a verification fixture.
    a, b, c, d = covariance.ravel()
    inverse = np.array([[d, -b], [-c, a]]) / (a * d - b * c)
    cross = kernel(query, x)
    mean_error = float(abs(mean[0] - (cross @ inverse @ y)[0]))
    variance_error = float(abs(variance[0] - (1 - cross @ inverse @ cross.T)[0, 0]))
    assert max(mean_error, variance_error) < 1e-12
    return {"mean_error": mean_error, "variance_error": variance_error}


def surrogate_probe(reference, budget):
    target = build_target(reference, "price")
    samples = sample_training(target, SamplingRequest(budget=budget))
    transform = training_transform(samples)
    x = transform.coordinates(samples.coordinates)
    y = transform.targets(samples.values)
    spot, tau = np.meshgrid(reference.axes.spots, reference.axes.times_to_maturity)
    coordinates = np.column_stack((spot.ravel(), tau.ravel()))
    query = transform.coordinates(coordinates)
    rows, columns = samples.shape
    training_coordinates = np.asarray(samples.coordinates).reshape(rows, columns, 2)
    spline, fit_ms = timed(lambda: RegularGridInterpolator(
        (training_coordinates[:, 0, 1], training_coordinates[0, :, 0]),
        np.asarray(samples.values).reshape(samples.shape), method="cubic", bounds_error=False, fill_value=None,
        solver_args={"rtol": 1e-12, "atol": 1e-12}))
    predictions, inference_ms = timed(lambda: spline(coordinates[:, ::-1]))
    knot_error = float(np.max(np.abs(spline(np.asarray(samples.coordinates)[:, ::-1]) - samples.values)))
    assert knot_error < 1e-8
    result = {"spline": {"fit_ms": fit_ms, "inference_ms": inference_ms, "max_knot_error": knot_error}}
    (fit, factor_ms), fit_ms = timed(lambda: gp_fit(x, y, np.asarray(samples.standard_errors) / transform.scale))
    (means, variances), inference_ms = timed(lambda: gp_predict(fit, query))
    assert np.all(np.isfinite(means)) and np.min(variances) >= -1e-10
    result["gp"] = {"fit_ms": fit_ms, "factor_ms": factor_ms, "inference_ms": inference_ms, "minimum_variance": float(np.min(variances))}
    for residual in (False, True):
        started = perf_counter()
        values = np.asarray(samples.values)
        if residual:
            values = values - evaluate_baseline(samples.coordinates, reference.configuration.market, "call", "price")
        current_transform = training_transform(samples, values)
        parameters, initial, final = train(x, current_transform.targets(values))
        fit_ms = (perf_counter() - started) * 1000
        def predict():
            prediction = current_transform.restore(network(parameters, query))
            if residual:
                prediction += evaluate_baseline(coordinates, reference.configuration.market, "call", "price")
            return prediction
        predictions, inference_ms = timed(predict)
        assert np.all(np.isfinite(predictions)) and final < initial
        result["residual_mlp" if residual else "mlp"] = {"fit_ms": fit_ms, "inference_ms": inference_ms, "initial_loss": initial, "final_loss": final}
    return result


@contextmanager
def tracked_allocations():
    tracemalloc.start()
    try:
        yield
    finally:
        tracemalloc.stop()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    blas = np.__config__.CONFIG.get("Build Dependencies", {}).get("blas", {})
    report = {"environment": {"python": sys.version, "numpy": np.__version__, "scipy": scipy.__version__,
                              "platform": platform.platform(), "processor": platform.processor(),
                              "blas": {key: blas.get(key) for key in ("name", "version", "openblas configuration")}},
              "note": "Single local observations; surrogate probes are feasibility code, not production adapters. Tracemalloc is tracked allocation peak, not total process RSS."}
    with tracked_allocations():
        reference, elapsed = timed(lambda: generate_reference(ReferenceRequest()))
        report["default_reference"] = {"wall_ms": elapsed, "compute_ms": reference.timing.reference_ms,
                                       "tracked_peak_mib": tracemalloc.get_traced_memory()[1] / 2**20,
                                       "serialized_bytes": len(reference.model_dump_json().encode()), "reference_id": reference.reference_id}
    # Nearly the operation ceiling, while satisfying all individual dimension limits.
    capped = ReferenceRequest(domain={"spot_nodes": 81, "tau_nodes": 81}, monte_carlo={"paths": 18518})
    with tracked_allocations():
        cap_reference, elapsed = timed(lambda: generate_reference(capped))
        report["capped_reference"] = {"operations": capped.estimated_operations, "wall_ms": elapsed,
                                      "tracked_peak_mib": tracemalloc.get_traced_memory()[1] / 2**20,
                                      "serialized_bytes": len(cap_reference.model_dump_json().encode())}
    largest_block = ReferenceRequest(domain={"spot_nodes": 20, "tau_nodes": 20}, monte_carlo={"paths": 100000})
    with tracked_allocations():
        _, elapsed = timed(lambda: generate_reference(largest_block))
        report["max_path_reference"] = {"wall_ms": elapsed, "paths": 100000,
                                       "tracked_peak_mib": tracemalloc.get_traced_memory()[1] / 2**20}
    narrow = default_reference_request("implied_volatility")
    iv_reference = generate_reference(narrow)
    iv, elapsed = timed(lambda: build_target(iv_reference, "implied_volatility"))
    report["iv_default"] = {"wall_ms": elapsed, "invalid_nodes": sum(not v for row in iv.valid_mask for v in row),
                            "budgets": [sample_training(iv, SamplingRequest(budget=n)).count for n in BUDGET_SHAPES]}
    report["gradient_max_error"] = check_gradient()
    report["gp_fixture"] = gp_fixture()
    for count, ref in ((128, reference), (256, cap_reference)):
        with tracked_allocations():
            report[f"surrogate_probe_{count}"] = surrogate_probe(ref, count)
            report[f"surrogate_probe_{count}"]["tracked_peak_mib"] = tracemalloc.get_traced_memory()[1] / 2**20
    generator = np.random.default_rng(123)
    x = generator.uniform(0, 1, (128, 2))
    for name, y in (("smooth", x[:, 0] + x[:, 1]**2), ("constant", np.full(128, .2))):
        _, initial, final = train(x, y)
        assert final < initial and final < .02
        report[f"mlp_{name}"] = {"initial_loss": initial, "final_loss": final}
    (_, initial, final), elapsed = timed(lambda: train(generator.uniform(0, 1, (256, 2)), np.zeros(256), width=64, epochs=1000))
    report["mlp_cap"] = {"wall_ms": elapsed, "width": 64, "epochs": 1000, "initial_loss": initial, "final_loss": final}
    control = ExecutionControl(monotonic() + 30)
    stopped_at = []
    def stop():
        sleep(.05)
        stopped_at.append(perf_counter())
        control.stop("probe cancellation")
    stopper = Thread(target=stop)
    token = bind_execution(control)
    try:
        stopper.start()
        try:
            generate_reference(largest_block)
            raise AssertionError("Reference completed without observing cancellation")
        except ExecutionStopped:
            report["cancellation_ms"] = (perf_counter() - stopped_at[0]) * 1000
    finally:
        stopper.join()
        reset_execution(token)
    output = json.dumps(report, indent=2, allow_nan=False)
    if args.output:
        args.output.write_text(output + "\n", encoding="utf-8")
    print(output)


if __name__ == "__main__":
    main()
