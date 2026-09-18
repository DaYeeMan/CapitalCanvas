from time import monotonic
import unittest

import numpy as np
from pydantic import ValidationError

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.oracle.baseline import evaluate_baseline, reconstruct, residual_targets
from app.oracle.evaluation import display_error, evaluate_predictions, metrics
from app.oracle.implied_volatility import build_target
from app.oracle.models import Bounds, Evaluation, Market, SamplingRequest
from app.oracle.sampling import sample_training
from app.solvers.black_scholes import MarketInputs, black_scholes_price
from oracle_fixtures import small_reference, with_target_data


class OracleEvaluationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.target = build_target(small_reference(), "price")
        cls.samples = sample_training(cls.target, SamplingRequest(budget=16))

    def test_hand_computed_metrics_empty_and_large_values(self):
        result = metrics(np.array([-1., 2., -3., 0.]))
        self.assertEqual(result.count, 4)
        self.assertEqual(result.mae, 1.5)
        self.assertAlmostEqual(result.rmse, np.sqrt(3.5))
        self.assertEqual(result.max_abs_error, 3)
        self.assertIsNone(metrics(np.array([])).rmse)
        self.assertEqual(metrics(np.array([0., 0.])).rmse, 0)
        self.assertEqual(metrics(np.array([1e200, -1e200])).rmse, 1e200)
        with self.assertRaises(ValueError):
            metrics(np.array([float("nan")]))

    def test_training_exclusion_and_empty_extrapolation(self):
        prediction = np.asarray(self.target.values).copy()
        prediction.flat[list(self.samples.flat_indices)] += 2
        result = evaluate_predictions(self.target, self.samples, prediction)
        self.assertEqual(result.full.count, 400)
        self.assertEqual(result.unseen.count, 384)
        self.assertAlmostEqual(result.full.mae, .08)
        self.assertAlmostEqual(result.full.rmse, .4)
        self.assertEqual(result.unseen.rmse, 0)
        self.assertEqual(result.outside.count, 0)
        self.assertIsNone(result.outside.mae)

    def test_inside_outside_partition_includes_boundary(self):
        samples = sample_training(self.target, SamplingRequest(budget=16, training_bounds=Bounds(spot_min=85., spot_max=115., tau_min=.2, tau_max=1.8)))
        result = evaluate_predictions(self.target, samples, np.asarray(self.target.values) + 1)
        self.assertEqual(result.inside.count + result.outside.count, 400)
        self.assertEqual(result.unseen_inside.count + result.unseen_outside.count, 384)
        self.assertEqual(result.inside.rmse, 1)
        self.assertEqual(result.outside.rmse, 1)
        self.assertTrue(result.inside_mask[samples.row_indices[0]][samples.column_indices[0]])
        self.assertFalse(np.any(np.asarray(result.inside_mask) & np.asarray(result.outside_mask)))

    def test_nonfinite_prediction_fails_not_reduced_domain(self):
        prediction = np.asarray(self.target.values).copy()
        prediction[5, 5] = np.nan
        with self.assertRaisesRegex(ValueError, "non-finite predictions"):
            evaluate_predictions(self.target, self.samples, prediction)
        with self.assertRaisesRegex(ValueError, "reference shape"):
            evaluate_predictions(self.target, self.samples, prediction.T[:10])

    def test_evaluation_contract_rejects_inconsistent_denominators(self):
        payload = evaluate_predictions(self.target, self.samples, np.asarray(self.target.values)).model_dump(mode="json")
        payload["full"]["count"] -= 1
        with self.assertRaises(ValidationError):
            Evaluation.model_validate(payload)

    def test_masked_reference_nodes_use_common_domain(self):
        values = [list(row) for row in self.target.values]
        errors = [list(row) for row in self.target.standard_errors]
        mask = [list(row) for row in self.target.valid_mask]
        reasons = [list(row) for row in self.target.invalid_reasons]
        values[1][1] = errors[1][1] = None
        mask[1][1], reasons[1][1] = False, "unbracketed"
        target = with_target_data(self.target, values=values, standard_errors=errors, valid_mask=mask, invalid_reasons=reasons)
        samples = sample_training(target, SamplingRequest(budget=16))
        prediction = np.asarray(target.values, dtype=float)
        result = evaluate_predictions(target, samples, prediction)
        self.assertEqual(result.full.count, 399)
        self.assertIsNone(result.absolute_errors[1][1])
        self.assertEqual(result.full.rmse, 0)

    def test_display_iv_error_conversion(self):
        iv = build_target(small_reference(tau_min=.25), "implied_volatility")
        self.assertEqual(display_error(.002, iv), .2)
        self.assertEqual(display_error(.002, self.target), .002)
        self.assertIsNone(display_error(None, iv))

    def test_baseline_prices_iv_and_residual_reconstruction(self):
        coordinates = np.array([[0., 0.], [0., 2.], [100., 1.], [120., 0.]])
        for side in ("call", "put"):
            baseline = evaluate_baseline(coordinates, Market(), side, "price")
            self.assertAlmostEqual(baseline[2], black_scholes_price(MarketInputs(100, 100, 1, .2, .05, 0), side))
            self.assertAlmostEqual(baseline[1], 0 if side == "call" else 100 * np.exp(-.1))
            values = baseline + np.array([0., -.1, .2, -.3])
            residual = residual_targets(values, baseline)
            np.testing.assert_allclose(reconstruct(baseline, residual), values)
            np.testing.assert_array_equal(reconstruct(baseline, np.zeros(4)), baseline)
        np.testing.assert_array_equal(evaluate_baseline(coordinates, Market(), "call", "implied_volatility"), .2)
        with self.assertRaises(ValueError):
            reconstruct(np.zeros(4), np.zeros((4, 1)))
        with self.assertRaisesRegex(ValueError, "finite numerical range"):
            reconstruct(np.array([1e308]), np.array([1e308]))

    def test_evaluation_and_baseline_cancellation(self):
        token = bind_execution(ExecutionControl(monotonic() - 1))
        try:
            for operation in (
                lambda: evaluate_predictions(self.target, self.samples, np.asarray(self.target.values)),
                lambda: evaluate_baseline(np.array([[100., 1.]]), Market(), "call", "price"),
            ):
                with self.assertRaises(ExecutionStopped):
                    operation()
        finally:
            reset_execution(token)
