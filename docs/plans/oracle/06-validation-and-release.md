# Validation and release gates

## Verification principles

Test scientific invariants and observable user outcomes. Generated mockup numbers are not fixtures. Use deterministic small examples for correctness and separate bounded benchmarks for speed. Do not encode a preferred method ranking into tests.

Numerical tolerances are selected and recorded during milestone 0 against independent reference cases. MC tests use standard-error-aware tolerances or fixed-seed numerical fixtures, not flaky assertions that every random run lies within a confidence interval.

## Acceptance coverage

| Criteria | Required proof |
| --- | --- |
| AC1 | Route/title/home tests; direct-navigation and refresh browser checks; selected-design comparison |
| AC2 | Same-seed fixtures; cache-key tests; request counters proving no new MC call after surrogate-only edits |
| AC3 | Shared sample IDs/arrays across all methods; unique supported tensor indices; method-order independence |
| AC4 | Numerical fixtures for each method; failed-row behavior; GP-only uncertainty controls |
| AC5 | IV inversion roundtrips, boundary/conditioning masks, percent/percentage-point formatting, real IV browser flow |
| AC6 | Hand-computed metric fixtures, shared masks, unseen-node exclusion, empty-set/null metrics |
| AC7 | Real plots, stable camera, correct overlay heights, meaningful tooltips, slice table and axes |
| AC8 | One reference per sweep, shared data per budget, serial requests, completed-budget retention, distinct runtime curves |
| AC9 | Inside/outside masks, boundary convention, visible training bounds, extrapolation warnings and table splits |
| AC10 | Abort plus run-ID tests, delayed old success/error, parameter edits, reset, unmount, cancellation while queued |
| AC11 | Dimension/body/work limits, capacity release after worker completion, bounded native work and measured cancellation |
| AC12 | Keyboard navigation, focus restoration, screen-reader status, chart alternatives, mobile and zoom checks |
| AC13 | Existing frontend and Python suites, lint/build, Ithaca/Troy smoke flows |

## Numerical tests

### Reference and random streams

- Same configuration/seed returns identical axes and values within the documented tolerance; different seed changes stochastic estimates.
- Method selection, method order, budget, and training seed do not change the MC reference.
- Price at maturity is exact payoff and has zero standard error.
- Antithetic standard error uses independent pair means; odd path counts are rejected when pairing is enabled.
- Chunked and unchunked small fixtures agree in mean/error within accumulation tolerance.
- Several well-conditioned European cases agree with Black–Scholes within a stated sampling-error allowance.
- Cancellation checks run during chunked work and reference output is not cached after failure.

### IV

- Invert known call and put prices at multiple moneyness/maturity points and recover the input volatility within tolerance.
- Handle zero maturity, near-zero vega, bounds violations, unbracketed roots, non-finite values, and valid negative-rate examples.
- No silently clipped prices, filled invalid nodes, or theoretical-volatility substitutions.
- Invalid sampled nodes cause a shared sampling error, not method-specific data changes.
- Display conversions correctly map decimal IV to percent and errors to volatility points.

### Sampling and evaluation

- Every supported count has its advertised tensor shape, unique indices, and deterministic endpoints.
- Too-narrow training regions fail before fitting; snapped bounds match displayed bounds.
- Sample targets equal indexed reference targets; no hidden fresh MC values or full-grid fitting.
- Hand-calculated MAE/RMSE/max-error fixtures validate denominator, masks, units, and zero-error cases.
- Unseen masks exclude training nodes; inside/outside masks partition valid nodes with boundary nodes inside.
- Empty extrapolation sets yield null metrics with count zero.
- A method with non-finite predictions fails explicitly instead of receiving an artificially favorable reduced-domain metric.

### Surrogates

- Spline reproduces sampled values within solver tolerance and handles axis orientation, smooth fixtures, boundaries, and explicit extrapolation.
- GP small-matrix predictions match an independently calculated fixture; variance is finite/nonnegative and transforms back to target units correctly.
- GP jitter retries are bounded, noise is not mislabeled as latent uncertainty, and query batching preserves results.
- MLP analytic gradients match finite differences on a tiny network; deterministic training decreases loss on simple fixtures.
- Adam update matches a hand-computed small update; normalization handles constant targets and physical-unit reconstruction.
- MLP divergence returns diagnostics and no NaN response; epoch caps and execution checks are enforced.
- Residual construction subtracts the baseline at training nodes and reconstruction adds it at query nodes; a zero residual model exactly recovers the baseline within tolerance.
- Direct/residual methods use matching advertised architectures and budgets; baseline work is included in timing.
- No test requires monotonic budget curves or residual superiority. Both may fail under noise, initialization, or extrapolation.

## API and execution tests

