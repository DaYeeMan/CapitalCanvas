import type { Capabilities, Config } from "./types";

export function validateConfig(config: Config, capabilities: Capabilities | null): string[] {
  if (!capabilities) return ["The solver service must be available before running an experiment."];
  const errors: string[] = [], l = capabilities.limits;
  const check = (label: string, value: number, min: number, max: number, integer = false) => {
    if (!Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) errors.push(`${label} must be ${integer ? "an integer " : ""}between ${min} and ${max}.`);
  };
  const { market: m, domain: d, monte_carlo: mc } = config.reference;
  check("Strike", m.strike, l.strike_min, l.spot_max); check("Volatility", m.volatility, l.volatility_min, l.volatility_max);
  check("Rate", m.rate, l.rate_min, l.rate_max); check("Dividend", m.dividend, l.rate_min, l.rate_max);
  for (const [label, min, max, cap] of [["Spot", d.spot_min, d.spot_max, l.spot_max], ["Maturity", d.tau_min, d.tau_max, l.tau_max]] as const) {
    check(`${label} minimum`, min, 0, cap); check(`${label} maximum`, max, 0, cap);
    if (max <= min) errors.push(`${label} maximum must exceed its minimum.`);
  }
  check("Spot grid", d.spot_nodes, l.axis_min, l.axis_max, true); check("Maturity grid", d.tau_nodes, l.axis_min, l.axis_max, true);
  check("Paths", mc.paths, l.paths_min, l.paths_max, true); check("Reference seed", mc.seed, 0, l.seed_max, true); check("Training seed", config.training_seed, 0, l.seed_max, true);
  if (mc.antithetic && mc.paths % 2 !== 0) errors.push("Antithetic sampling requires an even path count.");
  if (mc.paths * d.spot_nodes * (d.tau_nodes - (d.tau_min === 0 ? 1 : 0)) > l.reference_work) errors.push("Reference exceeds the operation budget. Reduce paths or grid size.");
  if (config.target === "implied_volatility" && d.tau_min <= 0) errors.push("Implied volatility requires a positive minimum maturity. Use the IV preset or adjust the domain.");
  if (!config.methods.length || config.methods.some(method => !capabilities.methods.includes(method))) errors.push("Select at least one supported surrogate model.");
  const budgets = config.mode === "budget" ? config.budgets : [config.budget];
  if (!budgets.length || budgets.length > l.sweep_max) errors.push(`Select 1–${l.sweep_max} budgets.`);
  const { mlp, gp } = config.settings;
  check("Network width", mlp.width, l.width_min, l.width_max, true); check("Epochs", mlp.epochs, l.epochs_min, l.epochs_max, true);
  check("Learning rate", mlp.learning_rate, l.learning_rate_min, l.learning_rate_max); check("Regularization", mlp.regularization, 0, l.regularization_max);
  check("GP length scale", gp.length_scale, l.length_scale_min, l.length_scale_max); check("GP noise floor", gp.noise_floor, l.noise_floor_min, l.noise_floor_max);
  for (const n of budgets) {
    const shape = capabilities.budgets.find(budget => budget.count === n)?.shape;
    if (!shape) { errors.push(`Unsupported training budget: ${n}.`); continue; }
    const grid = d.spot_nodes * d.tau_nodes, weights = mlp.width ** 2 + 3 * mlp.width;
    const neural = config.methods.filter(method => method === "mlp" || method === "residual_mlp").length;
    const work = (config.methods.includes("gaussian_process") ? n ** 3 + grid * n ** 2 : 0) + neural * (6 * mlp.epochs * n * weights + 2 * grid * weights);
    if (work > l.fit_work) errors.push(`The ${n}-sample fit exceeds the work budget. Reduce width, epochs, or selected methods.`);
    if (config.mode === "extrapolation") {
      const b = config.training_bounds;
      for (const [label, low, high, min, max, nodes, required] of [
        ["Training spot", b.spot_min, b.spot_max, d.spot_min, d.spot_max, d.spot_nodes, shape[1]],
        ["Training maturity", b.tau_min, b.tau_max, d.tau_min, d.tau_max, d.tau_nodes, shape[0]],
      ] as const) {
        if (!Number.isFinite(low) || !Number.isFinite(high) || low < min || high > max || high <= low) errors.push(`${label} bounds must be ordered and inside the reference domain.`);
        else {
          const step = (max - min) / (nodes - 1);
          const available = Math.floor((high - min) / step + 1e-10) - Math.ceil((low - min) / step - 1e-10) + 1;
          if (available < required) errors.push(`${label} region needs at least ${required} reference nodes for this budget.`);
        }
      }
    }
  }
  return [...new Set(errors)];
}
