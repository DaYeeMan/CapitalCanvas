"""Bounded IV inversion. Invalid nodes stay masked, never repaired or clipped."""
from dataclasses import dataclass
from math import exp, isfinite, log, pi, sqrt
from time import perf_counter

from scipy.optimize import brentq

from app.execution import ExecutionStopped, check_execution
from app.solvers.black_scholes import MarketInputs, OptionSide, black_scholes_price
from app.oracle.models import InvalidReason, Market, PriceReference, TargetKind, TargetSurface, TARGET_VERSION, content_id

IV_MIN = 1e-6
IV_MAX = 5.0
IV_XTOL = 1e-10
IV_RTOL = 1e-12
IV_MAX_ITERATIONS = 100
# Vega is measured per unit decimal volatility, relative to discounted contract scale.
MIN_RELATIVE_VEGA = 1e-6


@dataclass(frozen=True)
class IVResult:
    value: float | None
    standard_error: float | None
    reason: InvalidReason | None


def invert_price(price: float, standard_error: float, spot: float, tau: float, market: Market, side: OptionSide) -> IVResult:
    check_execution()
    if not all(isfinite(x) for x in (price, standard_error, spot, tau)) or standard_error < 0:
        return IVResult(None, None, "non_finite")
    if tau <= 0:
        return IVResult(None, None, "zero_maturity")
    if spot <= 0:
        return IVResult(None, None, "zero_spot")
    discounted_spot = spot * exp(-market.dividend * tau)
    discounted_strike = market.strike * exp(-market.rate * tau)
    lower = max(discounted_spot - discounted_strike, 0.0) if side == "call" else max(discounted_strike - discounted_spot, 0.0)
    upper = discounted_spot if side == "call" else discounted_strike
    if price < lower or price >= upper:
        return IVResult(None, None, "price_out_of_bounds")

    def objective(volatility: float) -> float:
        check_execution()
        inputs = MarketInputs(spot, market.strike, tau, volatility, market.rate, market.dividend)
        return black_scholes_price(inputs, side) - price

    low, high = objective(IV_MIN), objective(IV_MAX)
    # A root at the numerical zero-volatility limit is not a well-identified IV.
    if low >= 0 or high < 0:
        return IVResult(None, None, "unbracketed")
    try:
        value = float(brentq(objective, IV_MIN, IV_MAX, xtol=IV_XTOL, rtol=IV_RTOL, maxiter=IV_MAX_ITERATIONS))
    except ExecutionStopped:
        raise
    except (ValueError, RuntimeError):
        return IVResult(None, None, "solver_failed")
    root_t = sqrt(tau)
    d1 = (log(spot / market.strike) + (market.rate - market.dividend + 0.5 * value**2) * tau) / (value * root_t)
    vega = discounted_spot * exp(-0.5 * d1**2) / sqrt(2 * pi) * root_t
    if vega < MIN_RELATIVE_VEGA * max(discounted_spot, discounted_strike):
        return IVResult(None, None, "low_vega")
    noise = standard_error / vega
    if not isfinite(noise):
        return IVResult(None, None, "non_finite")
    return IVResult(value, noise, None)


def build_target(reference: PriceReference, kind: TargetKind) -> TargetSurface:
    check_execution()
    if kind not in ("price", "implied_volatility"):
        raise ValueError("Unsupported target kind")
    started = perf_counter()
    values, errors, masks, reasons = [], [], [], []
    market = reference.configuration.market
    for row, tau in enumerate(reference.axes.times_to_maturity):
        check_execution()
        row_values, row_errors, row_mask, row_reasons = [], [], [], []
        for column, spot in enumerate(reference.axes.spots):
            price, error = reference.prices[row][column], reference.price_standard_errors[row][column]
            result = IVResult(price, error, None) if kind == "price" else invert_price(price, error, spot, tau, market, reference.configuration.option_side)
            row_values.append(result.value)
            row_errors.append(result.standard_error)
            row_mask.append(result.reason is None)
            row_reasons.append(result.reason)
        values.append(row_values)
        errors.append(row_errors)
        masks.append(row_mask)
        reasons.append(row_reasons)
    payload = {
        "version": TARGET_VERSION,
        "reference_id": reference.reference_id,
        "kind": kind,
        "axes": reference.axes.model_dump(mode="json"),
        "internal_unit": "currency" if kind == "price" else "decimal_volatility",
        "display_unit": "currency" if kind == "price" else "percent_volatility",
        "error_display_unit": "currency" if kind == "price" else "volatility_percentage_points",
        "values": values, "standard_errors": errors, "valid_mask": masks, "invalid_reasons": reasons,
    }
    warnings = []
    if kind == "implied_volatility":
        warnings.append({"code": "gbm_flat_iv", "message": "Constant-volatility GBM has flat theoretical IV; observed variation includes Monte Carlo noise."})
        warnings.append({"code": "iv_noise_approximation", "message": "IV standard error is a local price-error/vega approximation, not an exact confidence interval."})
        invalid = sum(not cell for row in masks for cell in row)
        if invalid:
            warnings.append({"code": "invalid_iv_nodes", "message": f"{invalid} IV nodes are masked. Narrow the domain or increase paths if training nodes are affected."})
    check_execution()
    return TargetSurface(**payload, target_id=content_id(payload), conversion_ms=(perf_counter() - started) * 1000, warnings=warnings)
