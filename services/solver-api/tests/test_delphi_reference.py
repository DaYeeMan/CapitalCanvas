import json
from time import monotonic
import unittest
from unittest.mock import patch

import numpy as np
from pydantic import ValidationError

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.delphi.models import Axes, PriceReference, ReferenceRequest, content_id
from app.delphi.reference import generate_reference
from app.solvers.black_scholes import MarketInputs, black_scholes_price
from app.solvers.monte_carlo import _discounted_payoffs, _normal_samples, solve_monte_carlo
from delphi_fixtures import small_reference


class DelphiReferenceTests(unittest.TestCase):
    def test_seed_identity_and_serialization(self):
        one = small_reference()
        two = generate_reference(one.configuration)
        self.assertEqual(one.reference_id, two.reference_id)
        self.assertEqual(one.prices, two.prices)
        self.assertEqual(one.price_standard_errors, two.price_standard_errors)
        self.assertNotEqual(one.reference_id, small_reference(seed=43).reference_id)
        self.assertEqual(PriceReference.model_validate_json(one.model_dump_json()), one)
        json.dumps(one.model_dump(mode="json"), allow_nan=False)

    def test_chunked_matches_existing_ithaca_reference(self):
        for antithetic in (True, False):
            with self.subTest(antithetic=antithetic):
                result = small_reference(antithetic=antithetic)
                inputs = MarketInputs(100, 100, 2, .2, .05, 0)
                existing = solve_monte_carlo(inputs, "call", 80, 120, 20, 20, 1000, 1, 42, antithetic, .95)
                np.testing.assert_allclose(result.prices, existing["surface"]["prices"], rtol=1e-13, atol=1e-12)
                np.testing.assert_allclose(result.price_standard_errors, existing["surface"]["standard_errors"], rtol=1e-13, atol=1e-12)

    def test_paired_standard_error_uses_independent_pairs(self):
        result = small_reference()
        draws = _normal_samples(1000, 1, 42, True)
        payoffs = _discounted_payoffs(MarketInputs(100, 100, 2, .2, .05, 0), "call", 2.0, np.array([120.0]), draws)[:, 0]
        pairs = (payoffs[::2] + payoffs[1::2]) / 2
        expected = np.std(pairs, ddof=1) / np.sqrt(500)
        self.assertAlmostEqual(result.price_standard_errors[-1][-1], expected, places=12)
        self.assertEqual(result.diagnostics.effective_independent_samples, 500)

    def test_price_agrees_with_analytical_with_noise_allowance(self):
        for side in ("call", "put"):
            result = small_reference(side)
            for row, column in ((6, 4), (12, 10), (19, 15)):
                spot, tau = result.axes.spots[column], result.axes.times_to_maturity[row]
                expected = black_scholes_price(MarketInputs(spot, 100, tau, .2, .05, 0), side)
                self.assertLess(abs(result.prices[row][column] - expected), 5 * result.price_standard_errors[row][column] + 1e-10)

    def test_terminal_and_zero_spot_boundaries(self):
        for side in ("call", "put"):
            request = ReferenceRequest(option_side=side, domain={"spot_min": 0.0, "spot_max": 120.0, "spot_nodes": 20, "tau_nodes": 20}, monte_carlo={"paths": 1000})
            result = generate_reference(request)
            sign = 1 if side == "call" else -1
            np.testing.assert_array_equal(result.prices[0], np.maximum(sign * (np.asarray(result.axes.spots) - 100), 0))
            np.testing.assert_array_equal(result.price_standard_errors[0], 0)
            expected = np.zeros(20) if side == "call" else 100 * np.exp(-.05 * np.asarray(result.axes.times_to_maturity))
            np.testing.assert_allclose(np.asarray(result.prices)[:, 0], expected, atol=1e-11)
            np.testing.assert_allclose(np.asarray(result.price_standard_errors)[:, 0], 0, atol=1e-11)

    def test_cancel_between_payoff_blocks(self):
        control = ExecutionControl(monotonic() + 10)
        token = bind_execution(control)
        calls = 0

        def payoff(*args):
            nonlocal calls
            calls += 1
            result = _discounted_payoffs(*args)
            control.stop("test cancelled")
            return result

        try:
            with patch("app.delphi.reference._discounted_payoffs", side_effect=payoff):
                with self.assertRaises(ExecutionStopped):
                    generate_reference(small_reference().configuration)
            self.assertEqual(calls, 1)
        finally:
            reset_execution(token)

    def test_expired_deadline_prevents_allocation(self):
        token = bind_execution(ExecutionControl(monotonic() - 1))
        try:
            with patch("app.delphi.reference._normal_samples") as draw:
                with self.assertRaises(ExecutionStopped):
                    generate_reference(ReferenceRequest())
                draw.assert_not_called()
        finally:
            reset_execution(token)


class DelphiContractTests(unittest.TestCase):
    def test_invalid_dimensions_values_and_work_are_rejected(self):
        cases = [
            {"domain": {"spot_nodes": 82}}, {"domain": {"tau_nodes": 19}},
            {"domain": {"spot_min": 140.0, "spot_max": 60.0}},
            {"domain": {"tau_min": 2.0, "tau_max": 2.0}},
            {"market": {"volatility": float("nan")}}, {"market": {"rate": float("inf")}},
            {"market": {"rate": .3}}, {"market": {"strike": "100"}},
            {"monte_carlo": {"paths": 1001}}, {"monte_carlo": {"seed": True}},
            {"monte_carlo": {"paths": 100000}}, {"methods": ["mlp"]},
            {"domain": {"spot_nodes": 21.0}}, {"monte_carlo": {"antithetic": "true"}},
            {"domain": {"spot_min": 1.0, "spot_max": float(np.nextafter(1.0, 2.0))}},
        ]
        for case in cases:
            with self.subTest(case=case), self.assertRaises(ValidationError):
                ReferenceRequest.model_validate(case)

    def test_combined_operation_estimate_and_odd_unpaired(self):
        self.assertEqual(ReferenceRequest().estimated_operations, 61_000_000)
        self.assertEqual(ReferenceRequest(domain={"tau_min": .25}).estimated_operations, 62_220_000)
        self.assertEqual(ReferenceRequest(monte_carlo={"paths": 1001, "antithetic": False}).monte_carlo.paths, 1001)

    def test_shape_content_and_axis_mismatch(self):
        for change in ("shape", "negative", "hash", "axis", "terminal", "count"):
            payload = small_reference().model_dump(mode="json")
            if change == "shape": payload["prices"] = payload["prices"][:-1]
            if change == "negative": payload["price_standard_errors"][1][1] = -1.0
            if change == "hash": payload["prices"][1][1] += .1
            if change == "axis": payload["axes"]["spots"][1] += .01
            if change == "terminal": payload["prices"][0][0] = .1
            if change == "count": payload["diagnostics"]["effective_independent_samples"] = 1000
            if change != "hash":
                payload["reference_id"] = content_id({k: v for k, v in payload.items() if k not in {"reference_id", "timing", "diagnostics", "warnings"}})
            with self.subTest(change=change), self.assertRaises(ValidationError):
                PriceReference.model_validate(payload)

    def test_immutable_nested_reference(self):
        result = small_reference()
        with self.assertRaises(ValidationError):
            result.configuration.market.rate = .1
        with self.assertRaises(TypeError):
            result.prices[0][0] = 1.0

    def test_axes_reject_duplicates_and_nonfinite(self):
        for values in ([1.0] * 20, [float("nan")] + list(range(1, 20))):
            with self.assertRaises(ValidationError):
                Axes(spots=values, times_to_maturity=np.linspace(0, 2, 20).tolist())
