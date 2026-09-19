import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import { DelphiNumber } from "./DelphiControls";
import { centralBounds, defaultReference, labels, METHODS, type Bounds, type Capabilities, type Config, type Target } from "./types";

interface Props { config: Config; capabilities: Capabilities | null; edit: (update: (previous: Config) => Config) => void; referenceStatus: string }
export function DelphiParameters({ config, capabilities, edit, referenceStatus }: Props) {
  const [presetNotice, setPresetNotice] = useState("");
  const id = useId();
  const { reference: r, settings } = config;
  const market = (key: keyof typeof r.market, value: number) => edit(old => ({ ...old, reference: { ...old.reference, market: { ...old.reference.market, [key]: value } } }));
  const domain = (key: keyof typeof r.domain, value: number) => edit(old => ({ ...old, reference: { ...old.reference, domain: { ...old.reference.domain, [key]: value } } }));
  const mc = (key: keyof typeof r.monte_carlo, value: number | boolean) => edit(old => ({ ...old, reference: { ...old.reference, monte_carlo: { ...old.reference.monte_carlo, [key]: value } } }));
  const preset = (target: Target) => capabilities?.defaults[target].domain ?? (target === "price" ? defaultReference.domain : { ...defaultReference.domain, spot_min: 80, spot_max: 120, tau_min: .25 });
  function selectTarget(target: Target, force = false) {
    const untouched = [preset("price"), preset("implied_volatility")].some(item => JSON.stringify(item) === JSON.stringify(r.domain));
    const nextDomain = untouched || force ? { ...preset(target) } : r.domain;
    setPresetNotice(untouched || force ? `${target === "price" ? "Price" : "IV"} preset: spot ${nextDomain.spot_min}–${nextDomain.spot_max}, maturity ${nextDomain.tau_min}–${nextDomain.tau_max} years.` : "Custom domain retained. IV requires positive maturity.");
    edit(old => ({ ...old, target, reference: { ...old.reference, domain: nextDomain }, training_bounds: centralBounds(nextDomain) }));
  }
  const budgets = capabilities?.budgets ?? [16, 32, 64, 128, 256].map(count => ({ count, shape: count === 128 ? [8, 16] : count === 256 ? [16, 16] : count === 64 ? [8, 8] : count === 32 ? [4, 8] : [4, 4] }));
  return <>
    <h2 className="delphi-rail-heading">Experiment setup</h2>
    <details open className="delphi-control-section" aria-labelledby={`${id}-surface`}>
      <summary id={`${id}-surface`}>Surface<ChevronDown size={15} /></summary>
      <div className="delphi-target" role="group" aria-label="Output target"><span>Output</span>{(["price", "implied_volatility"] as const).map(target => <button type="button" key={target} aria-pressed={config.target === target} onClick={() => selectTarget(target)}>{target === "price" ? "Price" : "Implied volatility"}</button>)}</div>
      <label className="delphi-select"><span>Option type</span><select value={r.option_side} onChange={event => edit(old => ({ ...old, reference: { ...old.reference, option_side: event.target.value as "call" | "put" } }))}><option value="call">European call</option><option value="put">European put</option></select></label>
      <DelphiNumber label="Strike K" value={r.market.strike} suffix="$" min={1} max={1000000} onChange={value => market("strike", value)} />
      <DelphiNumber label="Volatility σ" value={r.market.volatility * 100} suffix="%" min={1} max={200} onChange={value => market("volatility", value / 100)} />
      <DelphiNumber label="Risk-free rate r" value={r.market.rate * 100} suffix="%" min={-25} max={25} onChange={value => market("rate", value / 100)} />
      <DelphiNumber label="Dividend q" value={r.market.dividend * 100} suffix="%" min={-25} max={25} onChange={value => market("dividend", value / 100)} />
      <details className="delphi-disclosure"><summary>Surface domain</summary>
        <DelphiNumber label="Spot minimum" value={r.domain.spot_min} suffix="$" onChange={value => domain("spot_min", value)} />
        <DelphiNumber label="Spot maximum" value={r.domain.spot_max} suffix="$" onChange={value => domain("spot_max", value)} />
        <DelphiNumber label="Maturity minimum" value={r.domain.tau_min} suffix="yr" onChange={value => domain("tau_min", value)} />
        <DelphiNumber label="Maturity maximum" value={r.domain.tau_max} suffix="yr" onChange={value => domain("tau_max", value)} />
        <button className="delphi-text-button" onClick={() => selectTarget(config.target, true)}>Apply {config.target === "price" ? "price" : "IV"} domain preset</button>
      </details>
      <p className="delphi-caption">S {r.domain.spot_min}–{r.domain.spot_max} · τ {r.domain.tau_min}–{r.domain.tau_max} yr</p>
      <span className="sr-only" role="status">{presetNotice}</span>
    </details>
    <details open className="delphi-control-section" aria-labelledby={`${id}-reference`}>
      <summary id={`${id}-reference`}>Monte Carlo reference<ChevronDown size={15} /></summary>
      <DelphiNumber label="Paths" value={r.monte_carlo.paths} min={1000} max={100000} step={1000} onChange={value => mc("paths", value)} />
      <details className="delphi-disclosure"><summary>Grid · {r.domain.spot_nodes} × {r.domain.tau_nodes}</summary>
        <DelphiNumber label="Spot grid nodes" value={r.domain.spot_nodes} min={20} max={81} step={1} onChange={value => domain("spot_nodes", value)} />
        <DelphiNumber label="Maturity grid nodes" value={r.domain.tau_nodes} min={20} max={81} step={1} onChange={value => domain("tau_nodes", value)} />
      </details>
      <DelphiNumber label="Reference seed" value={r.monte_carlo.seed} min={0} max={2147483647} step={1} onChange={value => mc("seed", value)} />
      <p className="delphi-reference-status"><span className={referenceStatus === "Reused" || referenceStatus === "Ready" ? "ready" : ""} aria-hidden="true" />{referenceStatus}</p>
      <p className="delphi-caption">Paths simulate prices. Training samples are surface points given to each model.</p>
    </details>
    <details open className="delphi-control-section" aria-labelledby={`${id}-training`}>
      <summary id={`${id}-training`}>Training data<ChevronDown size={15} /></summary>
      {config.mode === "budget" ? <fieldset className="delphi-checks"><legend>Budgets to compare</legend>{budgets.map(item => <label key={item.count}><input type="checkbox" checked={config.budgets.includes(item.count)} onChange={event => edit(old => ({ ...old, budgets: event.target.checked ? [...old.budgets, item.count] : old.budgets.filter(n => n !== item.count) }))} />{item.count} samples</label>)}<p className="delphi-caption">Choose up to four. Uniform grids are not necessarily nested.</p></fieldset> : <label className="delphi-select"><span>Samples</span><select value={config.budget} onChange={event => edit(old => ({ ...old, budget: Number(event.target.value) }))}>{budgets.map(item => <option key={item.count} value={item.count}>{item.count} · {item.shape.join(" × ")}</option>)}</select></label>}
      <p className="delphi-caption">Uniform tensor grid · shared across models</p>
      <fieldset className="delphi-checks"><legend>Models to train</legend>{METHODS.map(method => <label key={method}><input type="checkbox" checked={config.methods.includes(method)} onChange={event => edit(old => ({ ...old, methods: METHODS.filter(item => item === method ? event.target.checked : old.methods.includes(item)) }))} />{labels[method]}</label>)}</fieldset>
      {config.mode === "extrapolation" ? <div className="delphi-training-bounds"><h4>Training region</h4>{([['spot_min', 'Training spot minimum', '$'], ['spot_max', 'Training spot maximum', '$'], ['tau_min', 'Training maturity minimum', 'yr'], ['tau_max', 'Training maturity maximum', 'yr']] as const).map(([key, label, suffix]) => <DelphiNumber key={key} label={label} suffix={suffix} value={config.training_bounds[key]} onChange={value => edit(old => ({ ...old, training_bounds: { ...old.training_bounds, [key as keyof Bounds]: value } }))} />)}<button className="delphi-text-button" onClick={() => edit(old => ({ ...old, training_bounds: centralBounds(old.reference.domain) }))}>Use central 70%</button><p className="delphi-caption">Bounds snap inward to reference nodes. Outside-region errors are reported separately.</p></div> : null}
    </details>
    <details className="delphi-control-section delphi-advanced"><summary>Advanced settings</summary>
      <h4>Reference</h4><label className="delphi-check"><input type="checkbox" checked={r.monte_carlo.antithetic} onChange={event => mc("antithetic", event.target.checked)} />Antithetic paths</label>
      <h4>Gaussian process</h4>
      <DelphiNumber label="Length scale" value={settings.gp.length_scale} onChange={value => edit(old => ({ ...old, settings: { ...old.settings, gp: { ...old.settings.gp, length_scale: value } } }))} />
      <DelphiNumber label="Noise floor" value={settings.gp.noise_floor} onChange={value => edit(old => ({ ...old, settings: { ...old.settings, gp: { ...old.settings.gp, noise_floor: value } } }))} />
      <h4>Both MLP models</h4><p className="delphi-caption">Two tanh layers. Same architecture, seed, and epoch budget.</p>
      {([['width', 'Hidden width'], ['epochs', 'Epochs'], ['learning_rate', 'Learning rate'], ['regularization', 'L2 regularization']] as const).map(([key, label]) => <DelphiNumber key={key} label={label} value={settings.mlp[key]} onChange={value => edit(old => ({ ...old, settings: { ...old.settings, mlp: { ...old.settings.mlp, [key]: value } } }))} />)}
      <DelphiNumber label="Training seed" value={config.training_seed} onChange={value => edit(old => ({ ...old, training_seed: value }))} />
    </details>
  </>;
}
