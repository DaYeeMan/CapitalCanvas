// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ScientificPlot } from "./ChartPanel";
import Plotly from "plotly.js-dist-min";
import type { Layout } from "plotly.js";
vi.mock("plotly.js-dist-min", () => ({ default: { react: vi.fn(), purge: vi.fn(), Plots: { resize: vi.fn() } } }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
it("retains the camera across views and resets it when the domain revision changes", () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const layout: Partial<Layout> = { uirevision: "domain-a", scene: { camera: { eye: { x: 1, y: 1, z: 1 } } } };
  const { container, rerender } = render(<ScientificPlot preserveCamera data={[]} layout={layout} label="Surface" />);
  const camera = { eye: { x: -2, y: 3, z: 1 } };
  Object.assign(container.firstElementChild!, { layout: { uirevision: "domain-a", scene: { camera } } });
  rerender(<ScientificPlot preserveCamera data={[]} layout={{ ...layout }} label="Error" />);
  expect(vi.mocked(Plotly.react).mock.calls.at(-1)?.[2]?.scene?.camera).toEqual(camera);
  rerender(<ScientificPlot preserveCamera data={[]} layout={{ ...layout, uirevision: "domain-b" }} label="New domain" />);
  expect(vi.mocked(Plotly.react).mock.calls.at(-1)?.[2]?.scene?.camera).toEqual(layout.scene?.camera);
});
it("ignores a delayed resize rejection after the chart unmounts", async () => {
  let resized!: () => void, reject!: (error: Error) => void;
  const disconnect = vi.fn();
  vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { resized = callback; } observe() {} disconnect = disconnect; });
  vi.mocked(Plotly.Plots.resize).mockReturnValue(new Promise((_, no) => { reject = no; }));
  const errors = vi.spyOn(console, "error").mockImplementation(() => {});
  const { container, unmount } = render(<ScientificPlot data={[]} layout={{}} label="Test surface" />);
  const node = container.firstElementChild!;
  node.classList.add("js-plotly-plot");
  vi.spyOn(node, "getClientRects").mockReturnValue([{ width: 100, height: 100 }] as unknown as DOMRectList);
  act(resized); expect(Plotly.Plots.resize).toHaveBeenCalledTimes(1);
  unmount(); await act(async () => reject(new Error("Resize must be passed a displayed plot div element.")));
  expect(disconnect).toHaveBeenCalled(); expect(Plotly.purge).toHaveBeenCalledWith(node); expect(errors).not.toHaveBeenCalled();
});
