import { useEffect, useRef, useState } from "react";
import { fitExperiment, getCapabilities, getReference } from "./api";
import { initialConfig, type BudgetPoint, type Capabilities, type Config, type ExperimentResult, type PriceReference } from "./types";
import { validateConfig } from "./validation";

const bytes = (value: unknown) => JSON.stringify(value).length * 2;
export function useDelphiExperiment() {
  const [config, setConfig] = useState(initialConfig);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<ExperimentResult | null>(null);
  const [points, setPoints] = useState<BudgetPoint[]>([]);
  const [committedKey, setCommittedKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Ready to configure");
  const [errors, setErrors] = useState<string[]>([]);
  const [referenceInfo, setReferenceInfo] = useState<{ id: string; ms: number; reused: boolean } | null>(null);
  const references = useRef(new Map<string, PriceReference>());
  const sequence = useRef(0), active = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getCapabilities(controller.signal).then(next => {
      if (controller.signal.aborted) return;
      setCapabilities(next); setServiceError(null);
    }).catch(error => { if (!controller.signal.aborted) setServiceError(error instanceof Error ? error.message : "Solver service is unavailable."); });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => () => { sequence.current++; active.current?.abort(); }, []);

  function cancel() {
    sequence.current++; active.current?.abort(); active.current = null;
    setBusy(false); setStatus("Cancelled — completed results retained");
  }
  function edit(update: (previous: Config) => Config) {
    sequence.current++; active.current?.abort(); active.current = null;
    setBusy(false); setErrors([]); setStatus("Inputs changed — run to update"); setConfig(update);
  }
  function reset() {
    cancel(); references.current.clear(); setResult(null); setPoints([]); setCommittedKey("");
    setReferenceInfo(null); setErrors([]); setStatus("Ready to configure"); setConfig(initialConfig(capabilities ?? undefined));
  }
  async function run() {
    const problems = validateConfig(config, capabilities);
    setErrors(problems);
    if (problems.length || !capabilities) return;
    active.current?.abort();
    const id = ++sequence.current, controller = new AbortController(); active.current = controller;
    const current = () => sequence.current === id && !controller.signal.aborted;
    const snapshot = structuredClone(config), key = JSON.stringify(snapshot);
    const timeout = (capabilities.execution.timeout_seconds + 10) * 1000;
    setBusy(true); setStatus("Preparing experiment");
    if (snapshot.mode === "budget") setPoints([]);
    try {
      const referenceKey = `${capabilities.algorithm_version}:${JSON.stringify(snapshot.reference)}`;
      let reference = references.current.get(referenceKey);
      const reused = Boolean(reference);
      if (!reference) {
        setStatus("Generating Monte Carlo reference…");
        reference = await getReference(snapshot.reference, controller.signal, timeout);
        if (!current()) return;
        if (bytes(reference) > 16 * 1024 ** 2) throw new Error("Reference exceeds the browser memory budget.");
        references.current.set(referenceKey, reference);
      } else { references.current.delete(referenceKey); references.current.set(referenceKey, reference); }
      while (references.current.size > 2 || [...references.current.values()].reduce((sum, item) => sum + bytes(item), 0) > 16 * 1024 ** 2) references.current.delete(references.current.keys().next().value!);
      setReferenceInfo({ id: reference.reference_id, ms: reference.timing.reference_ms, reused });
      const budgets = snapshot.mode === "budget" ? [...snapshot.budgets].sort((a, b) => a - b) : [snapshot.budget];
      const completed: BudgetPoint[] = [];
      let partial = false, anySuccess = false;
      for (let index = 0; index < budgets.length; index++) {
        if (!current()) return;
        setStatus(`Fitting models · ${budgets[index]} samples${snapshot.mode === "budget" ? ` · budget ${index + 1} of ${budgets.length}` : ""}`);
        const next = await fitExperiment({ schema_version: 1, reference, target: snapshot.target, sampling: { strategy: "uniform_tensor", budget: budgets[index], training_bounds: snapshot.mode === "extrapolation" ? snapshot.training_bounds : null }, methods: snapshot.methods, settings: snapshot.settings, training_seed: snapshot.training_seed }, controller.signal, timeout);
        if (!current()) return;
        if (next.reference_id !== reference.reference_id || next.samples.count !== budgets[index]) throw new Error("Solver result does not match the requested reference and budget.");
        setResult(next); setCommittedKey(key);
        partial ||= next.methods.some(model => model.status === "failed");
        anySuccess ||= next.methods.some(model => model.status === "complete");
        if (snapshot.mode === "budget") {
          completed.push({ count: budgets[index], target: next.target.kind, referenceId: next.reference_id, result: next,
            methods: next.methods.map(model => ({ method: model.method, metric: model.evaluation?.full ?? null, fit_ms: model.timing?.fit_ms ?? null, inference_ms: model.timing?.inference_ms ?? null })) });
          // Keep every summary; evict oldest detailed surfaces only when needed.
          for (let old = 0; bytes(completed) > 32 * 1024 ** 2 && old < completed.length - 1; old++) completed[old] = { ...completed[old], result: null };
          setPoints([...completed]);
        }
      }
      if (current()) {
        if (!anySuccess) setErrors(["All models failed. Inspect diagnostics and adjust the configuration before retrying."]);
        setStatus(!anySuccess ? "Experiment failed — all models failed" : partial ? "Finished with model failures — inspect comparison rows" : snapshot.mode === "budget" ? `Completed ${budgets.length} budgets` : "Experiment complete");
      }
    } catch (error) {
      if (current()) { setErrors([error instanceof Error ? error.message : "Experiment failed."]); setStatus("Experiment failed — completed results retained"); }
    } finally {
      if (current()) { active.current = null; setBusy(false); }
    }
  }
  return { config, capabilities, serviceError, retryService: () => setAttempt(value => value + 1), result, points, busy, status, errors, referenceInfo,
    stale: Boolean(result && JSON.stringify(config) !== committedKey), edit, reset, cancel, run, selectResult: setResult };
}
