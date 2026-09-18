from time import monotonic
import unittest

import numpy as np
from pydantic import ValidationError

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution
from app.oracle.implied_volatility import build_target
from app.oracle.models import BUDGET_SHAPES, Bounds, SampleSet, SamplingRequest, content_id
from app.oracle.preprocessing import training_transform
from app.oracle.sampling import sample_training, validate_samples
from oracle_fixtures import small_reference, with_target_data


class OracleSamplingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.target = build_target(small_reference(), "price")

    def test_all_budgets_are_unique_shared_reference_subsets(self):
        for budget, shape in BUDGET_SHAPES.items():
            with self.subTest(budget=budget):
                samples = sample_training(self.target, SamplingRequest(budget=budget))
                self.assertEqual(samples, sample_training(self.target, SamplingRequest(budget=budget)))
                self.assertEqual(samples.shape, shape)
                self.assertEqual(len(set(samples.flat_indices)), budget)
                self.assertEqual(samples.row_indices[0], 0)
                self.assertEqual(samples.row_indices[-1], 19)
                self.assertEqual(samples.column_indices[-1], 19)
                np.testing.assert_array_equal(samples.values, np.asarray(self.target.values).flat[list(samples.flat_indices)])
                validate_samples(self.target, samples)

    def test_bounds_snap_inward_to_real_coordinates(self):
        samples = sample_training(self.target, SamplingRequest(budget=32, training_bounds=Bounds(spot_min=85.0, spot_max=115.0, tau_min=.2, tau_max=1.8)))
        self.assertGreaterEqual(samples.bounds.spot_min, 85)
        self.assertLessEqual(samples.bounds.spot_max, 115)
        self.assertEqual(samples.bounds.tau_min, self.target.axes.times_to_maturity[samples.row_indices[0]])
        validate_samples(self.target, samples)

    def test_bad_budget_and_regions_fail_without_silent_adjustment(self):
        for budget in (0, 127, 512, True, 128.0):
            with self.subTest(budget=budget), self.assertRaises(ValidationError):
                SamplingRequest(budget=budget)
        for bounds in (Bounds(spot_min=99.0, spot_max=101.0), Bounds(spot_min=70.0, spot_max=130.0)):
            with self.assertRaises(ValueError):
                sample_training(self.target, SamplingRequest(training_bounds=bounds))

    def test_one_invalid_training_point_rejects_entire_set(self):
        values = [list(row) for row in self.target.values]
        errors = [list(row) for row in self.target.standard_errors]
        masks = [list(row) for row in self.target.valid_mask]
        reasons = [list(row) for row in self.target.invalid_reasons]
        values[0][0] = errors[0][0] = None
        masks[0][0] = False
        reasons[0][0] = "unbracketed"
        target = with_target_data(self.target, values=values, standard_errors=errors, valid_mask=masks, invalid_reasons=reasons)
        with self.assertRaisesRegex(ValueError, "1 of 128"):
            sample_training(target, SamplingRequest())

    def test_identity_changes_with_region_budget_or_target(self):
        full = sample_training(self.target, SamplingRequest())
        smaller = sample_training(self.target, SamplingRequest(budget=64))
        changed = build_target(small_reference(seed=43), "price")
        self.assertNotEqual(full.sample_set_id, smaller.sample_set_id)
        with self.assertRaisesRegex(ValueError, "different reference"):
            validate_samples(changed, full)

    def test_even_rehashed_corrupt_sample_rejected_against_parent(self):
        payload = sample_training(self.target, SamplingRequest()).model_dump(mode="json")
        payload["values"][1] += 1
        payload["sample_set_id"] = content_id({k: v for k, v in payload.items() if k != "sample_set_id"})
        corrupt = SampleSet.model_validate(payload)
        with self.assertRaisesRegex(ValueError, "do not match"):
            validate_samples(self.target, corrupt)

    def test_sample_shape_and_integer_types_are_strict(self):
        for mutation in ("coordinate", "index", "length"):
            payload = sample_training(self.target, SamplingRequest()).model_dump(mode="json")
            if mutation == "coordinate": payload["coordinates"][1][0] += .1
            if mutation == "index": payload["row_indices"][0] = False
            if mutation == "length": payload["values"] *= 3
            payload["sample_set_id"] = content_id({k: v for k, v in payload.items() if k != "sample_set_id"})
            with self.subTest(mutation=mutation), self.assertRaises(ValidationError):
                SampleSet.model_validate(payload)

    def test_normalization_uses_only_training_and_does_not_clip(self):
        samples = sample_training(self.target, SamplingRequest(budget=16, training_bounds=Bounds(spot_min=85.0, spot_max=115.0, tau_min=.2, tau_max=1.8)))
        transform = training_transform(samples)
        self.assertAlmostEqual(transform.mean, np.mean(samples.values))
        self.assertAlmostEqual(transform.scale, np.std(samples.values))
        normalized = transform.coordinates(np.array([[80, 0], [120, 2]]))
        self.assertTrue(np.all(normalized[0] < 0))
        self.assertTrue(np.all(normalized[1] > 1))
        np.testing.assert_allclose(transform.restore(transform.targets(samples.values)), samples.values, atol=1e-14)
        np.testing.assert_allclose(transform.restore_stddev(np.array([1.0])), [transform.scale])
        constant = training_transform(samples, np.zeros(samples.count))
        self.assertTrue(constant.scale_floored)
        np.testing.assert_array_equal(constant.targets(np.zeros(samples.count)), 0)
        with self.assertRaisesRegex(ValueError, "normalization range"):
            training_transform(samples, np.full(samples.count, 1e308))

    def test_sampling_and_preprocessing_obey_cancellation(self):
        samples = sample_training(self.target, SamplingRequest())
        token = bind_execution(ExecutionControl(monotonic() - 1))
        try:
            for operation in (lambda: sample_training(self.target, SamplingRequest()), lambda: training_transform(samples)):
                with self.assertRaises(ExecutionStopped):
                    operation()
        finally:
            reset_execution(token)
