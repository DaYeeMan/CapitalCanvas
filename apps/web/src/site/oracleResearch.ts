import type { ResearchEntry } from "./research";

export const oracleResearch: ResearchEntry[] = [
  { id: "oracle-splines", method: "Tensor interpolation", title: "RegularGridInterpolator", authors: "SciPy contributors", year: "Living documentation", source: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.RegularGridInterpolator.html", access: "Open documentation", tools: ["Oracle"],
    summary: "Interpolates observations arranged on a rectangular grid, including tensor-product cubic splines.",
    implementation: "Oracle uses cubic interpolation on normalized spot and maturity coordinates. Every method receives the same tensor knots. Extrapolation extends the fitted spline and can violate option-price bounds; predictions remain visible with diagnostics." },
  { id: "oracle-gaussian-process", method: "Probabilistic regression", title: "Gaussian Processes for Machine Learning", authors: "Carl Edward Rasmussen & Christopher K. I. Williams", year: "2006", source: "https://gaussianprocess.org/gpml/", access: "Author-hosted book", tools: ["Oracle"],
    summary: "A treatment of regression using covariance functions and conditional Gaussian distributions.",
    implementation: "Oracle uses an exact Gaussian process with a fixed RBF kernel, training-only normalization, Monte Carlo standard errors on the diagonal, a noise floor, and bounded numerical jitter. Latent posterior standard deviation describes the fitted GP. It is neither a pricing-error guarantee nor Monte Carlo standard error; correlated reference noise is approximated diagonally." },
  { id: "oracle-adam", method: "Neural optimization", title: "Adam: A Method for Stochastic Optimization", authors: "Diederik P. Kingma & Jimmy Ba", year: "2014 / ICLR 2015", source: "https://arxiv.org/abs/1412.6980", access: "Open paper", tools: ["Oracle"],
    summary: "An optimization method that adjusts updates using estimates of gradient moments.",
    implementation: "Oracle trains two-layer tanh networks with full-batch Adam, squared error, and weight regularization. Direct and residual networks share architecture, seed, and epoch budget. Residual MLP adds a learned correction to Black–Scholes. Under the current constant-volatility GBM reference, that baseline is the analytical expectation, so the residual mainly represents Monte Carlo noise. A fixed epoch budget does not establish convergence." },
];
