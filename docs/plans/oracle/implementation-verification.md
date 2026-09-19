# Oracle implementation verification

Date: 2026-09-18.

## Completed release scope — milestones 2–6

The user subsequently requested continued implementation until finished. All planned local implementation milestones are complete. Oracle is available at `/tools/oracle`, linked from the third home card. No commit, push, or production deployment was performed during this implementation turn.

Delivered: stateless capabilities/reference/experiment endpoints; shared bounded execution with Ithaca; production cubic spline, exact RBF GP, NumPy MLP, and residual MLP; price and IV targets; sequential budget sweeps; extrapolation and regional metrics; real surfaces, GP uncertainty, training overlays, numeric slices, method explanations, reference reuse, cancellation, stale-result protection, mobile controls, and research integration. No new runtime dependency was needed.

### Final checks

| Check | Result |
| --- | --- |
| `npm run test:web` | 76 tests passed in 9 files |
| `npm run lint:web` | Passed |
| `npm run build:web` | Passed; Oracle remains a separate lazy chunk, approximately 43 kB before gzip |
| Service-directory `.\.venv\Scripts\python.exe -m unittest discover -s tests` | 113 tests passed |
| `git diff --check` | Passed |
| Real Edge/Playwright browser-to-API flow | Passed; 12 experiment responses captured in the comprehensive run; zero uncaught page errors |
| Additional camera/keyboard/Ithaca/Troy browser smoke | Passed; zero console errors |

Vite still warns about the existing shared Plotly bundle size. Python emits the existing Starlette/httpx deprecation warning. Neither prevents the checks from passing. Browser verification used bundled Playwright with installed Edge because the frontend skill's browser plugin was unavailable and bundled Chromium was not installed. No browser dependency was added to the repository.

### Acceptance evidence

| Criteria | Evidence |
| --- | --- |
| AC1 | Home launch/route/title tests; real direct URL and refresh; research hash opens Oracle group; screenshot comparison |
| AC2 | Deterministic numerical fixtures; browser counters show one reference after a surrogate-only edit, new reference after seed/domain changes; hook cache tests |
| AC3 | Shared immutable sample object, method-order independence, unique tensor indices tested in Python |
| AC4 | Independent GP dense solve and bounded jitter; spline knots/extrapolation; MLP finite differences, Adam update, learning, cancellation; all four methods completed in real API/browser flows; failed rows show no invented metrics |
| AC5 | Numerical IV masks/roundtrips; browser IV preset, volatility-point table labels, forced invalid sampled knot error; no silent imputation |
| AC6 | Hand-calculated metric/mask tests, unseen exclusion and empty-region nulls; browser regional selector |
| AC7 | Visible WebGL traces, shared scales, overlays, slider and accessible slice table; camera survives compatible view changes, resets with domain revision; changing surface view exits the slice |
| AC8 | Four real sequential budgets with no additional reference request; distinct accuracy/fit/inference curves; inspect completed budget; real cancellation retains completed budget; delayed-transport hook test proves no late append |
| AC9 | Real extrapolation flow, inward-snapped training rectangle, outside-region metrics, explicit extrapolation warnings |
| AC10 | Hook tests for late success/error despite ignored abort, edit, reset, unmount, cancel, result identity mismatch, all-model failure; browser cancel/service retry/stale labels |
| AC11 | Body/work/dimension limits; chunked oversized body test; 503 capacity, 504 deadline; slot retained until disconnected or timed-out worker actually finishes; maximum legitimate request measured below byte cap |
| AC12 | Keyboard tab arrows and disabled-tab skipping; mobile modal Escape/focus restoration; labelled controls/live status; numeric chart alternatives; 390px, 768px effective viewport (200%-equivalent reflow), 1440px and 1536px desktop checks |
| AC13 | Full frontend/Python regressions; actual Ithaca Solve and Troy Worker simulation with rendered results |

