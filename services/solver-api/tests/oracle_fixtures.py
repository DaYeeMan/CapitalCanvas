"""Small deterministic numerical fixtures; no external API or trained model."""
from functools import lru_cache

from app.oracle.models import ReferenceRequest, TargetSurface, content_id
from app.oracle.reference import generate_reference


@lru_cache(maxsize=8)
def small_reference(side="call", antithetic=True, seed=42, tau_min=0.0):
    return generate_reference(ReferenceRequest(
        option_side=side, domain={"spot_min": 80.0, "spot_max": 120.0, "spot_nodes": 20, "tau_min": tau_min, "tau_max": 2.0, "tau_nodes": 20},
        monte_carlo={"paths": 1000, "seed": seed, "antithetic": antithetic},
    ))


def with_target_data(target, **updates):
    payload = target.model_dump(mode="json")
    payload.update(updates)
    identity = {key: value for key, value in payload.items() if key not in {"target_id", "conversion_ms", "warnings"}}
    payload["target_id"] = content_id(identity)
    return TargetSurface.model_validate(payload)
