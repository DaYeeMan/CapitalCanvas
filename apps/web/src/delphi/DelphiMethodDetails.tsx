import { BlockMath } from "../components/Math";
import { labels, numberText, type ExperimentResult, type Method } from "./types";

const descriptions: Record<Method, { equation: string; text: string }> = {
  cubic_spline: { equation: "\\hat f(S,\\tau)=\\sum_{i,j}c_{ij}B_i(S)B_j(\\tau)", text: "A smooth cubic interpolant through the shared tensor grid. Outside the training region, polynomial continuation can overshoot." },
  gaussian_process: { equation: "\\hat f(x)=k_x^T(K+\\Sigma+\\lambda^2 I)^{-1}y", text: "An RBF kernel selects spot and maturity scales and regularization by holding out interior spot columns and maturity rows, weighting both directions equally. The final fit uses all training points. The diagonal noise approximation does not capture correlated Monte Carlo errors." },
  mlp: { equation: "\\hat f(x)=W_3\\tanh(W_2\\tanh(W_1x+b_1)+b_2)+b_3", text: "A small neural network learns the reference target directly from shared training points. A fixed epoch budget does not guarantee convergence." },
  residual_mlp: { equation: "\\hat f(x)=f_{BS}(x)+g_\\theta(x)", text: "A neural network learns the difference between the Monte Carlo reference and the Black–Scholes baseline. Under GBM, this correction primarily fits sampling error." },
};
export function DelphiMethodDetails({ result, method }: { result: ExperimentResult; method: Method }) {
  const model = result.methods.find(item => item.method === method), copy = descriptions[method], factor = result.target.kind === "price" ? 1 : 100;
  return <aside className="delphi-method-details" aria-label="Selected method explanation"><h3>{labels[method]}</h3>{method === "residual_mlp" ? <p className="delphi-caption">Prediction = baseline + correction<br />Baseline: Black–Scholes</p> : null}<div className="delphi-equation"><BlockMath math={copy.equation} /></div><p>{copy.text}</p>
    {model?.baseline_metrics ? <p className="delphi-caption">Baseline-only RMSE: {numberText((model.baseline_metrics.full.rmse ?? 0) * factor)} {result.target.kind === "price" ? "$" : "vol pts"}</p> : null}
    {model?.diagnostics?.epochs ? <p className="delphi-caption">{model.diagnostics.epochs} epochs · {result.configuration_snapshot.settings.mlp.width} units per hidden layer<br />Normalized loss: {numberText(model.diagnostics.initial_loss)} → {numberText(model.diagnostics.final_loss)}</p> : null}
    {method === "gaussian_process" ? <p className="delphi-caption">GP uncertainty is not Monte Carlo standard error or guaranteed error coverage. Jitter: {numberText(model?.diagnostics?.jitter)}</p> : null}
    {method === "gaussian_process" && model?.diagnostics?.gp_length_scales ? <p className="delphi-caption">Fitted scales: spot {numberText(model.diagnostics.gp_length_scales[0])} · maturity {numberText(model.diagnostics.gp_length_scales[1])}<br />Regularization: {numberText(model.diagnostics.gp_regularization)} · normalized units<br />Spatial search: {model.diagnostics.gp_fit_converged ? "converged" : "search stopped"} · {model.diagnostics.gp_fit_evaluations} evaluations</p> : null}
    {method === "gaussian_process" && model?.diagnostics?.gp_validation_rmse != null ? <p className="delphi-caption">Spatial validation RMSE: {numberText(model.diagnostics.gp_validation_rmse * factor)} {result.target.kind === "price" ? "$" : "vol pts"}<br />Training holdouts only; final-grid error is reported in the comparison table.</p> : null}
    {model?.diagnostics?.target_scale_floored ? <p className="delphi-notice">Nearly constant training targets: normalization uses a numerical scale floor.</p> : null}
    {model?.error ? <p className="delphi-notice">{model.error.message}</p> : null}
    <a className="delphi-text-button" href="/#delphi-methods">Research and methods ↗</a>
  </aside>;
}
