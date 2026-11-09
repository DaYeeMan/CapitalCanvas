/** European reference formulas. Heston uses the stable (negative-exponential) characteristic function. */
export const normalCdf = (x: number) => {
  const z = Math.abs(x), t = 1 / (1 + 0.2316419 * z)
  const p = 1 - Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI) * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))))
  return x >= 0 ? p : 1 - p
}
const intrinsic = (s: number, k: number, put: boolean) => Math.max(put ? k - s : s - k, 0)
export function blackScholes(spot: number, strike: number, time: number, rate: number, volatility: number, optionType: 'call' | 'put', dividendYield = 0) {
  const put = optionType === 'put'
  if (time <= 0) return intrinsic(spot, strike, put)
  const s = spot * Math.exp(-dividendYield * time), k = strike * Math.exp(-rate * time)
  if (volatility === 0) return intrinsic(s, k, put)
  const d1 = (Math.log(spot / strike) + (rate - dividendYield + volatility ** 2 / 2) * time) / (volatility * Math.sqrt(time)), d2 = d1 - volatility * Math.sqrt(time)
  return Math.max(0, put ? k * normalCdf(-d2) - s * normalCdf(-d1) : s * normalCdf(d1) - k * normalCdf(d2))
}

export function mertonPrice(s: number, k: number, t: number, r: number, q: number, sigma: number, intensity: number, mean: number, jumpVol: number, side: 'call' | 'put') {
  if (t <= 0) return intrinsic(s, k, side === 'put')
  if (!intensity || (!mean && !jumpVol)) return blackScholes(s, k, t, r, sigma, side, q)
  const lambda = intensity * t, expectedJump = Math.exp(mean + jumpVol ** 2 / 2), tilted = lambda * expectedJump
  // Share-weighted and ordinary Poisson sums avoid overflowing conditional spot prices.
  const end = Math.ceil(Math.max(lambda, tilted) + 12 * Math.sqrt(Math.max(lambda, tilted)) + 32)
  if (!Number.isFinite(end) || end > 10000) throw new Error('Merton pricing budget exceeded; reduce jump parameters or maturity.')
  let logFactorial = 0, stockProbability = 0, strikeProbability = 0
  for (let n = 0; n <= end; n++) {
    if (n) logFactorial += Math.log(n)
    const variance = sigma ** 2 * t + n * jumpVol ** 2
    const logMoneyness = Math.log(s / k) + (r - q - intensity * (expectedJump - 1) - sigma ** 2 / 2) * t + n * mean
    const d2 = variance ? logMoneyness / Math.sqrt(variance) : (logMoneyness > 0 ? Infinity : -Infinity)
    stockProbability += Math.exp(-tilted + n * Math.log(tilted) - logFactorial) * normalCdf(d2 + Math.sqrt(variance))
    strikeProbability += Math.exp(-lambda + n * Math.log(lambda) - logFactorial) * normalCdf(d2)
  }
  const discountedS = s * Math.exp(-q * t), discountedK = k * Math.exp(-r * t)
  const call = discountedS * stockProbability - discountedK * strikeProbability
  return Math.max(0, side === 'call' ? call : call - discountedS + discountedK)
}

type Complex = [number, number]
const add = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]]
const sub = (a: Complex, b: Complex): Complex => [a[0] - b[0], a[1] - b[1]]
const scale = (a: Complex, x: number): Complex => [a[0] * x, a[1] * x]
const mul = (a: Complex, b: Complex): Complex => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]]
const div = (a: Complex, b: Complex): Complex => {
  const d = b[0] ** 2 + b[1] ** 2
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]
}
const exp = (a: Complex): Complex => scale([Math.cos(a[1]), Math.sin(a[1])], Math.exp(a[0]))
const log = (a: Complex): Complex => [Math.log(Math.hypot(...a)), Math.atan2(a[1], a[0])]
const sqrt = (a: Complex): Complex => {
  const size = Math.hypot(...a)
  return [Math.sqrt(Math.max(0, (size + a[0]) / 2)), Math.sign(a[1]) * Math.sqrt(Math.max(0, (size - a[0]) / 2))]
}

export function hestonMark(s: number, k: number, t: number, r: number, q: number, v: number, theta: number, kappa: number, xi: number, rho: number, side: 'call' | 'put') {
  const integrated = kappa > 1e-10 ? theta * t + (v - theta) * -Math.expm1(-kappa * t) / kappa : v * t
  const logForwardMoneyness = Math.log(s / k) + (r - q) * t
  const discount = Math.exp(-q * t)
  if (xi < 1e-5 || (v === 0 && kappa * theta === 0) || t <= 0) {
    const std = Math.sqrt(Math.max(0, integrated))
    const exercise = std ? normalCdf((logForwardMoneyness + integrated / 2) / std) : (1 + Math.sign(logForwardMoneyness)) / 2
    return {
      value: blackScholes(s, k, t, r, t > 0 ? std / Math.sqrt(t) : 0, side, q),
      delta: discount * (exercise - Number(side === 'put')),
    }
  }
  const one: Complex = [1, 0]
  // CF of log(S_T / forward), on the Lewis contour Im(u) = -1/2.
  const phi = (u: number): Complex => {
    const z: Complex = [u, -0.5], iz: Complex = [0.5, u]
    const b = sub([kappa, 0], scale(iz, rho * xi))
    const d = sqrt(add(mul(b, b), scale(add(mul(z, z), iz), xi ** 2)))
    const bd = sub(b, d), g = div(bd, add(b, d)), decay = exp(scale(d, -t))
    const denominator = sub(one, mul(g, decay))
    const C = scale(sub(scale(bd, t), scale(log(div(denominator, sub(one, g))), 2)), kappa * theta / xi ** 2)
    const D = scale(mul(bd, div(sub(one, decay), denominator)), 1 / xi ** 2)
    return exp(add(C, scale(D, v)))
  }
  // Composite Simpson; bounded work, resolving the near-origin pole and oscillations.
  const upper = Math.min(4000, Math.max(160, 16 / Math.sqrt(Math.max(integrated, 1e-5))))
  const n = 2 * Math.ceil(upper / 0.1 / 2), h = upper / n
  let integral = 0, logSpotDerivative = 0
  for (let j = 0; j <= n; j++) {
    const u = j * h, [real, imaginary] = phi(u)
    const cos = Math.cos(u * logForwardMoneyness), sin = Math.sin(u * logForwardMoneyness)
    const weight = (j === 0 || j === n ? 1 : j % 2 ? 4 : 2) / (u * u + 0.25)
    integral += weight * (cos * real - sin * imaginary)
    logSpotDerivative -= weight * u * (sin * real + cos * imaginary)
  }
  const discountedS = s * discount, discountedK = k * Math.exp(-r * t)
  const factor = Math.sqrt(s * k) * Math.exp(-(r + q) * t / 2) * h / (3 * Math.PI)
  const call = discountedS - factor * integral
  // Differentiate the same Fourier integral with variance held fixed.
  const rawDelta = discount - factor / s * (integral / 2 + logSpotDerivative)
  const lower = Math.max(0, discountedS - discountedK)
  if (!Number.isFinite(call) || call < lower - 0.02 || call > discountedS + 0.02) throw new Error('Heston integration failed; reduce extreme parameters or maturity.')
  const boundedCall = Math.max(lower, Math.min(discountedS, call))
  const callDelta = call < lower ? (discountedS > discountedK ? discount : 0) : Math.max(0, Math.min(discount, rawDelta))
  return { value: side === 'call' ? boundedCall : Math.max(0, boundedCall - discountedS + discountedK), delta: callDelta - (side === 'put' ? discount : 0) }
}
