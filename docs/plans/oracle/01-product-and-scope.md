# Product and release scope

## Purpose

Oracle teaches the tradeoffs between surrogate accuracy, training data, construction cost, and inference cost on financial surfaces. Monte Carlo supplies a reproducible high-fidelity reference with sampling error. It is not exact mathematical truth.

The primary question is: “What did this model learn from these sampled points, where does it disagree with the reference, and what did it cost?” There is no aggregate accuracy/speed score and no implied universal winner.

## Required workflow

1. Choose price or implied volatility and configure a European call or put.
2. Set the reference domain, path count, and experiment seed.
3. Generate or reuse the Monte Carlo reference.
4. Select a supported training-point budget and an interpolation or extrapolation region.
5. Select any nonempty subset of cubic spline, Gaussian process, MLP, and residual MLP.
6. Run the experiment on shared training points.
7. Switch between reference, prediction, absolute error, and GP uncertainty; inspect training points and 2D slices.
8. Compare the common accuracy metrics and separate fit/inference times.
9. Run a budget sweep or adjust the training region while reusing the reference.

## Release scope

| Area | Required behavior |
| --- | --- |
| Financial contract | European vanilla call and put; fixed strike, rates, dividend yield, and model volatility |
| Reference model | Existing risk-neutral GBM Monte Carlo, seeded, antithetic, with price standard errors |
| Surfaces | Price and Black–Scholes implied volatility derived from Monte Carlo prices |
| Coordinates | Spot and time to maturity for both targets; IV may format spot as S/K without changing the underlying coordinates |
| Methods | Cubic spline, Gaussian process, direct MLP, residual MLP |
| Experiments | Model comparison, high-fidelity data budget, extrapolation |
| Metrics | MAE, RMSE, maximum absolute error, fit time, inference time, actual training count |
| Explanations | Method equations, residual baseline, shared-data provenance, MC error versus GP uncertainty |
| Lifecycle | Explicit run, cancel, stale-result protection, bounded computation, reference reuse |
| Site | Lazy `/tools/oracle` route, third home card, method documentation, title and metadata |

## Initial defaults to benchmark

| Setting | Proposed default |
| --- | --- |
| Target / side | Price / call |
| Market | Spot 100, strike 100, volatility 20%, rate 5%, dividend 0% |
| Domain | Spot 60–140, maturity 0–2 years for price |
| Reference grid | 61 spot nodes × 51 maturity nodes |
| Paths / sampling | 20,000 paths, antithetic pairs, exact GBM terminal sampling |
| Experiment seed | 42 |
| Training sample count | 128, arranged as 8 maturity nodes × 16 spot nodes |
| Selected methods | All four |
| Initial completed view | Prediction; cubic spline selected unless a valid existing method selection is retained |
| Training overlay | Visible |
| Advanced settings | Collapsed |
| Budget sweep | 32, 64, 128, 256 |
| IV domain | Spot 80–120, maturity 0.25–2 years; unsupported IV nodes remain masked |

The image's 50,000 paths are not a mandatory default. The current API has a 30-second default deadline and a 120-million-operation limit on Ithaca requests. Oracle needs its own conservative estimator and measured defaults; independent dimension limits do not guarantee a valid combined request.

Phase 1 measurement corrected the IV default: the original spot 60–140 preset produced seven invalid IV nodes, including one required training knot, at seed 42 with 20,000 paths. The 80–120 preset passed all five supported sample budgets without masking any default nodes. This changes a default, not the available domain controls. Other configurations still receive explicit invalid-node diagnostics.

## Scientific interpretation

GBM with constant volatility has a flat theoretical IV surface. Oracle must not create an artificial smile to match artwork. Differences in an IV experiment arise from Monte Carlo noise, inversion, and surrogate approximation. This is useful for an initial numerical laboratory but is not a calibrated volatility-smile model.

Black–Scholes with the same GBM parameters is the residual model's analytical baseline. The correction mostly learns reference sampling error and approximation effects in this first release. Explain this prominently and show baseline-only error in the method detail. Do not promise residual MLP superiority. A future different high-fidelity process would require a separate scoped change.

## Non-goals

- Live market data, calibration, trading execution, investment recommendations, or portfolio tools.
- American, barrier, or Asian contract support in Oracle's first release.
- New stochastic-volatility/jump reference models, GPU execution, PyTorch, or a cross-runtime bridge into Troy's browser engine.
- Arbitrary scattered-point sampling, adaptive acquisition, Bayesian optimization, automatic architecture searches, or arbitrary uploaded training data.
- Persistent saved experiments, accounts, database cache, background jobs, cross-session resume, or public benchmark rankings.
- Export, screenshot generation, dashboards beyond this workbench, or a site redesign.

## Observable acceptance criteria

- **AC1 — Route and identity:** Direct loading and refreshing `/tools/oracle` work; home links to Oracle; the shell matches the selected design.
- **AC2 — Shared reference:** Repeating a configuration and seed reproduces the reference within documented numerical tolerance. Changing only a method does not regenerate Monte Carlo.
- **AC3 — Shared data:** Every selected method receives identical training coordinates and values for a comparison; actual sample count and identity are visible.
- **AC4 — Methods:** All four return predictions and diagnostics; GP additionally returns clearly labeled predictive standard deviation.
- **AC5 — Targets:** Price and IV work; invalid IV nodes are explained and never converted into invented values.
- **AC6 — Evaluation:** Metrics use the same reference and explicit evaluation mask; full-grid and unseen-grid evaluations are distinguished.
- **AC7 — Visualization:** Reference, prediction, error, training overlay, and 2D slice are available with meaningful labels and stable camera behavior.
- **AC8 — Budget:** A sweep reuses its reference, shares samples across methods at each budget, and shows separate accuracy/fit/inference curves.
- **AC9 — Extrapolation:** Training bounds are visible; interpolation and extrapolation errors are reported separately.
- **AC10 — Lifecycle:** Cancel, navigation, edited inputs, and late responses cannot overwrite the current experiment or mislabel old results.
- **AC11 — Limits:** Unsupported dimensions and combined workloads fail early with actionable errors; operations remain bounded.
- **AC12 — Accessibility:** Keyboard access, focus restoration, labeled inputs, chart alternatives, mobile controls, and non-color status cues work.
- **AC13 — Compatibility:** Existing Ithaca/Troy tests, lint, build, and relevant numerical regressions pass.

Every criterion maps to verification in [06-validation-and-release.md](06-validation-and-release.md).
