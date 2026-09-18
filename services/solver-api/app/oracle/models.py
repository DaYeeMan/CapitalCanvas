"""Bounded, immutable contracts for Oracle's numerical pipeline.

Matrices are [maturity][spot]. Hashes identify content, not its authenticity.
HTTP body-size enforcement belongs to the future router, before parsing these models.
"""
from __future__ import annotations

from hashlib import sha256
import json
from math import isclose
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

ALGORITHM_VERSION = "oracle-gbm-v1"
TARGET_VERSION = "oracle-target-v1"
SAMPLER_VERSION = "uniform-tensor-v1"
MAX_OPERATIONS = 120_000_000
MAX_AXIS = 81
BUDGET_SHAPES = {16: (4, 4), 32: (4, 8), 64: (8, 8), 128: (8, 16), 256: (16, 16)}

Finite = Annotated[float, Field(strict=True, allow_inf_nan=False)]
Nonnegative = Annotated[Finite, Field(ge=0)]
Axis = Annotated[tuple[Nonnegative, ...], Field(min_length=20, max_length=MAX_AXIS)]
Row = Annotated[tuple[Finite, ...], Field(min_length=20, max_length=MAX_AXIS)]
Matrix = Annotated[tuple[Row, ...], Field(min_length=20, max_length=MAX_AXIS)]
NullableRow = Annotated[tuple[Finite | None, ...], Field(min_length=20, max_length=MAX_AXIS)]
NullableMatrix = Annotated[tuple[NullableRow, ...], Field(min_length=20, max_length=MAX_AXIS)]
StrictBool = Annotated[bool, Field(strict=True)]
BoolRow = Annotated[tuple[StrictBool, ...], Field(min_length=20, max_length=MAX_AXIS)]
BoolMatrix = Annotated[tuple[BoolRow, ...], Field(min_length=20, max_length=MAX_AXIS)]
TargetKind = Literal["price", "implied_volatility"]
InvalidReason = Literal["zero_maturity", "zero_spot", "non_finite", "price_out_of_bounds", "unbracketed", "low_vega", "solver_failed"]
ReasonRow = Annotated[tuple[InvalidReason | None, ...], Field(min_length=20, max_length=MAX_AXIS)]
ReasonMatrix = Annotated[tuple[ReasonRow, ...], Field(min_length=20, max_length=MAX_AXIS)]
ContentID = Annotated[str, Field(pattern=r"^[0-9a-f]{64}$")]
SampleIndex = Annotated[int, Field(strict=True, ge=0, lt=MAX_AXIS)]
SampleIndices = Annotated[tuple[SampleIndex, ...], Field(min_length=4, max_length=16)]
FlatIndex = Annotated[int, Field(strict=True, ge=0, lt=MAX_AXIS**2)]
FlatIndices = Annotated[tuple[FlatIndex, ...], Field(min_length=16, max_length=256)]
SampleValues = Annotated[tuple[Finite, ...], Field(min_length=16, max_length=256)]
SampleErrors = Annotated[tuple[Nonnegative, ...], Field(min_length=16, max_length=256)]
SampleCoordinates = Annotated[tuple[tuple[Nonnegative, Nonnegative], ...], Field(min_length=16, max_length=256)]


def content_id(payload: object) -> str:
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":"), allow_nan=False)
    return sha256(encoded.encode("utf-8")).hexdigest()


class Contract(BaseModel):
    model_config = ConfigDict(extra="forbid", frozen=True, allow_inf_nan=False)


class Market(Contract):
    strike: Finite = Field(default=100.0, ge=1, le=1_000_000)
    volatility: Finite = Field(default=0.2, ge=0.01, le=2)
    rate: Finite = Field(default=0.05, ge=-0.25, le=0.25)
    dividend: Finite = Field(default=0.0, ge=-0.25, le=0.25)


class Bounds(Contract):
    spot_min: Finite = Field(default=60.0, ge=0, le=1_000_000)
    spot_max: Finite = Field(default=140.0, gt=0, le=1_000_000)
    tau_min: Finite = Field(default=0.0, ge=0, le=10)
    tau_max: Finite = Field(default=2.0, gt=0, le=10)

    @model_validator(mode="after")
    def ordered(self) -> "Bounds":
        if self.spot_max <= self.spot_min or self.tau_max <= self.tau_min:
            raise ValueError("Each domain maximum must exceed its minimum")
        return self


