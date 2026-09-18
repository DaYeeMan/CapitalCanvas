# Numerical design

## Coordinate and unit contract

Use two coordinates: spot `S` and time to maturity `tau`. Strike `K`, rate `r`, dividend yield `q`, and GBM volatility `sigma` are fixed for a reference. Price and IV share this coordinate convention. A formatted `S/K` axis is a view transform only; do not describe it as a strike sweep.

Arrays are row-major `[maturity_index][spot_index]`. Prices use the configured currency unit, times use years, and rates/IV use decimals internally. Display IV values as percentages and IV errors as percentage points: a decimal error of 0.002 is 0.2 volatility points, not 0.002%.

## Reference generation

Reuse existing GBM payoff, antithetic-pair error estimation, market parameters, Black–Scholes pricing, and cooperative execution primitives. Avoid generating Ithaca convergence plots and sample paths solely to serve Oracle. If extraction is needed, preserve Ithaca behavior and verify it before and after extraction.

For each maturity, evaluate discounted terminal payoffs from exact GBM terminal draws. Reuse common random numbers across surface nodes to reduce artificial surface roughness. At `tau = 0`, price is the payoff and MC standard error is zero. At `S = 0`, implement the price boundary explicitly; the initial UI default uses positive spots.

Return the price matrix, standard-error matrix, coordinate arrays, configuration, algorithm version, reference ID, seed, path count, and reference generation time. Chunk work by maturity and spot/path blocks as needed to bound temporary arrays. Chunked accumulation must preserve antithetic pairs and yield statistically correct standard errors, not treat paired paths as independent observations.

Common random numbers correlate node errors. They improve comparisons but mean a diagonal GP observation-noise approximation is not a full MC covariance model. Disclose this limitation.

