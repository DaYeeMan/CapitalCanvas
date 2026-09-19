export const METHODS = ["cubic_spline", "gaussian_process", "mlp", "residual_mlp"] as const;
export type Method = typeof METHODS[number];
export type Target = "price" | "implied_volatility";
export type Mode = "comparison" | "budget" | "extrapolation";
export type View = "reference" | "prediction" | "error" | "uncertainty";
export type Region = "full" | "unseen" | "inside" | "outside" | "unseen_inside" | "unseen_outside";
export type Matrix = (number | null)[][];
export interface Bounds { spot_min: number; spot_max: number; tau_min: number; tau_max: number }
export interface ReferenceRequest {
  schema_version: 1;
  market: { strike: number; volatility: number; rate: number; dividend: number };
  option_side: "call" | "put";
  domain: Bounds & { spot_nodes: number; tau_nodes: number };
  monte_carlo: { paths: number; seed: number; antithetic: boolean };
}
export interface Settings {
  gp: { length_scale: number; noise_floor: number };
  mlp: { width: number; epochs: number; learning_rate: number; regularization: number };
  residual_baseline: "black_scholes";
}
export interface Config {
  reference: ReferenceRequest; target: Target; methods: Method[]; settings: Settings; training_seed: number;
  budget: number; mode: Mode; budgets: number[]; training_bounds: Bounds;
}
export interface Axes { spots: number[]; times_to_maturity: number[] }
export interface Notice { code: string; message: string }
export interface PriceReference {
  schema_version: 1; algorithm_version: string; reference_id: string; configuration: ReferenceRequest;
  axes: Axes; prices: number[][]; price_standard_errors: number[][]; timing: { reference_ms: number };
  diagnostics: Record<string, string | number>; warnings: Notice[];
}
export interface Sampling { strategy: "uniform_tensor"; budget: number; training_bounds: Bounds | null }
export interface ExperimentRequest {
  schema_version: 1; reference: PriceReference; target: Target; sampling: Sampling;
  methods: Method[]; settings: Settings; training_seed: number;
}
export interface Metric { count: number; mae: number | null; rmse: number | null; max_abs_error: number | null }
export type Evaluation = Record<Region, Metric> & { absolute_errors: Matrix; training_mask: boolean[][]; inside_mask: boolean[][]; outside_mask: boolean[][] };
export interface ModelResult {
  method: Method; status: "complete" | "failed"; training_count: number; predictions: Matrix | null;
  predictive_stddev: Matrix | null; evaluation: Evaluation | null;
  timing: { fit_ms: number; inference_ms: number; prediction_count: number } | null;
  diagnostics: { model: string; target_scale_floored: boolean; extrapolated_nodes: number; bounds_violations: number; jitter?: number | null; epochs?: number | null; initial_loss?: number | null; final_loss?: number | null; baseline?: string | null } | null;
  baseline_metrics: Evaluation | null; warnings: Notice[]; error: Notice | null;
}
export interface ExperimentResult {
  schema_version: 1; experiment_id: string; reference_id: string; sample_set_id: string;
  configuration_snapshot: { reference: ReferenceRequest; target: Target; sampling: Sampling; methods: Method[]; settings: Settings; training_seed: number };
  axes: Axes;
  target: { kind: Target; values: Matrix; standard_errors: Matrix; valid_mask: boolean[][]; invalid_reasons: (string | null)[][]; warnings: Notice[] };
  samples: { count: number; shape: [number, number]; coordinates: [number, number][]; row_indices: number[]; column_indices: number[]; flat_indices: number[]; values: number[]; bounds: Bounds };
  methods: ModelResult[]; timings: { request_compute_ms: number; iv_conversion_ms: number; sampling_ms: number; evaluation_ms: number }; warnings: Notice[];
}
export interface Capabilities {
  schema_version: 1; algorithm_version: string; methods: Method[];
  budgets: { count: number; shape: [number, number] }[];
  defaults: { price: ReferenceRequest; implied_volatility: ReferenceRequest; settings: Settings };
  limits: Record<string, number>; execution: { timeout_seconds: number };
}
export interface BudgetPoint {
  count: number; target: Target; referenceId: string;
  methods: { method: Method; metric: Metric | null; fit_ms: number | null; inference_ms: number | null }[];
  result: ExperimentResult | null;
}
export const labels: Record<Method, string> = { cubic_spline: "Cubic spline", gaussian_process: "Gaussian process", mlp: "MLP", residual_mlp: "Residual MLP" };
export const colors: Record<Method, string> = { cubic_spline: "#24d5e7", gaussian_process: "#c6a3ef", mlp: "#ffb000", residual_mlp: "#86d849" };
export const defaultReference: ReferenceRequest = { schema_version: 1, option_side: "call", market: { strike: 100, volatility: .2, rate: .05, dividend: 0 }, domain: { spot_min: 60, spot_max: 140, tau_min: 0, tau_max: 2, spot_nodes: 61, tau_nodes: 51 }, monte_carlo: { paths: 20000, seed: 42, antithetic: true } };
export const defaultSettings: Settings = { gp: { length_scale: .35, noise_floor: .00001 }, mlp: { width: 32, epochs: 300, learning_rate: .01, regularization: .0001 }, residual_baseline: "black_scholes" };
export function centralBounds(domain: Bounds): Bounds {
  const s = (domain.spot_max - domain.spot_min) * .15, t = (domain.tau_max - domain.tau_min) * .15;
  return { spot_min: domain.spot_min + s, spot_max: domain.spot_max - s, tau_min: domain.tau_min + t, tau_max: domain.tau_max - t };
}
export function initialConfig(capabilities?: Capabilities): Config {
  const reference = structuredClone(capabilities?.defaults.price ?? defaultReference);
  return { reference, target: "price", methods: [...METHODS], settings: structuredClone(capabilities?.defaults.settings ?? defaultSettings), training_seed: 42, budget: 128, mode: "comparison", budgets: [32, 64, 128, 256], training_bounds: centralBounds(reference.domain) };
}
export function numberText(value: number | null | undefined, digits = 4): string {
  if (value == null || !Number.isFinite(value)) return "—";
  return value !== 0 && Math.abs(value) < 10 ** -digits ? value.toExponential(2) : value.toLocaleString("en-US", { maximumFractionDigits: digits });
}
export function referenceKey(reference: ReferenceRequest): string {
  return JSON.stringify([reference.schema_version, reference.option_side,
    ...[reference.market, reference.domain, reference.monte_carlo].map(group => Object.entries(group).sort(([a], [b]) => a.localeCompare(b)))]);
}
