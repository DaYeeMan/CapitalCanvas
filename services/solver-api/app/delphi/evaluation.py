"""Physical-unit errors on explicit full, unseen, and regional masks."""
import numpy as np

from app.execution import check_execution
from app.delphi.models import Evaluation, MetricSet, NumericalError, SampleSet, TargetSurface
from app.delphi.sampling import validate_samples


def metrics(errors: np.ndarray) -> MetricSet:
    check_execution()
    errors = np.asarray(errors, dtype=float).reshape(-1)
    if not np.all(np.isfinite(errors)):
        raise NumericalError("non_finite_error", "Cannot score non-finite errors")
    count = len(errors)
    if not count:
        return MetricSet(count=0, mae=None, rmse=None, max_abs_error=None)
    absolute = np.abs(errors)
    maximum = float(np.max(absolute))
    # Scaling avoids overflow while squaring otherwise finite errors.
    scaled = absolute / maximum if maximum else absolute
    return MetricSet(count=count, mae=float(np.mean(scaled)) * maximum,
                     rmse=float(np.sqrt(np.mean(scaled**2))) * maximum, max_abs_error=maximum)


def evaluate_predictions(target: TargetSurface, samples: SampleSet, predictions: np.ndarray) -> Evaluation:
    check_execution()
    validate_samples(target, samples)
    predicted = np.asarray(predictions, dtype=float)
    if predicted.shape != target.axes.shape:
        raise NumericalError("prediction_shape", "Predictions must match [maturity][spot] reference shape")
    valid = np.asarray(target.valid_mask)
    if not np.all(np.isfinite(predicted[valid])):
        raise NumericalError("non_finite_prediction", "Method failed: non-finite predictions on valid reference nodes")
    reference = np.asarray(target.values, dtype=float)
    errors = np.zeros(predicted.shape)
    with np.errstate(over="ignore", invalid="ignore"):
        errors[valid] = predicted[valid] - reference[valid]
    if not np.all(np.isfinite(errors[valid])):
        raise NumericalError("non_finite_error", "Prediction differences exceed finite numerical range")
    training = np.zeros(predicted.shape, dtype=bool)
    training.flat[list(samples.flat_indices)] = True
    spots = np.asarray(target.axes.spots)[None, :]
    times = np.asarray(target.axes.times_to_maturity)[:, None]
    bounds = samples.bounds
    in_domain = (spots >= bounds.spot_min) & (spots <= bounds.spot_max) & (times >= bounds.tau_min) & (times <= bounds.tau_max)
    inside, outside = valid & in_domain, valid & ~in_domain
    unseen = valid & ~training
    masks = {"full": valid, "unseen": unseen, "inside": inside, "outside": outside,
             "unseen_inside": unseen & inside, "unseen_outside": unseen & outside}
    absolute = [[float(abs(errors[row, column])) if valid[row, column] else None for column in range(predicted.shape[1])] for row in range(predicted.shape[0])]
    check_execution()
    return Evaluation(absolute_errors=absolute, training_mask=training.tolist(), inside_mask=inside.tolist(),
                      outside_mask=outside.tolist(), **{name: metrics(errors[mask]) for name, mask in masks.items()})


def display_error(value: float | None, target: TargetSurface) -> float | None:
    """Convert a decimal-IV error to volatility percentage points exactly once."""
    return None if value is None else value * (100 if target.kind == "implied_volatility" else 1)
