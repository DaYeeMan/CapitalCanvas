// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import IthacaWorkbench from "./IthacaWorkbench";
import { solveOption } from "./lib/api";
import type { SolveResponse } from "./types";

vi.mock("./lib/api", () => ({ solveOption: vi.fn() }));
vi.mock("plotly.js-dist-min", () => ({ default: { react: vi.fn(), relayout: vi.fn(), purge: vi.fn(), Icons: { home: {} }, Plots: { resize: vi.fn() } } }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it("places warnings before the time slider and keeps them dismissed until another solve", async () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const warning = "Finite-difference domain may be too narrow for low truncation error.";
  const response: SolveResponse = {
    results: [{ method: "closed_form", price: 10, runtime_ms: 1, surface: { spots: [50, 150], times_to_maturity: [0, 1], prices: [[0, 50], [1, 55]] }, convergence: [], sample_paths: [], diagnostics: {}, warnings: [] }],
    estimated_operations: 1,
    warnings: [warning],
  };
  vi.mocked(solveOption).mockResolvedValue(response);
  render(<IthacaWorkbench />);

  const message = await screen.findByRole("alert");
  const slider = screen.getByRole("slider", { name: /Slice at/ });
  expect(message).toHaveTextContent(warning);
  expect(message.parentElement).toBe(slider.closest(".chart-content"));
  expect(message.compareDocumentPosition(slider) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

  fireEvent.click(within(message).getByRole("button", { name: "Dismiss message" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  fireEvent.change(slider, { target: { value: "0" } });
  expect(slider).toHaveValue("0");
  expect(screen.getByText("Slice at τ = 0.00 yr")).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Solve" }));
  await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(warning));
  expect(solveOption).toHaveBeenCalledTimes(2);
});
