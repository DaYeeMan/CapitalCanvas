"""Stateless Oracle endpoints with bounded bodies before JSON parsing."""
from typing import TypeVar

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, ValidationError

from app.oracle.contracts import ExperimentRequest, ExperimentResult, MAX_FIT_WORK, METHODS, Settings
from app.oracle.experiment import run_experiment
from app.oracle.models import ALGORITHM_VERSION, BUDGET_SHAPES, MAX_OPERATIONS, NumericalError, PriceReference, ReferenceRequest, default_reference_request
from app.oracle.reference import generate_reference
from app.runner import run_bounded

router = APIRouter(prefix="/v1/oracle", tags=["Oracle"])
MAX_BODY_BYTES = 2 * 1024 * 1024
T = TypeVar("T", bound=BaseModel)


async def read_model(request: Request, model: type[T]) -> T:
    data = bytearray()
    async for chunk in request.stream():
        if len(data) + len(chunk) > MAX_BODY_BYTES:
            raise HTTPException(413, detail={"code": "body_too_large", "message": "Oracle requests are limited to 2 MiB."})
        data.extend(chunk)
    try:
        return model.model_validate_json(data)
    except ValidationError as error:
        messages = [{"field": ".".join(map(str, item["loc"])), "message": item["msg"]} for item in error.errors(include_url=False, include_context=False, include_input=False)[:10]]
        raise HTTPException(422, detail={"code": "invalid_experiment", "message": "; ".join(f"{item['field']}: {item['message']}" for item in messages), "fields": messages}) from error


@router.get("/capabilities")
def capabilities(request: Request):
    return {
        "schema_version": 1, "algorithm_version": ALGORITHM_VERSION,
        "targets": ["price", "implied_volatility"], "sides": ["call", "put"], "methods": METHODS,
        "budgets": [{"count": count, "shape": shape} for count, shape in BUDGET_SHAPES.items()],
        "defaults": {"price": default_reference_request().model_dump(mode="json"), "implied_volatility": default_reference_request("implied_volatility").model_dump(mode="json"), "settings": Settings().model_dump(mode="json")},
        "limits": {"axis_min": 20, "axis_max": 81, "paths_min": 1000, "paths_max": 100000,
                   "reference_work": MAX_OPERATIONS, "fit_work": MAX_FIT_WORK, "body_bytes": MAX_BODY_BYTES,
                   "strike_min": 1, "spot_max": 1000000, "tau_max": 10, "volatility_min": .01, "volatility_max": 2,
                   "rate_min": -.25, "rate_max": .25, "width_min": 4, "width_max": 64, "epochs_min": 10, "epochs_max": 1000,
                   "learning_rate_min": 1e-5, "learning_rate_max": .05, "regularization_max": .1,
                   "length_scale_min": .05, "length_scale_max": 2, "noise_floor_min": 1e-8, "noise_floor_max": .5,
                   "seed_max": 2147483647, "sweep_max": 4},
        "execution": {"timeout_seconds": request.app.state.request_timeout_seconds, "progress": "stage-level", "cancellation": "disconnect and cooperative deadline"},
    }


@router.post("/reference", response_model=PriceReference)
async def reference(request: Request):
    config = await read_model(request, ReferenceRequest)
    return await run_bounded(request, lambda control: generate_reference(config), request.app.state.request_timeout_seconds)


@router.post("/experiment", response_model=ExperimentResult)
async def experiment(request: Request):
    config = await read_model(request, ExperimentRequest)
    try:
        return await run_bounded(request, lambda control: run_experiment(config), request.app.state.request_timeout_seconds)
    except NumericalError as error:
        raise HTTPException(422, detail={"code": error.code, "message": str(error)}) from error
