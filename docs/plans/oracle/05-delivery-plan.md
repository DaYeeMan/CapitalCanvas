# Delivery plan

## Working rules

The user authorized phase 1 on 2026-09-18. Milestone 1 is complete, with the necessary milestone 0 feasibility measurements recorded in [implementation-verification.md](implementation-verification.md). The following milestones remain the implementation sequence; this status does not describe the complete product as released.

At implementation start, read applicable repository instructions and recheck changed integration points. Keep each milestone runnable, with a narrow diff and tests for its actual behavior. Do not introduce placeholder numerical results in release UI. Do not begin with a broad component or service rewrite.

## Milestone 0 — Feasibility and contract freeze

**Purpose:** Resolve numerical and performance assumptions before building around them.

Tasks:

- Inspect actual installed NumPy/SciPy versions and confirm the selected cubic interpolation API in that environment.
- Benchmark the proposed 20,000-path 61×51 reference and a 128-sample all-method fit on documented hardware.
- Measure peak temporary memory, native-call duration, and default/capped work against service deadlines.
- Check the default IV domain for invalid/low-vega nodes; establish inversion tolerance, vega threshold, and actionable failure behavior.
- Verify fixed-budget MLP learning on a known smooth function and nearly constant targets; establish gradient-check tolerances.
- Confirm GP fixed-kernel behavior and noise-floor handling using a small independent fixture.
- Finalize bounds, defaults, combined-work estimator, loss conventions, canonical IDs, and API/error schema.
- Record any necessary change to the NumPy-only ML choice with justification. Do not add a framework solely for convenience.

**Gate:** A short implementation-era measurement record documents viable defaults and caps. No fabricated performance claims; no unresolved numerical definition blocking the next milestone.

## Milestone 1 — Reference, IV, sampling, and metrics foundations

Status: complete. Foundation modules and 39 focused tests are present; all 96 Python tests passed in the final phase 1 regression run. See the verification record for measured limits and the IV preset correction.

**Depends on:** Milestone 0.

Tasks:

- Add Oracle input/output models with strict dimensions, finite values, and resource limits.
- Reuse/extract MC primitives and implement bounded reference generation, price standard errors, and provenance.
- Implement IV inversion, valid masks, reason codes, and optional noise approximation.
- Implement supported tensor budgets, deterministic indices, training-region handling, and sample identities.
- Implement metric masks, units, baseline evaluation, and full/unseen/region statistics.
- Preserve execution checks through every new loop and retain existing Ithaca results after any extraction.

**Gate:** Seed, paired-error, IV roundtrip/masking, sampling, metric, and cancellation tests pass. A valid reference and shared sample set can be produced without a frontend.

## Milestone 2 — Price + spline vertical slice

**Depends on:** Milestone 1.

Tasks:

- Register capabilities/reference/experiment endpoints under `/v1/oracle` with the shared bounded runner.
- Implement cubic spline fitting/prediction and structured method diagnostics.
- Add lazy Oracle route and tool-scoped shell matching the selected design.
- Wire real parameter inputs, explicit Run/Cancel, reference reuse, guarded commits, initial/error/stale states, surface tabs, and the comparison table.
- Reuse scientific plot and math primitives; add only the needed camera/slice interface.
- Keep the public Coming soon card until the release scope is complete; the in-development route is for validation.

**Gate:** A real price experiment runs from browser controls through API to a spline surface and metrics. A method-setting change reuses the reference; cancellation and late responses cannot corrupt UI state.

## Milestone 3 — All four methods

**Depends on:** Milestone 2.

Tasks:

- Add exact GP mean/latent variance with bounded jitter and prediction batches.
- Add bounded MLP training and inference with tested gradients/optimizer behavior.
- Add residual training and reconstruction through the common baseline interface.
- Complete shared settings, uncertainty view, contextual explanations, all table columns, and partial-failure rows.
- Verify every method sees the exact same training object and no evaluation-grid targets.
- Record fit/inference timing consistently; include residual baseline cost and explain GP variance cost.

**Gate:** All four methods complete one reproducible price experiment, report honest diagnostics, and pass their focused numerical tests. Uncertainty cannot be mistaken for MC standard error.

## Milestone 4 — IV, budget, and extrapolation experiences

**Depends on:** Milestone 3. IV numerical foundations already exist from milestone 1.

Tasks:

- Wire IV target selection, units, invalid-node gaps, conditioning warnings, and flat-GBM explanation.
- Implement sequential budget requests with one reused reference, per-budget shared sample sets, stage status, and retained completed budgets.
- Add separate accuracy/fit/inference charts inside the approved shell; selecting a budget opens its completed comparison.
- Add training-region controls, realized-bound display, outside-region indication, and split metrics.
- Complete stable camera behavior, training overlays, numeric slice alternatives, and scale consistency across method switches.

**Gate:** Both targets and all three experiments meet their acceptance criteria. No silent sample dropping, fake IV smile, mixed configuration results, or combined performance score.

## Milestone 5 — Accessibility and site integration

**Depends on:** Milestone 4.

Tasks:

- Complete mobile control sheets, focus behavior, keyboard tabs, live status, reduced motion, and readable tables.
- Check screenshot fidelity against the selected image at desktop size, using real computed results.
- Replace the third home card with Oracle and a concise description: “Compare surrogate models across price and implied-volatility surfaces.” Suggested tags: Surrogates, Monte Carlo, Model error.
- Add an Oracle research/methods group using the site's existing source metadata/disclosure pattern. Use verified primary references and original explanations.
- Update route metadata and `docs/PRODUCT.md`/root README only to describe completed capabilities.
- Check attribution/notices only if dependencies or licensed material actually changed.

**Gate:** Oracle is discoverable, navigable, and usable with keyboard and at planned responsive widths. Ithaca/Troy style and interaction behavior remain intact.

## Milestone 6 — Release verification

**Depends on:** Milestone 5.

Tasks:

- Run the acceptance matrix and focused default/cap benchmarks from the validation plan.
- Run frontend tests, lint, build, and Python numerical/API tests.
- Exercise real browser-to-API flows, including cancellation, service unavailability, stale responses, IV invalidity, method failure, and a full budget sweep.
- Inspect compiled/lazy route behavior and same-origin API routing without redesigning deployment infrastructure.
- Record test outcomes, exact environment, benchmark observations, known limitations, and remaining work in `implementation-verification.md` when actual verification occurs.

**Gate:** All release criteria pass; no fabricated results, incomplete controls, unknown failure states, or unbounded work. Implementation completion does not itself authorize production deployment.

## Suggested change boundaries

Use reviewable groups: numerical foundations; transport/execution; spline vertical slice; remaining models; experiments; accessibility/site; final validation. These are suggested commit boundaries, not a requirement to commit or publish without the user's normal workflow.

## Stop condition

Stop after the documented release scope and checks pass. Do not continue into stochastic-volatility models, arbitrary datasets, nested adaptive sampling, hyperparameter search, persistence, or a generic ML platform. Record those as possible later work only if they solve a demonstrated user need.
