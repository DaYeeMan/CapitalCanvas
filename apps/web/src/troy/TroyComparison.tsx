import { useEffect, useRef, useState } from 'react';
import { NumberField } from '../components/NumberField';
import { attributionLabels, attributionMoney, money, pricingLabels, quoteTiming } from './labels';
import type { ComparisonRequest, ComparisonResult, Config } from './types';

export function TroyComparison({ config }: { config: Config }) {
  const worker = useRef<Worker | null>(null);
  const [runs, setRuns] = useState(20);
  const [compareTimings, setCompareTimings] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState('');
  const [horizon, setHorizon] = useState<'interim' | 'settled'>('settled');
  useEffect(() => () => { worker.current?.terminate(); worker.current = null; }, []);
  const cancel = () => { worker.current?.terminate(); worker.current = null; setBusy(false); setProgress('Comparison cancelled.'); };
  const run = () => {
    setError(''); setResult(null); setBusy(true); setProgress('Starting comparison…');
    try {
      const current = new Worker(new URL('./simulation.worker.ts', import.meta.url), { type: 'module' });
      worker.current = current;
      const finish = () => { current.terminate(); worker.current = null; setBusy(false); };
      current.onmessage = (event: MessageEvent<{ comparison?: ComparisonResult; progress?: { completed: number; total: number }; error?: string }>) => {
        if (worker.current !== current) return;
        if (event.data.progress) { setProgress(`${event.data.progress.completed} / ${event.data.progress.total} runs complete`); return; }
        if (event.data.comparison) { setResult(event.data.comparison); setProgress('Comparison complete.'); }
        if (event.data.error) { setError(event.data.error); setProgress(''); }
        finish();
      };
      current.onerror = () => {
        if (worker.current !== current) return;
        setError('Comparison worker failed. Reduce runs or time steps and retry.');
        setProgress(''); finish();
      };
      current.postMessage({ kind: 'comparison', config, runs, compareTimings } satisfies ComparisonRequest);
    } catch {
      worker.current?.terminate(); worker.current = null; setBusy(false); setProgress('');
      setError('Comparison could not start. Refresh the page to retry.');
    }
  };
  return <section className="troy-comparison" aria-label="Model comparison">
    <div className="troy-chart-heading"><h2>Compare maker models</h2></div>
    <div className="troy-comparison-controls">
      <NumberField label="Comparison seeds" value={runs} min={2} max={200} step={1} onChange={value => { if (Number.isFinite(value)) setRuns(Math.min(200, Math.max(2, Math.round(value)))); }} />
      <label className="troy-compare-timing"><input type="checkbox" checked={compareTimings} disabled={busy} onChange={e => setCompareTimings(e.target.checked)} /> Compare both quote timings</label>
      <button className="secondary-button" disabled={busy} onClick={run}>Run comparison</button>
      {busy && <button className="secondary-button" onClick={cancel}>Cancel comparison</button>}
      <span role="status" aria-live="polite">{progress}</span>
    </div>
    {compareTimings && <p className="troy-caption">Runs refreshed quotes and a {config.quoteLatencySteps || 1}-step delay on the same markets and order draws.</p>}
    {error && <p className="troy-error" role="alert">{error}</p>}
    {result && <>
      <label className="troy-select troy-comparison-horizon">Measurement horizon<select value={horizon} onChange={e => setHorizon(e.target.value as typeof horizon)}><option value="interim">Interim reference-marked</option><option value="settled">Expiry-settled</option></select></label>
      <p className="troy-caption">{result.seeds.length} seeds starting at {result.config.seed}, stride 7919 · interim at {result.interimTime.toFixed(4)} yr · expiry at {result.config.maturity.toFixed(4)} yr · {result.settlementSteps} steps through expiry. Interim uses the last grid point at or before the requested horizon. Tail estimates are coarse with small batches.</p>
      <div className="troy-comparison-table" role="region" aria-label="Comparison results" tabIndex={0}>
        <table><caption>{horizon === 'settled' ? 'Expiry-settled P&L' : 'Interim reference P&L'} · dollars per one-unit contract</caption>
          <thead><tr><th scope="col">Maker</th><th scope="col">Quote timing</th><th scope="col">Mean P&L</th><th scope="col">Std. dev.</th><th scope="col">Loss chance</th><th scope="col">5th percentile</th><th scope="col">Worst 5% mean</th><th scope="col">Mean max drawdown*</th><th scope="col">Pricing RMSE*</th><th scope="col">Hedge RMSE*</th></tr></thead>
          <tbody>{result.rows.map(row => {
            const values = row[horizon];
            return <tr key={`${row.pricing}-${row.quoteLatencySteps}`}>
              <th scope="row">{pricingLabels[row.pricing]}</th>
              <td>{quoteTiming(row.quoteLatencySteps, result.config.maturity / result.settlementSteps)}</td>
              <td>{money(values.mean)}</td>
              <td>{money(values.standardDeviation)}</td>
              <td>{(values.lossProbability * 100).toFixed(1)}%</td>
              <td>{money(values.p05)}</td>
              <td>{money(values.expectedShortfall)}</td>
              <td>{money(row.meanDrawdown)}</td>
              <td>{money(row.pricingRmse)}</td>
              <td>{money(row.hedgeRmse)}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>
      <p className="troy-caption">* Diagnostics cover the full path through expiry. Pricing RMSE compares maker and reference prices. Hedge RMSE measures the interval residual of held options and stock after risk-free carry and dividends.</p>
      <details className="troy-methods">
        <summary>Mean P&L breakdown</summary>
        <div className="troy-comparison-table" role="region" aria-label="Mean P&L breakdown" tabIndex={0}>
          <table>
            <caption>{horizon === 'settled' ? 'Expiry' : 'Interim'} mean P&L breakdown</caption>
            <thead><tr><th scope="col">Maker</th><th scope="col">Quote timing</th>{attributionLabels.map(([key, label]) => <th key={key} scope="col">{label}</th>)}<th scope="col">Mean P&L</th></tr></thead>
            <tbody>{result.rows.map(row => <tr key={`${row.pricing}-${row.quoteLatencySteps}`}>
              <th scope="row">{pricingLabels[row.pricing]}</th>
              <td>{quoteTiming(row.quoteLatencySteps, result.config.maturity / result.settlementSteps)}</td>
              {attributionLabels.map(([key]) => <td key={key}>{attributionMoney(row.attribution[horizon], key)}</td>)}
              <td>{money(row[horizon].mean)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </details>
    </>}
  </section>;
}
