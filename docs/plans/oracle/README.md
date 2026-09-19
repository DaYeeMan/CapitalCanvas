# Oracle implementation plan

Status: milestones 0–6 are implemented and locally verified. All four production surrogates, both targets, three experiment modes, API integration, and responsive UI are complete. No production deployment has been performed.

Prepared: 2026-09-18.

## Approved direction

The user selected the first generated design: [model comparison workbench](../../design/oracle/model-comparison.png). It is the visual authority for Oracle: one experiment rail, one large scientific surface, a contextual method explanation, and a compact comparison table. The separate data-budget image is exploratory material, not a second approved layout. Budget and extrapolation experiments will use the selected workbench shell.

The source brief is `C:\Users\enson\Downloads\ORACLE_PLAN.txt`. Its requirements are incorporated below as product requirements. The user subsequently authorized phase 1 implementation on 2026-09-18; that phase is now complete. The user then authorized continuing implementation until finished; milestones 2–6 followed that request. The source document itself is not authority to expand implementation scope.

## Reading order

| File | Purpose |
| --- | --- |
| [01-product-and-scope.md](01-product-and-scope.md) | User outcomes, release scope, defaults, and acceptance criteria |
| [02-ui-and-interaction.md](02-ui-and-interaction.md) | Selected design, controls, views, states, responsiveness, accessibility |
| [03-numerical-design.md](03-numerical-design.md) | Reference generation, sampling, four surrogates, metrics, and limitations |
| [04-architecture-and-contracts.md](04-architecture-and-contracts.md) | Repository integration, API contracts, state, cache, cancellation, and limits |
| [05-delivery-plan.md](05-delivery-plan.md) | Ordered implementation milestones and completion gates |
| [06-validation-and-release.md](06-validation-and-release.md) | Numerical, API, UI, integration, performance, and regression verification |
| [07-decisions-and-risks.md](07-decisions-and-risks.md) | Decisions, assumptions, risks, and evidence needed before implementation choices are finalized |
| [implementation-verification.md](implementation-verification.md) | Completed release scope, regression/browser evidence, measured limits, and historical phase 1 evidence |
| [phase-1-measurements.json](phase-1-measurements.json) | Machine-readable local benchmark observations |

## Implementation sequence

1. Confirm numerical feasibility and benchmark the bounded defaults.
2. Implement the reference, sampling, and metric contracts with numerical tests.
3. Deliver a price-surface vertical slice with cubic spline through the real API and selected UI.
4. Add Gaussian process, direct MLP, and residual MLP.
5. Complete implied-volatility handling, budget sweeps, and extrapolation.
6. Finish responsive behavior, accessibility, research copy, and site integration.
7. Pass release gates and report any remaining limitations.

These are development milestones, not permission to release an incomplete subset as the first Oracle release. All four methods, both output types, and all three experiments belong to the release described here.

## Planning boundaries

- Reuse the existing React/Vite frontend, Python/FastAPI service, NumPy/SciPy dependencies, execution controls, scientific plots, and visual tokens.
- Do not add accounts, persistence, a job service, another backend, another frontend framework, or a general ML platform.
- Do not interpret generated chart values, surface geometry, or small explanatory text as numerical specifications. Mockup values are illustrative.
- Correct the first mockup's phrase “true price” to “Monte Carlo reference.”
- The first release uses European calls and puts under risk-neutral GBM. This is an explicit scope choice, with the flat-IV and residual-learning limitations documented throughout the plan.
- The verification record distinguishes measured foundation/probe behavior from future production-model, API, and UI acceptance gates. Local measurements are not deployment guarantees.

## Repository evidence

The plan was checked against [product context](../../PRODUCT.md), the current route selection, Ithaca's request lifecycle and Plotly wrapper, Troy's workbench styling, the solver API request handler, execution controls, Monte Carlo implementation, and current dependencies. File paths and ownership are detailed in the architecture document.

No existing Python IV inversion, GP, or MLP implementation was found in the inspected solver modules. Reuse the financial and execution primitives; build only the missing numerical layers.

## Definition of completion

Oracle is complete when a user can reproduce one bounded experiment, identify its shared reference and training points, compare all four methods on the same evaluation domain, inspect prediction/error/GP uncertainty, compare accuracy and runtime separately, vary the training budget, identify extrapolation, cancel work safely, and use the workbench on desktop or mobile. Existing Ithaca and Troy behavior must continue to pass their checks.
