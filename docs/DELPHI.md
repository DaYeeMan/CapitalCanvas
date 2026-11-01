# Delphi maintenance notes

Delphi compares cubic splines, exact RBF Gaussian processes, direct MLPs, and residual MLPs on shared Monte Carlo training data. It supports price and implied-volatility surfaces for European calls and puts under constant-volatility risk-neutral GBM.

## Locations

- UI and request state: `apps/web/src/delphi/`
- Research citations: `apps/web/src/site/delphiResearch.ts`
- Numerical implementation and API: `services/solver-api/app/delphi/`
- Numerical/API tests: `services/solver-api/tests/test_delphi_*.py`
- Public route: `/tools/delphi`
- API: `/v1/delphi/capabilities`, `/reference`, `/experiment`

## Contracts and limits

Arrays are indexed by maturity, then spot. All selected methods receive one immutable sample set. Supported tensor budgets remain 16, 32, 64, 128, and 256. The `nested-tensor-v2` sampler preserves four evenly spread anchors per axis, then repeatedly adds the midpoint of the largest remaining gap (leftmost gap wins ties; midpoints round down). Larger budgets retain every smaller-budget training point within the same domain or training region. Grids remain rectangular for cubic interpolation; spacing is approximately even rather than exactly uniform. The request strategy label `uniform_tensor` is retained for compatibility. Reference, sample, and experiment identities guard against mixed configurations. Full-grid metrics include training points; unseen and inside/outside metrics are reported separately.

The full reference and evaluation grid stays fixed across budgets within a run. Changing the surface domain or grid dimensions marks existing results stale; the next run generates a new reference and rebuilds nested subsets from its eligible nodes. Restricted extrapolation regions snap inward to reference nodes and use their own nested family. Sampling version changes are included in sample and experiment identities.

The default reference uses 20,000 antithetic paths and a 61×51 grid. Every browser run draws fresh Monte Carlo and model-training seeds using the same browser-entropy helper as Troy; the API keeps explicit seeds for reproducibility. All models, budgets, and views within that run share one reference and training seed. Seeds are recorded in the result snapshot rather than exposed as fixed input fields. Price uses spot 60–140 and maturity 0–2 years; the IV preset uses spot 80–120 and maturity 0.25–2 years to avoid ill-conditioned default training knots. Invalid IV nodes are masked; invalid sampled knots reject the experiment.

Reference work is capped at 120 million payoff node-path evaluations, combined fit work at 9 billion estimated scalar operations, and request bodies at 2 MiB. Capabilities publish the current bounds. Delphi shares Ithaca's execution slots and deadline settings. A cancelled or timed-out request retains its slot until its worker finishes.

Each run generates a fresh reference within a 16 MiB size limit; references are not reused across runs. The browser keeps up to four sequential sweep results within a 32 MiB detail budget. Completed summaries survive detailed-surface eviction. Edits, reset, cancellation, and unmount abort requests; run identifiers also reject late responses. Nothing is persisted.

Run experiment prepares all three views from one shared reference: the full-domain comparison at the selected sample count, the selected data-budget sweep, and the restricted-region extrapolation at the selected sample count. Fits run serially; the sweep reuses the comparison fit when its sample count is included. Each view retains its own result, and inspecting a budget cannot replace the comparison or extrapolation surface. Tab selection does not cancel work or mark results stale. All three configurations are validated before starting; real input changes still abort the run and mark retained results stale. Completed results and budget curves survive cancellation or failure, including cancellation before a replacement sweep begins.

## Numerical interpretation

Black–Scholes is the analytical expectation of the GBM reference, so residual learning primarily fits Monte Carlo noise. Theoretical IV is flat. GP latent uncertainty is distinct from Monte Carlo standard error and uses a diagonal approximation to correlated reference noise. MLPs use two tanh hidden layers, full-batch Adam, and fixed epoch budgets; convergence and monotonic improvement with more data are not guaranteed.

The GP retains the RBF kernel with unit prior variance on training-normalized targets. Each fit selects separate normalized spot and maturity length scales (0.05–2) and an additional discrepancy standard deviation (`noise_floor`–0.5) using training-only spatial cross-validation. Four deterministic folds hold out alternating interior spot columns (two folds) and maturity rows (two folds); boundary levels remain in each fold's training set, so validation tests interpolation gaps. Every interior level is held out once along its axis. Each fold computes target normalization and Monte Carlo noise scaling from its retained samples only. The objective averages the two fold MSEs within each axis, then weights spot and maturity equally. Scores use a common training-scale unit solely to stabilize optimization; diagnostics restore them to price or decimal-IV units. Validation RMSE is a model-selection score, distinct from the final full-grid evaluation, and does not validate extrapolation.

After selection, the GP is refitted on every training point. Its covariance is `K + diag((MC_SE / target_scale)^2 + regularization^2) + jitter*I`: regularization is additional model discrepancy, not a replacement for Monte Carlo error. `length_scale` initializes both axes; the legacy `noise_floor` setting bounds fitted regularization from below. Two deterministic starts use regularization 0.001 and 0.03 (raised to the configured minimum). L-BFGS-B uses analytic validation gradients, at most 40 iterations per start and 96 total four-fold objective evaluations, and cooperative cancellation between folds/evaluations. The existing conservative fit-work estimate covers the four smaller fold fits per evaluation and final refit. Bounded factorization jitter remains separate. No query coordinates, final-grid evaluation targets, analytical baseline, or earlier-budget errors enter model selection. The best finite validation candidate is retained if optimization stops early, with a warning and diagnostics. Experiment identities use `delphi-fit-v3-rbf-spatial-cv`; reference and sample identities are unchanged. Fitted scales, regularization, combined and per-axis validation RMSE, evaluation count, and convergence are returned in diagnostics. The GP still uses its training mean; no linear trend or Matérn kernel is added. More data can still increase measured error, and curves are never adjusted to enforce monotonicity.

IV is decimal internally, displayed in percent; IV errors are volatility percentage points. Raw predictions that violate financial bounds remain in evaluation and carry diagnostics. Fit and inference timings exclude reference generation, network transfer, plotting, and evaluation.

## Verification

Run frontend checks from the repository root:

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Run Python tests from the service directory so the checkout takes precedence over older installed packages:

```powershell
Set-Location services/solver-api
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

The completed rename passed 76 frontend tests, 113 Python tests, lint, build, and a real browser launch and experiment at the Delphi route. Earlier browser checks covered all methods, both targets, sweeps, extrapolation, cancellation, failure recovery, mobile controls, camera persistence, and Ithaca/Troy smoke flows. Production deployment remains separate from local verification.

The shared-run update passed 17 focused frontend tests and the production build; lint has no errors and retains the existing DelphiSurface dependency warning. Real solver/browser checks in installed Edge at 1440×900 and 390×844 confirmed one click produces one reference request and five default fit requests, all three views and four budget points, switching tabs during a run without cancellation, separate comparison/extrapolation samples, budget inspection isolation, stale-input handling, and reset across every view. No browser errors occurred. Browser plugin unavailable; verification used bundled Playwright, with temporary evidence outside the repository.
