import type { Config, Observation, SimulationResult, ReturnStatistics, Fill, Quote, QuotePolicy, ArrivalPolicy, DynamicsTransition, PricingModel, ContractPayoff, SimulationModules } from './types'
import { blackScholes, hestonMark, mertonPrice } from './pricing'
export { blackScholes } from './pricing'
export type { Config, SimulationResult } from './types'

export const defaultConfig: Config = {
  seed: 1729, dynamics: 'gbm', pricing: 'bs', optionType: 'call', spot: 100, strike: 100,
  maturity: 1, horizon: 0.25, steps: 180, drift: 0.06, rate: 0.03, dividendYield: 0, volatility: 0.2, pricingVolatility: 0.2,
  initialVariance: 0.04, longRunVariance: 0.04, meanReversion: 2, volOfVol: 0.4, correlation: -0.7,
  pricingInitialVariance: 0.04, pricingLongRunVariance: 0.04, pricingMeanReversion: 2, pricingVolOfVol: 0.4, pricingCorrelation: -0.7,
  jumpIntensity: 2, jumpMean: -0.06, jumpVolatility: 0.12,
  pricingJumpIntensity: 2, pricingJumpMean: -0.06, pricingJumpVolatility: 0.12,
  referenceJumpIntensityMultiplier: 1, referenceJumpMeanShift: 0, varianceRiskPremium: 0, hestonVarianceSource: 'observed',
  informedFlowShare: 0.5, borrowingSpread: 0.01, stockBorrowBps: 25,
  halfSpread: 0.15, inventorySkew: 0.02, fillIntensity: 400, fillSensitivity: 4,
  quoteLatencySteps: 0,
  quoteSize: 1, buyFlowBalance: 0.5, inventoryLimit: 20, hedgeEvery: 5, hedgeEnabled: true, optionCost: 0.01, hedgeCostBps: 1,
  pricingPaths: 512, treeSteps: 60, samplePaths: 30,
}

