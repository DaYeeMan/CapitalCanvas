import { useMemo, useState } from "react";
import type { Data, Layout } from "plotly.js";
import { ScientificPlot } from "../components/ChartPanel";
import { colors, labels, METHODS, type BudgetPoint, type ExperimentResult } from "./types";
import { OracleTabs } from "./OracleControls";

type Measure = "rmse" | "mae" | "max_abs_error" | "fit_ms" | "inference_ms";
export function OracleBudget({ points, onSelect }: { points: BudgetPoint[]; onSelect: (result: ExperimentResult) => void }) {
  const [measure, setMeasure] = useState<Measure>("rmse");
  const unit = measure.endsWith("ms") ? "ms" : points[0]?.target === "implied_volatility" ? "volatility points" : "$";
  const traces = useMemo(() => METHODS.filter(method => points.some(point => point.methods.some(model => model.method === method))).map((method, index) => ({ type: "scatter", mode: "lines+markers", name: labels[method], x: points.map(point => point.count), y: points.map(point => {
    const model = point.methods.find(item => item.method === method);
    const factor = point.target === "implied_volatility" ? 100 : 1;
    return measure === "fit_ms" ? model?.fit_ms : measure === "inference_ms" ? model?.inference_ms : model?.metric?.[measure] == null ? null : model.metric[measure]! * factor;
  }), connectgaps: false, line: { color: colors[method], width: 2, dash: ["solid", "dash", "dot", "dashdot"][index] }, marker: { color: colors[method], size: 8, symbol: ["square", "diamond", "triangle-up", "circle"][index] } }) as Data), [points, measure]);
  const layout = useMemo<Partial<Layout>>(() => ({ paper_bgcolor: "transparent", plot_bgcolor: "transparent", font: { color: "#a8b4bd", size: 12 }, margin: { l: 70, r: 25, b: 65, t: 30 }, xaxis: { title: { text: "Monte Carlo training samples" }, type: "log", tickvals: points.map(point => point.count), gridcolor: "#203545" }, yaxis: { title: { text: `${measure.replaceAll("_", " ").toUpperCase()} (${unit})` }, rangemode: "tozero", gridcolor: "#203545" }, legend: { orientation: "h", y: 1.13 }, uirevision: measure }), [points, measure, unit]);
  return <section className="oracle-budget" aria-label="Data budget experiment">
    <h2>How much data is enough?</h2><p className="oracle-caption">Same reference. Shared samples at every budget. Full-grid errors use a fixed evaluation domain.</p>
    <OracleTabs label="Budget metric" value={measure} panelId="oracle-budget-plot" onChange={setMeasure} options={[{ value: "rmse", label: "RMSE" }, { value: "mae", label: "MAE" }, { value: "max_abs_error", label: "Max error" }, { value: "fit_ms", label: "Fit time" }, { value: "inference_ms", label: "Inference time" }]} />
    {points.length ? <><div className="oracle-budget-plot" id="oracle-budget-plot" role="tabpanel" aria-label="Budget metric plot"><ScientificPlot data={traces} layout={layout} label={`${measure} versus training sample count`} /></div><div className="oracle-budget-picks">{points.map(point => <button key={point.count} disabled={!point.result} title={!point.result ? "Surface evicted from memory; rerun this budget to inspect it." : "Open completed surface and metrics"} onClick={() => point.result && onSelect(point.result)}>{point.count} samples · inspect</button>)}</div>
      <details className="oracle-disclosure"><summary>Budget values · accessible table</summary><div className="oracle-table-scroll" tabIndex={0}><table><thead><tr><th>Samples</th><th>Method</th><th>{measure} ({unit})</th></tr></thead><tbody>{points.flatMap(point => point.methods.map(model => {
        const value = measure === "fit_ms" ? model.fit_ms : measure === "inference_ms" ? model.inference_ms : model.metric?.[measure] == null ? null : model.metric[measure]! * (point.target === "implied_volatility" ? 100 : 1);
        return <tr key={`${point.count}-${model.method}`}><td>{point.count}</td><td>{labels[model.method]}</td><td>{value == null ? "Unavailable" : value.toPrecision(5)}</td></tr>;
      }))}</tbody></table></div></details></> : <div className="oracle-empty">Choose up to four budgets, then run the experiment. Completed budgets remain available if you cancel.</div>}
  </section>;
}
