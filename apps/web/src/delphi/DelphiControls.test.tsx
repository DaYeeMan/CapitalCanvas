// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { DelphiTabs } from "./DelphiControls";
import { DelphiComparison } from "./DelphiComparison";
import { DelphiMethodDetails } from "./DelphiMethodDetails";
import type { ExperimentResult } from "./types";
afterEach(cleanup);
it("labels the training spatial-validation score separately and converts IV units", () => {
  const result = { target: { kind: "implied_volatility" }, methods: [{ method: "gaussian_process", status: "complete", diagnostics: {
    gp_fit_objective: "spatial_cross_validation", gp_validation_rmse: .003, gp_length_scales: [.4, .8], gp_regularization: .01, gp_fit_evaluations: 30, gp_fit_converged: true,
  } }] } as unknown as ExperimentResult;
  render(<DelphiMethodDetails result={result} method="gaussian_process" />);
  expect(screen.getByText(/Spatial validation RMSE: 0.3 vol pts/)).toBeInTheDocument();
  expect(screen.getByText(/Training holdouts only; final-grid error is reported in the comparison table/)).toBeInTheDocument();
});
it("supports arrow keys and skips disabled uncertainty", () => {
  const change = vi.fn();
  render(<DelphiTabs label="Views" panelId="plot" value="reference" onChange={change} options={[{ value: "reference", label: "Reference" }, { value: "uncertainty", label: "GP uncertainty", disabled: true, reason: "Fit GP first" }, { value: "error", label: "Error" }]} />);
  fireEvent.keyDown(screen.getByRole("tab", { name: "Reference" }), { key: "ArrowRight" });
  expect(change).toHaveBeenCalledWith("error"); expect(screen.getByRole("tab", { name: "Error" })).toHaveFocus();
  expect(screen.getByRole("tab", { name: "GP uncertainty" })).toBeDisabled();
});
it("shows failed methods without invented metrics and converts decimal IV errors into volatility points", () => {
  const result = { target: { kind: "implied_volatility" }, methods: [
    { method: "cubic_spline", status: "complete", training_count: 16, evaluation: { full: { count: 400, mae: .002, rmse: .003, max_abs_error: .004 } }, timing: { fit_ms: 1, inference_ms: 2 } },
    { method: "mlp", status: "failed", training_count: 16, error: { message: "Diverged" } },
  ] } as unknown as ExperimentResult;
  render(<DelphiComparison result={result} active="cubic_spline" onSelect={vi.fn()} region="full" onRegion={vi.fn()} />);
  expect(screen.getByText("0.2")).toBeInTheDocument(); expect(screen.getByText("0.3")).toBeInTheDocument();
  expect(screen.getByText("Failed: Diverged")).toBeInTheDocument(); expect(screen.getAllByText("—")).toHaveLength(5);
});
