import { useEffect, useMemo, useState } from "react";
import type { Data, Layout } from "plotly.js";
import { ScientificPlot } from "../components/ChartPanel";
import { DelphiMethodDetails } from "./DelphiMethodDetails";
import { colors, labels, numberText, type ExperimentResult, type Method, type View } from "./types";

const surfaceColors: [number, string][] = [[0, "#253a96"], [.3, "#1075b3"], [.55, "#16c6cb"], [.8, "#93d773"], [1, "#ffbf36"]];
const errorColors: [number, string][] = [[0, "#102b47"], [.35, "#227da0"], [.7, "#e9bd53"], [1, "#ff7c67"]];
const chartBase: Partial<Layout> = { paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#a8b4bd", size: 12 }, margin: { l: 10, r: 15, t: 5, b: 15 } };

export function DelphiSurface({ result, method, view, slice, onSlice }: { result: ExperimentResult; method: Method; view: View; slice: boolean; onSlice: (slice: boolean) => void }) {
  const [overlay, setOverlay] = useState(true), [sliceIndex, setSliceIndex] = useState(25), [band, setBand] = useState(false);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 900px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const selected = result.methods.find(item => item.method === method);
  const isIV = result.target.kind === "implied_volatility", factor = isIV ? 100 : 1;
  const field = view === "reference" ? result.target.values : view === "error" ? selected?.evaluation?.absolute_errors : view === "uncertainty" ? selected?.predictive_stddev : selected?.predictions;
  const unit = isIV ? (view === "reference" || view === "prediction" ? "IV (%)" : "Volatility points") : "Option price ($)";
  const zLabel = view === "error" ? `Absolute error (${isIV ? "vol pts" : "$"})` : view === "uncertainty" ? `GP standard deviation (${isIV ? "vol pts" : "$"})` : unit;
  const title = view === "reference" ? "Monte Carlo reference" : view === "error" ? "Absolute error" : view === "uncertainty" ? "GP predictive standard deviation" : labels[method];
  const row = Math.min(sliceIndex, result.axes.times_to_maturity.length - 1);
  const tau = result.axes.times_to_maturity[row];
  const commonScale = useMemo(() => {
    if (view === "error") return [0, Math.max(1e-10, ...result.methods.map(item => (item.evaluation?.full.max_abs_error ?? 0) * factor))];
    if (view === "uncertainty") return [0, Math.max(1e-10, ...(field?.flat().filter((value): value is number => value !== null).map(value => value * factor) ?? [0]))];
    const values = [result.target.values, ...result.methods.flatMap(item => item.predictions ? [item.predictions] : [])].flat(2).filter((value): value is number => value !== null).map(value => value * factor);
    return [Math.min(...values), Math.max(...values)];
  }, [result, view, factor, field]);
  const data = useMemo<Data[]>(() => {
    if (!field) return [];
    const traces: Data[] = [{ type: "surface", x: result.axes.spots, y: result.axes.times_to_maturity, z: field.map(values => values.map(value => value === null ? null : value * factor)), cmin: commonScale[0], cmax: commonScale[1], colorscale: view === "error" || view === "uncertainty" ? errorColors : surfaceColors, showscale: true, colorbar: { title: { text: zLabel, side: "right" }, thickness: 12, len: .78, tickfont: { size: 10 } }, hovertemplate: `Spot %{x:.2f}<br>Maturity %{y:.3f} yr<br>${zLabel}: %{z:.5g}<extra>${title}</extra>`, contours: { x: { show: true, color: "#ffffff28", width: 1 }, y: { show: true, color: "#ffffff28", width: 1 } } } as Data];
    if (overlay) traces.push({ type: "scatter3d", mode: "markers", name: "Training points", x: result.samples.coordinates.map(point => point[0]), y: result.samples.coordinates.map(point => point[1]), z: result.samples.flat_indices.map((index, sample) => {
      if (view === "reference" || view === "prediction") return result.samples.values[sample] * factor;
      const value = field[Math.floor(index / result.axes.spots.length)][index % result.axes.spots.length];
      return value === null ? null : value * factor;
    }), customdata: result.samples.values.map(value => value * factor), marker: { color: "#f2f5f5", size: 2.5, line: { color: "#03101d", width: .5 } }, hovertemplate: "Training point<br>Spot %{x:.2f}<br>Maturity %{y:.3f} yr<br>Reference target: %{customdata:.5g}<extra></extra>" } as Data);
    return traces;
  }, [field, result, factor, commonScale, view, zLabel, title, overlay]);
  const layout = useMemo<Partial<Layout>>(() => {
    const axis = { gridcolor: "#203545", zerolinecolor: "#334452", showbackground: false, tickfont: { size: 10 } };
    return { ...chartBase, showlegend: false, uirevision: JSON.stringify([result.axes, compact]), scene: {
      uirevision: JSON.stringify([result.axes, compact]), camera: { eye: compact ? { x: -1.9, y: -1.9, z: 1.2 } : { x: -1.4, y: -1.45, z: .85 } }, aspectmode: "manual", aspectratio: { x: 1.3, y: 1, z: .85 },
      xaxis: { ...axis, title: { text: "Spot S ($)", font: { size: 12 } }, range: [result.axes.spots[0], result.axes.spots.at(-1)!] },
      yaxis: { ...axis, title: { text: "Maturity (yr)", font: { size: 12 } }, range: [result.axes.times_to_maturity[0], result.axes.times_to_maturity.at(-1)!] },
      zaxis: { ...axis, title: { text: zLabel, font: { size: 11 } }, range: commonScale },
    } };
  }, [result.axes, zLabel, commonScale, compact]);
  const sliceData = useMemo<Data[]>(() => {
    const gp = result.methods.find(item => item.method === "gaussian_process");
    const traces: Data[] = [];
    if (band && gp?.predictions && gp.predictive_stddev) {
      const mean = gp.predictions[row], sd = gp.predictive_stddev[row];
      traces.push({ type: "scatter", x: result.axes.spots, y: mean.map((value, index) => value == null || sd[index] == null ? null : (value - 1.96 * sd[index]!) * factor), mode: "lines", line: { width: 0 }, showlegend: false, hoverinfo: "skip" } as Data);
      traces.push({ type: "scatter", name: "GP mean ± 1.96 SD", x: result.axes.spots, y: mean.map((value, index) => value == null || sd[index] == null ? null : (value + 1.96 * sd[index]!) * factor), mode: "lines", line: { width: 0 }, fill: "tonexty", fillcolor: "rgba(198,163,239,.15)", hoverinfo: "skip" } as Data);
    }
    traces.push({ type: "scatter", name: "MC reference", mode: "lines", x: result.axes.spots, y: result.target.values[row].map(value => value == null ? null : value * factor), line: { color: "#f2f5f5", width: 3 } });
    result.methods.filter(item => item.status === "complete").forEach((model, index) => traces.push({ type: "scatter", name: labels[model.method], mode: "lines", x: result.axes.spots, y: model.predictions![row].map(value => value == null ? null : value * factor), line: { color: colors[model.method], width: 2, dash: ["solid", "dash", "dot", "dashdot"][index] } } as Data));
    return traces;
  }, [result, row, factor, band]);
  const sliceLayout = useMemo<Partial<Layout>>(() => ({ ...chartBase, margin: { l: 65, r: 20, t: 35, b: 55 }, legend: { orientation: "h", y: 1.17 }, xaxis: { title: { text: "Spot S ($)" }, gridcolor: "#203545" }, yaxis: { title: { text: isIV ? "IV (%)" : "Option price ($)" }, gridcolor: "#203545" }, uirevision: JSON.stringify(result.axes), shapes: result.configuration_snapshot.sampling.training_bounds ? [{ type: "rect", xref: "x", yref: "paper", x0: result.samples.bounds.spot_min, x1: result.samples.bounds.spot_max, y0: 0, y1: 1, fillcolor: "rgba(36,213,231,.06)", line: { color: "#24d5e7", width: 1, dash: "dot" }, layer: "below" }] : [] }), [result, isIV]);
  const b = result.samples.bounds, domain = result.configuration_snapshot.reference.domain;
  const invalid = result.target.valid_mask.flat().filter(value => !value).length;
  const maxSE = Math.max(0, ...result.target.standard_errors.flat().filter((value): value is number => value !== null)) * factor;
  return <>
    <section className="delphi-surface-panel" aria-label={title}>
      <div className="delphi-visualization">
        <div className="delphi-plot" id="delphi-surface-plot" role="tabpanel" aria-label={slice ? "Surface slice" : title}>
          {slice ? <ScientificPlot data={sliceData} layout={sliceLayout} label={`Price or IV slice at ${tau} years; reference and selected surrogate predictions`} /> : field ? <ScientificPlot preserveCamera data={data} layout={layout} label={`${title}, spot versus maturity. ${result.samples.count} training samples; ${invalid} masked reference nodes.`} /> : <div className="delphi-empty">This model has no completed surface. Select a completed method or rerun the experiment.</div>}
        </div>
        <div className="delphi-plot-controls"><label className="delphi-check"><input type="checkbox" checked={overlay} disabled={slice} onChange={event => setOverlay(event.target.checked)} />Training points</label><button aria-pressed={slice} onClick={() => onSlice(!slice)}>{slice ? "3D surface" : "2D slice"}</button></div>
        {slice ? <div className="delphi-slice-controls"><label>Slice maturity: {numberText(tau, 3)} yr<input aria-label="Slice maturity" type="range" min={0} max={result.axes.times_to_maturity.length - 1} value={row} onChange={event => setSliceIndex(Number(event.target.value))} /></label>{result.methods.some(item => item.predictive_stddev) ? <label className="delphi-check"><input type="checkbox" checked={band} onChange={event => setBand(event.target.checked)} />GP mean ± 1.96 SD (model uncertainty)</label> : null}<details className="delphi-disclosure"><summary>Slice values · accessible table</summary><div className="delphi-table-scroll" tabIndex={0}><table><thead><tr><th>Spot</th><th>MC reference</th>{result.methods.map(model => <th key={model.method}>{labels[model.method]}</th>)}</tr></thead><tbody>{result.axes.spots.map((spot, column) => <tr key={spot}><td>{numberText(spot, 2)}</td><td>{numberText(result.target.values[row][column] == null ? null : result.target.values[row][column]! * factor)}</td>{result.methods.map(model => <td key={model.method}>{numberText(model.predictions?.[row][column] == null ? null : model.predictions[row][column]! * factor)}</td>)}</tr>)}</tbody></table></div></details></div> : null}
      </div><DelphiMethodDetails result={result} method={method} />
    </section>
    {result.configuration_snapshot.sampling.training_bounds ? <div className="delphi-domain-summary"><svg viewBox="0 0 260 100" role="img" aria-label="Training rectangle inside reference domain; shaded rectangle is interpolation region"><rect x="20" y="8" width="220" height="66" fill="#061725" stroke="#334452" /><rect x={20 + (b.spot_min - domain.spot_min) / (domain.spot_max - domain.spot_min) * 220} y={8 + (domain.tau_max - b.tau_max) / (domain.tau_max - domain.tau_min) * 66} width={(b.spot_max - b.spot_min) / (domain.spot_max - domain.spot_min) * 220} height={(b.tau_max - b.tau_min) / (domain.tau_max - domain.tau_min) * 66} fill="#123e4d" stroke="#24d5e7" /><text x="130" y="92" textAnchor="middle" fill="#a8b4bd" fontSize="11">Spot · maturity domain</text></svg><p>Realized training region: S {numberText(b.spot_min, 2)}–{numberText(b.spot_max, 2)}, τ {numberText(b.tau_min, 3)}–{numberText(b.tau_max, 3)} yr.<br /><span className="delphi-caption">Shaded region interpolates. Remaining valid nodes extrapolate. {slice && (tau < b.tau_min || tau > b.tau_max) ? "This entire maturity slice lies outside the training region." : ""}</span></p></div> : null}
    <p className="delphi-caption">{invalid} masked reference nodes · Maximum {isIV ? "approximate IV" : "MC price"} standard error: {numberText(maxSE)} {isIV ? "vol pts" : "$"}. {view === "error" ? "Error color scale is shared across completed models." : "Monte Carlo is a high-fidelity reference, not exact truth."}</p>
  </>;
}
