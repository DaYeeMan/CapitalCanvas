"""Cubic interpolation and exact GP on normalized shared training data."""
from dataclasses import dataclass

import numpy as np
from scipy.interpolate import RegularGridInterpolator
from scipy.linalg import cholesky, cho_solve, solve_triangular

from app.execution import check_execution
from app.delphi.contracts import GPSettings
from app.delphi.models import NumericalError, SampleSet
from app.delphi.preprocessing import TrainingTransform


def fit_spline(samples: SampleSet, transform: TrainingTransform) -> RegularGridInterpolator:
    check_execution()
    coordinates = transform.coordinates(samples.coordinates).reshape(*samples.shape, 2)
    return RegularGridInterpolator(
        (coordinates[:, 0, 1], coordinates[0, :, 0]),
        transform.targets(samples.values).reshape(samples.shape),
        method="cubic", bounds_error=False, fill_value=None,
        solver_args={"rtol": 1e-12, "atol": 1e-12},
    )


def rbf(left: np.ndarray, right: np.ndarray, scale: float) -> np.ndarray:
    return np.exp(-.5 * np.sum(((left[:, None, :] - right[None, :, :]) / scale)**2, axis=2))


@dataclass
class GaussianProcess:
    x: np.ndarray
    factor: np.ndarray
    weights: np.ndarray
    length_scale: float
    jitter: float

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


def fit_gp(samples: SampleSet, transform: TrainingTransform, settings: GPSettings) -> GaussianProcess:
    check_execution()
    x, y = transform.coordinates(samples.coordinates), transform.targets(samples.values)
    noise = np.maximum(np.asarray(samples.standard_errors) / transform.scale, settings.noise_floor)
    with np.errstate(over="raise", invalid="raise"):
        covariance = rbf(x, x, settings.length_scale) + np.diag(noise**2)
    for jitter in (1e-10, 1e-8, 1e-6, 1e-4):
        check_execution()
        try:
            factor = cholesky(covariance + np.eye(len(x)) * jitter, lower=True)
            weights = cho_solve((factor, True), y)
            return GaussianProcess(x, factor, weights, settings.length_scale, jitter)
        except np.linalg.LinAlgError:
            continue
    raise NumericalError("gp_factorization", "GP covariance could not be factored with bounded jitter")
