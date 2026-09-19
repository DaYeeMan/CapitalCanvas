import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Play, SlidersHorizontal, X, Square } from "lucide-react";
import "katex/dist/katex.min.css";
import { OracleParameters } from "./OracleParameters";
import { OracleSurface } from "./OracleSurface";
import { OracleComparison } from "./OracleComparison";
import { OracleBudget } from "./OracleBudget";
import { OracleTabs } from "./OracleControls";
import { useOracleExperiment } from "./useOracleExperiment";
import { labels, numberText, referenceKey, type Method, type Mode, type Region, type View } from "./types";
import "./oracle.css";

export default function OracleWorkbench() {
  const experiment = useOracleExperiment();
  const { config, result, busy, referenceInfo } = experiment;
  const [method, setMethod] = useState<Method>("cubic_spline"), [view, setView] = useState<View>("prediction"), [region, setRegion] = useState<Region>("full");
  const [inspectBudget, setInspectBudget] = useState(false), [slice, setSlice] = useState(false);
  const sheet = useRef<HTMLDialogElement>(null), controlsButton = useRef<HTMLButtonElement>(null), errorSummary = useRef<HTMLDivElement>(null);
  const activeMethod = result?.methods.some(item => item.method === method) ? method : result?.methods[0]?.method ?? "cubic_spline";
  const hasGP = result?.methods.some(item => item.method === "gaussian_process" && item.status === "complete") ?? false;
  const activeView = view === "uncertainty" && !hasGP ? "prediction" : view;
  useEffect(() => { if (experiment.errors.length) errorSummary.current?.focus(); }, [experiment.errors]);
  function selectMethod(next: Method) { setMethod(next); if (view === "uncertainty" && next !== "gaussian_process") setView("prediction"); }
  function selectView(next: View) { setSlice(false); setView(next); if (next === "uncertainty") setMethod("gaussian_process"); }
  function changeMode(mode: Mode) { setInspectBudget(false); experiment.edit(old => ({ ...old, mode })); }
  function closeSheet() { sheet.current?.close(); controlsButton.current?.focus(); }
  const matchingInfo = referenceInfo && result?.reference_id === referenceInfo.id ? referenceInfo : null;
  const referenceMatches = result && referenceKey(config.reference) === referenceKey(result.configuration_snapshot.reference);
  const referenceStatus = busy && experiment.status.startsWith("Generating") ? "Generating…" : referenceMatches ? (matchingInfo?.reused ? "Reused" : "Ready") : referenceInfo ? "Out of date" : "Not generated";
  const parameters = <OracleParameters config={config} capabilities={experiment.capabilities} edit={experiment.edit} referenceStatus={referenceStatus} />;
  const showingBudget = config.mode === "budget" && !inspectBudget;
  const warnings = [...(result?.warnings ?? []), ...(result?.methods.find(item => item.method === activeMethod)?.warnings ?? [])];
  return <div className="oracle-workbench">
    <a className="skip-link" href="#oracle-main">Skip to experiment</a>
    <header className="oracle-topbar"><a className="oracle-back" href="/#home" aria-label="Return to CapitalCanvas"><ArrowLeft size={20} /></a><h1>Oracle</h1><span className="oracle-tagline">Surrogate modeling laboratory</span><div className="oracle-actions"><button className="oracle-mobile-controls" ref={controlsButton} onClick={() => sheet.current?.showModal()}><SlidersHorizontal size={16} />Setup</button><button onClick={() => { experiment.reset(); setSlice(false); setInspectBudget(false); setView("prediction"); setMethod("cubic_spline"); setRegion("full"); }}><RotateCcw size={15} />Reset</button>{busy ? <button className="oracle-primary" onClick={experiment.cancel}><Square size={13} />Cancel</button> : <button className="oracle-primary" disabled={!experiment.capabilities} onClick={() => { setInspectBudget(false); void experiment.run(); }}><Play size={14} fill="currentColor" />Run experiment</button>}</div></header>
    <aside className="oracle-rail" aria-label="Experiment configuration">{parameters}</aside>
    <dialog className="oracle-sheet" aria-label="Experiment setup" ref={sheet} onClose={() => controlsButton.current?.focus()}><div className="oracle-sheet-top"><span>Experiment controls</span><button aria-label="Close experiment controls" onClick={closeSheet}><X size={20} /></button></div>{parameters}<button className="oracle-primary oracle-sheet-done" onClick={closeSheet}>Apply and close</button></dialog>
    <main id="oracle-main" className="oracle-main" tabIndex={-1}>
      <OracleTabs label="Experiment type" value={config.mode} panelId="oracle-experiment-panel" onChange={changeMode} options={[{ value: "comparison", label: "Model comparison" }, { value: "budget", label: "Data budget" }, { value: "extrapolation", label: "Extrapolation" }]} />
      <div className="oracle-status-line"><span role="status" aria-live="polite">{experiment.status}</span>{experiment.stale ? <strong>Previous experiment — inputs changed</strong> : null}</div>
      {experiment.serviceError ? <div className="oracle-alert" role="alert">{experiment.serviceError} <button onClick={experiment.retryService}>Retry connection</button></div> : null}
      {experiment.errors.length ? <div ref={errorSummary} className="oracle-alert" role="alert" tabIndex={-1}><strong>Experiment needs attention</strong><ul>{experiment.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : null}
      <div id="oracle-experiment-panel" role="tabpanel" aria-label={config.mode === "comparison" ? "Model comparison" : config.mode === "budget" ? "Data budget" : "Extrapolation"}>
        {showingBudget ? <OracleBudget points={experiment.points} onSelect={next => { experiment.selectResult(next); setInspectBudget(true); }} /> : <>
          <div className="oracle-title-line"><h2>{(result?.target.kind ?? config.target) === "price" ? "Price surface" : "Implied-volatility surface"}</h2>{result ? <span className="oracle-provenance">Shared reference · Shared {result.samples.count} samples</span> : null}{inspectBudget ? <button onClick={() => setInspectBudget(false)}>Back to budget curves</button> : null}</div>
          <div className="oracle-viewbar"><OracleTabs label="Surface view" value={activeView} panelId="oracle-surface-plot" compact onChange={selectView} options={[{ value: "reference", label: "Reference" }, { value: "prediction", label: "Prediction" }, { value: "error", label: "Absolute error" }, { value: "uncertainty", label: "GP uncertainty", disabled: !hasGP, reason: "Run a successful Gaussian process fit to inspect its uncertainty." }]} />{result ? <label className="oracle-model-select">Model<select value={activeMethod} onChange={event => selectMethod(event.target.value as Method)}>{result.methods.map(item => <option key={item.method} value={item.method}>{labels[item.method]}{item.status === "failed" ? " · failed" : ""}</option>)}</select></label> : null}</div>
          {result ? <><OracleSurface result={result} method={activeMethod} view={activeView} slice={slice} onSlice={setSlice} /><OracleComparison result={result} active={activeMethod} onSelect={selectMethod} region={region} onRegion={setRegion} /></> : <div className="oracle-empty oracle-empty-surface" id="oracle-surface-plot" role="tabpanel" aria-label="Surface awaiting experiment"><div><h3>Start with the same data.</h3><p>Generate a Monte Carlo reference, then compare four ways to learn its surface.</p><p className="oracle-caption">Choose your inputs and press Run experiment.<br />GP uncertainty becomes available after a successful GP fit.</p></div></div>}
        </>}
      </div>
      {warnings.length ? <details className="oracle-diagnostics"><summary>Assumptions and diagnostics · {warnings.length}</summary>{warnings.map((notice, index) => <p key={`${notice.code}-${index}`}>{notice.message}</p>)}</details> : null}
      {result ? <details className="oracle-provenance-details"><summary>Experiment provenance · seed {result.configuration_snapshot.reference.monte_carlo.seed} · {numberText(matchingInfo?.ms, 1)} ms reference {matchingInfo?.reused ? "(reused)" : ""}</summary><dl><dt>Reference</dt><dd>{result.reference_id}</dd><dt>Sample set</dt><dd>{result.sample_set_id}</dd><dt>Experiment</dt><dd>{result.experiment_id}</dd></dl><p className="oracle-caption">{result.configuration_snapshot.reference.option_side} · K {result.configuration_snapshot.reference.market.strike} · σ {result.configuration_snapshot.reference.market.volatility * 100}% · r {result.configuration_snapshot.reference.market.rate * 100}% · q {result.configuration_snapshot.reference.market.dividend * 100}% · {result.configuration_snapshot.reference.monte_carlo.paths.toLocaleString()} paths<br />Fit and inference exclude network, plotting, and evaluation. Reference node errors are correlated.</p></details> : null}
      <footer className="oracle-footer">Monte Carlo is a high-fidelity reference, not exact truth. {(result?.target.kind ?? config.target) === "implied_volatility" ? "Constant-volatility GBM has flat theoretical IV." : "Seeded experiments · Shared training data"}</footer>
    </main>
  </div>;
}
