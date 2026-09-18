# Decisions, assumptions, and risks

## Decision record

| Decision | Reason and consequence |
| --- | --- |
| First mockup is the approved shell | Preserve the user's chosen rail, surface, explanation, and comparison table across experiments |
| European GBM first | Reuses the Python MC implementation and keeps scope bounded; it does not produce a structural volatility smile |
| Fixed strike; spot × maturity coordinates | Matches Ithaca's numerical seam and first mockup; avoids pretending a spot sweep is a market strike surface |
| Existing Python service for all numerical work | Avoids duplicating reference generation between Python and browser ML; Troy's JS engine remains separate |
| Stateless API with client-held reference envelope | Reuse survives server instance changes without a database/cache service; adds bounded payload validation and transfer cost |
| Uniform tensor-grid budgets | All methods share data and cubic interpolation has a valid grid; arbitrary counts and scattered samples are deferred |
| Independent uniform lattices per budget | Keeps the initial sampler simple; budgets are not necessarily nested and this is disclosed |
| Exact GP with fixed bounded hyperparameters | Predictable cost and testability; uncertainty is conditional on a simple kernel/noise approximation |
| Small NumPy MLP and shared residual adapter | No new ML runtime; requires rigorous gradient/optimizer tests and careful maintenance |
| Same-parameter Black–Scholes baseline | Appropriate fast analytical baseline for GBM; residual mostly models MC noise rather than structural model discrepancy |
| Full-grid metrics plus explicit unseen/region masks | Satisfies the source brief while revealing training-node contribution and extrapolation behavior |
| Explicit Run and sequential sweeps | Avoids expensive recomputation on every input edit and keeps cancellation/status honest |
| No server job queue or progress stream | Existing synchronous HTTP lifecycle suffices; progress is stage-level rather than fabricated percentages |

## Assumptions that can be changed without blocking this planning deliverable

The user selected a design, not exact financial defaults or numerical libraries. This plan chooses the narrowest complete release that fits the supplied brief and repository. These assumptions are visible so implementation can revisit them with evidence:

1. Constant-volatility GBM is acceptable for the first educational IV experiment, provided its flat-IV limitation is explicit.
2. Supported tensor budgets satisfy “configurable number of samples”; arbitrary integers are not required initially.
3. Default direct and residual MLP settings remain matched, and no automatic hyperparameter tuning is needed.
4. Session-only reference reuse is enough; page refresh clears results.
5. A method details panel and the existing research section are enough for initial documentation.

If the intended product instead requires a meaningful stochastic-volatility smile or a residual model correcting structural low-fidelity bias, resolve that before implementing the reference engine. That would require adding a different high-fidelity model and revising the scope, limits, baseline, and validation plan. Do not quietly represent noisy GBM IV as that capability.

## Risks and controls

| Risk | Consequence | Planned control / evidence |
| --- | --- | --- |
| Generated UI text/curves treated as facts | Misleading scientific behavior | Use image only for visual hierarchy; replace “true price,” illustrative numbers, and decorative IV shapes |
| Learning reference noise | Apparent gains over a strong analytical baseline are misinterpreted | Show baseline-only context, MC uncertainty, and GBM limitation; no guaranteed method ranking |
| Invalid or unstable IV | Invented values or broken spline lattice | Bounded inversion, vega checks, shared masks, actionable failure on invalid training knots |
| Data leakage | Unrealistically favorable results | Training-only transformations/settings; tests prohibit evaluation targets in fitting |
| Different samples across methods | Unfair comparison | Server-owned single sampler and content identities |
| Budget curves compare moving unseen sets | Misread data-efficiency conclusions | Default fixed full-grid domain; disclose changing unseen masks and nonnested training grids |
| GP uncertainty overconfidence | Users confuse a model assumption with certainty | Label latent SD, separate MC standard error, disclose diagonal correlated-noise approximation |
| Spline/neural extrapolation overshoot | Invalid prices or volatility | Preserve raw predictions, flag bounds violations, separate outside-domain errors |
| MLP implementation bugs | Plausible-looking but wrong learning | Finite-difference gradients, optimizer fixtures, known-function training, bounded finite-loss checks |
| Too much numerical work | Timeouts or memory pressure | Combined estimators, hard caps, chunking, shared capacity, measurement gates |
| Native operations delay cancellation | Threads continue after request ends | Small caps, measured worst section, slot held until real completion |
| Cached reference inconsistency | Wrong labels or mixed experiments | Versioned canonical identities, strict shape/config checks, immutable result snapshot |
| Large untrusted payloads | Excess allocation before validation | Byte and shape limits before expensive materialization; no executable model uploads |
| Late requests overwrite new work | Wrong chart/result state | Abort plus monotonically increasing run ID guarding all state commits |
| Shared extraction regresses Ithaca | Existing pricing behavior changes | Narrow extraction, before/after numerical fixtures, existing API and UI regressions |
| Workbench CSS leaks | Existing tool/site appearance changes | Oracle-scoped layout, token reuse, cross-tool visual smoke checks |
| Plan overstates timing/reproducibility | False performance expectations | Record environment and observed timings; distinguish planning targets from measurements |

## Items to resolve with measurements in milestone 0

- Final path/grid/work caps and memory budget under the installed runtime.
- IV bracket/tolerances, vega threshold, and a default domain that yields a usable shared lattice for seed 42.
- GP jitter floor/retry limits and default normalized kernel scale.
- MLP learning-rate/epoch defaults, numerical tolerances, and whether the NumPy implementation remains acceptably small.
- Body-size limits for the largest legitimate reference/result envelope.
- Actual worst-case native-call duration and cancellation target.

Phase 1 resolved the foundation defaults, IV thresholds, numerical normalization, and bounded-reference feasibility. Its benchmark-only GP/MLP probes support the planned dependency choice; final production adapter validation and HTTP body enforcement remain later gates. See [implementation-verification.md](implementation-verification.md). These gates do not authorize silently expanding scope.

## Primary numerical references

- [SciPy RegularGridInterpolator](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.RegularGridInterpolator.html) — cubic tensor-grid requirements and explicit extrapolation controls. Verify against the installed version during implementation.
- [NumPy parallel random generation](https://numpy.org/doc/stable/reference/random/parallel.html) — deterministic independent random streams using request-local generators.
- [Rasmussen and Williams, Gaussian Processes for Machine Learning](https://gaussianprocess.org/gpml/chapters/RW.pdf) — GP regression and predictive uncertainty. Product documentation should cite the relevant method and describe Oracle's actual approximation.

Additional published references for the implemented MLP/optimizer and financial methods should be verified when writing the release research entries; do not invent citations or imply this plan has already validated every implementation detail.
