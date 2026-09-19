"""Shared bounded thread execution for every numerical endpoint."""
import asyncio
from collections.abc import Callable
from time import monotonic
from typing import TypeVar

from fastapi import HTTPException, Request
from starlette.concurrency import run_in_threadpool

from app.execution import ExecutionControl, ExecutionStopped, bind_execution, reset_execution

T = TypeVar("T")


async def run_bounded(request: Request, work: Callable[[ExecutionControl], T], timeout: float) -> T:
    slots = request.app.state.solve_slots
    try:
        await asyncio.wait_for(slots.acquire(), timeout=0.05)
    except TimeoutError as error:
        raise HTTPException(503, detail={"code": "solver_busy", "message": "All solver slots are busy. Retry shortly."}) from error
    control = ExecutionControl(monotonic() + timeout)

    def execute() -> T:
        token = bind_execution(control)
        try:
            control.check()
            result = work(control)
            control.check()
            return result
        finally:
            reset_execution(token)

    task = asyncio.create_task(run_in_threadpool(execute))

    def finished(completed: asyncio.Task) -> None:
        # A disconnected request must not free capacity while its worker still runs.
        slots.release()
        if not completed.cancelled():
            completed.exception()

    try:
        while not task.done():
            if await request.is_disconnected():
                control.stop("client disconnected")
                raise HTTPException(499, detail={"code": "client_disconnected", "message": "Calculation cancelled."})
            if monotonic() >= control.deadline:
                control.stop("deadline exceeded")
                raise ExecutionStopped("calculation exceeded the server deadline")
            await asyncio.sleep(0.025)
        return task.result()
    except asyncio.CancelledError:
        control.stop("request cancelled")
        raise
    finally:
        if not task.done():
            task.add_done_callback(finished)
        else:
            finished(task)
