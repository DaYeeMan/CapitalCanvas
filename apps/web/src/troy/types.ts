export type Dynamics = 'gbm' | 'heston' | 'merton'
export type Pricing = 'bs' | 'crr' | 'mc' | 'heston' | 'merton'
/** Times in years; rates/vols as decimals; prices and costs per one-unit contract. */
export interface Config {
  seed: number; dynamics: Dynamics; pricing: Pricing; optionType: 'call' | 'put'
  spot: number; strike: number; maturity: number; horizon: number; steps: number
  drift: number; rate: number; dividendYield: number; volatility: number; pricingVolatility: number
  initialVariance: number; longRunVariance: number; meanReversion: number; volOfVol: number; correlation: number
  pricingInitialVariance: number; pricingLongRunVariance: number; pricingMeanReversion: number; pricingVolOfVol: number; pricingCorrelation: number
  jumpIntensity: number; jumpMean: number; jumpVolatility: number
  pricingJumpIntensity: number; pricingJumpMean: number; pricingJumpVolatility: number
  /** Reference Q intensity = physical intensity × multiplier; log-jump mean receives the shift. */
  referenceJumpIntensityMultiplier: number; referenceJumpMeanShift: number
  /** Reference Q mean reversion = physical κ + premium; κ_Q θ_Q = κ_P θ_P. */
  varianceRiskPremium: number
  hestonVarianceSource: 'observed' | 'fixed'
  halfSpread: number; inventorySkew: number; fillIntensity: number; fillSensitivity: number
  /** Number of market steps before a quote becomes available for execution. */
  quoteLatencySteps: number
  /** Contracts per arrival; buyFlowBalance is the fraction of customers buying (dealer sells). */
  quoteSize: number; buyFlowBalance: number; inventoryLimit: number; hedgeEvery: number; hedgeEnabled: boolean
  informedFlowShare: number; borrowingSpread: number; stockBorrowBps: number
  optionCost: number; hedgeCostBps: number; pricingPaths: number; treeSteps: number; samplePaths: number
}
export interface PnlAttribution {
  postingEdge: number; preFillMove: number; heldOptionPnl: number
  hedgePnl: number; financingPnl: number; transactionCosts: number
}
export interface Observation extends PnlAttribution {
  time: number; spot: number; variance: number; fairValue: number; referenceValue: number; delta: number; referenceDelta: number
  bid: number; ask: number; quoteAge: number; inventory: number; hedgePosition: number; netDelta: number
  cash: number; realizedPnl: number; unrealizedPnl: number; totalPnl: number; drawdown: number
  modelPnl: number; valuationError: number; hedgeError: number
  bidFills: number; askFills: number
}
export interface Fill {
  step: number; time: number; side: 'buy' | 'sell'; quantity: number; price: number; count: number
  referenceValue: number; postingReference: number; quoteAge: number
}
export interface ReturnStatistics { count: number; mean: number; standardDeviation: number; annualizedVolatility: number; skewness: number; excessKurtosis: number; min: number; max: number }
export interface SimulationResult {
  config: Config; observations: Observation[]; samplePaths: number[][]; fills: Fill[]; logReturns: number[]
  statistics: ReturnStatistics
  summary: { realizedPnl: number; unrealizedPnl: number; hedgePnl: number; totalPnl: number; transactionCosts: number; maxDrawdown: number; totalFills: number; finalInventory: number; averageSpreadCaptured: number; hedgePosition: number; modelPnl: number; valuationError: number; financingPnl: number; pricingRmse: number; hedgeRmse: number }
  pricingLabel: string; referenceLabel: string; warnings: string[]
}

/** Posted prices and the maker's own mark, in currency per contract. */
export interface Quote { fairValue: number; bid: number; ask: number }
/** Arrival counts by dealer side, before inventory clipping. */
export interface ArrivalCounts { buyCount: number; sellCount: number }
export interface RandomSource { uniform(): number; normal(): number; poisson(lambda: number): number }
export type QuotePolicy = (config: Config, fairValue: number, inventory: number) => Quote
export type ArrivalPolicy = (config: Config, quote: Quote, dt: number, rng: RandomSource, referenceValue: number) => ArrivalCounts
export type DynamicsStep = (config: Config, spot: number, variance: number, dt: number, rng: RandomSource, riskNeutral?: boolean) => [number, number]
export type PricingFunction = (config: Config, spot?: number, time?: number) => number

/** History includes the current spot. Modules must not mutate it or config. */
export interface MarketContext { spot: number; variance: number; time: number; history: readonly number[] }
export interface DynamicsTransition {
  (config: Config, context: MarketContext & { dt: number; rng: RandomSource }): [number, number]
}
export interface PricingModel {
  (config: Config, context: MarketContext): { value: number; delta: number }
}
export interface ContractPayoff {
  (config: Config, context: MarketContext): number
}
/** Inject inside a Worker; function modules themselves cannot be structured-cloned. */
export interface SimulationModules {
  dynamics?: DynamicsTransition
  pricing?: PricingModel
  reference?: PricingModel
  contract?: ContractPayoff
  quote?: QuotePolicy
  arrivals?: ArrivalPolicy
}

export interface DistributionSummary {
  mean: number; standardDeviation: number; lossProbability: number; p05: number; expectedShortfall: number
}
export interface ComparisonRow {
  pricing: Pricing; quoteLatencySteps: number; interim: DistributionSummary; settled: DistributionSummary
  attribution: Record<'interim' | 'settled', PnlAttribution>
  meanDrawdown: number; pricingRmse: number; hedgeRmse: number
}
export interface ComparisonResult { config: Config; interimTime: number; settlementSteps: number; seeds: number[]; rows: ComparisonRow[] }
export interface ComparisonRequest { kind: 'comparison'; config: Config; runs: number; compareTimings: boolean }
