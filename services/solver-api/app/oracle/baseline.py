"""Same-parameter analytical baseline, evaluated without reference targets."""
from math import exp

import numpy as np

from app.execution import check_execution
from app.solvers.black_scholes import MarketInputs, OptionSide, black_scholes_price
from app.oracle.models import Market, NumericalError, TargetKind

BASELINE_VERSION = "black-scholes-v1"


def evaluate_baseline(coordinates: np.ndarray, market: Market, side: OptionSide, target: TargetKind) -> np.ndarray:
    check_execution()
    coordinates = np.asarray(coordinates, dtype=float)
    if coordinates.ndim != 2 or coordinates.shape[1] != 2 or len(coordinates) > 81**2:
        raise NumericalError("baseline_coordinates", "Expected at most 6,561 (spot, maturity) coordinates")
    if not np.all(np.isfinite(coordinates)) or np.any(coordinates < 0) or np.any(coordinates[:, 0] > 1_000_000) or np.any(coordinates[:, 1] > 10):
        raise NumericalError("baseline_coordinates", "Coordinates must be finite and inside financial domain limits")
    if side not in ("call", "put") or target not in ("price", "implied_volatility"):
        raise ValueError("Unsupported baseline side or target")
    if target == "implied_volatility":
        # The theoretical limiting value is sigma; the reference target mask still
        # excludes non-identifiable IV nodes such as zero maturity or zero spot.
        return np.full(len(coordinates), market.volatility)
    values = np.empty(len(coordinates))
    for index, (spot, tau) in enumerate(coordinates):
        if index % 64 == 0:
            check_execution()
        if spot == 0:
            values[index] = 0 if side == "call" else market.strike * exp(-market.rate * tau)
        else:
            values[index] = black_scholes_price(MarketInputs(float(spot), market.strike, float(tau), market.volatility, market.rate, market.dividend), side)
    return values


def residual_targets(values: np.ndarray, baseline: np.ndarray) -> np.ndarray:
    check_execution()
    values, baseline = np.asarray(values, dtype=float), np.asarray(baseline, dtype=float)
    if values.shape != baseline.shape or not np.all(np.isfinite(values)) or not np.all(np.isfinite(baseline)):
        raise NumericalError("residual_inputs", "Residual values and baseline must have matching shapes and finite values")
    with np.errstate(over="ignore", invalid="ignore"):
        result = values - baseline
    if not np.all(np.isfinite(result)):
        raise NumericalError("residual_overflow", "Residual differences exceed finite numerical range")
    return result


def reconstruct(baseline: np.ndarray, corrections: np.ndarray) -> np.ndarray:
    check_execution()
    baseline, corrections = np.asarray(baseline, dtype=float), np.asarray(corrections, dtype=float)
    if baseline.shape != corrections.shape or not np.all(np.isfinite(baseline)) or not np.all(np.isfinite(corrections)):
        raise NumericalError("residual_inputs", "Baseline and correction must have matching shapes and finite values")
    with np.errstate(over="ignore", invalid="ignore"):
        result = baseline + corrections
    if not np.all(np.isfinite(result)):
        raise NumericalError("residual_overflow", "Residual reconstruction exceeds finite numerical range")
    return result
