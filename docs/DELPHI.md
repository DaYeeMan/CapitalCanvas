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

Arrays are indexed by maturity, then spot. All selected methods receive one immutable sample set. Supported tensor budgets are 16, 32, 64, 128, and 256. Reference, sample, and experiment identities guard against mixed configurations. Full-grid metrics include training points; unseen and inside/outside metrics are reported separately.

The default reference uses 20,000 antithetic paths, a 61×51 grid, and seed 42. Price uses spot 60–140 and maturity 0–2 years; the IV preset uses spot 80–120 and maturity 0.25–2 years to avoid ill-conditioned default training knots. Invalid IV nodes are masked; invalid sampled knots reject the experiment.

Reference work is capped at 120 million payoff node-path evaluations, combined fit work at 9 billion estimated scalar operations, and request bodies at 2 MiB. Capabilities publish the current bounds. Delphi shares Ithaca's execution slots and deadline settings. A cancelled or timed-out request retains its slot until its worker finishes.

The browser keeps at most two references within an approximate 16 MiB cache and up to four sequential sweep results within a 32 MiB detail budget. Completed summaries survive detailed-surface eviction. Edits, reset, cancellation, and unmount abort requests; run identifiers also reject late responses. Nothing is persisted.

## Numerical interpretation

Black–Scholes is the analytical expectation of the GBM reference, so residual learning primarily fits Monte Carlo noise. Theoretical IV is flat. GP latent uncertainty is distinct from Monte Carlo standard error and uses a diagonal approximation to correlated reference noise. MLPs use two tanh hidden layers, full-batch Adam, and fixed epoch budgets; convergence and monotonic improvement with more data are not guaranteed.

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
