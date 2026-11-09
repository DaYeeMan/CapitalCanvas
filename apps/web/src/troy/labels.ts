import type { Dynamics, PnlAttribution, Pricing } from './types';
export const dynamicsLabels: Record<Dynamics, string> = { gbm: 'Geometric Brownian Motion', heston: 'Heston', merton: 'Merton Jump Diffusion' };
export const pricingLabels: Record<Pricing, string> = { bs: 'Black–Scholes', crr: 'Cox–Ross–Rubinstein', mc: 'GBM Monte Carlo', heston: 'Heston', merton: 'Merton Jump Diffusion' };
export const hoursPerYear = 365 * 24;
export const money = (value: number) => `${value < 0 ? '−' : ''}$${Math.abs(value).toFixed(2)}`;
export const quoteTiming = (steps: number, stepYears: number) => steps
  ? `${steps} ${steps === 1 ? 'step' : 'steps'} · ${(steps * stepYears * hoursPerYear).toFixed(2)} h`
  : 'Refreshed before fills';

export const attributionLabels = [
  ['postingEdge', 'Edge at posting'],
  ['preFillMove', 'Reference move before fill'],
  ['heldOptionPnl', 'Held options'],
  ['hedgePnl', 'Held hedge and dividends'],
  ['financingPnl', 'Financing'],
  ['transactionCosts', 'Transaction fees'],
] as const satisfies ReadonlyArray<readonly [keyof PnlAttribution, string]>;
export const attributionMoney = (values: PnlAttribution, key: keyof PnlAttribution) => money(key === 'transactionCosts' ? -values[key] : values[key]);
