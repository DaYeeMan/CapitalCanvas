# CapitalCanvas

CapitalCanvas is a personal, noncommercial project for learning quantitative finance through interactive models, transparent assumptions, and visual results.

The tools are **Ithaca**, an option-pricing workbench; **Troy**, an options market-making simulator; and **Delphi**, a surrogate-model comparison laboratory for price and implied-volatility surfaces.

See [Product context](docs/PRODUCT.md) for current capabilities, design conventions, and code locations useful when planning another tool. These notes describe the repository, not current deployment status. Troy runs in the browser without the solver API.

## Local development

Requirements: Node.js 22+, npm, and Python 3.12+.

Install and start the solver API:

```powershell
cd services/solver-api
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -e ".[dev]"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, install and start the web app:

```powershell
npm --prefix apps/web install
npm run dev:web -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. Vite proxies `/health` and `/v1` to the local API on port 8000, matching the same-origin production routes. Set `VITE_SOLVER_API_URL` only when deliberately using an external API host.

## Checks

```powershell
npm run test:web
npm run lint:web
npm run build:web
Set-Location services/solver-api
.\.venv\Scripts\python.exe -m unittest discover -s tests
```

## Reference material

Numerical reference cases and tolerances live in `services/solver-api/tests/` and `apps/web/src/troy/engine.test.ts`. `scripts/smoke_test.py` checks frontend/API routing and a reference price.

[License sources](docs/licenses/README.md) describe third-party attribution maintenance.

Delphi runs at `/tools/delphi` using `/v1/delphi/capabilities`, `/reference`, and `/experiment`. It compares cubic splines, exact Gaussian processes, MLPs, and residual MLPs on a shared seeded Monte Carlo reference. Comparison, data-budget, and extrapolation modes support European calls and puts under constant-volatility GBM. Results remain in memory. See the [Delphi maintenance notes](docs/DELPHI.md) for bounds, tests, and the flat-IV/residual-noise limitations.