export function randomSource(seed: number) {
  let state = seed >>> 0
  const uniform = () => {
    state += 0x6D2B79F5
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const normal = () => Math.sqrt(-2 * Math.log(Math.max(uniform(), 1e-12))) * Math.cos(2 * Math.PI * uniform())
  // Split large intensities into independent exact Poisson draws, avoiding exp underflow.
  const poisson = (lambda: number) => {
    let count = 0
    while (lambda > 0) {
      const part = Math.min(lambda, 20), threshold = Math.exp(-part)
      let product = 1, k = 0
      do { product *= uniform(); k++ } while (product > threshold)
      count += k - 1; lambda -= part
    }
    return count
  }
  return { uniform, normal, poisson }
}
function numericalGuard(value: number, label: string, minimum = -Infinity): number {
  if (!Number.isFinite(value) || value < minimum) {
    throw new Error(`Numerical overflow/underflow in ${label}; reduce horizon, drift, volatility, or jump parameters.`)
  }
  return value
}
// Reject subnormal spots as well as zero: delta bumps and price ratios lose precision there.
const positiveSpot = (value: number) => numericalGuard(value, 'spot path', 2.2250738585072014e-308)
function checkedState(spot: number, variance: number): [number, number] {
  return [positiveSpot(spot), numericalGuard(variance, 'variance path', 0)]
}
const payoff = (s: number, k: number, put: boolean) => Math.max(put ? k - s : s - k, 0)
export function advance(c: Config, s: number, v: number, dt: number, rng: ReturnType<typeof randomSource>, riskNeutral = false): [number, number] {
  const z = rng.normal(), mu = riskNeutral ? c.rate - c.dividendYield : c.drift
  if (c.dynamics === 'heston') {
    const positive = Math.max(v, 0)
    const nextV = Math.max(0, v + c.meanReversion * (c.longRunVariance - positive) * dt + c.volOfVol * Math.sqrt(positive * dt) * (c.correlation * z + Math.sqrt(1 - c.correlation ** 2) * rng.normal()))
    return checkedState(s * Math.exp((mu - positive / 2) * dt + Math.sqrt(positive * dt) * z), nextV)
  }
  let jump = 0, compensation = 0
  if (c.dynamics === 'merton') {
    const count = rng.poisson(c.jumpIntensity * dt)
    if (count) jump = count * c.jumpMean + Math.sqrt(count) * c.jumpVolatility * rng.normal()
    compensation = c.jumpIntensity * Math.expm1(c.jumpMean + c.jumpVolatility ** 2 / 2)
  }
  return checkedState(s * Math.exp((mu - compensation - c.volatility ** 2 / 2) * dt + c.volatility * Math.sqrt(dt) * z + jump), c.volatility ** 2)
}

/** Selected pricing law is independent of the true dynamics. MC means risk-neutral GBM. */
export function priceOption(c: Config, spot = c.spot, time = c.maturity): number {
  positiveSpot(spot)
  return numericalGuard(priceOptionUnchecked(c, spot, time), `${c.pricing} option price`, 0)
}
function priceHeston(c: Config, spot: number, time: number) {
  return hestonMark(spot, c.strike, time, c.rate, c.dividendYield, c.pricingInitialVariance, c.pricingLongRunVariance, c.pricingMeanReversion, c.pricingVolOfVol, c.pricingCorrelation, c.optionType)
}
function priceOptionUnchecked(c: Config, spot: number, time: number): number {
  const put = c.optionType === 'put'
  if (time <= 0) return payoff(spot, c.strike, put)
  if (c.pricing === 'bs') return blackScholes(spot, c.strike, time, c.rate, c.pricingVolatility, c.optionType, c.dividendYield)
  if (c.pricing === 'merton') return mertonPrice(spot, c.strike, time, c.rate, c.dividendYield, c.pricingVolatility, c.pricingJumpIntensity, c.pricingJumpMean, c.pricingJumpVolatility, c.optionType)
  if (c.pricing === 'heston') return priceHeston(c, spot, time).value
  if (c.pricing === 'crr') {
    if (c.pricingVolatility === 0) return blackScholes(spot, c.strike, time, c.rate, 0, c.optionType, c.dividendYield)
    const n = c.treeSteps, dt = time / n, u = Math.exp(c.pricingVolatility * Math.sqrt(dt)), d = 1 / u
    const p = (Math.exp((c.rate - c.dividendYield) * dt) - d) / (u - d)
    if (p < 0 || p > 1) throw new Error('CRR probability outside [0,1]; increase treeSteps or volatility.')
    const values = Array.from({ length: n + 1 }, (_, j) => payoff(spot * u ** j * d ** (n - j), c.strike, put))
    for (let i = n - 1; i >= 0; i--) for (let j = 0; j <= i; j++) values[j] = Math.exp(-c.rate * dt) * ((1 - p) * values[j] + p * values[j + 1])
    return values[0]
  }
  // Reset stream for common random numbers across spot bumps and successive marks.
  const rng = randomSource(c.seed ^ 0x50726963)
  let sum = 0
  for (let i = 0; i < c.pricingPaths; i++) {
    const terminal = spot * Math.exp((c.rate - c.dividendYield - c.pricingVolatility ** 2 / 2) * time + c.pricingVolatility * Math.sqrt(time) * rng.normal())
    positiveSpot(terminal)
    sum += payoff(terminal, c.strike, put)
  }
  return Math.exp(-c.rate * time) * sum / c.pricingPaths
}
export function optionDelta(c: Config, spot = c.spot, time = c.maturity) {
  const bump = spot * 0.001
  return numericalGuard((priceOption(c, spot + bump, time) - priceOption(c, spot - bump, time)) / (2 * bump), 'option delta')
}
function optionMark(c: Config, spot: number, time: number) {
  return c.pricing === 'heston' ? priceHeston(c, spot, time) : { value: priceOption(c, spot, time), delta: optionDelta(c, spot, time) }
}
export function returnStatistics(values: number[], dt: number): ReturnStatistics {
  const count = values.length
  if (!count) return { count: 0, mean: 0, standardDeviation: 0, annualizedVolatility: 0, skewness: 0, excessKurtosis: 0, min: 0, max: 0 }
  const mean = values.reduce((a, b) => a + b, 0) / count
  const moment = (power: number) => values.reduce((a, b) => a + (b - mean) ** power, 0) / count
  const variance = moment(2), sd = Math.sqrt(variance)
  return { count, mean, standardDeviation: sd, annualizedVolatility: sd / Math.sqrt(dt), skewness: sd ? moment(3) / sd ** 3 : 0, excessKurtosis: sd ? moment(4) / sd ** 4 - 3 : 0, min: Math.min(...values), max: Math.max(...values) }
}
function validate(c: Config) {
  for (const [key, value] of Object.entries(c)) if (typeof value === 'number' && !Number.isFinite(value)) throw new Error(`${key} must be finite`)
  if (!['gbm', 'heston', 'merton'].includes(c.dynamics) || !['bs', 'crr', 'mc', 'heston', 'merton'].includes(c.pricing) || !['call', 'put'].includes(c.optionType)) throw new Error('Unknown model or option type')
  for (const key of ['spot', 'strike', 'maturity', 'horizon'] as const) if (c[key] <= 0) throw new Error(`${key} must be positive`)
  if (c.horizon > c.maturity) throw new Error('horizon must not exceed maturity')
  for (const key of ['pricingInitialVariance', 'pricingLongRunVariance', 'pricingMeanReversion', 'pricingVolOfVol', 'volatility', 'pricingVolatility', 'initialVariance', 'longRunVariance', 'meanReversion', 'volOfVol', 'jumpIntensity', 'jumpVolatility', 'halfSpread', 'inventorySkew', 'fillIntensity', 'fillSensitivity', 'optionCost', 'hedgeCostBps', 'pricingJumpIntensity', 'pricingJumpVolatility', 'referenceJumpIntensityMultiplier', 'borrowingSpread', 'stockBorrowBps'] as const) if (c[key] < 0) throw new Error(`${key} must be nonnegative`)
  if (!['observed', 'fixed'].includes(c.hestonVarianceSource)) throw new Error('Unknown Heston variance source')
  if (c.dynamics === 'heston' && (c.meanReversion + c.varianceRiskPremium < 0 || (c.meanReversion + c.varianceRiskPremium === 0 && c.meanReversion * c.longRunVariance !== 0))) throw new Error('Reference Heston mean reversion must be positive when kappa times theta is nonzero')
  if (c.informedFlowShare < 0 || c.informedFlowShare > 1) throw new Error('informedFlowShare must be in [0,1]')
  if (!Number.isInteger(c.quoteLatencySteps) || c.quoteLatencySteps < 0 || c.quoteLatencySteps > 100) throw new Error('Quote latency must be an integer from 0 to 100 steps')
  if (Math.abs(c.correlation) > 1 || Math.abs(c.pricingCorrelation) > 1) throw new Error('correlation must be in [-1,1]')
  for (const [key, max] of Object.entries({ quoteSize: 1000, steps: 1000, pricingPaths: 4096, treeSteps: 250, samplePaths: 50, inventoryLimit: 1000, hedgeEvery: 1000 })) {
    const value = c[key as keyof Config] as number
    if (!Number.isInteger(value) || value < 1 || value > max) throw new Error(`${key} must be an integer in [1, ${max}]`)
  }
  if (c.buyFlowBalance < 0 || c.buyFlowBalance > 1) throw new Error('buyFlowBalance must be in [0,1]')
  const work = c.pricing === 'heston' ? 4000 : c.pricing === 'mc' ? c.pricingPaths : c.pricing === 'crr' ? c.treeSteps ** 2 : 1
  if (3 * (c.steps + 1) * work > 50_000_000 || c.fillIntensity * c.horizon > 100_000 || c.jumpIntensity * c.horizon * c.samplePaths > 100_000) throw new Error('Compute budget exceeded; reduce steps, paths, or intensity')
}

/** Inventory shifts the quote center; prices are floored at zero. */
export const quotePolicy: QuotePolicy = (c, fairValue, inventory) => {
  const center = fairValue - c.inventorySkew * inventory
  return { fairValue, bid: Math.max(0, center - c.halfSpread), ask: Math.max(0, center + c.halfSpread) }
}
/** Uninformed arrivals depend on posted width; informed arrivals use the current external reference. */
export const arrivalCounts: ArrivalPolicy = (c, quote, dt, rng, referenceValue) => {
  const uninformed = Math.exp(-c.fillSensitivity * Math.max(0, (quote.ask - quote.bid) / 2))
  const accept = (share: number, distance: number) => {
    const probability = (1 - c.informedFlowShare) * uninformed + c.informedFlowShare * Math.exp(-c.fillSensitivity * Math.max(0, distance))
    // Draw candidate orders before thinning so quote changes do not shift future order randomness.
    const candidates = rng.poisson(share * c.fillIntensity * dt)
    let fills = 0
    for (let i = 0; i < candidates; i++) if (rng.uniform() < probability) fills++
    return fills
  }
  return {
    buyCount: accept(1 - c.buyFlowBalance, referenceValue - quote.bid),
    sellCount: accept(c.buyFlowBalance, quote.ask - referenceValue),
  }
}

export const defaultDynamics: DynamicsTransition = (c, context) =>
  advance(c, context.spot, context.variance, context.dt, context.rng)
export const defaultPricing: PricingModel = (c, context) => {
  const pc = c.pricing === 'heston' && c.hestonVarianceSource === 'observed' ? { ...c, pricingInitialVariance: context.variance } : c
  const time = Math.max(0, c.maturity - context.time)
  return optionMark(pc, context.spot, time)
}
/** Q parameters are specified independently of the maker; zero premia retain the physical jump/variance laws. */
export const referencePricing: PricingModel = (c, context) => {
  const kappa = c.meanReversion + c.varianceRiskPremium
  const pc: Config = {
    ...c, pricing: c.dynamics === 'gbm' ? 'bs' : c.dynamics, pricingVolatility: c.volatility,
    pricingJumpIntensity: c.jumpIntensity * c.referenceJumpIntensityMultiplier,
    pricingJumpMean: c.jumpMean + c.referenceJumpMeanShift, pricingJumpVolatility: c.jumpVolatility,
    pricingInitialVariance: context.variance, pricingMeanReversion: kappa,
    pricingLongRunVariance: kappa ? c.meanReversion * c.longRunVariance / kappa : 0,
    pricingVolOfVol: c.volOfVol, pricingCorrelation: c.correlation,
  }
  const time = Math.max(0, c.maturity - context.time)
  return optionMark(pc, context.spot, time)
}
export const defaultContract: ContractPayoff = (c, context) => payoff(context.spot, c.strike, c.optionType === 'put')

interface PostedQuote extends Quote { postedAt: number; postingReference: number }

export function simulate(input: Config, modules: SimulationModules = {}): SimulationResult {
  if (!Number.isFinite(input.horizon)) throw new Error('horizon must be finite')
  const c = { ...input, quoteLatencySteps: input.quoteLatencySteps ?? defaultConfig.quoteLatencySteps, horizon: Math.min(input.horizon, input.maturity) }; validate(c)
  const transition = modules.dynamics ?? defaultDynamics, pricing = modules.pricing ?? defaultPricing
  const reference = modules.reference ?? referencePricing
  const contract = modules.contract ?? defaultContract, quoting = modules.quote ?? quotePolicy, arrivals = modules.arrivals ?? arrivalCounts
  const history = [c.spot]
  const dt = c.horizon / c.steps
  const marketRng = randomSource(c.seed), fillRng = randomSource(c.seed ^ 0x46696c6c)
  let spot = c.spot, variance = c.dynamics === 'heston' ? c.initialVariance : c.volatility ** 2
  let inventory = 0, basis = 0, realized = 0, cash = 0, hedge = 0, hedgeCash = 0, costs = 0, financing = 0, peak = 0, maxDrawdown = 0
  let postingEdge = 0, preFillMove = 0, heldOptionPnl = 0, filledUnits = 0
  const observations: Observation[] = [], fills: Fill[] = [], logReturns: number[] = []
  const postedQuotes: PostedQuote[] = []
  for (let step = 0; step <= c.steps; step++) {
    const time = step === c.steps ? c.horizon : step * dt
    if (step) {
      const previous = spot
      const balance = cash + hedgeCash + financing - costs
      financing += balance * Math.expm1((c.rate + (balance < 0 ? c.borrowingSpread : 0)) * dt)
      financing -= Math.max(0, -hedge) * previous * c.stockBorrowBps / 10000 * dt
      // Continuous yield paid to long underlying holders (owed by shorts).
      hedgeCash += hedge * previous * Math.expm1(c.dividendYield * dt)
      ;[spot, variance] = checkedState(...transition(c, { spot, variance, dt, time: (step - 1) * dt, history, rng: marketRng }))
      history.push(spot)
    }
    const remaining = Math.max(0, c.maturity - time), context = { spot, variance, time, history }
    const expired = remaining <= 1e-12
    const marketMark = expired ? { value: contract(c, context), delta: 0 } : reference(c, context)
    const referenceValue = numericalGuard(marketMark.value, 'reference value', 0)
    const referenceDelta = numericalGuard(marketMark.delta, 'reference delta')
    const previous = observations[step - 1]
    const optionMove = previous ? previous.inventory * (referenceValue - previous.referenceValue) : 0
    heldOptionPnl += optionMove
    // Interval residual of the held option/hedge portfolio, after risk-free carry and dividends.
    const hedgeError = step ? optionMove + previous.hedgePosition * (spot - previous.spot)
      + previous.hedgePosition * previous.spot * Math.expm1(c.dividendYield * dt)
      - (previous.inventory * previous.referenceValue + previous.hedgePosition * previous.spot) * Math.expm1(c.rate * dt) : 0
    const mark = expired ? marketMark : pricing(c, context)
    const fairValue = numericalGuard(mark.value, 'contract value', 0)
    const delta = numericalGuard(mark.delta, 'option delta')
    const postQuote = (): PostedQuote => ({ ...quoting(c, fairValue, inventory), postedAt: time, postingReference: referenceValue })
    // The initial quote is already live. Delayed updates become active in submission order.
    const quote = expired ? { fairValue, bid: fairValue, ask: fairValue, postedAt: time, postingReference: referenceValue }
      : c.quoteLatencySteps > 0 && step > 0 ? postedQuotes[Math.max(0, step - c.quoteLatencySteps)] : postQuote()
    const quoteAge = time - quote.postedAt
    let bidFills = 0, askFills = 0
    if (step && !expired) {
      const { buyCount, sellCount } = arrivals(c, quote, dt, fillRng, referenceValue)
      const execute = (side: 'buy' | 'sell', count: number, price: number) => {
        const sign = side === 'buy' ? 1 : -1
        const quantity = Math.min(count * c.quoteSize, c.inventoryLimit - sign * inventory)
        if (!quantity) return
        const closing = inventory * sign < 0 ? Math.min(Math.abs(inventory), quantity) : 0
        realized += closing * (price - basis) * Math.sign(inventory)
        const next = inventory + sign * quantity
        if (inventory * sign >= 0) basis = (Math.abs(inventory) * basis + quantity * price) / Math.abs(next)
        else if (quantity > Math.abs(inventory)) basis = price
        else if (!next) basis = 0
        inventory = next; cash -= sign * quantity * price; costs += quantity * c.optionCost
        postingEdge += sign * quantity * (quote.postingReference - price)
        preFillMove += sign * quantity * (referenceValue - quote.postingReference)
        filledUnits += quantity
        fills.push({ step, time, side, quantity, price, count: Math.ceil(quantity / c.quoteSize), referenceValue, postingReference: quote.postingReference, quoteAge })
        if (side === 'buy') bidFills += quantity; else askFills += quantity
      }
      // Randomize arrival-side ordering so clipping has no systematic buy-first bias.
      if (fillRng.uniform() < 0.5) { execute('buy', buyCount, quote.bid); execute('sell', sellCount, quote.ask) }
      else { execute('sell', sellCount, quote.ask); execute('buy', buyCount, quote.bid) }
    }
    if (c.hedgeEnabled && (step % c.hedgeEvery === 0 || expired)) {
      const target = expired ? 0 : -inventory * delta, trade = target - hedge
      hedgeCash -= trade * spot; costs += Math.abs(trade) * spot * c.hedgeCostBps / 10000; hedge = target
    }
    if (expired) { cash += inventory * referenceValue; realized += inventory * (referenceValue - basis); inventory = 0; basis = 0 }
    const unrealizedPnl = inventory * (referenceValue - basis), hedgePnl = hedgeCash + hedge * spot
    const totalPnl = numericalGuard(cash + hedgeCash + financing - costs + inventory * referenceValue + hedge * spot, 'P&L accounting')
    const valuationError = inventory * (fairValue - referenceValue), modelPnl = totalPnl + valuationError
    peak = Math.max(peak, totalPnl); const drawdown = peak - totalPnl; maxDrawdown = Math.max(maxDrawdown, drawdown)
    if (c.quoteLatencySteps > 0 && !expired) postedQuotes.push(step ? postQuote() : quote)
    observations.push({ time, spot, variance, fairValue, referenceValue, delta, referenceDelta, bid: quote.bid, ask: quote.ask, quoteAge, inventory, hedgePosition: hedge, netDelta: inventory * referenceDelta + hedge, cash: cash + hedgeCash + financing - costs, realizedPnl: realized, unrealizedPnl, hedgePnl, transactionCosts: costs, totalPnl, modelPnl, valuationError, financingPnl: financing, hedgeError, drawdown, bidFills, askFills, postingEdge, preFillMove, heldOptionPnl })
  }
  const samplePaths = [observations.map(o => o.spot)]
  for (let i = 1; i < c.samplePaths; i++) {
    const rng = randomSource(c.seed + i * 7919); let s = c.spot, v = c.dynamics === 'heston' ? c.initialVariance : c.volatility ** 2
    const path = [s]
    for (let j = 0; j < c.steps; j++) { [s, v] = checkedState(...transition(c, { spot: s, variance: v, dt, time: j * dt, history: path, rng })); path.push(s) }
    samplePaths.push(path)
  }
  // Pool each path exactly once; path zero is the traded path.
  for (const path of samplePaths) for (let j = 1; j < path.length; j++) logReturns.push(Math.log(path[j] / path[j - 1]))
  const last = observations[observations.length - 1]
  return {
    config: c, observations, samplePaths, fills, logReturns, statistics: returnStatistics(logReturns, dt),
    summary: {
      realizedPnl: last.realizedPnl, unrealizedPnl: last.unrealizedPnl, hedgePnl: last.hedgePnl, totalPnl: last.totalPnl,
      modelPnl: last.modelPnl, valuationError: last.valuationError, financingPnl: financing,
      pricingRmse: Math.sqrt(observations.reduce((sum, o) => sum + (o.fairValue - o.referenceValue) ** 2, 0) / observations.length),
      hedgeRmse: Math.sqrt(observations.slice(1).reduce((sum, o) => sum + o.hedgeError ** 2, 0) / c.steps),
      transactionCosts: costs, maxDrawdown, totalFills: fills.reduce((a, f) => a + f.count, 0), finalInventory: inventory, hedgePosition: hedge,
      averageSpreadCaptured: filledUnits ? (postingEdge + preFillMove) / filledUnits : 0,
    },
    pricingLabel: modules.pricing ? 'Custom pricing model' : { bs: 'Black–Scholes', crr: 'CRR European binomial tree', mc: 'GBM Monte Carlo', heston: 'Heston Fourier pricing', merton: 'Merton Poisson-mixture pricing' }[c.pricing],
    referenceLabel: modules.reference ? 'Custom market reference' : { gbm: 'GBM analytical reference', heston: 'Heston Fourier reference', merton: 'Merton Poisson-mixture reference' }[c.dynamics],
    warnings: [
      'Reference P&L includes cash interest, borrowing spread, stock borrow fees, and dividends; one-unit contracts.',
      c.quoteLatencySteps ? `Orders can hit quotes submitted ${c.quoteLatencySteps} market ${c.quoteLatencySteps === 1 ? 'step' : 'steps'} earlier. The maker starts with an active initial quote.` : 'The maker refreshes its quotes after each market move and before orders execute.',
      ...(c.dynamics === 'merton' ? [`Reference Q jump intensity is ${c.referenceJumpIntensityMultiplier} × physical intensity; Q log-jump mean shift is ${c.referenceJumpMeanShift}.`] : []),
      ...(c.dynamics === 'heston' ? [`The Heston reference uses numerical Fourier integration. Simulated variance uses projected Euler steps. Reference variance-risk premium: ${c.varianceRiskPremium}.`] : []),
      ...(c.pricing === 'heston' ? [`Maker variance access: ${c.hestonVarianceSource === 'observed' ? 'full information, using current simulated variance' : 'fixed configured variance assumption'}.`] : []),
    ],
  }
}
