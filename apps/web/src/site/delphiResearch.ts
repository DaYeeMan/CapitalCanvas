import type { ResearchEntry } from "./research";

export const delphiResearch: ResearchEntry[] = [
  { id: "delphi-monte-carlo", method: "Monte Carlo pricing", title: "Options: A Monte Carlo Approach", authors: "Phelim P. Boyle", year: "1977", source: "https://doi.org/10.1016/0304-405X(77)90005-8", access: "Publisher · access may vary", tools: ["Delphi"],
    summary: "Values options by simulating risk-neutral asset returns and averaging discounted payoffs, with techniques to improve simulation efficiency.",
  },
  { id: "delphi-splines", method: "Tensor interpolation", title: "RegularGridInterpolator", authors: "SciPy contributors", year: "Living documentation", source: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.RegularGridInterpolator.html", access: "Open documentation", tools: ["Delphi"],
    summary: "Interpolates observations arranged on a rectangular grid, including tensor-product cubic splines.",
  },
  { id: "delphi-gaussian-process", method: "Probabilistic regression", title: "Gaussian Processes for Machine Learning", authors: "Carl Edward Rasmussen & Christopher K. I. Williams", year: "2006", source: "https://gaussianprocess.org/gpml/", access: "Author-hosted book", tools: ["Delphi"],
    summary: "A treatment of regression using covariance functions and conditional Gaussian distributions.",
  },
  { id: "delphi-neural-approximation", method: "Neural approximation", title: "Multilayer Feedforward Networks Are Universal Approximators", authors: "Kurt Hornik, Maxwell Stinchcombe & Halbert White", year: "1989", source: "https://doi.org/10.1016/0893-6080(89)90020-8", access: "Publisher · access may vary", tools: ["Delphi"],
    summary: "Establishes the approximation capacity of feedforward neural networks with suitable activation functions and sufficiently many hidden units.",
  },
  { id: "delphi-residual-learning", method: "Multi-fidelity / residual learning", title: "SABR Equipped with AI Wings", authors: "Hideharu Funahashi", year: "2023 · online 2022", source: "https://doi.org/10.1080/14697688.2022.2150561", access: "Publisher · access may vary", tools: ["Delphi"],
    summary: "Uses neural networks to learn corrections between asymptotic implied-volatility approximations and Monte Carlo results under SABR models.",
  },
  { id: "delphi-surrogate-modeling", method: "Surrogate modeling", title: "Bayesian Calibration of Computer Models", authors: "Marc C. Kennedy & Anthony O’Hagan", year: "2001", source: "https://doi.org/10.1111/1467-9868.00294", access: "Publisher · access may vary", tools: ["Delphi"],
    summary: "Develops Bayesian calibration of computer models with uncertainty about fitted parameters and a discrepancy term for model inadequacy.",
  },
];
