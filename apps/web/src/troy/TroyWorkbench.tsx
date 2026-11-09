import { useEffect, useState } from 'react';
import { ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import { defaultConfig } from './engine';
import { freshSeed } from './experimentSeed';
import type { Config, SimulationResult } from './types';
import { TroyParameters } from './TroyParameters';
import { attributionLabels, attributionMoney, dynamicsLabels, money, pricingLabels, quoteTiming } from './labels';
import { DynamicsCharts, TradingCharts } from './TroyCharts';
import { TroyComparison } from './TroyComparison';
import '../workbench.css';
import './troy.css';
import '../workbench-after-hours.css';

const tabs = [['making', 'Market Making'], ['dynamics', 'Market Dynamics'], ['comparison', 'Model Comparison']] as const;
type TroyTab = typeof tabs[number][0];
export default function TroyWorkbench() {
  const [config, setConfig] = useState<Config>(() => ({ ...defaultConfig, seed: freshSeed() }));
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [tab, setTab] = useState<TroyTab>('making');
  const updateConfig = (value: Config) => {
    setConfig(value);
    setBusy(true); setError('');
  };
  useEffect(() => {
    let active = true;
    let worker: Worker | undefined;
    const timer = window.setTimeout(() => {
      try {
        worker = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
        worker.onmessage = (event: MessageEvent<{ result?: SimulationResult; error?: string }>) => {
          if (!active) return;
          if (event.data.result) setResult(event.data.result);
          setError(event.data.error ?? ''); setBusy(false); worker?.terminate();
        };
        worker.onerror = () => { if (!active) return; setError('Simulation worker failed. Change parameters or reset to retry.'); setBusy(false); worker?.terminate(); };
        worker.postMessage(config);
      } catch { setError('Simulation could not start. Refresh the page to retry.'); setBusy(false); }
    }, 250);
    return () => { active = false; clearTimeout(timer); worker?.terminate(); };
  }, [config]);
  const last = result?.observations.at(-1);
  const shown = result?.config ?? config;
  return <div className="ithaca-workbench troy-workbench tool-workbench after-hours">
    <a className="skip-link" href="#troy-main">Skip to simulation</a>
    <header className="topbar troy-topbar">
      <a className="back-home" href="/#home" aria-label="Back to CapitalCanvas"><ArrowLeft size={20} /></a>
      <h1 className="wordmark">Troy</h1>
      <div className="topbar-actions">
        <button className="secondary-button" onClick={() => updateConfig({ ...defaultConfig, seed: freshSeed(config.seed) })}><RotateCcw size={14} /> Reset</button>
        <button className="solve-button" onClick={() => updateConfig({ ...config, seed: freshSeed(config.seed) })}><Sparkles size={16} />New market</button>
      </div>
    </header>
    <aside className="troy-parameters" aria-label="Simulation parameters"><TroyParameters config={config} onChange={updateConfig} /></aside>
    <main className="troy-main" id="troy-main" tabIndex={-1}>
      <div className="troy-experiment-heading"><span className={`troy-run-status ${busy ? 'working' : ''}`} role="status">{error ? 'Needs attention' : busy ? 'Simulating…' : `Seed ${shown.seed} · ${shown.steps} steps`}</span></div>
      <div className="troy-model-badges">
        <span>True Market: <strong>{dynamicsLabels[shown.dynamics]}</strong></span>
        <span>Maker Pricing Model: <strong>{pricingLabels[shown.pricing]}</strong></span>
        <span>Quote Timing: <strong>{quoteTiming(shown.quoteLatencySteps, Math.min(shown.horizon, shown.maturity) / shown.steps)}</strong></span>
      </div>
      <div className="troy-tabs" role="tablist" aria-label="Simulation views">
        {tabs.map(([id, label], index) => <button key={id} id={`troy-tab-${id}`} type="button" role="tab" aria-controls={`troy-panel-${id}`} aria-selected={tab === id} tabIndex={tab === id ? 0 : -1}
          onKeyDown={e => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
            e.preventDefault();
            const next = e.key === 'Home' ? 0 : e.key === 'End' ? tabs.length - 1 : (index + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            setTab(tabs[next][0]);
            document.getElementById(`troy-tab-${tabs[next][0]}`)?.focus();
          }}
          onClick={() => setTab(id)}>{label}</button>)}
      </div>
      {error && <p className="troy-error" role="alert">{error}</p>}
      <div role="tabpanel" id={`troy-panel-${tab}`} aria-labelledby={`troy-tab-${tab}`} aria-busy={busy} className={busy ? 'troy-output updating' : 'troy-output'}>
        {result && last ? <>
          {tab === 'making' ? <>
            <div className="troy-metrics troy-trading-metrics">
              {[
                ['Total P&L', money(last.totalPnl), 'independent reference', last.totalPnl < 0 ? 'negative' : 'positive'],
                ['Maker-marked P&L', money(last.modelPnl), 'own valuation', ''],
                ['Valuation Error', money(last.valuationError), 'maker minus reference wealth', ''],
                ['Current Inventory', String(last.inventory), 'option units', ''],
                ['Number of Fills', String(result.summary.totalFills), 'executions', ''],
                ['Avg. Execution Edge', money(result.summary.averageSpreadCaptured), 'per unit vs reference at fill', ''],
                ['Maximum Drawdown', money(result.summary.maxDrawdown), 'peak to trough', ''],
                ['Hedge Position', last.hedgePosition.toFixed(2), 'underlying units', ''],
                ['Financing P&L', money(last.financingPnl), 'interest less borrowing fees', ''],
              ].map(([label, value, note, tone]) => <div className={`troy-metric ${tone}`} key={label}><span>{label}</span><strong>{value}</strong><small>{note}</small></div>)}
            </div>
            <section className="troy-comparison" aria-labelledby="troy-pnl-breakdown-title">
              <div className="troy-chart-heading">
                <h2 id="troy-pnl-breakdown-title">P&L breakdown</h2>
              </div>
              <dl className="troy-pnl-breakdown">
                {attributionLabels.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{attributionMoney(last, key)}</dd></div>)}
              </dl>
            </section>
            <TradingCharts result={result} />
          </> : tab === 'dynamics' ? <DynamicsCharts result={result} /> : null}
          <div hidden={tab !== 'comparison'}><TroyComparison key={JSON.stringify(config)} config={config} /></div>
          <details className="troy-methods"><summary>How this experiment works</summary>
            <p>The maker uses its own model to quote and hedge. Informed customers compare quotes with the market reference, while other customers respond to the spread. P&amp;L values open positions against the reference and includes financing and fees. At expiry, options settle and hedges close.</p>
          </details>
        </> : !error && <div className="troy-empty">Generating market paths, quotes, and inventory…</div>}
      </div>
    </main>
  </div>;
}
