import { expect, it, vi } from "vitest";
import { spaceSurfaceAxisLabels, type SurfaceScene } from "./surface-axis-labels";

// Project the actual arguments sent to Plotly's text renderer. An orbit that
// moves the visible axis corner must change its anchor, never the screen gap.
it.each([0, 1.7, 3.5])("keeps Price ticks 26px left and its title 60px left after orbit %s", angle => {
  const c = Math.cos(angle), s = Math.sin(angle);
  const model = [2, 0, 0, 0, 0, 3, 0, 0, 0, 0, 4, 0, -1, -1.5, -2, 1];
  const view = [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, -5, 1];
  const projection = [0.5, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  const drawTicks = vi.fn(), drawLabel = vi.fn();
  const scene = {
    axesOptions: { tickPad: [], labelPad: [] },
    glplot: {
      canvas: { clientWidth: 1000 }, cameraParams: { model, view, projection }, redraw: vi.fn(),
      axes: { bounds: [[0, 0, 0], [1, 1, 1]], lastCubeProps: { cubeEdges: [0, 0, angle ? 3 : 0] }, _text: { drawTicks, drawLabel } },
    },
  } as unknown as SurfaceScene;
  const restore = spaceSurfaceAxisLabels(scene);
  const text = scene.glplot.axes._text;
  const corner = angle ? 1 : 0;
  const project = (point: number[]) => {
    const x = 2 * point[0] - 1, y = 3 * point[1] - 1.5, z = 4 * point[2] - 2;
    return [(c * x - s * z) * 0.5 * 500, y * 500];
  };
  // Price starts at z=0; the adapter must not hide or move it down the axis.
  text.drawTicks(2, 12, 0, [9, 9, 0], [], [0, 0, 1], [], []);
  text.drawLabel(2, 12, 0, [9, 9, 0.5], [], [0, 0, 0], [], []);
  for (const [call, z, gap] of [[drawTicks.mock.calls[0], 0, 26], [drawLabel.mock.calls[0], 0.5, 60]] as const) {
    const positioned = project(call[3]);
    const axis = project([corner, corner, z]);
    expect(positioned[0]).toBeCloseTo(axis[0] - gap);
    expect(positioned[1]).toBeCloseTo(axis[1]);
    expect(call[7][0]).toBe(-1); // Horizontal ticks; explicitly rotated title.
  }
  text.drawTicks(0, 12, 0, [1, 2, 3], [], [], [], []);
  expect(drawTicks.mock.calls.at(-1)?.[3]).toEqual([1, 2, 3]);
  restore();
  expect(text.drawTicks).toBe(drawTicks);
  expect(text.drawLabel).toBe(drawLabel);
});
