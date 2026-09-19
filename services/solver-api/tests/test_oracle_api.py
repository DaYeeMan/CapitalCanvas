import asyncio
from threading import Event
from types import SimpleNamespace
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.execution import ExecutionStopped
from app.main import app
from app.oracle.models import default_reference_request
from app.oracle.router import MAX_BODY_BYTES, read_model
from app.oracle.models import ReferenceRequest
from app.runner import run_bounded
from oracle_fixtures import small_reference


class OracleAPITests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_reference_and_all_model_flow(self):
        reference = self.client.post("/v1/oracle/reference", json=small_reference().configuration.model_dump(mode="json"))
        self.assertEqual(reference.status_code, 200, reference.text)
        result = self.client.post("/v1/oracle/experiment", json={"reference": reference.json(), "settings": {"mlp": {"epochs": 20}}})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertTrue(all(m["status"] == "complete" for m in result.json()["methods"]))

    def test_iv_and_extrapolation_api_flow(self):
        request = default_reference_request("implied_volatility").model_dump(mode="json")
        reference = self.client.post("/v1/oracle/reference", json=request).json()
        result = self.client.post("/v1/oracle/experiment", json={"reference": reference, "target": "implied_volatility", "sampling": {"budget": 32, "training_bounds": {"spot_min": 85., "spot_max": 115., "tau_min": .4, "tau_max": 1.8}}, "settings": {"mlp": {"epochs": 20}}})
        self.assertEqual(result.status_code, 200, result.text)
        self.assertTrue(all(m["status"] == "complete" and m["evaluation"]["outside"]["count"] > 0 for m in result.json()["methods"]))

    def test_capabilities_and_bad_requests(self):
        capabilities = self.client.get("/v1/oracle/capabilities").json()
        self.assertEqual(len(capabilities["methods"]), 4)
        self.assertEqual(capabilities["limits"]["body_bytes"], MAX_BODY_BYTES)
        response = self.client.post("/v1/oracle/reference", json={"monte_carlo": {"paths": 100000}})
        self.assertEqual(response.status_code, 422)
        response = self.client.post("/v1/oracle/reference", content=b"{" + b" " * MAX_BODY_BYTES)
        self.assertEqual(response.status_code, 413)
        reference = small_reference().model_dump(mode="json")
        reference["prices"][1][0] += .1
        response = self.client.post("/v1/oracle/experiment", json={"reference": reference})
        self.assertEqual(response.status_code, 422)
        self.assertIn("identity mismatch", response.text)

    def test_invalid_iv_training_fails_shared_experiment(self):
        result = self.client.post("/v1/oracle/experiment", json={"reference": small_reference().model_dump(mode="json"), "target": "implied_volatility"})
        self.assertEqual(result.status_code, 422)
        self.assertEqual(result.json()["error"]["code"], "invalid_training_nodes")

    def test_timeout_uses_structured_error(self):
        with patch("app.oracle.router.generate_reference", side_effect=ExecutionStopped("deadline")):
            response = self.client.post("/v1/oracle/reference", json={})
        self.assertEqual(response.status_code, 504)
        self.assertIn("request_id", response.json()["error"])


class RunnerTests(unittest.IsolatedAsyncioTestCase):
    async def test_deadline_retains_slot_until_native_work_finishes(self):
        slots, release = asyncio.Semaphore(1), Event()
        async def connected(): return False
        request = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(solve_slots=slots)), is_disconnected=connected)
        try:
            with self.assertRaises(ExecutionStopped):
                await run_bounded(request, lambda control: release.wait(2), .02)
            self.assertTrue(slots.locked())
        finally:
            release.set()
        for _ in range(100):
            if not slots.locked(): break
            await asyncio.sleep(.01)
        self.assertFalse(slots.locked())

    async def test_slot_retained_until_disconnected_worker_finishes(self):
        slots, release, started = asyncio.Semaphore(1), Event(), Event()
        async def disconnected(): return started.is_set()
        request = SimpleNamespace(app=SimpleNamespace(state=SimpleNamespace(solve_slots=slots)), is_disconnected=disconnected)
        def work(control):
            started.set()
            release.wait(2)
            return 1
        try:
            with self.assertRaises(HTTPException) as caught:
                await run_bounded(request, work, 10)
            self.assertEqual(caught.exception.status_code, 499)
            self.assertTrue(slots.locked())
            with self.assertRaises(HTTPException) as busy:
                await run_bounded(request, work, 10)
            self.assertEqual(busy.exception.status_code, 503)
        finally:
            release.set()
        for _ in range(100):
            if not slots.locked(): break
            await asyncio.sleep(.01)
        self.assertFalse(slots.locked())

    async def test_chunked_body_limit_without_content_length(self):
        async def stream():
            yield b" " * MAX_BODY_BYTES
            yield b"x"
        with self.assertRaises(HTTPException) as caught:
            await read_model(SimpleNamespace(stream=stream), ReferenceRequest)
        self.assertEqual(caught.exception.status_code, 413)
