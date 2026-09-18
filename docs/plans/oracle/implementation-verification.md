# Oracle implementation verification

Date: 2026-09-18.

## Status and scope

Phase 1 means **milestone 1: reference, IV, sampling, and metrics foundations** in the approved delivery plan. That phase is complete. The user authorized continuing this phase until it was finished or required input. No unresolved user decision blocked completion.

The necessary feasibility work from milestone 0 was performed alongside the foundations and is reproducible with the probe below. Its surrogate implementations are explicitly benchmark-only experiments. They are not production adapters, HTTP endpoints, or a claim that milestones 2–6 are complete.

No existing application implementation file was modified. Oracle has no route, public home card, or HTTP endpoints yet. The selected UI remains the visual specification for milestone 2.

## Delivered foundations

| Module | Delivered behavior |
| --- | --- |
| `services/solver-api/app/oracle/models.py` | Immutable, versioned Pydantic contracts; finite values; bounded dimensions, paths, and total reference work; consistent arrays/masks/counts; canonical content identities |
| `services/solver-api/app/oracle/reference.py` | Seeded exact-terminal GBM reference; existing Ithaca payoff/draw/pair-error primitives; shared draws; bounded eight-spot blocks; exact maturity and zero-spot boundaries |
| `services/solver-api/app/oracle/implied_volatility.py` | Bounded bracketed inversion; invalid-node reasons; no clipping or imputation; local price-error/vega uncertainty; distinct target-value/error units |
| `services/solver-api/app/oracle/sampling.py` | Supported tensor budgets; deterministic nearest-even index selection; inward-snapped bounds; one immutable sample set; parent-content validation |
| `services/solver-api/app/oracle/evaluation.py` | Absolute-error surface; full, unseen, inside, outside, and unseen-region metrics; explicit counts/nulls; non-finite prediction rejection |
| `services/solver-api/app/oracle/baseline.py` | Existing Black–Scholes baseline; constant theoretical IV baseline; signed residual construction and reconstruction without clipping |
| `services/solver-api/app/oracle/preprocessing.py` | Training-only coordinate/target normalization, residual normalization, constant-target scale floor, no extrapolation clipping |

The Monte Carlo code imports the existing internal numerical primitives directly. No extraction was needed to achieve reuse, so Ithaca's public solver and its call sites stayed untouched. An explicit regression test compares Oracle's blockwise reference to Ithaca's existing MC surface with identical terminal draws, both with and without antithetic pairing.

## Frozen foundation defaults and numerical policies

- Price preset: call, strike 100, volatility 20%, rate 5%, dividend 0%, spot 60–140, maturity 0–2 years, 61×51 grid, 20,000 paths, antithetic, seed 42.
- IV preset: same financial/reference settings, spot **80–120**, maturity **0.25–2 years**.
- Reference limits: 20–81 nodes per axis; 1,000–100,000 paths; 120,000,000 positive-time payoff node-path evaluations; even paths for antithetic sampling.
- Financial limits: strike 1–1,000,000, spot 0–1,000,000, time 0–10 years, volatility 0.01–2, rates/dividends -0.25–0.25. Nonrepresentable grids are rejected before simulation.
- Sampling budgets: 16 = 4×4; 32 = 4×8; 64 = 8×8; 128 = 8×16; 256 = 16×16. Shapes are maturity × spot. Grids are not promised to be nested across budgets.
- IV bracket: `1e-6` to `5.0`; absolute root tolerance `1e-10`; relative tolerance `1e-12`; at most 100 iterations.
- Vega threshold: `1e-6 × max(discounted spot, discounted strike)` per unit decimal volatility. Nodes below it are masked.
- Normalization: training-only population standard deviation, with an absolute floor of `1e-8`; diagnostic flag identifies the floor.
- Arrays use `[maturity][spot]`; samples flatten in that order and coordinates are `(spot, maturity)`.
- IV remains decimal internally. Displayed values use percent volatility; displayed errors use volatility percentage points. Error 0.002 therefore displays as 0.2 points.
- Training-region boundary nodes count as interpolation. Full-grid metrics include training nodes; unseen metrics exclude them explicitly.
- All methods must fail rather than silently shrink their evaluation denominator when predictions are non-finite on a valid reference node.

### IV default correction

The planned 60–140 spot domain at maturity 0.25–2, seed 42, and 20,000 paths produced **seven invalid IV nodes**, including **one of the 128 default training knots**. The shared sampler correctly rejected the lattice.

The narrower 80–120 IV preset produced **zero invalid nodes** and passed all five supported training budgets. This default change is encoded in `default_reference_request("implied_volatility")`, tested, and reflected in the product/UI plans. Custom domains still retain explicit conditioning failures rather than silently changing their points.

## Verification results

Final regression command, executed from `services/solver-api`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

Result: **96 tests passed in 9.687 seconds**: 57 existing tests plus 39 new Oracle tests.

The new tests cover:

