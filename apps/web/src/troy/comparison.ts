import { referencePricing, simulate } from './engine'
import type { ComparisonResult, Config, DistributionSummary, Observation, PnlAttribution, Pricing } from './types'

export const comparisonModels: Pricing[] = ['bs', 'crr', 'mc', 'heston', 'merton']
export function distribution(values: number[]): DistributionSummary {
  const ordered = [...values].sort((a, b) => a - b)
  const mean = values.reduce((sum, x) => sum + x, 0) / values.length
  const tailCount = Math.max(1, Math.ceil(values.length * 0.05))
  return {
    mean, standardDeviation: Math.sqrt(values.reduce((sum, x) => sum + (x - mean) ** 2, 0) / values.length),
    lossProbability: values.filter(x => x < 0).length / values.length,
    p05: ordered[Math.max(0, Math.ceil(values.length * 0.05) - 1)],
    expectedShortfall: ordered.slice(0, tailCount).reduce((sum, x) => sum + x, 0) / tailCount,
  }
}

function meanAttribution(rows: PnlAttribution[]): PnlAttribution {
  const mean = (key: keyof PnlAttribution) => rows.reduce((sum, row) => sum + row[key], 0) / rows.length
  return {
    postingEdge: mean('postingEdge'), preFillMove: mean('preFillMove'), heldOptionPnl: mean('heldOptionPnl'),
    hedgePnl: mean('hedgePnl'), financingPnl: mean('financingPnl'), transactionCosts: mean('transactionCosts'),
  }
}

/** Every maker sees the same path and random-arrival stream; interim and expiry use one grid. */
export function compareModels(input: Config, runs: number, onProgress?: (completed: number, total: number) => void, compareTimings = false): ComparisonResult {
  if (!Number.isInteger(runs) || runs < 2 || runs > 200) throw new Error('Comparison runs must be an integer in [2, 200]')
  const horizon = Math.min(input.horizon, input.maturity)
  const fullSteps = Math.ceil(input.steps * input.maturity / horizon)
  if (fullSteps > 1000) throw new Error('Comparison through expiry exceeds 1000 steps; increase horizon or reduce time steps.')
  // Use an exact expiry grid; the interim metric is the last observation at/before requested horizon.
  // All models and both reported horizons are measured on this single common path.
  const seeds = Array.from({ length: runs }, (_, i) => (input.seed + Math.imul(i, 7919)) >>> 0)
  const selectedLatency = input.quoteLatencySteps ?? 0
  const latencies = compareTimings ? [0, selectedLatency || 1] : [selectedLatency]
  const total = runs * comparisonModels.length * latencies.length
  const references = new Map<number, Map<number, ReturnType<typeof referencePricing>>>()
  let completed = 0
  const rows = comparisonModels.flatMap(pricing => latencies.map(quoteLatencySteps => {
    const interim: Observation[] = [], settled: Observation[] = []
    let drawdown = 0, pricingError = 0, hedgeError = 0
    for (const seed of seeds) {
      const cache = references.get(seed) ?? new Map<number, ReturnType<typeof referencePricing>>()
      references.set(seed, cache)
      const result = simulate({ ...input, seed, pricing, quoteLatencySteps, horizon: input.maturity, steps: fullSteps, samplePaths: 1 }, {
        reference: (c, context) => {
          const mark = cache.get(context.time) ?? referencePricing(c, context)
          cache.set(context.time, mark)
          return mark
        },
      })
      const atHorizon = result.observations.filter(o => o.time <= horizon + 1e-12).at(-1)!
      interim.push(atHorizon); settled.push(result.observations.at(-1)!)
      drawdown += result.summary.maxDrawdown; pricingError += result.summary.pricingRmse ** 2; hedgeError += result.summary.hedgeRmse ** 2
      onProgress?.(++completed, total)
    }
    return {
      pricing, quoteLatencySteps, interim: distribution(interim.map(o => o.totalPnl)), settled: distribution(settled.map(o => o.totalPnl)),
      attribution: { interim: meanAttribution(interim), settled: meanAttribution(settled) },
      meanDrawdown: drawdown / runs, pricingRmse: Math.sqrt(pricingError / runs), hedgeRmse: Math.sqrt(hedgeError / runs),
    }
  }))
  return { config: { ...input, quoteLatencySteps: selectedLatency, horizon }, interimTime: Math.floor((horizon + 1e-12) * fullSteps / input.maturity) * input.maturity / fullSteps, settlementSteps: fullSteps, seeds, rows }
}
