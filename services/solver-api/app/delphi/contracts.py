"""Delphi fit settings and API result contracts, separate from Ithaca solvers."""
from typing import Annotated, Literal

from pydantic import Field, model_validator

from app.delphi.models import (
    ALGORITHM_VERSION, Axes, ContentID, Contract, Evaluation, Finite, Nonnegative,
    NullableMatrix, PriceReference, ReferenceRequest, SampleSet, SamplingRequest,
    TargetKind, TargetSurface, Warning,
)

Method = Literal["cubic_spline", "gaussian_process", "mlp", "residual_mlp"]
METHODS = ("cubic_spline", "gaussian_process", "mlp", "residual_mlp")
MAX_FIT_WORK = 9_000_000_000


class GPSettings(Contract):
    length_scale: Finite = Field(default=.35, ge=.05, le=2)
    noise_floor: Finite = Field(default=1e-5, ge=1e-8, le=.5)


class MLPSettings(Contract):
    width: int = Field(default=32, strict=True, ge=4, le=64)
    epochs: int = Field(default=300, strict=True, ge=10, le=1000)
    learning_rate: Finite = Field(default=.01, ge=1e-5, le=.05)
    regularization: Finite = Field(default=1e-4, ge=0, le=.1)


class Settings(Contract):
    gp: GPSettings = Field(default_factory=GPSettings)
    mlp: MLPSettings = Field(default_factory=MLPSettings)
    residual_baseline: Literal["black_scholes"] = "black_scholes"


class ExperimentRequest(Contract):
    schema_version: Literal[1] = 1
    reference: PriceReference
    target: TargetKind = "price"
    sampling: SamplingRequest = Field(default_factory=SamplingRequest)
    methods: Annotated[tuple[Method, ...], Field(min_length=1, max_length=4)] = METHODS
    settings: Settings = Field(default_factory=Settings)
    training_seed: int = Field(default=42, strict=True, ge=0, le=2_147_483_647)

    @property
    def estimated_work(self) -> int:
        n = self.sampling.budget
        grid = self.reference.axes.shape[0] * self.reference.axes.shape[1]
        width = self.settings.mlp.width
        weights = width * width + 3 * width
        neural = sum(method in self.methods for method in ("mlp", "residual_mlp"))
        return (n**3 + grid * n**2 if "gaussian_process" in self.methods else 0) + neural * (6 * self.settings.mlp.epochs * n * weights + 2 * grid * weights)

    @model_validator(mode="after")
    def bounded(self) -> "ExperimentRequest":
        if len(set(self.methods)) != len(self.methods):
            raise ValueError("Select each method only once")
        if self.estimated_work > MAX_FIT_WORK:
            raise ValueError("Fit exceeds the combined work budget; reduce samples, width, epochs, or selected methods")
        return self


class Snapshot(Contract):
    reference: ReferenceRequest
    target: TargetKind
    sampling: SamplingRequest
    methods: tuple[Method, ...]
    settings: Settings
    training_seed: int


class FitTiming(Contract):
    fit_ms: Nonnegative
    inference_ms: Nonnegative
    prediction_count: int


class Diagnostics(Contract):
    model: str
    target_scale_floored: bool = False
    extrapolated_nodes: int = 0
    bounds_violations: int = 0
    jitter: Nonnegative | None = None
    epochs: int | None = None
    initial_loss: Nonnegative | None = None
    final_loss: Nonnegative | None = None
    baseline: str | None = None


class MethodError(Contract):
    code: str
    message: str


class SurrogateResult(Contract):
    method: Method
    status: Literal["complete", "failed"]
    training_count: int
    predictions: NullableMatrix | None = None
    predictive_stddev: NullableMatrix | None = None
    evaluation: Evaluation | None = None
    timing: FitTiming | None = None
    diagnostics: Diagnostics | None = None
    baseline_metrics: Evaluation | None = None
    warnings: tuple[Warning, ...] = ()
    error: MethodError | None = None

    @model_validator(mode="after")
    def complete_or_failed(self) -> "SurrogateResult":
        if self.status == "complete" and (self.predictions is None or self.evaluation is None or self.timing is None or self.diagnostics is None or self.error is not None):
            raise ValueError("Completed methods require predictions, metrics, timings, and diagnostics")
        if self.status == "failed" and (self.error is None or any(v is not None for v in (self.predictions, self.evaluation, self.timing, self.predictive_stddev))):
            raise ValueError("Failed methods require an error and no successful result")
        if self.predictive_stddev is not None and self.method != "gaussian_process":
            raise ValueError("Only GP has predictive standard deviation")
        return self


class ExperimentTiming(Contract):
    iv_conversion_ms: Nonnegative
    sampling_ms: Nonnegative
    evaluation_ms: Nonnegative
    request_compute_ms: Nonnegative


class ExperimentResult(Contract):
    schema_version: Literal[1] = 1
    algorithm_version: str = ALGORITHM_VERSION
    experiment_id: ContentID
    reference_id: ContentID
    sample_set_id: ContentID
    configuration_snapshot: Snapshot
    axes: Axes
    target: TargetSurface
    samples: SampleSet
    methods: tuple[SurrogateResult, ...]
    timings: ExperimentTiming
    warnings: tuple[Warning, ...] = ()
