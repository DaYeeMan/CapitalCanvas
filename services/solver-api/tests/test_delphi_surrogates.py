from time import monotonic
import unittest
from unittest.mock import patch

import numpy as np
from pydantic import ValidationError

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.delphi.contracts import ExperimentRequest, GP_MAX_FIT_EVALUATIONS, GPSettings, MLPSettings
from app.delphi.experiment import run_experiment
from app.delphi.implied_volatility import build_target
from app.delphi.mlp import adam_step, initialize, loss_gradient, predict, train
from app.delphi.models import NumericalError, SamplingRequest
from app.delphi.preprocessing import training_transform
from app.delphi.sampling import sample_training
from app.delphi.surrogates import _gp_validation_folds, _gp_validation_objective, fit_gp, fit_spline, rbf
from delphi_fixtures import small_reference, with_target_data


class DelphiSurrogateTests(unittest.TestCase):
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
        noise = np.asarray(self.samples.standard_errors) / self.transform.scale
        covariance = rbf(x, x, gp.length_scale) + np.diag(noise**2 + gp.regularization**2 + gp.jitter)
        cross = rbf(query, x, gp.length_scale)
        expected = cross @ np.linalg.solve(covariance, self.transform.targets(self.samples.values))
        variance = 1 - np.diag(cross @ np.linalg.solve(covariance, cross.T))
        actual, deviation = gp.predict(query)
        np.testing.assert_allclose(actual, expected, atol=1e-8)
        np.testing.assert_allclose(deviation**2, variance, atol=1e-8)
        whole = gp.predict(np.tile(query, (150, 1)))[0]
        np.testing.assert_allclose(whole, np.tile(actual, 150), atol=1e-12)

    def test_gp_spatial_validation_gradient_matches_finite_differences(self):
        folds = _gp_validation_folds(self.samples, self.transform)
        parameters = np.log([.4, .8, .07])
        _, gradient, _ = _gp_validation_objective(parameters, folds)
        for index in range(3):
            step = np.eye(3)[index] * 1e-5
            upper = _gp_validation_objective(parameters + step, folds)[0]
            lower = _gp_validation_objective(parameters - step, folds)[0]
            self.assertAlmostEqual(gradient[index], (upper - lower) / 2e-5, delta=1e-5)

    def test_gp_spatial_folds_hold_out_whole_levels_without_normalization_leakage(self):
        folds = _gp_validation_folds(self.samples, self.transform)
        self.assertEqual([fold.axis for fold in folds], [0, 0, 1, 1])
        x = np.asarray(self.samples.coordinates)
        for index, fold in enumerate(folds):
            train, held = fold.training_indices, fold.validation_indices
            self.assertEqual(len(set(train) & set(held)), 0)
            self.assertEqual(len(train) + len(held), self.samples.count)
            self.assertEqual(len(set(x[train, fold.axis]) & set(x[held, fold.axis])), 0)
            np.testing.assert_array_equal(x[train].min(axis=0), x.min(axis=0))
            np.testing.assert_array_equal(x[train].max(axis=0), x.max(axis=0))
            values = np.asarray(self.samples.values).copy()
            values[held] += 100
            altered = self.samples.model_copy(update={"values": tuple(values.tolist())})
            counterpart = _gp_validation_folds(altered, training_transform(altered))[index]
            np.testing.assert_array_equal(counterpart.training_targets, fold.training_targets)
            np.testing.assert_array_equal(counterpart.observation_variances, fold.observation_variances)
        for axis in (0, 1):
            axis_folds = [fold for fold in folds if fold.axis == axis]
            held = np.concatenate([fold.validation_indices for fold in axis_folds])
            expected = np.flatnonzero((x[:, axis] > x[:, axis].min()) & (x[:, axis] < x[:, axis].max()))
            np.testing.assert_array_equal(np.sort(held), expected)

    def test_gp_validation_score_matches_independent_fold_solves_and_balances_axes(self):
        folds = _gp_validation_folds(self.samples, self.transform)
        parameters = np.log([.4, .8, .07])
        score, _, axis_scores = _gp_validation_objective(parameters, folds)
        x = self.transform.coordinates(self.samples.coordinates)
        values = np.asarray(self.samples.values)
        errors = np.asarray(self.samples.standard_errors)
        independent = [[], []]
        for fold in folds:
            train, held = fold.training_indices, fold.validation_indices
            mean, scale = float(np.mean(values[train])), float(np.std(values[train]))
            covariance = rbf(x[train], x[train], (.4, .8)) + np.diag((errors[train] / scale)**2 + .07**2 + 1e-10)
            weights = np.linalg.solve(covariance, (values[train] - mean) / scale)
            prediction = mean + scale * (rbf(x[held], x[train], (.4, .8)) @ weights)
            independent[fold.axis].append(np.mean((prediction - values[held])**2) / self.transform.scale**2)
        expected = np.array([np.mean(scores) for scores in independent])
        np.testing.assert_allclose(axis_scores, expected, atol=1e-10)
        self.assertAlmostEqual(score, float(np.mean(expected)), delta=1e-10)

    def test_gp_fits_bounded_parameters_and_improves_spatial_validation(self):
        settings = GPSettings(noise_floor=.01)
        gp = fit_gp(self.samples, self.transform, settings)
        self.assertTrue(all(.05 - 1e-12 <= value <= 2 + 1e-12 for value in gp.length_scale))
        self.assertTrue(.01 - 1e-12 <= gp.regularization <= .5 + 1e-12)
        self.assertLess(gp.validation_rmse, gp.initial_validation_rmse)
        self.assertAlmostEqual(gp.validation_rmse**2, np.mean(np.square(gp.validation_rmse_by_axis)))
        self.assertFalse(np.allclose(gp.length_scale, settings.length_scale))
        self.assertLessEqual(gp.fit_evaluations, GP_MAX_FIT_EVALUATIONS)

    def test_gp_fit_is_reproducible_and_ignores_unsampled_targets(self):
        values = np.asarray(self.target.values).copy()
        unused = np.ones(values.size, dtype=bool)
        unused[list(self.samples.flat_indices)] = False
        values.ravel()[unused] += 100
        altered = with_target_data(self.target, values=values.tolist())
        samples = sample_training(altered, SamplingRequest(budget=32))
        first = fit_gp(self.samples, self.transform, GPSettings())
        second = fit_gp(samples, training_transform(samples), GPSettings())
        self.assertEqual(first.length_scale, second.length_scale)
        self.assertEqual(first.regularization, second.regularization)
        np.testing.assert_array_equal(first.weights, second.weights)

    def test_gp_fit_budget_retains_best_candidate_with_warning(self):
        def exhaust(objective, parameters, **kwargs):
            for _ in range(GP_MAX_FIT_EVALUATIONS + 1):
                objective(parameters)
            self.fail("GP fit did not enforce its evaluation budget")
        with patch("app.delphi.surrogates.minimize", side_effect=exhaust):
            result = run_experiment(ExperimentRequest(reference=self.reference, sampling={"budget": 32}, methods=("gaussian_process",)))
        model = result.methods[0]
        self.assertEqual(model.status, "complete")
        self.assertEqual(model.diagnostics.gp_fit_evaluations, GP_MAX_FIT_EVALUATIONS)
        self.assertFalse(model.diagnostics.gp_fit_converged)
        self.assertIn("gp_fit_budget", [warning.code for warning in model.warnings])

    def test_gp_fit_checks_cancellation_between_validation_evaluations(self):
        control = ExecutionControl(monotonic() + 10)
        def stop_after_first(*args):
            result = _gp_validation_objective(*args)
            control.stop("cancelled during GP fitting")
            return result
        token = bind_execution(control)
        try:
            with patch("app.delphi.surrogates._gp_validation_objective", side_effect=stop_after_first):
                with self.assertRaisesRegex(ExecutionStopped, "during GP fitting"):
                    fit_gp(self.samples, self.transform, GPSettings())
        finally:
            reset_execution(token)

    def test_gp_jitter_retries_are_bounded(self):
        with patch("app.delphi.surrogates.cholesky", side_effect=np.linalg.LinAlgError("singular")) as factor:
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
        with patch("app.delphi.mlp.loss_gradient", return_value=(float("nan"), [np.array([np.nan])])):
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
        with patch("app.delphi.experiment.fit_gp", side_effect=NumericalError("test_failure", "GP fixture failed")):
            result = run_experiment(ExperimentRequest(reference=self.reference, methods=("cubic_spline", "gaussian_process")))
        self.assertEqual(result.methods[0].status, "complete")
        self.assertEqual(result.methods[1].status, "failed")
        self.assertIsNone(result.methods[1].evaluation)

    def test_method_order_and_combined_work_validation(self):
        with self.assertRaises(ValidationError):
            ExperimentRequest(reference=self.reference, methods=("mlp", "mlp"))
        with self.assertRaisesRegex(ValidationError, "work budget"):
            ExperimentRequest(reference=self.reference, sampling={"budget": 256}, settings={"mlp": {"width": 64, "epochs": 1000}})
        ExperimentRequest(reference=self.reference, sampling={"budget": 256}, methods=("mlp",), settings={"mlp": {"width": 64, "epochs": 1000}})
        with self.assertRaisesRegex(ValidationError, "work budget"):
            ExperimentRequest(reference=self.reference, sampling={"budget": 256}, methods=("mlp", "gaussian_process"), settings={"mlp": {"width": 64, "epochs": 1000}})
