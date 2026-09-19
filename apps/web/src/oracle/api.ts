import type { Capabilities, ExperimentRequest, ExperimentResult, PriceReference, ReferenceRequest } from "./types";

const base = (import.meta.env.VITE_SOLVER_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
async function request<T>(path: string, signal: AbortSignal, body?: unknown, timeout = 40000): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  if (signal.aborted) abort();
  signal.addEventListener("abort", abort, { once: true });
  const timer = window.setTimeout(() => controller.abort(new DOMException("Solver request timed out", "TimeoutError")), timeout);
  try {
    const response = await fetch(`${base}/v1/oracle/${path}`, { signal: controller.signal, ...(body === undefined ? {} : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message ?? `Solver returned HTTP ${response.status}`);
    return data as T;
  } catch (error) {
    if (signal.aborted) throw error;
    if (controller.signal.aborted) throw new Error("Solver request timed out. Reduce paths, grid size, or training settings.");
    if (error instanceof TypeError || error instanceof SyntaxError) throw new Error("Solver service is unavailable. Check the connection, then retry.");
    throw error;
  } finally {
    window.clearTimeout(timer); signal.removeEventListener("abort", abort);
  }
}
export const getCapabilities = (signal: AbortSignal) => request<Capabilities>("capabilities", signal);
export const getReference = (config: ReferenceRequest, signal: AbortSignal, timeout?: number) => request<PriceReference>("reference", signal, config, timeout);
export const fitExperiment = (config: ExperimentRequest, signal: AbortSignal, timeout?: number) => request<ExperimentResult>("experiment", signal, config, timeout);
