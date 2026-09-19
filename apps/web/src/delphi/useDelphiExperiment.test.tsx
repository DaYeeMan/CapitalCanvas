// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDelphiExperiment } from "./useDelphiExperiment";
import { fitExperiment, getCapabilities, getReference } from "./api";
import { defaultReference, defaultSettings, initialConfig, METHODS, referenceKey, type Capabilities, type ExperimentRequest, type ExperimentResult, type PriceReference } from "./types";
import { validateConfig } from "./validation";
vi.mock("./api", () => ({ getCapabilities: vi.fn(), getReference: vi.fn(), fitExperiment: vi.fn() }));

const capabilities: Capabilities = { schema_version: 1, algorithm_version: "test", methods: [...METHODS], budgets: [16, 32, 64, 128, 256].map(count => ({ count, shape: count === 256 ? [16, 16] : count === 128 ? [8, 16] : count === 64 ? [8, 8] : count === 32 ? [4, 8] : [4, 4] })), defaults: { price: defaultReference, implied_volatility: defaultReference, settings: defaultSettings }, execution: { timeout_seconds: 30 }, limits: { strike_min: 1, spot_max: 1e6, volatility_min: .01, volatility_max: 2, rate_min: -.25, rate_max: .25, tau_max: 10, axis_min: 20, axis_max: 81, paths_min: 1000, paths_max: 100000, seed_max: 2147483647, reference_work: 120e6, fit_work: 9e9, sweep_max: 4, width_min: 4, width_max: 64, epochs_min: 10, epochs_max: 1000, learning_rate_min: 1e-5, learning_rate_max: .05, regularization_max: .1, length_scale_min: .05, length_scale_max: 2, noise_floor_min: 1e-8, noise_floor_max: .5 } };
const reference = { reference_id: "reference-a", timing: { reference_ms: 10 } } as PriceReference;
function resultFor(request: ExperimentRequest): ExperimentResult {
  return { reference_id: request.reference.reference_id, samples: { count: request.sampling.budget }, configuration_snapshot: request,
    target: { kind: request.target }, methods: request.methods.map(method => ({ method, status: "complete", evaluation: { full: { count: 100, mae: 1, rmse: 2, max_abs_error: 3 } }, timing: { fit_ms: 1, inference_ms: 2 } })) } as unknown as ExperimentResult; // State tests only need the transport fields read by the hook.
}
function deferred<T>() { let resolve!: (value: T) => void, reject!: (error: Error) => void; const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
async function ready() { const hook = renderHook(useDelphiExperiment); await waitFor(() => expect(hook.result.current.capabilities).toBeTruthy()); return hook; }
beforeEach(() => { vi.resetAllMocks(); vi.mocked(getCapabilities).mockResolvedValue(capabilities); vi.mocked(getReference).mockResolvedValue(reference); vi.mocked(fitExperiment).mockImplementation(async request => resultFor(request)); });
afterEach(cleanup);

describe("Delphi state and request ownership", () => {
  it("does not auto-run; preserves results after edits and reuses references only for matching inputs", async () => {
    const { result } = await ready(); expect(getReference).not.toHaveBeenCalled();
    await act(() => result.current.run()); const first = result.current.result;
    act(() => result.current.edit(old => ({ ...old, training_seed: 43 })));
    expect(result.current.stale).toBe(true); expect(result.current.result).toBe(first);
    await act(() => result.current.run()); expect(getReference).toHaveBeenCalledTimes(1); expect(result.current.referenceInfo?.reused).toBe(true);
    act(() => result.current.edit(old => ({ ...old, reference: { ...old.reference, monte_carlo: { ...old.reference.monte_carlo, seed: 44 } } })));
    await act(() => result.current.run()); expect(getReference).toHaveBeenCalledTimes(2);
  });
  it.each(["success", "error"])("ignores a late old %s even when transport ignores abort", async outcome => {
    const old = deferred<ExperimentResult>(); vi.mocked(fitExperiment).mockImplementationOnce(() => old.promise);
    const { result } = await ready(); let pending!: Promise<void>;
    act(() => { pending = result.current.run(); }); await waitFor(() => expect(fitExperiment).toHaveBeenCalledTimes(1));
    const oldRequest = vi.mocked(fitExperiment).mock.calls[0][0]; const signal = vi.mocked(fitExperiment).mock.calls[0][1];
    act(() => result.current.edit(config => ({ ...config, training_seed: 88 })));
    expect(signal.aborted).toBe(true);
    await act(() => result.current.run()); const latest = result.current.result;
    await act(async () => { if (outcome === "success") old.resolve(resultFor(oldRequest)); else old.reject(new Error("obsolete failure")); await pending; });
    expect(result.current.result).toBe(latest); expect(result.current.errors).toEqual([]); expect(result.current.busy).toBe(false);
  });
  it("runs budgets serially, reuses one reference, and retains only completed budgets on cancellation", async () => {
    const second = deferred<ExperimentResult>(); vi.mocked(fitExperiment).mockImplementationOnce(async request => resultFor(request)).mockImplementationOnce(() => second.promise);
    const { result } = await ready(); act(() => result.current.edit(old => ({ ...old, mode: "budget" })));
    let pending!: Promise<void>; act(() => { pending = result.current.run(); });
    await waitFor(() => expect(fitExperiment).toHaveBeenCalledTimes(2)); expect(result.current.points.map(p => p.count)).toEqual([32]); expect(getReference).toHaveBeenCalledTimes(1);
    act(() => result.current.cancel()); await act(async () => { second.resolve(resultFor(vi.mocked(fitExperiment).mock.calls[1][0])); await pending; });
    expect(result.current.points.map(p => p.count)).toEqual([32]); expect(fitExperiment).toHaveBeenCalledTimes(2); expect(result.current.busy).toBe(false);
  });
  it.each(["reset", "unmount"])("aborts and prevents reference commits after %s", async action => {
    const pendingReference = deferred<PriceReference>(); vi.mocked(getReference).mockReturnValue(pendingReference.promise);
    const hook = await ready(); let pending!: Promise<void>; act(() => { pending = hook.result.current.run(); });
    const signal = vi.mocked(getReference).mock.calls[0][1];
    act(() => { if (action === "reset") hook.result.current.reset(); else hook.unmount(); });
    expect(signal.aborted).toBe(true); await act(async () => { pendingReference.resolve(reference); await pending; });
    expect(fitExperiment).not.toHaveBeenCalled(); expect(hook.result.current.result).toBeNull();
  });
  it("reports all-model failures and rejects mismatched result identities", async () => {
    vi.mocked(fitExperiment).mockImplementationOnce(async request => ({ ...resultFor(request), methods: request.methods.map(method => ({ method, status: "failed", error: { code: "numerical", message: "failed" } })) } as ExperimentResult));
    const { result } = await ready(); await act(() => result.current.run()); expect(result.current.status).toContain("all models failed"); expect(result.current.errors[0]).toContain("All models failed");
    vi.mocked(fitExperiment).mockImplementationOnce(async request => ({ ...resultFor(request), reference_id: "wrong" }));
    await act(() => result.current.run()); expect(result.current.errors[0]).toContain("does not match");
  });
});
describe("Delphi validation", () => {
  it("accepts defaults and rejects invalid, oversized, and too-narrow configurations", () => {
    const config = initialConfig(); expect(validateConfig(config, capabilities)).toEqual([]);
    config.reference.monte_carlo.paths = 99999; config.settings.mlp.width = 64; config.settings.mlp.epochs = 1000; config.budget = 256;
    expect(validateConfig(config, capabilities).join(" ")).toMatch(/even path.*operation budget.*work budget/);
    config.mode = "extrapolation"; config.training_bounds.spot_max = config.training_bounds.spot_min + .001;
    expect(validateConfig(config, capabilities).join(" ")).toContain("reference nodes");
    config.reference.market.rate = NaN; expect(validateConfig(config, capabilities).join(" ")).toContain("Rate must");
  });
  it("compares reference configurations independently of JSON property order", () => {
    expect(referenceKey(defaultReference)).toBe(referenceKey({ ...defaultReference, market: { dividend: 0, rate: .05, volatility: .2, strike: 100 } }));
  });
});
