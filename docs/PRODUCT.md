# CapitalCanvas product context

## Purpose and scope

CapitalCanvas helps people understand quantitative finance through visualization and experimentation. It is a personal, noncommercial education and research project. Outputs are theoretical estimates, not investment advice, executable quotes, or promises of returns.

The site name is CapitalCanvas; the displayed wordmark is Capital Canvas. The public About attribution is Emmanuel Zhang, with contact `dymteam23@gmail.com`.

Three tools exist: Ithaca, Troy, and Delphi. Delphi occupies the third home card with a launch link and surrogate-model features.

The current product has no accounts, database, saved results, live market data, or trading execution. These describe the existing product rather than restrictions on future planning.

## Site and navigation

- `/` contains Home, Research and methods, About, and the footer in one scrolling document.
- `/#home`, `/#resources`, and `/#about` target sections of that document. Resources and About are not separate pages.
- `/tools/ithaca`, `/tools/troy`, and `/tools/delphi` open independent workbenches with a return link to home.
- `/privacy`, `/terms`, `/disclaimer`, and `/notices` contain policy and attribution content.
- Unknown paths show a not-found view with a home link.

Home says “Explore pricing and market dynamics” and “Visual tools for understanding financial models.” Three translucent navy cards follow the hero directly, without an “Explore the tools” line. Each tool has a description, feature tags, and launch link.

Research entries are grouped by tool in collapsible sections. They include source metadata, original summaries, and implementation notes that distinguish published models from project approximations. Stable paper anchors open the containing group. Ithaca also exposes method references within its sidebar.

The Field homepage uses a separate decorative surface behind Home and About. It is a locally hosted 10-second H.264 loop with a WebP poster, not real-time 3D or a baked page image. The About surface is horizontally mirrored to distinguish it from Home. There is no on-page motion button. Reduced-motion and data-saving preferences disable video; hidden/offscreen media pauses, and video is deferred until its section approaches the viewport. Failed or blocked playback leaves the poster visible. Text and controls remain ordinary HTML above the media.

Resources and the footer use solid navy. All 10 Ithaca, 7 Troy, and 6 Delphi entries remain in native disclosures, collapsed initially, with two-column research rows that stack on mobile. About retains the full project explanation and contact details. Policy and tool routes have no decorative media. Media source and reproduction details live in [Field asset documentation](design/field/ASSET.md).

## Ithaca: option pricing

Ithaca compares analytical and numerical option prices across parameters. It supports European, American, continuous zero-rebate single-barrier, and discrete fixed-strike Asian calls and puts, with methods enabled according to contract compatibility.

The workbench combines input controls, synchronized charts, scalar results, governing equations, uncertainty, convergence, and numerical diagnostics. Desktop places controls left, charts centrally, and explanations right. Mobile prioritizes charts and uses accessible control sheets.

Useful model distinctions:

- European pricing includes Black–Scholes, finite differences, and Monte Carlo.
- American pricing includes a binomial tree, an exercise-constrained finite-difference method, and Longstaff–Schwartz simulation.
- Barrier contracts use continuous monitoring and no rebate. Touching the barrier activates a knock-in or deactivates a knock-out. Monte Carlo uses Brownian-bridge survival weighting.
- Asian contracts use equally spaced future observations, excluding initial spot. Geometric averages have an analytical benchmark; arithmetic Monte Carlo uses a geometric control variate. The augmented-state method is a tree with running-average interpolation, despite its API grouping under `finite_difference`.
- Rates are continuously compounded, volatility and rates use decimal values in API contracts, and time is measured in years. Seeded stochastic results are reproducible; displayed paths may be a subset of the pricing sample.

Ithaca sends inputs to the Python solver API. Computation is stateless, bounded, and cancellable. Preserve numerical checks and method-specific diagnostics when extending shared components.

## Troy: market making and model risk

Troy explores the difference between true market dynamics and a market maker's pricing beliefs. It supports European vanilla calls and puts in one-unit contracts, without an exchange-style 100-share multiplier.

True dynamics can be GBM, Heston, or compensated Merton jump diffusion. Pricing can use Black–Scholes, European CRR, risk-neutral GBM Monte Carlo, or separately configured risk-neutral Heston Monte Carlo. Pricing assumptions remain independent of true dynamics.

The Market Making view shows prices, executions, inventory, hedging, P&L, and costs. The Market Dynamics view shows sample paths, pooled log-return distributions, a normal reference, and distribution moments.

Useful simulation conventions:

- Simulations run in a cancellable browser Worker; inputs and results stay in the browser.
- Market, order-flow, and pricing random streams are separate. A fresh seed is chosen when opening, resetting, changing true dynamics, or selecting New market. An explicit seed and identical settings reproduce an experiment. Changing pricing or hedging preserves the traded underlying path.
- Inventory shifts quotes; quote-sensitive Poisson arrivals generate fills. Inventory limits bound positions. This is an illustrative policy, not calibrated order flow or an optimal quoting strategy.
- Optional hedging offsets model delta. Total P&L combines realized and unrealized option P&L plus hedge P&L minus transaction costs. Cash financing is excluded; starting capital is zero.
- At maturity, options cash-settle and hedges close. A shorter simulation horizon retains open positions.
- Heston uses approximate variance discretization; Monte Carlo pricing has sampling error. Neither implies calibration to observed markets.
- Computation is bounded. Invalid configurations produce errors, and previous completed results retain their model labels during recalculation.

## Delphi: surrogate modeling

Delphi compares cubic splines, exact RBF Gaussian processes, two-hidden-layer tanh MLPs, and residual MLPs against one seeded Monte Carlo reference. It supports European calls and puts under risk-neutral constant-volatility GBM, with price and implied-volatility outputs.

Model comparison, sequential data-budget sweeps, and extrapolation use the same surface/table shell. Every selected model sees the same training knots at each budget. Full, unseen, inside, and outside errors are distinct; fit and inference timings remain separate. Invalid IV nodes are masked, and invalid training knots reject the shared experiment. The UI distinguishes MC standard error from GP latent uncertainty, provides numeric slice tables, and retains completed results during edits or cancellation.

Black–Scholes is the analytical expectation of this GBM reference, so residual learning primarily fits Monte Carlo noise. Theoretical IV is flat. Neither neural convergence nor improving accuracy with larger budgets is guaranteed. These limitations appear in the workbench and research explanations.

Delphi uses bounded stateless `/v1/delphi` endpoints and the same execution capacity as Ithaca. References and result summaries are cached only in browser memory; financial/domain/seed changes require a matching new reference. Run is explicit. Mobile setup uses a native modal dialog.

## Shared design and behavior

Use the existing dark navy surfaces, cream serif display text, muted sans-serif body text, thin borders, and cyan accents. Typography uses shared `--serif` (Georgia with serif fallbacks) and `--sans` (system sans-serif) tokens across the site and all three tools. Plotly inherits the same computed sans-serif family as its container. Mathematical notation retains its specialized math fonts; license/code text retains monospace. Spectral colors support charts and preview art. Reuse existing controls and charts where their behavior fits.

Home and policy pages use natural document scrolling. Tool viewport layouts remain scoped to their workbenches. Tool code and heavy chart dependencies are lazy-loaded; home should remain usable without the solver API or a background solve.

Preserve keyboard access, visible focus, labelled controls, chart text alternatives, keyboard tabs, reduced-motion behavior, and mobile dialog focus management. Navigation supports direct links, refresh, anchors, and browser history.

## Code map and runtime boundaries

| Location | Responsibility |
| --- | --- |
| `apps/web/src/App.tsx` | Route selection and lazy tool loading |
| `apps/web/src/site/` | Home, navigation, policies, research data, shared site styling |
| `apps/web/src/IthacaWorkbench.tsx` | Ithaca interface |
| `apps/web/src/components/` | Existing numerical controls, chart and explanation components |
| `apps/web/src/lib/` | Ithaca API client and input validation |
| `apps/web/src/troy/` | Troy interface, pure simulation engine, Worker, and tests |
| `apps/web/src/delphi/` | Delphi workbench, typed API client, guarded experiment state, and tests |
| `services/solver-api/app/delphi/` | Delphi reference, sampling, surrogate fitting, evaluation, and endpoints |
| `services/solver-api/` | FastAPI solver and numerical regression tests |
| `scripts/` | Smoke checks and license notice generation |
| `vercel.json` | Combined web/API service routing |

The frontend uses React, TypeScript, and Vite, with Plotly charts and KaTeX equations. The existing deployment configuration combines the frontend and solver API in one Vercel project. `/health` and `/v1/*` take precedence over the frontend SPA fallback. Browser API requests are same-origin by default.

Ithaca and Delphi transmit calculation inputs; Delphi also sends its reusable numerical reference to the solver. Troy computes locally. Application request logs contain request metadata rather than calculation bodies. Hosting-provider practices are separate from application behavior, so privacy copy must not claim that the entire site collects no data or that nothing leaves the browser.

Current source, configuration, and tests are the authority for implementation details. These notes intentionally omit historical release status, audit snapshots, and completed task lists.