class Domain(Bounds):
    spot_nodes: int = Field(default=61, strict=True, ge=20, le=MAX_AXIS)
    tau_nodes: int = Field(default=51, strict=True, ge=20, le=MAX_AXIS)

    @model_validator(mode="after")
    def representable_grid(self) -> "Domain":
        for lower, upper, count in ((self.spot_min, self.spot_max, self.spot_nodes), (self.tau_min, self.tau_max, self.tau_nodes)):
            axis = [lower + (upper - lower) * index / (count - 1) for index in range(count)]
            if any(right <= left for left, right in zip(axis, axis[1:])):
                raise ValueError("Domain is too narrow for distinct floating-point grid nodes")
        return self


class MonteCarlo(Contract):
    paths: int = Field(default=20_000, strict=True, ge=1_000, le=100_000)
    seed: int = Field(default=42, strict=True, ge=0, le=2_147_483_647)
    antithetic: bool = Field(default=True, strict=True)

    @model_validator(mode="after")
    def paired(self) -> "MonteCarlo":
        if self.antithetic and self.paths % 2:
            raise ValueError("Antithetic sampling requires an even path count")
        return self


class ReferenceRequest(Contract):
    schema_version: Literal[1] = 1
    market: Market = Field(default_factory=Market)
    option_side: Literal["call", "put"] = "call"
    domain: Domain = Field(default_factory=Domain)
    monte_carlo: MonteCarlo = Field(default_factory=MonteCarlo)

    @property
    def estimated_operations(self) -> int:
        positive_times = self.domain.tau_nodes - int(self.domain.tau_min == 0)
        return self.monte_carlo.paths * self.domain.spot_nodes * positive_times

    @model_validator(mode="after")
    def work_limit(self) -> "ReferenceRequest":
        if self.estimated_operations > MAX_OPERATIONS:
            raise ValueError("Reference exceeds 120 million payoff evaluations; reduce paths or grid size")
        return self


def default_reference_request(target: TargetKind = "price") -> ReferenceRequest:
    """The IV preset avoids the low-vega tails of the wider price preset."""
    if target == "price":
        return ReferenceRequest()
    if target == "implied_volatility":
        return ReferenceRequest(domain=Domain(spot_min=80.0, spot_max=120.0, tau_min=0.25))
    raise ValueError("Unsupported target kind")


class Axes(Contract):
    spots: Axis
    times_to_maturity: Axis

    @model_validator(mode="after")
    def increasing(self) -> "Axes":
        for axis in (self.spots, self.times_to_maturity):
            if any(right <= left for left, right in zip(axis, axis[1:])):
                raise ValueError("Axes must be strictly increasing")
        if self.spots[-1] > 1_000_000 or self.times_to_maturity[-1] > 10:
            raise ValueError("Axes exceed the financial domain limits")
        return self

    @property
    def shape(self) -> tuple[int, int]:
        return len(self.times_to_maturity), len(self.spots)


def check_shape(matrix: tuple, axes: Axes) -> None:
    rows, columns = axes.shape
    if len(matrix) != rows or any(len(row) != columns for row in matrix):
        raise ValueError("Matrix shape must match [maturity][spot] axes")


class Warning(Contract):
    code: str
    message: str


class ReferenceTiming(Contract):
    reference_ms: Nonnegative


class ReferenceDiagnostics(Contract):
    effective_independent_samples: int = Field(strict=True, ge=500, le=100_000)
    estimated_operations: int = Field(strict=True, ge=1, le=MAX_OPERATIONS)
    sampling: Literal["exact GBM terminal; common random numbers"] = "exact GBM terminal; common random numbers"
    correlation_note: str = "Reference node errors are correlated; pointwise standard errors do not describe their full covariance."
    numpy_version: str
    rng: Literal["PCG64; reference seed"] = "PCG64; reference seed"


