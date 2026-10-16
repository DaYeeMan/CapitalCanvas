"""Bound solve bodies before FastAPI buffers or parses their JSON."""
from collections.abc import Callable, Coroutine
from typing import Any

from fastapi import HTTPException, Request, Response
from fastapi.routing import APIRoute
from starlette.types import Message


MAX_SOLVE_BODY_BYTES = 2 * 1024 * 1024


class BoundedSolveRoute(APIRoute):
    def get_route_handler(self) -> Callable[[Request], Coroutine[Any, Any, Response]]:
        handler = super().get_route_handler()

        async def bounded_handler(request: Request) -> Response:
            received_bytes = 0

            async def receive() -> Message:
                nonlocal received_bytes
                message = await request.receive()
                if message["type"] == "http.request":
                    received_bytes += len(message.get("body", b""))
                    if received_bytes > MAX_SOLVE_BODY_BYTES:
                        raise HTTPException(413, detail={
                            "code": "body_too_large",
                            "message": "Solve requests are limited to 2 MiB.",
                        })
                return message

            # Keep FastAPI's typed validation and media-type handling. Count
            # actual chunks, independent of any supplied Content-Length.
            return await handler(Request(request.scope, receive=receive))

        return bounded_handler