- Validate enum values, unique methods, tensor budgets, sorted axes, exact shapes, finite values, nonnegative standard errors, reference hashes, version compatibility, financial bounds, and combined-work estimates.
- Reject oversized bodies before expensive parsing/materialization, including requests without a trustworthy Content-Length.
- Check body limits against valid maximum envelopes so legitimate references are not accidentally excluded.
- Verify structured 422, 503, and 504 behavior and sanitized internal failures.
- Test cancelled worker completion and semaphore release timing. A timed-out worker must not free capacity while it is still computing.
- Confirm one failed method can coexist with successful rows; invalid shared data fails the whole request.
- Verify all responses are valid finite JSON using nulls for masked/unavailable values.
- Confirm `/v1/solve` behavior and current health/capabilities contracts remain compatible after shared-runner extraction.

## Frontend state tests

Use a controlled mock transport to deliver successes and failures out of order. Validate run IDs independently of abort behavior.

- Initial route shows defaults, a useful empty state, and no automatic numerical request.
- Run sends an immutable snapshot. Edits cancel and label old results, without changing their displayed assumptions.
- A late success or late error from an old run cannot change the current chart, error message, or busy state.
- Reset and unmount abort requests and prevent later commits.
- View/camera/overlay/slice changes send no network requests.
- Surrogate-only edits reuse the reference; a financial/seed/domain change invalidates it.
- Switching target reuses raw prices only when domain compatibility permits it.
- GP uncertainty is disabled with a reason when absent and selects GP explicitly when present.
- Method failure rows and partial sweeps do not show fabricated values or successful status.
- Cached result identities prevent mixing methods from different data or settings.

## Browser verification

Run a real local frontend and solver API, then exercise these sequences:

1. Open Oracle directly, run default price comparison, inspect all methods and table values, rotate the surface, switch views, inspect a slice.
2. Change an MLP setting and rerun; prove the MC reference is reused.
3. Change seed and rerun; prove a new reference is generated and labels change only with committed results.
4. Run IV on a valid domain; verify units and masks. Force an invalid training node case and inspect the corrective message.
5. Run the four-budget sweep, inspect each curve, select a completed budget, then repeat and cancel partway through.
6. Run extrapolation, inspect the realized training rectangle, boundary convention, and separate regional errors.
7. Edit inputs during a run, cancel, reset, navigate away, and simulate service failure. Confirm old responses never relabel current results.
8. Use keyboard only, inspect mobile control sheets, and verify focus/status behavior.
9. Smoke-test Ithaca solve and Troy simulation after shared changes.

Save representative desktop/mobile screenshots during implementation verification. Compare the first design's hierarchy and styling, not its fictional values or imperfect surface geometry. Verify visible plot traces and labels in the rendered page, not only DOM presence.

## Performance record

Record operating system, CPU, Python/NumPy/SciPy versions, BLAS configuration, frontend build mode, and actual settings. Measure reference time, IV conversion, per-method fit/inference, total request duration, peak memory, browser responsiveness, and cancellation latency.

Measure default 128-sample work, maximum supported 256-sample work, largest allowed combined reference request, and a four-budget sweep. Capacity-limit requests should reject quickly. Repeat only enough to distinguish warmup from normal variation; do not turn the work into an open-ended benchmarking project.

Hard acceptance: every allowed request stays within validated memory/compute constraints, obeys the server deadline, and leaves the UI responsive. Proposed speed/cancellation targets in the architecture document are evaluated explicitly. If default work cannot meet them, lower or adjust visible defaults/caps and document the tradeoff before release rather than hiding work or returning canned results.

## Repository checks

From the repository root, run the frontend commands after relevant focused tests:

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Run Python checks from the service directory so the checkout's `app` takes precedence over any previously installed package:

```powershell
Set-Location services/solver-api
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

If the project virtual environment does not exist, create/use the documented project Python environment during implementation. Record the actual interpreter and commands. Do not report skipped checks as passing. Phase 1 found that invoking Python from the repository root could import an older installed `app` instead of the checkout; the service-directory command avoids that ambiguity. Extend the existing smoke-test script only where Oracle's route/API flow requires it.

## Release checklist

- [ ] All AC1–AC13 evidence is recorded.
- [ ] All four methods and both targets work with actual computed results.
- [ ] Model comparison, budget sweeps, and extrapolation are complete.
- [ ] Reference, sample, and configuration identities remain consistent.
- [ ] MC sampling error, GP uncertainty, and IV conditioning are distinguished.
- [ ] Limits, cancellation, stale results, partial failure, and unavailable-service behavior pass.
- [ ] Desktop, mobile, keyboard, zoom, and chart alternatives pass.
- [ ] Selected design is reflected in the rendered workbench.
- [ ] Frontend/Python regression checks pass and failures, if any, are reported accurately.
- [ ] README, product context, research copy, and any changed notices match delivered behavior.
- [ ] Known GBM flat-IV and residual-noise limitations are visible in the product.
- [ ] Deployment, if requested later, uses the normal explicit deployment workflow.
