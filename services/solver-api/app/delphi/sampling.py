"""One deterministic Cartesian sample set shared by every surrogate."""
import numpy as np

from app.execution import check_execution
from app.delphi.models import BUDGET_SHAPES, SAMPLER_VERSION, Bounds, NumericalError, SampleSet, SamplingRequest, TargetSurface, content_id


def sample_training(target: TargetSurface, request: SamplingRequest) -> SampleSet:
    check_execution()
    spots = np.asarray(target.axes.spots)
    times = np.asarray(target.axes.times_to_maturity)
    bounds = request.training_bounds or Bounds(
        spot_min=float(spots[0]), spot_max=float(spots[-1]),
        tau_min=float(times[0]), tau_max=float(times[-1]),
    )
    if bounds.spot_min < spots[0] or bounds.spot_max > spots[-1] or bounds.tau_min < times[0] or bounds.tau_max > times[-1]:
        raise NumericalError("training_domain_outside_reference", "Training bounds must lie within the reference domain")
    eligible_rows = np.flatnonzero((times >= bounds.tau_min) & (times <= bounds.tau_max))
    eligible_columns = np.flatnonzero((spots >= bounds.spot_min) & (spots <= bounds.spot_max))
    n_rows, n_columns = BUDGET_SHAPES[request.budget]
    if len(eligible_rows) < n_rows or len(eligible_columns) < n_columns:
        raise NumericalError("insufficient_training_nodes", "Training region has too few grid nodes for this budget; widen the region or reduce samples")
    # np.rint uses nearest-even ties. Version the sampler if this convention changes.
    rows = eligible_rows[np.rint(np.linspace(0, len(eligible_rows) - 1, n_rows)).astype(int)]
    columns = eligible_columns[np.rint(np.linspace(0, len(eligible_columns) - 1, n_columns)).astype(int)]
    pairs = [(int(row), int(column)) for row in rows for column in columns]
    invalid = [(row, column) for row, column in pairs if not target.valid_mask[row][column]]
    if invalid:
        reasons = sorted({target.invalid_reasons[row][column] for row, column in invalid})
        raise NumericalError("invalid_training_nodes", f"{len(invalid)} of {request.budget} training nodes are invalid ({', '.join(reasons)}). Narrow the domain or increase paths; no samples were dropped.")
    payload = {
        "version": SAMPLER_VERSION,
        "reference_id": target.reference_id,
        "target_id": target.target_id,
        "row_indices": rows.tolist(), "column_indices": columns.tolist(),
        "flat_indices": [row * len(spots) + column for row, column in pairs],
        "coordinates": [[float(spots[column]), float(times[row])] for row, column in pairs],
        "values": [target.values[row][column] for row, column in pairs],
        "standard_errors": [target.standard_errors[row][column] for row, column in pairs],
        "count": request.budget,
        "shape": [n_rows, n_columns],
        "bounds": Bounds(spot_min=float(spots[columns[0]]), spot_max=float(spots[columns[-1]]), tau_min=float(times[rows[0]]), tau_max=float(times[rows[-1]])).model_dump(mode="json"),
    }
    check_execution()
    return SampleSet(**payload, sample_set_id=content_id(payload))


def validate_samples(target: TargetSurface, samples: SampleSet) -> None:
    """Check content against its parent, not only a self-consistent client hash."""
    check_execution()
    if samples.target_id != target.target_id or samples.reference_id != target.reference_id:
        raise NumericalError("sample_target_mismatch", "Samples belong to a different reference or target")
    expected = sample_training(target, SamplingRequest(budget=samples.count, training_bounds=samples.bounds))
    if expected != samples:
        raise NumericalError("sample_content_mismatch", "Sample coordinates, values, or indices do not match the target")