- Same-seed reference values and identities, changed-seed separation, finite JSON roundtrips, and nested immutability.
- Blockwise agreement with existing MC, standard error from independent antithetic pair means, analytical price agreement, exact maturity payoff, and zero-spot boundaries.
- Early dimension/finite-value/combined-work rejection, axis consistency, corrupted envelope/hash rejection, and too-narrow floating-point domains.
- Call/put IV roundtrips, negative rates, vega-based noise conversion, out-of-bounds prices, unbracketed values, actual low-vega cases, and solver failure.
- IV masks/nulls, no mutation of the raw reference, no hidden repair of invalid training knots, and usable default IV budgets.
- Deterministic unique training indices for every budget, inward-snapped bounds, mismatched targets, rehashed corrupt samples, unsupported sample counts, and narrow regions.
- Training-only transforms, physical-unit restoration, near-constant targets, normalization overflow, and unclipped extrapolation coordinates.
- Hand-computed MAE/RMSE/max error, stable large-error arithmetic, empty sets, unseen masks, boundary convention, common invalid-reference masks, and consistent metric denominators.
- Black–Scholes/IV baseline values, signed residual reconstruction, zero-correction identity, dimension checks, and overflow rejection.
- Cooperative cancellation before allocation, between payoff blocks, during IV inversion, and in sampling/preprocessing/evaluation/baseline work.

An initial command from the repository root exposed that the existing virtual environment can import an older installed `app` package. The authoritative before/after regression runs were therefore executed from the service directory and the local `app.__file__` was verified. The probe explicitly prepends the checkout service path. The validation plan now documents the unambiguous command.

The existing environment emits a Starlette/httpx deprecation warning. It does not fail the tests and is unrelated to these new modules; dependencies were not changed for this phase.

Frontend tests, browser checks, lint, and build were not run: no frontend, route, or shared runtime implementation changed. Those remain required when milestone 2 adds the vertical slice.

## Reproducible feasibility measurements

From the repository root:

```powershell
.\services\solver-api\.venv\Scripts\python.exe scripts/oracle_phase1_probe.py --output docs/plans/oracle/phase-1-measurements.json
```

Full results and environment are saved in [phase-1-measurements.json](phase-1-measurements.json). Runtime: Windows 11, Python 3.14.7, NumPy 2.5.3, SciPy 1.18.1, OpenBLAS 0.3.34.106.0. The recorded processor identifier and build configuration are in the JSON.

| Foundation measurement | Observed result |
| --- | --- |
| Default 61×51, 20,000-path reference | 562.85 ms wall time; 6.46 MiB tracked allocation peak |
| 81×81, 18,518-path reference | 1,071.78 ms; 119,996,640 operations; 6.04 MiB tracked peak |
| 20×20, 100,000-path reference | 389.89 ms; 32.05 MiB tracked peak |
| Largest tested reference JSON | 251,516 bytes |
| Default IV conversion | 131.66 ms; zero invalid nodes |
| Cancellation after stop during 100,000-path reference | 6.97 ms |

`tracemalloc` reports tracked allocation peaks, including tracked NumPy buffers; these are **not total process RSS**. Times are single local observations with tracing overhead, not hosted performance guarantees. Cancellation is cooperative at bounded work boundaries, not preemptive thread termination.

### Surrogate feasibility only

| 128-sample probe | Fit | Inference on 61×51 |
| --- | --- | --- |
| Cubic spline | 9.62 ms | 0.76 ms |
| GP, including variance prediction | 1.30 ms | 24.48 ms |
| Direct MLP | 146.53 ms | 3.57 ms |
| Residual MLP, including baseline | 139.80 ms | 55.04 ms |

At 256 samples and 81×81 evaluation, GP factorization took 2.37 ms and prediction 99.87 ms. The capped 64-wide, two-hidden-layer MLP probe ran 1,000 epochs in 719.05 ms. The maximum surrogate-probe tracked peak was approximately 6.11 MiB.

The MLP probe's analytical gradient differed from central finite differences by at most **5.38e-11**. Its fixed-budget training reduced loss on both a smooth function and a constant target. The two-point GP probe matched an independent explicit 2×2 solution to approximately **1.11e-16** for its mean and exactly at reported precision for its variance.

The NumPy MLP probe uses `mean(error²) + lambda × sum(weight²)` with biases unregularized, Xavier-uniform initialization, and Adam (`beta1=0.9`, `beta2=0.999`, epsilon `1e-8`), 300 default epochs, learning rate 0.01, and L2 coefficient 1e-4. These definitions support the planned dependency choice; production implementation still needs its own optimizer, finite-loss, cancellation, and numerical tests in milestone 3.

SciPy's default cubic construction tolerance left roughly 1e-3 price-unit error at training knots. Explicit `rtol=1e-12`, `atol=1e-12` reduced maximum measured knot error to **1.01e-10 or less** for the 128/256 probes. The numerical plan now specifies that tolerance for milestone 2.

No production GP, MLP, residual MLP, or spline adapter is exported by the application yet. The probe measures feasibility, not final model accuracy, API latency, or a universal model ranking.

## Phase 1 completion gate

- [x] Generate a bounded reproducible reference without a frontend.
- [x] Convert price to IV with explicit conditioning/validity rules.
- [x] Produce one immutable sample set for all methods.
- [x] Define/verify physical-unit metrics and interpolation/extrapolation masks.
- [x] Reuse analytical baseline and MC primitives without altering Ithaca.
- [x] Enforce foundation limits and cooperative cancellation.
- [x] Record feasibility evidence, corrected defaults, and implementation choices.
- [x] Pass focused tests and the full existing Python regression suite.

Next planned phase: **milestone 2 — price + spline vertical slice**, including the shared execution runner, Oracle HTTP endpoints/capabilities, lazy route, selected-design workbench, and guarded request lifecycle. Byte limits before parsing, shared semaphore lifecycle, hosted memory/deadline behavior, and actual UI accessibility are later acceptance gates, not features claimed by this phase.
