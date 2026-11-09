import { ChevronDown, Info } from 'lucide-react';
import { useId, type ReactNode } from 'react';
import { NumberField } from '../components/NumberField';
import type { Config, Dynamics, Pricing } from './types';
import { dynamicsLabels, pricingLabels, quoteTiming } from './labels';

function Hint({ text, label }: { text: string; label: string }) {
  const id = useId();
  return <span className="troy-hint"><button type="button" aria-label={`About ${label}`} aria-describedby={id}><Info size={12} /></button><span role="tooltip" id={id}>{text}</span></span>;
}
function Group({ title, children }: { title: string; children: ReactNode }) {
  return <details className="control-section" open><summary>{title}<ChevronDown size={15} /></summary>{children}</details>;
}
type NumberKey = { [K in keyof Config]: Config[K] extends number ? K : never }[keyof Config];
export function TroyParameters({ config, onChange }: { config: Config; onChange: (config: Config) => void }) {
  const set = <K extends keyof Config>(key: K, value: Config[K]) => onChange({ ...config, [key]: value });
  const field = (key: NumberKey, label: string, min: number, max: number, step: number, suffix?: string, help?: string, factor = 1) => <div className="troy-field" key={key}>
    <NumberField allowDraft label={label} value={config[key] * factor} min={min} max={max} step={step} suffix={suffix}
      onChange={value => { if (Number.isFinite(value)) set(key, Math.min(max, Math.max(min, value)) / factor); }} />
    {help && <Hint text={help} label={label} />}
  </div>;
  const percent = (key: NumberKey, label: string, min = 0, max = 200, help?: string) => field(key, label, min, max, .5, '%', help, 100);
  const heston = (pricing: boolean) => <>
    {(!pricing || config.hestonVarianceSource === 'fixed') && field(pricing ? 'pricingInitialVariance' : 'initialVariance', 'Initial variance v₀', .0001, 4, .01, undefined, 'Starting instantaneous variance. A variance of 0.04 corresponds to 20% volatility.')}
    {field(pricing ? 'pricingMeanReversion' : 'meanReversion', 'Mean reversion κ', 0, 20, .1, undefined, 'Speed at which variance moves toward its long-run level, per year.')}
    {field(pricing ? 'pricingLongRunVariance' : 'longRunVariance', 'Long-run variance θ', .0001, 4, .01, undefined, 'Long-run target variance. This is variance, not volatility.')}
    {field(pricing ? 'pricingVolOfVol' : 'volOfVol', 'Vol of volatility ξ', 0, 3, .05, undefined, 'Controls the randomness of variance. Larger values create more variable volatility.')}
    {field(pricing ? 'pricingCorrelation' : 'correlation', 'Correlation ρ', -1, 1, .05, undefined, 'Correlation between spot and variance shocks. Negative values create a leverage effect.')}
  </>;
  return <div className="problem-content">
    <div className="troy-rail-title"><h2>Experiment</h2></div>
    <Group title="01 · Contract">
      <p className="troy-caption">European vanilla · one-unit contracts</p>
      <label className="troy-select">Option Type<select value={config.optionType} onChange={e => set('optionType', e.target.value as Config['optionType'])}><option value="call">Call</option><option value="put">Put</option></select></label>
      {field('spot', 'Initial spot S₀', 1, 10000, 1, '$')}
      {field('strike', 'Strike K', 1, 10000, 1, '$')}
      {field('maturity', 'Maturity T', .01, 5, .05, 'yr')}
      {percent('rate', 'Risk-free rate r', -10, 30)}
      {percent('dividendYield', 'Dividend yield q', 0, 30)}
    </Group>
    <Group title="02 · True Market Dynamics">
      <p className="troy-caption">Generates the simulated underlying.</p>
      <label className="troy-select">Dynamics model<select value={config.dynamics} onChange={e => set('dynamics', e.target.value as Dynamics)}>{Object.entries(dynamicsLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
      {percent('drift', 'Drift μ', -100, 100)}
      {config.dynamics === 'heston' ? heston(false) : percent('volatility', config.dynamics === 'merton' ? 'Diffusion volatility σ' : 'Volatility σ')}
      {config.dynamics === 'merton' && <>
        {field('jumpIntensity', 'Jump intensity λ', 0, 50, .1, '/yr', 'Expected jumps per year. Jump times follow a Poisson process.')}
        {field('jumpMean', 'Mean log jump', -1, 1, .01)}
        {percent('jumpVolatility', 'Jump volatility', 0, 100)}
        <h3 className="troy-subheading">Reference risk-neutral assumptions</h3>
        {field('referenceJumpIntensityMultiplier', 'Q jump intensity multiplier', 0, 4, .1, undefined, 'Risk-neutral intensity equals physical jump intensity times this factor. One retains the physical intensity.')}
        {field('referenceJumpMeanShift', 'Q log-jump mean shift', -.5, .5, .01, undefined, 'Added to the physical mean log jump for reference valuation. Zero retains the physical jump-size law.')}
      </>}
      {config.dynamics === 'heston' && field('varianceRiskPremium', 'Variance risk premium', 0, 10, .1, undefined, 'Reference κQ = κ + premium and κQθQ = κθ. Zero retains the physical variance law; spot drift becomes r − q.')}
      <p className="troy-equation">{config.dynamics === 'gbm' ? 'dS = μS dt + σS dW' : config.dynamics === 'heston' ? 'dS = μS dt + √v S dWₛ\ndv = κ(θ − v) dt + ξ√v dWᵥ' : 'dS/S = (μ − λE[J−1]) dt + σ dW + (J−1) dN'}</p>
    </Group>
    <Group title="03 · Market Maker">
      <h3 className="troy-subheading">Pricing</h3>
      <label className="troy-select">Pricing model<select value={config.pricing} onChange={e => set('pricing', e.target.value as Pricing)}>{Object.entries(pricingLabels).map(([key, label]) => <option key={key} value={key}>{label}{key === 'crr' ? ' Binomial' : ''}</option>)}</select></label>
      {config.pricing === 'heston' && <label className="troy-select">Variance access<select value={config.hestonVarianceSource} onChange={e => set('hestonVarianceSource', e.target.value as Config['hestonVarianceSource'])}><option value="observed">Current variance · full information</option><option value="fixed">Fixed variance assumption</option></select></label>}
      {config.pricing === 'heston' ? heston(true) : percent('pricingVolatility', 'Assumed volatility', .1, 200, 'Volatility used by the maker, independent of true market volatility.')}
      {config.pricing === 'merton' && <>
        {field('pricingJumpIntensity', 'Assumed jump intensity', 0, 100, .1, '/yr')}
        {field('pricingJumpMean', 'Assumed mean log jump', -1.5, 1.5, .01)}
        {percent('pricingJumpVolatility', 'Assumed jump volatility', 0, 100)}
      </>}
      {config.pricing === 'crr' && field('treeSteps', 'Binomial steps', 10, 200, 10)}
      {config.pricing === 'mc' && field('pricingPaths', 'Pricing paths', 64, 2048, 64)}
      {config.pricing === 'heston' && <p className="troy-caption">Deterministic Heston Fourier pricing. Current variance access reveals the simulated state; fixed access retains the configured variance assumption.</p>}
      <h3 className="troy-subheading divided">Quoting / Risk</h3>
      {field('quoteLatencySteps', 'Quote latency', 0, 100, 1, 'steps', 'Zero refreshes quotes before orders arrive. One lets orders trade against the previous step’s quotes. Larger values delay each update by that many market steps.')}
      <p className="troy-caption">{quoteTiming(config.quoteLatencySteps, Math.min(config.horizon, config.maturity) / config.steps)}{config.quoteLatencySteps > 0 ? ' of simulated delay' : ''}</p>
      {field('halfSpread', 'Base spread', .01, 20, .05, '$', 'Full bid–ask width before the nonnegative bid floor. Wider quotes receive fewer fills.', 2)}
      {field('quoteSize', 'Quote size', 1, 100, 1, undefined, 'Option units filled per arrival, clipped at the inventory limit.')}
      {field('inventorySkew', 'Inventory skew', 0, 2, .005, undefined, 'Quote shift in dollars per option held. Long inventory shifts both quotes downward.')}
      {field('inventoryLimit', 'Maximum inventory', 1, 1000, 1)}
      <label className="toggle-field">Hedging enabled<input type="checkbox" checked={config.hedgeEnabled} onChange={e => set('hedgeEnabled', e.target.checked)} /></label>
      {config.hedgeEnabled && <>{field('hedgeEvery', 'Hedge frequency', 1, 100, 1, 'steps')}{field('hedgeCostBps', 'Hedge transaction cost', 0, 100, .5, 'bps')}</>}
      {field('optionCost', 'Transaction cost', 0, 10, .005, '$', 'Cost per option unit traded. Hedge costs are charged separately on underlying notional.')}
      {percent('borrowingSpread', 'Cash borrowing spread', 0, 30, 'Positive cash earns r; negative cash pays r plus this spread.')}
      {field('stockBorrowBps', 'Stock borrow fee', 0, 1000, 5, 'bps/yr', 'Annual fee on short underlying notional, in addition to dividends owed.')}
    </Group>
    <Group title="04 · Simulation">
      {field('horizon', 'Simulation horizon', .01, 5, .05, 'yr', 'Effective horizon is capped at contract maturity.')}
      {field('steps', 'Time steps', 20, 1000, 20)}
      {field('seed', 'Random seed', 0, 2147483647, 1)}
      <p className="troy-caption">Model changes retain this seed. New market draws a fresh experiment.</p>
      {field('samplePaths', 'Sample paths', 2, 50, 1)}
      {field('fillIntensity', 'Order arrival intensity', 0, 2000, 20, '/yr', 'Base total customer arrivals per year, before quote competitiveness reduces fills.')}
      {percent('buyFlowBalance', 'Buy flow balance', 0, 100, 'Share of customer buy orders, which hit the maker’s ask. 50% gives balanced flow.')}
      {percent('informedFlowShare', 'Informed flow share', 0, 100, 'Informed customers compare executable quotes with the current independent market reference. Uninformed customers respond only to the posted spread.')}
      {field('fillSensitivity', 'Quote sensitivity', .01, 20, .1, undefined, 'Exponential decline in arrivals per dollar away from the reference. Larger values penalize less competitive quotes more.')}
    </Group>
  </div>;
}
