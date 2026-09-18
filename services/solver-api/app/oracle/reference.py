"""Exact terminal GBM reference with bounded payoff blocks and shared draws."""
from math import exp
from time import perf_counter

import numpy as np

from app.execution import check_execution
from app.solvers.black_scholes import MarketInputs
from app.solvers.monte_carlo import _discounted_payoffs, _mean_and_error, _normal_samples
from app.oracle.models import ALGORITHM_VERSION, PriceReference, ReferenceRequest, content_id

# At 100,000 paths each payoff block has at most 800,000 float64 entries.
# Keeping complete path pairs within a spot block preserves the existing SE estimator.
SPOT_BLOCK = 8


def generate_reference(request: ReferenceRequest) -> PriceReference:
    check_execution()
    started = perf_counter()
    domain, market, settings = request.domain, request.market, request.monte_carlo
    spots = np.linspace(domain.spot_min, domain.spot_max, domain.spot_nodes)
    times = np.linspace(domain.tau_min, domain.tau_max, domain.tau_nodes)
    normals = _normal_samples(settings.paths, 1, settings.seed, settings.antithetic)
    inputs = MarketInputs(float(spots[0]), market.strike, domain.tau_max, market.volatility, market.rate, market.dividend)
    prices = np.empty((len(times), len(spots)))
    errors = np.empty_like(prices)
    for row, tau in enumerate(times):
        check_execution()
        if tau == 0:
            sign = 1 if request.option_side == "call" else -1
            prices[row] = np.maximum(sign * (spots - market.strike), 0.0)
            errors[row] = 0
            continue
        for start in range(0, len(spots), SPOT_BLOCK):
            check_execution()
            stop = min(start + SPOT_BLOCK, len(spots))
            payoffs = _discounted_payoffs(inputs, request.option_side, float(tau), spots[start:stop], normals)
            prices[row, start:stop], errors[row, start:stop] = _mean_and_error(payoffs, settings.antithetic)
        if spots[0] == 0:
            prices[row, 0] = 0 if request.option_side == "call" else market.strike * exp(-market.rate * tau)
            errors[row, 0] = 0
    check_execution()
    payload = {
        "schema_version": 1,
        "algorithm_version": ALGORITHM_VERSION,
        "configuration": request.model_dump(mode="json"),
        "axes": {"spots": spots.tolist(), "times_to_maturity": times.tolist()},
        "prices": prices.tolist(),
        "price_standard_errors": errors.tolist(),
    }
    return PriceReference(
        **payload,
        reference_id=content_id(payload),
        timing={"reference_ms": (perf_counter() - started) * 1000},
        diagnostics={
            "effective_independent_samples": settings.paths // (2 if settings.antithetic else 1),
            "estimated_operations": request.estimated_operations,
            "numpy_version": np.__version__,
        },
    )
