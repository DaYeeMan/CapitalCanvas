import asyncio
import json
import unittest
from unittest.mock import patch

from app.main import app
from test_api import BASE_REQUEST


BODY_LIMIT = 2 * 1024 * 1024
SOLVE_BODY = json.dumps({**BASE_REQUEST, "methods": ["closed_form"]}).encode()


class RequestBodyTests(unittest.IsolatedAsyncioTestCase):
    async def request(self, chunks, headers=(), path="/v1/solve"):
        messages = iter(
            {"type": "http.request", "body": chunk, "more_body": index < len(chunks) - 1}
            for index, chunk in enumerate(chunks)
        )
        reads = 0
        sent = []

        async def receive():
            nonlocal reads
            try:
                message = next(messages)
            except StopIteration:
                # A connected client has nothing else to send after its body.
                await asyncio.Event().wait()
            reads += 1
            return message

        async def send(message):
            sent.append(message)

        await asyncio.wait_for(app({
            "type": "http", "asgi": {"version": "3.0", "spec_version": "2.4"},
            "http_version": "1.1", "method": "POST", "scheme": "http",
            "path": path, "raw_path": path.encode(), "query_string": b"",
            "root_path": "", "server": ("testserver", 80), "client": ("127.0.0.1", 1234),
            "headers": [(b"host", b"testserver"), (b"x-request-id", b"body-limit-test"), *headers],
        }, receive, send), timeout=3)
        response = next(message for message in sent if message["type"] == "http.response.start")
        body = b"".join(message.get("body", b"") for message in sent if message["type"] == "http.response.body")
        return response, json.loads(body), reads

    async def test_oversized_body_is_rejected_before_json_parsing(self):
        body = SOLVE_BODY + b" " * (BODY_LIMIT + 1 - len(SOLVE_BODY))
        for declared_size in (None, b"1", str(len(body)).encode()):
            with self.subTest(content_length=declared_size):
                headers = [(b"content-type", b"application/json")]
                if declared_size is not None:
                    headers.append((b"content-length", declared_size))
                with patch("starlette.requests.json.loads", wraps=json.loads) as parse:
                    # Only the helper's response decoding may use the parser.
                    response, data, _ = await self.request([body], headers)
                    self.assertEqual(response["status"], 413)
                    self.assertEqual(parse.call_count, 1)  # Response decoding only.
                self.assertEqual(data["error"]["code"], "body_too_large")
                self.assertEqual(data["error"]["request_id"], "body-limit-test")
                self.assertEqual(dict(response["headers"])[b"x-request-id"], b"body-limit-test")

    async def test_chunked_overflow_stops_reading_before_remaining_body(self):
        first = SOLVE_BODY + b" " * (BODY_LIMIT - len(SOLVE_BODY))
        response, _, reads = await self.request(
            [first, b" ", b"unread"], [(b"content-type", b"application/json")],
        )
        self.assertEqual(response["status"], 413)
        self.assertEqual(reads, 2)

    async def test_exact_limit_and_following_normal_request_succeed(self):
        padding = b" " * (BODY_LIMIT - len(SOLVE_BODY))
        for chunks in ([SOLVE_BODY, padding], [SOLVE_BODY]):
            response, data, _ = await self.request(chunks, [(b"content-type", b"application/json")])
            self.assertEqual(response["status"], 200)
            self.assertAlmostEqual(data["results"][0]["price"], 10.450583572185565)

    async def test_fastapi_validation_and_json_media_types_remain_intact(self):
        for body in (b"{", b"{}", b""):
            response, data, _ = await self.request([body], [(b"content-type", b"application/json")])
            self.assertEqual(response["status"], 422)
            self.assertIn("detail", data)
        response, _, _ = await self.request([SOLVE_BODY], [(b"content-type", b"application/vnd.test+json")])
        self.assertEqual(response["status"], 200)
        response, _, _ = await self.request([SOLVE_BODY], [(b"content-type", b"text/plain")])
        self.assertEqual(response["status"], 422)

    async def test_delphi_retains_its_existing_body_limit(self):
        response, data, _ = await self.request([b"{" + b" " * BODY_LIMIT], path="/v1/delphi/reference")
        self.assertEqual(response["status"], 413)
        self.assertEqual(data["error"]["code"], "body_too_large")
        self.assertIn("Delphi", data["error"]["message"])

    def test_solve_openapi_retains_typed_request_and_response(self):
        operation = app.openapi()["paths"]["/v1/solve"]["post"]
        self.assertEqual(operation["requestBody"]["content"]["application/json"]["schema"]["$ref"], "#/components/schemas/SolveRequest")
        self.assertEqual(operation["responses"]["200"]["content"]["application/json"]["schema"]["$ref"], "#/components/schemas/SolveResponse")
