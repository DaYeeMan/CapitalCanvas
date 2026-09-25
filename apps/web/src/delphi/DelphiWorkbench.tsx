import { useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw, Play, SlidersHorizontal, X, Square } from "lucide-react";
import "katex/dist/katex.min.css";
import { DelphiParameters } from "./DelphiParameters";
import { DelphiSurface } from "./DelphiSurface";
import { DelphiComparison } from "./DelphiComparison";
import { DelphiBudget } from "./DelphiBudget";
import { DelphiTabs } from "./DelphiControls";
import { useDelphiExperiment } from "./useDelphiExperiment";
import { labels, numberText, referenceKey, type Method, type Mode, type Region, type View } from "./types";
import "./delphi.css";
import { ToolBackground } from "../ToolBackground";

export default function DelphiWorkbench() {
  const experiment = useDelphiExperiment();
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
  const parameters = <DelphiParameters config={config} capabilities={experiment.capabilities} edit={experiment.edit} referenceStatus={referenceStatus} />;
  const showingBudget = config.mode === "budget" && !inspectBudget;
  const warnings = [...(result?.warnings ?? []), ...(result?.methods.find(item => item.method === activeMethod)?.warnings ?? [])];
  return <div className="delphi-workbench tool-workbench">
    <ToolBackground tool="delphi" />
    <a className="skip-link" href="#delphi-main">Skip to experiment</a>
    <header className="delphi-topbar"><a className="delphi-back" href="/#home" aria-label="Back to CapitalCanvas" title="Back to CapitalCanvas"><ArrowLeft size={22} aria-hidden="true" /></a><h1>Delphi</h1><div className="delphi-actions"><button className="delphi-mobile-controls" ref={controlsButton} onClick={() => sheet.current?.showModal()}><SlidersHorizontal size={16} />Setup</button><button onClick={() => { experiment.reset(); setSlice(false); setInspectBudget(false); setView("prediction"); setMethod("cubic_spline"); setRegion("full"); }}><RotateCcw size={15} />Reset</button>{busy ? <button className="delphi-primary" onClick={experiment.cancel}><Square size={13} />Cancel</button> : <button className="delphi-primary" disabled={!experiment.capabilities} onClick={() => { setInspectBudget(false); void experiment.run(); }}><Play size={14} fill="currentColor" />Run experiment</button>}</div></header>
    <aside className="delphi-rail" aria-label="Experiment configuration">{parameters}</aside>
    <dialog className="delphi-sheet" aria-label="Experiment setup" ref={sheet} onClose={() => controlsButton.current?.focus()}><div className="delphi-sheet-top"><span>Experiment controls</span><button aria-label="Close experiment controls" onClick={closeSheet}><X size={20} /></button></div>{parameters}<button className="delphi-primary delphi-sheet-done" onClick={closeSheet}>Apply and close</button></dialog>
    <main id="delphi-main" className="delphi-main" tabIndex={-1}>
      <DelphiTabs label="Experiment type" value={config.mode} panelId="delphi-experiment-panel" onChange={changeMode} options={[{ value: "comparison", label: "Model comparison" }, { value: "budget", label: "Data budget" }, { value: "extrapolation", label: "Extrapolation" }]} />
      <div className="delphi-status-line"><span role="status" aria-live="polite">{experiment.status}</span>{experiment.stale ? <strong>Previous experiment — inputs changed</strong> : null}</div>
      {experiment.serviceError ? <div className="delphi-alert" role="alert">{experiment.serviceError} <button onClick={experiment.retryService}>Retry connection</button></div> : null}
      {experiment.errors.length ? <div ref={errorSummary} className="delphi-alert" role="alert" tabIndex={-1}><strong>Experiment needs attention</strong><ul>{experiment.errors.map(error => <li key={error}>{error}</li>)}</ul></div> : null}
      <div id="delphi-experiment-panel" role="tabpanel" aria-label={config.mode === "comparison" ? "Model comparison" : config.mode === "budget" ? "Data budget" : "Extrapolation"}>
        {showingBudget ? <DelphiBudget points={experiment.points} onSelect={next => { experiment.selectResult(next); setInspectBudget(true); }} /> : <>
          <div className="delphi-title-line"><h2>{(result?.target.kind ?? config.target) === "price" ? "Price surface" : "Implied-volatility surface"}</h2>{result ? <span className="delphi-provenance">Shared reference · Shared {result.samples.count} samples</span> : null}{inspectBudget ? <button onClick={() => setInspectBudget(false)}>Back to budget curves</button> : null}</div>
          <div className="delphi-viewbar"><DelphiTabs label="Surface view" value={activeView} panelId="delphi-surface-plot" compact onChange={selectView} options={[{ value: "reference", label: "Reference" }, { value: "prediction", label: "Prediction" }, { value: "error", label: "Absolute error" }, { value: "uncertainty", label: "GP uncertainty", disabled: !hasGP, reason: "Run a successful Gaussian process fit to inspect its uncertainty." }]} />{result ? <label className="delphi-model-select">Model<select value={activeMethod} onChange={event => selectMethod(event.target.value as Method)}>{result.methods.map(item => <option key={item.method} value={item.method}>{labels[item.method]}{item.status === "failed" ? " · failed" : ""}</option>)}</select></label> : null}</div>
          {result ? <><DelphiSurface result={result} method={activeMethod} view={activeView} slice={slice} onSlice={setSlice} /><DelphiComparison result={result} active={activeMethod} onSelect={selectMethod} region={region} onRegion={setRegion} /></> : <div className="delphi-empty delphi-empty-surface" id="delphi-surface-plot" role="tabpanel" aria-label="Surface awaiting experiment"><div><h3>Start with the same data.</h3><p>Generate a Monte Carlo reference, then compare four ways to learn its surface.</p><p className="delphi-caption">Choose your inputs and press Run experiment.<br />GP uncertainty becomes available after a successful GP fit.</p></div></div>}
        </>}
      </div>
      {warnings.length ? <details className="delphi-diagnostics"><summary>Assumptions and diagnostics · {warnings.length}</summary>{warnings.map((notice, index) => <p key={`${notice.code}-${index}`}>{notice.message}</p>)}</details> : null}
      {result ? <details className="delphi-provenance-details"><summary>Experiment provenance · seed {result.configuration_snapshot.reference.monte_carlo.seed} · {numberText(matchingInfo?.ms, 1)} ms reference {matchingInfo?.reused ? "(reused)" : ""}</summary><dl><dt>Reference</dt><dd>{result.reference_id}</dd><dt>Sample set</dt><dd>{result.sample_set_id}</dd><dt>Experiment</dt><dd>{result.experiment_id}</dd></dl><p className="delphi-caption">{result.configuration_snapshot.reference.option_side} · K {result.configuration_snapshot.reference.market.strike} · σ {result.configuration_snapshot.reference.market.volatility * 100}% · r {result.configuration_snapshot.reference.market.rate * 100}% · q {result.configuration_snapshot.reference.market.dividend * 100}% · {result.configuration_snapshot.reference.monte_carlo.paths.toLocaleString()} paths<br />Fit and inference exclude network, plotting, and evaluation. Reference node errors are correlated.</p></details> : null}
      <footer className="delphi-footer">Monte Carlo is a high-fidelity reference, not exact truth. {(result?.target.kind ?? config.target) === "implied_volatility" ? "Constant-volatility GBM has flat theoretical IV." : "Seeded experiments · Shared training data"}</footer>
    </main>
  </div>;
}