class PriceReference(Contract):
    schema_version: Literal[1] = 1
    algorithm_version: Literal["oracle-gbm-v1"] = ALGORITHM_VERSION
    reference_id: ContentID
    configuration: ReferenceRequest
    axes: Axes
    prices: Matrix
    price_standard_errors: Matrix
    timing: ReferenceTiming
    diagnostics: ReferenceDiagnostics
    warnings: tuple[Warning, ...] = ()

    def identity_payload(self) -> dict:
        return self.model_dump(mode="json", exclude={"reference_id", "timing", "diagnostics", "warnings"})

    @model_validator(mode="after")
    def consistent(self) -> "PriceReference":
        domain = self.configuration.domain
        for axis, lower, upper, count in (
            (self.axes.spots, domain.spot_min, domain.spot_max, domain.spot_nodes),
            (self.axes.times_to_maturity, domain.tau_min, domain.tau_max, domain.tau_nodes),
        ):
            if len(axis) != count or any(
                not isclose(value, lower + (upper - lower) * i / (count - 1), rel_tol=1e-12, abs_tol=1e-12)
                for i, value in enumerate(axis)
            ):
                raise ValueError("Reference axes do not match the configured uniform grid")
        for matrix in (self.prices, self.price_standard_errors):
            check_shape(matrix, self.axes)
            if any(value < 0 for row in matrix for value in row):
                raise ValueError("Reference prices and standard errors must be nonnegative")
        if self.axes.times_to_maturity[0] == 0:
            sign = 1 if self.configuration.option_side == "call" else -1
            payoff = tuple(max(sign * (spot - self.configuration.market.strike), 0.0) for spot in self.axes.spots)
            if self.prices[0] != payoff or any(self.price_standard_errors[0]):
                raise ValueError("Zero-maturity prices must equal payoff with zero standard error")
        settings = self.configuration.monte_carlo
        if self.diagnostics.effective_independent_samples != settings.paths // (2 if settings.antithetic else 1):
            raise ValueError("Independent sample count does not match antithetic settings")
        if self.diagnostics.estimated_operations != self.configuration.estimated_operations:
            raise ValueError("Operation estimate does not match configuration")
        if self.reference_id != content_id(self.identity_payload()):
            raise ValueError("Reference content identity mismatch")
        return self


class TargetSurface(Contract):
    version: Literal["oracle-target-v1"] = TARGET_VERSION
    reference_id: ContentID
    target_id: ContentID
    kind: TargetKind
    axes: Axes
    internal_unit: Literal["currency", "decimal_volatility"]
    display_unit: Literal["currency", "percent_volatility"]
    error_display_unit: Literal["currency", "volatility_percentage_points"]
    values: NullableMatrix
    standard_errors: NullableMatrix
    valid_mask: BoolMatrix
    invalid_reasons: ReasonMatrix
    conversion_ms: Nonnegative = 0.0
    warnings: tuple[Warning, ...] = ()

    def identity_payload(self) -> dict:
        return self.model_dump(mode="json", exclude={"target_id", "conversion_ms", "warnings"})

    @model_validator(mode="after")
    def consistent(self) -> "TargetSurface":
        expected = ("currency", "currency", "currency") if self.kind == "price" else ("decimal_volatility", "percent_volatility", "volatility_percentage_points")
        if (self.internal_unit, self.display_unit, self.error_display_unit) != expected:
            raise ValueError("Target units do not match target kind")
        for matrix in (self.values, self.standard_errors, self.valid_mask, self.invalid_reasons):
            check_shape(matrix, self.axes)
        for values, errors, mask, reasons in zip(self.values, self.standard_errors, self.valid_mask, self.invalid_reasons):
            for value, error, valid, reason in zip(values, errors, mask, reasons):
                if valid:
                    if value is None or error is None or reason is not None or error < 0 or value < 0:
                        raise ValueError("Valid target cells require nonnegative values/errors and no invalid reason")
                elif value is not None or error is not None or reason is None:
                    raise ValueError("Invalid target cells require null values/errors and a reason")
        if self.target_id != content_id(self.identity_payload()):
            raise ValueError("Target content identity mismatch")
        return self


class SamplingRequest(Contract):
    strategy: Literal["uniform_tensor"] = "uniform_tensor"
    budget: int = Field(default=128, strict=True)
    training_bounds: Bounds | None = None

    @model_validator(mode="after")
    def supported_budget(self) -> "SamplingRequest":
        if self.budget not in BUDGET_SHAPES:
            raise ValueError("Supported sample budgets are 16, 32, 64, 128, 256")
        return self


