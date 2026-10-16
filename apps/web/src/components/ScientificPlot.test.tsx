// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ScientificPlot } from "./ChartPanel";
import Plotly from "plotly.js-dist-min";
import type { Config, Layout, PlotlyHTMLElement } from "plotly.js";
vi.mock("plotly.js-dist-min", () => ({ default: { react: vi.fn(), relayout: vi.fn(), purge: vi.fn(), Icons: { home: {} }, Plots: { resize: vi.fn() } } }));
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

it("resets an orbited surface to its authored view instead of Plotly's generic camera", () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const camera = { eye: { x: 0.44, y: -1.36, z: 0.92 }, center: { x: 0, y: 0, z: -0.05 } };
  const layout: Partial<Layout> = { uirevision: "surface", scene: { camera } };
  const { container, rerender } = render(<ScientificPlot preserveCamera resetCameraToView data={[]} layout={layout} label="Surface" />);
  const orbited = { eye: { x: -1, y: 2, z: 1 } };
  Object.assign(container.firstElementChild!, { layout: { uirevision: "surface", scene: { camera: orbited } } });
  rerender(<ScientificPlot preserveCamera resetCameraToView data={[]} layout={{ ...layout }} label="Surface slice" />);
  const config: Partial<Config> | undefined = vi.mocked(Plotly.react).mock.calls.at(-1)?.[3];
  const reset = config?.modeBarButtonsToAdd?.find(button => typeof button !== "string" && button.name === "resetIthacaCamera");
  if (!reset || typeof reset === "string") throw new Error("Missing view reset control");
  reset.click(container.firstElementChild as PlotlyHTMLElement, new MouseEvent("click"));
  expect(Plotly.relayout).toHaveBeenCalledWith(container.firstElementChild, { "scene.camera": camera });
});

it("spaces native surface labels without replacing their rotating axis attachment", async () => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const drawTicks = vi.fn(), drawLabel = vi.fn();
  const scene = { axesOptions: { tickPad: [18, 18, 18], labelPad: [30, 30, 30] }, glplot: { axes: { _text: { drawTicks, drawLabel } }, redraw: vi.fn() } };
  vi.mocked(Plotly.react).mockImplementationOnce((node: HTMLElement) => {
    Object.assign(node, { _fullLayout: { scene: { _scene: scene } } });
    return Promise.resolve(node as PlotlyHTMLElement);
  });
  const { unmount } = render(<ScientificPlot spaceAxisLabels data={[]} layout={{ scene: { zaxis: { title: { text: "Price" } } } }} label="Surface" />);
  await act(async () => {});
  expect(scene.axesOptions.tickPad).toEqual([28, 28, 18]);
  expect(scene.axesOptions.labelPad).toEqual([84, 84, 30]);
  expect(scene.glplot.redraw).toHaveBeenCalledOnce();
  expect(vi.mocked(Plotly.react).mock.calls.at(-1)?.[2]?.scene?.zaxis?.title?.text).toBe("Price");
  expect(vi.mocked(Plotly.react).mock.calls.at(-1)?.[2]?.scene?.zaxis?.labelalias).toBeUndefined();
  unmount();
  expect(scene.glplot.axes._text.drawTicks).toBe(drawTicks);
  expect(scene.glplot.axes._text.drawLabel).toBe(drawLabel);
});
