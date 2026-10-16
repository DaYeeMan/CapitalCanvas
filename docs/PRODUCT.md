# CapitalCanvas product context

## Purpose and scope

CapitalCanvas helps people understand quantitative finance through visualization and experimentation. It is a personal, noncommercial education and research project. Outputs are theoretical estimates, not investment advice, executable quotes, or promises of returns.

The site name is CapitalCanvas; the displayed name is Capital Canvas. The office and policy headers use the transparent interlocking CC mark beside the Capital Canvas wordmark; policy pages share the office About contact/legal footer. The browser icon and social thumbnail use the mark on navy. The public About attribution is Emmanuel Zhang, with contact `dymteam23@gmail.com`.

Three tools exist: Ithaca, Troy, and Delphi. Each has a marked desk on the Home and Resources floors.

The current product has no accounts, database, saved results, live market data, or trading execution. These describe the existing product rather than restrictions on future planning.

## Site and navigation

- `/` starts at the city. `/#home` and `/#resources` open the office floors; `/#about` shows the introduction over the city.
- `/preview/office` and its trailing-slash variant replace their current history entry with `/`, preserving query parameters and the destination hash.
- `/tools/ithaca`, `/tools/troy`, and `/tools/delphi` open independent workbenches with a return link to `/#home`.
- `/privacy`, `/terms`, `/disclaimer`, and `/notices` retain their content in an office-styled reading layout. These pages and the 404 share the office header and About footer.
- Unknown paths show the not-found view. Unknown office hashes normalize to `#city`.

City entry says “A Different Perspective” and “Visual tools for understanding financial models.” Enter Capital Canvas or the main tower opens Home. Three desk markers launch the tools. Resources uses the same desks to open centered research libraries containing all 10 Ithaca, 7 Troy, and 6 Delphi references and implementation notes.

Published research anchors such as `/#crr`, `/#asian-lattice`, `/#troy-market-making`, and `/#delphi-methods` remain supported. They open Resources and the corresponding library; a paper or note anchor expands and focuses that entry. Dismissing a directly linked library replaces the hash with `#resources`. Desk-opened libraries leave the current route unchanged. Research content and source links remain shared data.

The persistent 3D district supports floor travel, history, keyboard/pointer/touch controls, reduced motion and static renderer stills when WebGL is unavailable. Research libraries and About scroll internally. Policy pages scroll as ordinary documents. Current architecture, motion and assets are documented in [the office documentation](design/office-3d/README.md).

The old scrolling Field homepage, its layout/navigation, page CSS, and homepage-only loop/poster have been removed. Each tool retains its own locally hosted video/poster and shared motion-preference handling. Editable media generators and approved design references remain documentation history.

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

The office uses its After Hours system: locally hosted Geist, graphite surfaces, the original CC mark, physical lamp fixtures and a persistent 3D district. `OfficeChrome.tsx` and `officeChrome.css` own the shared header/footer and typography. `information.css` provides the policy reading layout. The office scene and all workbenches remain lazy-loaded; policies do not load the 3D renderer or charts.

Tool viewport layouts and styling remain scoped to their workbenches. Reuse existing controls and charts where their behavior fits. Mathematical notation retains its specialized math fonts; license/code text retains monospace. Home and research remain usable without the solver API or a background solve.

Preserve keyboard access, visible focus, labelled controls, chart text alternatives, keyboard tabs, reduced-motion behavior, and mobile dialog focus management. Navigation supports direct links, refresh, anchors, and browser history.

## Code map and runtime boundaries

| Location | Responsibility |
| --- | --- |
| `apps/web/src/App.tsx` | Route selection and lazy tool loading |
| `apps/web/src/site/` | Policy pages, research data, shared tool background lifecycle |
| `apps/web/src/site/office/` | Office homepage, scene, navigation, research libraries, shared header/footer |
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