class SampleSet(Contract):
    version: Literal["uniform-tensor-v1"] = SAMPLER_VERSION
    target_id: ContentID
    reference_id: ContentID
    sample_set_id: ContentID
    row_indices: SampleIndices
    column_indices: SampleIndices
    flat_indices: FlatIndices
    coordinates: SampleCoordinates  # (spot, tau), row-major
    values: SampleValues
    standard_errors: SampleErrors
    count: int = Field(strict=True, ge=16, le=256)
    shape: tuple[int, int]
    bounds: Bounds

    def identity_payload(self) -> dict:
        return self.model_dump(mode="json", exclude={"sample_set_id"})

    @model_validator(mode="after")
    def consistent(self) -> "SampleSet":
        if self.shape != BUDGET_SHAPES.get(self.count):
            raise ValueError("Sample shape must match a supported budget")
        if (len(self.row_indices), len(self.column_indices)) != self.shape:
            raise ValueError("Sample index axes must match sample shape")
        for indices in (self.row_indices, self.column_indices):
            if indices[0] < 0 or indices[-1] >= MAX_AXIS or any(b <= a for a, b in zip(indices, indices[1:])):
                raise ValueError("Sample indices must be distinct, increasing, and bounded")
        if any(len(values) != self.count for values in (self.flat_indices, self.coordinates, self.values, self.standard_errors)):
            raise ValueError("Sample arrays must match count")
        if len(set(self.flat_indices)) != self.count or any(index < 0 or index >= MAX_AXIS**2 for index in self.flat_indices):
            raise ValueError("Flat sample indices must be unique and bounded")
        row_count, column_count = self.shape
        spots = tuple(point[0] for point in self.coordinates[:column_count])
        times = tuple(self.coordinates[row * column_count][1] for row in range(row_count))
        if any(b <= a for axis in (spots, times) for a, b in zip(axis, axis[1:])):
            raise ValueError("Sample coordinate axes must increase")
        if self.coordinates != tuple((spot, tau) for tau in times for spot in spots):
            raise ValueError("Sample coordinates must form a row-major Cartesian grid")
        if (spots[0], spots[-1], times[0], times[-1]) != (self.bounds.spot_min, self.bounds.spot_max, self.bounds.tau_min, self.bounds.tau_max):
            raise ValueError("Sample bounds must match realized coordinates")
        if self.sample_set_id != content_id(self.identity_payload()):
            raise ValueError("Sample content identity mismatch")
        return self


class MetricSet(Contract):
    count: int = Field(strict=True, ge=0, le=MAX_AXIS**2)
    mae: Nonnegative | None
    rmse: Nonnegative | None
    max_abs_error: Nonnegative | None

    @model_validator(mode="after")
    def availability(self) -> "MetricSet":
        values = (self.mae, self.rmse, self.max_abs_error)
        if (self.count == 0 and any(v is not None for v in values)) or (self.count > 0 and any(v is None for v in values)):
            raise ValueError("Metrics must be null exactly when evaluation count is zero")
        return self


class Evaluation(Contract):
    absolute_errors: NullableMatrix
    training_mask: BoolMatrix
    inside_mask: BoolMatrix
    outside_mask: BoolMatrix
    full: MetricSet
    unseen: MetricSet
    inside: MetricSet
    outside: MetricSet
    unseen_inside: MetricSet
    unseen_outside: MetricSet

    @model_validator(mode="after")
    def consistent_masks(self) -> "Evaluation":
        shape = (len(self.absolute_errors), len(self.absolute_errors[0]))
        for matrix in (self.absolute_errors, self.training_mask, self.inside_mask, self.outside_mask):
            if len(matrix) != shape[0] or any(len(row) != shape[1] for row in matrix):
                raise ValueError("Evaluation matrices must share one rectangular shape")
        counts = dict.fromkeys(("full", "unseen", "inside", "outside", "unseen_inside", "unseen_outside"), 0)
        for errors, trained, inside, outside in zip(self.absolute_errors, self.training_mask, self.inside_mask, self.outside_mask):
            for error, sample, within, beyond in zip(errors, trained, inside, outside):
                valid = error is not None
                if (within and beyond) or ((within or beyond) != valid) or (sample and not valid):
                    raise ValueError("Evaluation masks must partition valid cells and contain all training nodes")
                if valid and error < 0:
                    raise ValueError("Absolute errors must be nonnegative")
                for name, selected in (("full", valid), ("unseen", valid and not sample), ("inside", within),
                                       ("outside", beyond), ("unseen_inside", within and not sample), ("unseen_outside", beyond and not sample)):
                    counts[name] += int(selected)
        if any(getattr(self, name).count != count for name, count in counts.items()):
            raise ValueError("Metric counts must match evaluation masks")
        return self


class NumericalError(ValueError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(message)
        self.code = code
