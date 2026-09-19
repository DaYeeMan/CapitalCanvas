from time import monotonic
import unittest
from unittest.mock import patch

import numpy as np
from pydantic import ValidationError

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.oracle.contracts import ExperimentRequest, GPSettings, MLPSettings
from app.oracle.experiment import run_experiment
from app.oracle.implied_volatility import build_target
from app.oracle.mlp import adam_step, initialize, loss_gradient, predict, train
from app.oracle.models import NumericalError, SamplingRequest
from app.oracle.preprocessing import training_transform
from app.oracle.sampling import sample_training
from app.oracle.surrogates import fit_gp, fit_spline, rbf
from oracle_fixtures import small_reference


class OracleSurrogateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.reference = small_reference()
        cls.target = build_target(cls.reference, "price")
        cls.samples = sample_training(cls.target, SamplingRequest(budget=32))
        cls.transform = training_transform(cls.samples)

    def test_spline_knot_reproduction_and_extrapolation(self):
        spline = fit_spline(self.samples, self.transform)
        x = self.transform.coordinates(self.samples.coordinates)
        actual = self.transform.restore(spline(x[:, ::-1]))
        np.testing.assert_allclose(actual, self.samples.values, atol=1e-8)
        self.assertTrue(np.all(np.isfinite(spline(np.array([[-.1, 1.1], [1.1, -.1]])))))

    def test_gp_matches_independent_dense_solve(self):
        gp = fit_gp(self.samples, self.transform, GPSettings())
        query = np.array([[.2, .4], [.8, .6]])
        x = self.transform.coordinates(self.samples.coordinates)
        noise = np.maximum(np.asarray(self.samples.standard_errors) / self.transform.scale, 1e-5)
        covariance = rbf(x, x, .35) + np.diag(noise**2 + gp.jitter)
        cross = rbf(query, x, .35)
        expected = cross @ np.linalg.solve(covariance, self.transform.targets(self.samples.values))
        variance = 1 - np.diag(cross @ np.linalg.solve(covariance, cross.T))
        actual, deviation = gp.predict(query)
        np.testing.assert_allclose(actual, expected, atol=1e-8)
        np.testing.assert_allclose(deviation**2, variance, atol=1e-8)
        whole = gp.predict(np.tile(query, (150, 1)))[0]
        np.testing.assert_allclose(whole, np.tile(actual, 150), atol=1e-12)

    def test_gp_jitter_retries_are_bounded(self):
        with patch("app.oracle.surrogates.cholesky", side_effect=np.linalg.LinAlgError("singular")) as factor:
            with self.assertRaisesRegex(NumericalError, "bounded jitter"):
                fit_gp(self.samples, self.transform, GPSettings())
            self.assertEqual(factor.call_count, 4)

    def test_mlp_gradient_matches_finite_differences(self):
        x = np.array([[.1, .2], [.4, .8], [.9, .3]])
        y = np.array([.3, -.1, .7])
        parameters = initialize(3, 42)
        _, gradients = loss_gradient(parameters, x, y, 1e-4)
        for parameter, gradient in zip(parameters, gradients):
            for index in np.ndindex(parameter.shape):
                original = parameter[index]
                parameter[index] = original + 1e-6
                upper = loss_gradient(parameters, x, y, 1e-4)[0]
                parameter[index] = original - 1e-6
                lower = loss_gradient(parameters, x, y, 1e-4)[0]
                parameter[index] = original
                self.assertAlmostEqual((upper - lower) / 2e-6, gradient[index], delta=1e-7)

    def test_adam_first_update_and_fixed_seed_learning(self):
        p, g = [np.array([1., -2.])], [np.array([.2, -.5])]
        adam_step(p, g, [np.zeros(2)], [np.zeros(2)], 1, .01)
        np.testing.assert_allclose(p[0], [1, -2] - .01 * g[0] / (np.abs(g[0]) + 1e-8))
        x = np.random.default_rng(1).uniform(0, 1, (32, 2))
        y = x[:, 0] + x[:, 1]**2
        first, second = train(x, y, MLPSettings(), 42), train(x, y, MLPSettings(), 42)
        self.assertLess(first.final_loss, first.initial_loss)
        self.assertLess(np.sqrt(np.mean((predict(first.parameters, x) - y)**2)), .1)
        np.testing.assert_array_equal(predict(first.parameters, x), predict(second.parameters, x))

    def test_mlp_divergence_and_cancellation(self):
        with patch("app.oracle.mlp.loss_gradient", return_value=(float("nan"), [np.array([np.nan])])):
            with self.assertRaises(NumericalError):
                train(np.ones((16, 2)), np.ones(16), MLPSettings(), 42)
        token = bind_execution(ExecutionControl(monotonic() - 1))
        try:
            for function in (lambda: train(np.ones((16, 2)), np.ones(16), MLPSettings(), 42), lambda: fit_gp(self.samples, self.transform, GPSettings())):
                with self.assertRaises(ExecutionStopped): function()
        finally:
            reset_execution(token)

    def test_all_models_share_data_and_return_common_metrics(self):
        request = ExperimentRequest(reference=self.reference, sampling={"budget": 32}, settings={"mlp": {"epochs": 20}})
        result = run_experiment(request)
        self.assertEqual(len(result.methods), 4)
        self.assertTrue(all(model.status == "complete" for model in result.methods))
        self.assertTrue(all(model.training_count == 32 and model.evaluation.full.count == 400 for model in result.methods))
        self.assertIsNotNone(result.methods[1].predictive_stddev)
        self.assertIsNotNone(result.methods[3].baseline_metrics)
        second = run_experiment(ExperimentRequest(reference=self.reference, sampling={"budget": 32}, methods=("residual_mlp", "mlp"), settings={"mlp": {"epochs": 20}}))
        self.assertEqual(result.sample_set_id, second.sample_set_id)
        self.assertEqual(result.methods[2].predictions, second.methods[1].predictions)
        self.assertEqual(result.methods[3].predictions, second.methods[0].predictions)

    def test_partial_failure_preserves_other_models(self):
        with patch("app.oracle.experiment.fit_gp", side_effect=NumericalError("test_failure", "GP fixture failed")):
            result = run_experiment(ExperimentRequest(reference=self.reference, methods=("cubic_spline", "gaussian_process")))
        self.assertEqual(result.methods[0].status, "complete")
        self.assertEqual(result.methods[1].status, "failed")
        self.assertIsNone(result.methods[1].evaluation)

    def test_method_order_and_combined_work_validation(self):
        with self.assertRaises(ValidationError):
            ExperimentRequest(reference=self.reference, methods=("mlp", "mlp"))
        with self.assertRaisesRegex(ValidationError, "work budget"):
            ExperimentRequest(reference=self.reference, sampling={"budget": 256}, settings={"mlp": {"width": 64, "epochs": 1000}})