Browser failures injected through transport interception are explicitly test cases, not production numerical outcomes. A real invalid-IV case failed at shared sampling as intended. A real cancellation returned control in **57 ms** in the first complete browser run; this measures UI responsiveness, not native worker termination. Python runner tests separately prove capacity is retained until worker completion.

### Production performance measurements

Run `services/solver-api/.venv/Scripts/python.exe scripts/oracle_release_probe.py` from the repository root. Results are saved in [release-measurements.json](release-measurements.json). Environment: Windows 11, AMD64 Family 26 Model 36, Python 3.14.7, NumPy 2.5.3, SciPy 1.18.1; same local BLAS installation as the foundation measurements. Browser tests used the Vite development build and local Uvicorn service.

| Production measurement | Observed wall time | Tracked allocation peak |
| --- | --- | --- |
| Default 61×51 / 20,000-path reference | 1,293.77 ms | 6.46 MiB |
| Default all-model 128-sample fit/evaluation | 1,299.15 ms | 2.37 MiB |
| All-model 256-sample fit/evaluation | 1,287.73 ms | 4.24 MiB |
| All models, width 64 / 1,000 epochs / 128 samples | 2,925.74 ms | 2.34 MiB |
| Near-cap reference: 81×81 / 18,518 paths | 2,752.28 ms | 6.04 MiB |
| 81×81 evaluation / 256 samples / all models | 1,868.37 ms | 4.96 MiB |

These are single local observations with tracing overhead and concurrent browser activity, not hosted performance guarantees or total process RSS. In the untraced browser run, default all-model compute was approximately **439 ms**, excluding reference generation/network/rendering. The largest serialized experiment request tested was **251,904 bytes**, below the **2 MiB** streaming body limit. Reference work is capped at 120 million operations; combined fit work at 9 billion estimated scalar operations. Both endpoints share the existing 30-second deadline and two-worker default capacity.

### Visual review and intentional differences

Compared the accepted 1536×1024 image with actual computed output at the same viewport:

1. Preserved the 68px header, approximately 300px left experiment rail, large central plot, right method explanation, and comparison table below.
2. Preserved navy surfaces, thin borders, cream serif headings, sans-serif controls, and cyan active/run states.
3. Preserved experiment tabs and separate reference/prediction/error/GP uncertainty views.
4. Used a real Plotly surface with training markers and numeric axes; corrected camera orientation to show the full surface face.
5. Preserved the highlighted selected-method row and separate accuracy/runtime columns.

Intentional differences: real numerical values replace mockup values; paths default to the measured 20,000; spot is a surface domain rather than an unused scalar field; dividend is exposed; truthful MC/GBM explanations and diagnostics add content; rails/results scroll independently when needed; mobile moves controls to a modal and explanations below the chart. The camera pulls back at narrow widths to keep axes visible. No generated image substitutes for interactive UI.

Browser scripts, raw browser observations, and screenshots are local review artifacts outside the repository at:

`C:/Users/enson/.codex/visualizations/2026/09/18/01a0b654-9abd-7863-a30b-b72ed3649e31/`

Representative files: `oracle-desktop.png`, `oracle-mobile.png`, `oracle-mobile-controls.png`, `oracle-iv.png`, `oracle-budget.png`, `oracle-extrapolation.png`, `ithaca-smoke.png`, `troy-smoke.png`, `oracle-browser-results.json`. They contain actual local results. The screenshots are local evidence, not deployment artifacts.

### Limits and release boundary

The release scope is complete in this checkout. Constant-volatility GBM has flat theoretical IV; the Black–Scholes residual mainly represents MC noise. GP uncertainty uses a diagonal approximation to correlated reference noise. Fixed-epoch MLP training does not establish convergence; budget curves need not improve monotonically. These limitations are visible in the product. Hosting performance, production routing, and full assistive-technology certification are not claimed by local browser tests. Production deployment remains a separate user action.

## Historical phase 1 status and scope

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
