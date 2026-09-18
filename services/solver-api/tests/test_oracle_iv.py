import json
from time import monotonic
import unittest
from unittest.mock import patch

import numpy as np
from pydantic import ValidationError

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.oracle.implied_volatility import build_target, invert_price
from app.oracle.models import Market, SamplingRequest, TargetSurface, default_reference_request
from app.oracle.reference import generate_reference
from app.oracle.sampling import sample_training
from app.solvers.black_scholes import MarketInputs, black_scholes_price
from oracle_fixtures import small_reference, with_target_data


class OracleIVTests(unittest.TestCase):
    def test_default_iv_reference_supports_all_training_budgets(self):
        target = build_target(generate_reference(default_reference_request("implied_volatility")), "implied_volatility")
        self.assertTrue(all(cell for row in target.valid_mask for cell in row))
        for budget in (16, 32, 64, 128, 256):
            self.assertEqual(sample_training(target, SamplingRequest(budget=budget)).count, budget)

    def test_roundtrip_call_put_and_negative_rates(self):
        for side in ("call", "put"):
            for spot, tau, sigma, rate, dividend in ((80, 1, .2, .05, 0), (100, .25, .35, -.02, .01), (120, 2, .5, .1, .03)):
                market = Market(volatility=sigma, rate=rate, dividend=dividend)
                price = black_scholes_price(MarketInputs(spot, 100, tau, sigma, rate, dividend), side)
                result = invert_price(price, .01, spot, tau, market, side)
                self.assertIsNone(result.reason)
                self.assertAlmostEqual(result.value, sigma, places=8)
                self.assertGreater(result.standard_error, 0)

    def test_noise_uses_vega_not_price_error_directly(self):
        inputs = MarketInputs(100, 100, 1, .2, .05, 0)
        price = black_scholes_price(inputs, "call")
        result = invert_price(price, .1, 100, 1, Market(), "call")
        d1 = (.05 + .5 * .2**2) / .2
        vega = 100 * np.exp(-.5 * d1**2) / np.sqrt(2 * np.pi)
        self.assertAlmostEqual(result.standard_error, .1 / vega, places=10)

    def test_invalid_nodes_not_clipped(self):
        cases = [
            (1.0, .1, 100, 0, "zero_maturity"), (1.0, .1, 0, 1, "zero_spot"),
            (float("nan"), .1, 100, 1, "non_finite"), (10.0, -.1, 100, 1, "non_finite"),
            (-.01, .1, 100, 1, "price_out_of_bounds"), (100.0, .1, 100, 1, "price_out_of_bounds"),
            (99.0, .1, 100, .01, "unbracketed"),
        ]
        for price, error, spot, tau, reason in cases:
            with self.subTest(reason=reason):
                result = invert_price(price, error, spot, tau, Market(), "call")
                self.assertEqual(result.reason, reason)
                self.assertIsNone(result.value)
                self.assertIsNone(result.standard_error)

    def test_ill_conditioned_and_solver_failures_are_explicit(self):
        market = Market(rate=0.0)
        price = black_scholes_price(MarketInputs(100, 100, 1e-12, .2, 0, 0), "call")
        self.assertEqual(invert_price(price, .1, 100, 1e-12, market, "call").reason, "low_vega")
        with patch("app.oracle.implied_volatility.brentq", side_effect=RuntimeError("no convergence")):
            self.assertEqual(invert_price(10, .1, 100, 1, Market(), "call").reason, "solver_failed")

    def test_masked_serialization_and_inversion_preserves_price_reference(self):
        reference = small_reference()
        before = reference.model_dump_json()
        target = build_target(reference, "implied_volatility")
        self.assertTrue(all(v is None for v in target.values[0]))
        self.assertTrue(all(v == "zero_maturity" for v in target.invalid_reasons[0]))
        self.assertEqual(TargetSurface.model_validate_json(target.model_dump_json()), target)
        json.dumps(target.model_dump(mode="json"), allow_nan=False)
        self.assertEqual(before, reference.model_dump_json())
        with self.assertRaisesRegex(ValueError, "no samples were dropped"):
            sample_training(target, SamplingRequest())

    def test_price_target_is_exact_reference(self):
        reference = small_reference()
        target = build_target(reference, "price")
        self.assertEqual(target.values, reference.prices)
        self.assertEqual(target.standard_errors, reference.price_standard_errors)
        self.assertTrue(all(v for row in target.valid_mask for v in row))

    def test_target_validation_rejects_false_masks_and_units(self):
        target = build_target(small_reference(), "price")
        mask = [list(row) for row in target.valid_mask]
        mask[0][0] = False
        for updates in ({"valid_mask": mask}, {"display_unit": "volatility_percentage_points"}):
            with self.assertRaises(ValidationError):
                with_target_data(target, **updates)
        mask[0][0] = 1
        with self.assertRaises(ValidationError):
            with_target_data(target, valid_mask=mask)

    def test_iv_cancellation_is_not_swallowed_as_a_mask(self):
        control = ExecutionControl(monotonic() + 10)
        token = bind_execution(control)
        def stopped(*args, **kwargs):
            control.stop("cancelled during inversion")
            raise ExecutionStopped("cancelled during inversion")
        try:
            with patch("app.oracle.implied_volatility.brentq", side_effect=stopped):
                with self.assertRaises(ExecutionStopped):
                    invert_price(10, .1, 100, 1, Market(), "call")
        finally:
            reset_execution(token)
