"""Training-only normalization; queries outside the training box remain outside."""
from dataclasses import dataclass

import numpy as np

from app.execution import check_execution
from app.delphi.models import NumericalError, SampleSet

TARGET_SCALE_FLOOR = 1e-8


@dataclass(frozen=True)
class TrainingTransform:
    origin: tuple[float, float]
    span: tuple[float, float]
    mean: float
    scale: float
    scale_floored: bool

    def coordinates(self, coordinates: np.ndarray) -> np.ndarray:
        values = np.asarray(coordinates, dtype=float)
        if values.ndim != 2 or values.shape[1] != 2 or not np.all(np.isfinite(values)):
            raise NumericalError("normalization_coordinates", "Expected finite (spot, maturity) coordinates")
        return (values - self.origin) / self.span

    def targets(self, values: np.ndarray) -> np.ndarray:
        return (np.asarray(values, dtype=float) - self.mean) / self.scale

    def restore(self, values: np.ndarray) -> np.ndarray:
        return np.asarray(values, dtype=float) * self.scale + self.mean

    def restore_stddev(self, values: np.ndarray) -> np.ndarray:
        return np.asarray(values, dtype=float) * self.scale


def training_transform(samples: SampleSet, residuals: np.ndarray | None = None) -> TrainingTransform:
    check_execution()
    values = np.asarray(samples.values if residuals is None else residuals, dtype=float)
    if values.shape != (samples.count,) or not np.all(np.isfinite(values)):
        raise NumericalError("normalization_targets", "Normalization requires one finite target per training sample")
    bounds = samples.bounds
    with np.errstate(over="ignore", invalid="ignore"):
        mean, scale = float(np.mean(values)), float(np.std(values))
    if not np.isfinite(mean) or not np.isfinite(scale):
        raise NumericalError("normalization_overflow", "Training targets exceed the normalization range")
    return TrainingTransform(
        origin=(bounds.spot_min, bounds.tau_min),
        span=(bounds.spot_max - bounds.spot_min, bounds.tau_max - bounds.tau_min),
        mean=mean, scale=max(scale, TARGET_SCALE_FLOOR), scale_floored=scale < TARGET_SCALE_FLOOR,
    )