Use request-local random generators with fixed named seed streams. Reference generation must be independent of selected methods and their order. Derive direct and residual MLP initialization streams deterministically; use matching initialization for their default shared architecture. Record generator/algorithm versions. Reproducibility means the same environment and configuration agree within documented floating-point tolerance, not bitwise identity across every BLAS/platform. NumPy documents independent streams through `SeedSequence`; never share mutable RNG state between requests. [NumPy parallel random generation](https://numpy.org/doc/stable/reference/random/parallel.html)

## Implied-volatility conversion

Derive IV by inverting Black–Scholes price at each MC node. Fit IV surrogates to those converted IV values directly; do not silently fit prices and call their outputs IV predictions.

Validate discounted no-arbitrage bounds first. Calls lie between `max(S exp(-q tau) − K exp(-r tau), 0)` and `S exp(-q tau)`; puts use the analogous discounted strike bound. At positive time, require an identifiable finite root and adequate vega. Use a bounded bracketed solver with a documented volatility bracket (initial proposal `1e-6` to `5.0`) and explicit tolerance/iteration limits. Return a reason code when inversion is impossible or ill-conditioned.

Mask zero maturity, invalid prices, non-finite results, unbracketed roots, and nodes below the chosen vega threshold. Do not clip an out-of-bounds MC estimate into a valid IV or substitute theoretical volatility as if it were observed. Keep mask counts/reasons visible.

The optional IV noise estimate is `price_standard_error / vega` for sufficiently well-conditioned nodes. Label it a local approximation, not an exact IV confidence interval. Use it consistently in the GP's diagonal noise term.

To retain a tensor-grid spline, select a deterministic valid Cartesian training lattice from the requested region. First attempt the normal lattice; if it contains invalid IV nodes, fail the shared sampling step with offending counts and actionable guidance to narrow the domain or increase paths. Do not drop only those nodes or impute them for one method. The initial release does not search for a different hidden training domain. Invalid evaluation nodes outside the lattice remain masked for every method.

GBM's expected IV surface is flat. An IV smile in generated artwork is not a requirement. Document noise amplification at small vega and avoid implying calibration to observed markets.

## Training sampling

Use a single deterministic uniform tensor-grid sampler. Supported budgets initially are 16 (4×4), 32 (4×8), 64 (8×8), 128 (8×16), and 256 (16×16), expressed as maturity × spot. Each axis requires at least four distinct nodes for cubic interpolation. SciPy's cubic regular-grid interpolation requires at least four points per axis. [SciPy RegularGridInterpolator](https://docs.scipy.org/doc/scipy/reference/generated/scipy.interpolate.RegularGridInterpolator.html)

Select evenly spaced indices including the training-region endpoints. Round deterministically, validate uniqueness, and reject regions with insufficient nodes. Training values are indexed from the reference; never run additional MC for a particular method. Return exact row/column indices, values, noise estimates, bounds, count, sampler version, and sample-set ID.

All selected methods at one budget receive the identical sample object. Budgets are independently uniform lattices and are not guaranteed nested on a 61×51 grid. State this in budget help text; do not claim that every larger budget strictly contains the smaller one. Nested/adaptive sampling is deferred.

The reference evaluation grid is distinct from the subset supplied to training. No full-grid targets may enter normalization, hyperparameter tuning, early stopping, residual fitting, or model selection. Evaluation receives the full reference only after prediction.

## Shared preprocessing

Normalize coordinates using the realized training bounds. Do not clip normalized coordinates outside those bounds; that would hide extrapolation. Guard against zero-width axes. Normalize targets using training-only mean and standard deviation with a numerical floor for nearly constant data. Restore physical target units before computing metrics and predictive standard deviations.

For near-constant IV targets, diagnostics report the scale floor. Store transformations with the fitted model during the request. Baseline values at query nodes are allowed for residual reconstruction; reference targets at query nodes are not.

## Cubic spline

Use SciPy tensor-product cubic interpolation on the sampled Cartesian grid. Fix boundary behavior in the adapter rather than leaving it as undocumented library default. Evaluate the full domain; explicitly enable polynomial continuation for outside-domain experiments and attach an extrapolation warning. No clipping to the training boundary or switching silently to linear/nearest interpolation.

The phase 1 feasibility probe found that SciPy's default iterative construction tolerance left approximately 1e-3 price-unit knot error on the benchmark. Use explicit `solver_args={"rtol": 1e-12, "atol": 1e-12}` for the planned adapter; this reduced benchmark knot error to about 1e-10. Verify this setting on the production adapter's own fixtures in milestone 2.

Test knot reproduction, orientation, affine/bicubic fixtures, edge behavior, and extrapolated values. Cubic interpolation can overshoot and does not enforce option arbitrage bounds; preserve raw predictions for honest error measurement and report violations.

## Gaussian process

Implement a small exact GP using existing NumPy/SciPy linear algebra: a fixed RBF kernel on normalized coordinates, constant training mean via centering, heteroscedastic diagonal noise from MC standard-error estimates, and a small numeric jitter floor. Initial normalized length scale is 0.35 per axis and normalized signal variance is 1; expose only bounded advanced controls. Automatic kernel optimization is deferred.

Factor the training covariance using Cholesky and solve linear systems; do not form its inverse. Predict mean and latent function variance in query batches. Add jitter through a bounded retry schedule and record the final value. Tiny negative variance from roundoff may clamp to zero within a documented tolerance; materially negative variance is a diagnostic failure. The GP formulation and the distinction between latent uncertainty and noisy observations follow standard GP regression. [Gaussian Processes for Machine Learning](https://gaussianprocess.org/gpml/chapters/RW.pdf)

Return latent predictive standard deviation in physical target units. It is model-dependent uncertainty, not reference standard error, a guarantee of coverage, or an exact measure of surrogate error. Training size is capped at 256 for this release. If more samples are introduced later, never silently subsample only the GP in a supposedly fair comparison.

## Direct MLP

Use a small CPU NumPy implementation to avoid a new heavy runtime and to support explicit epoch/batch cancellation. Default architecture: 2 inputs, two hidden layers of width 32, tanh activation, one linear output. Train normalized targets using mean squared error plus L2 weight regularization, seeded Xavier initialization, and bounded full-batch Adam. Initial proposals: 300 epochs, learning rate 0.01, L2 coefficient 1e-4. Define the exact loss normalization and regularization convention in tests.

Use the same training rows for all methods. Do not remove an MLP-only validation subset while still claiming it trained on all samples. Initial stopping is a fixed epoch budget with finite-loss checks; optional training-loss convergence stopping must be deterministic and report completed epochs. No evaluation-grid early stopping or hidden hyperparameter search.

The cost of this dependency decision is ownership of small backpropagation and Adam routines. Before exposing them, require finite-difference gradient checks and known-function convergence tests. If this cannot be maintained cleanly, record a scoped dependency decision at milestone 0 rather than adding an unreviewed ML framework mid-implementation.

## Residual MLP

Define a minimal baseline interface `evaluate(coordinates, market, target)` with identity/version metadata. The first implementation is same-parameter Black–Scholes: price for a price target and constant `sigma` for an IV target.

At training nodes, compute `residual = MC_target − baseline_target`. Fit the same MLP machinery on these residuals. Reconstruct predictions as `baseline(query) + predicted_residual(query)`. Include baseline evaluation in fit and inference timing where it occurs. Return baseline-only metrics as context, not as a fifth surrogate row competing on a different data budget.

Normalize residuals from training residuals only, with a scale floor. Preserve negative corrections. Do not force final predictions positive, within no-arbitrage bounds, or close to the baseline after evaluation. Report violations instead of improving metrics through hidden clipping.

Under the initial GBM reference, Black–Scholes is the underlying analytical expectation. This makes residual learning largely a fit to MC noise. Explain that limitation and never use a regression test asserting that residual MLP must outperform all methods.

## Metrics and evaluation masks

For an explicitly defined set `E`, let `e_i = prediction_i − reference_i`:

- `MAE = sum(abs(e_i)) / |E|`.
- `RMSE = sqrt(sum(e_i²) / |E|)`.
- `max_abs_error = max(abs(e_i))`.
- Absolute error surface stores `abs(e_i)` wherever reference and prediction are valid.

Return metrics for full valid grid, unseen grid nodes (exclude the shared training indices), interpolation region, and extrapolation region, including unseen intersections where applicable. A boundary node belongs to interpolation; outside means outside either training-axis interval. Return counts for every mask and null metrics when a set is empty.

Use one common validity mask for comparisons across successful methods. If a method has non-finite predictions on valid reference nodes, mark that method failed rather than quietly excluding difficult nodes to improve its score. Invalid reference nodes are excluded for all methods and remain visible as gaps. Report surface coverage explicitly.

Budget curves default to full valid grid, whose denominator is fixed across the sweep. Unseen-node curves may be offered with a note that their node set changes as training sets change. All metrics are comparisons with a noisy reference, not independent estimates of error against exact prices.

## Timing protocol

Use server monotonic/performance timing. Reference time includes simulation and, separately labeled, IV conversion. Fit time includes method preprocessing, construction/training, and residual baseline construction. Inference time measures a single complete prediction over the same evaluation grid, including transforms, baseline reconstruction, and GP uncertainty calculation. Return predicted-node count and state that GP inference includes variance.

Exclude network, serialization, plot rendering, and metric calculation from fit/inference times; show total request time separately if useful. Record that these are single-run observations affected by warmup and host load. Do not claim stable rankings from tiny timing differences or rerun training solely to beautify timings.
