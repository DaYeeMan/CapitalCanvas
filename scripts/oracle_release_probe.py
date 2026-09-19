"""Bounded local measurements of the production Oracle implementations."""
import json
from pathlib import Path
import platform
import sys
from time import perf_counter
import tracemalloc

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "services" / "solver-api"))
import numpy as np
import scipy
from app.oracle.contracts import ExperimentRequest
from app.oracle.experiment import run_experiment
from app.oracle.models import ReferenceRequest, default_reference_request
from app.oracle.reference import generate_reference


def measure(name, work):
    tracemalloc.start()
    start = perf_counter()
    result = work()
    elapsed = (perf_counter() - start) * 1000
    _, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    record = {"name": name, "wall_ms": elapsed, "tracked_peak_mib": peak / 1024**2}
    if hasattr(result, "methods"):
        record.update(timings=result.timings.model_dump(), methods=[{"method": m.method, "status": m.status, "timing": m.timing.model_dump() if m.timing else None, "metric": m.evaluation.full.model_dump() if m.evaluation else None} for m in result.methods])
    print(json.dumps(record), flush=True)
    records.append(record)
    return result


records = []
reference = measure("default_reference", lambda: generate_reference(default_reference_request()))
measure("default_128_all_methods", lambda: run_experiment(ExperimentRequest(reference=reference)))
measure("256_all_methods", lambda: run_experiment(ExperimentRequest(reference=reference, sampling={"budget": 256})))
measure("bounded_64_width_1000_epochs", lambda: run_experiment(ExperimentRequest(reference=reference, sampling={"budget": 128}, settings={"mlp": {"width": 64, "epochs": 1000}})))
largest = measure("largest_grid_near_work_cap", lambda: generate_reference(ReferenceRequest(domain={"spot_nodes": 81, "tau_nodes": 81}, monte_carlo={"paths": 18518})))
measure("largest_grid_256_all_methods", lambda: run_experiment(ExperimentRequest(reference=largest, sampling={"budget": 256})))
payload = ExperimentRequest(reference=largest, sampling={"budget": 256}).model_dump_json()
assert len(payload.encode()) < 2 * 1024**2
report = {"environment": {"platform": platform.platform(), "processor": platform.processor(), "python": platform.python_version(), "numpy": np.__version__, "scipy": scipy.__version__}, "largest_request_bytes": len(payload.encode()), "observations": records, "notes": "Single local observations with tracemalloc overhead. Tracked allocations are not total process RSS; these are not hosted latency guarantees."}
(ROOT / "docs/plans/oracle/release-measurements.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
