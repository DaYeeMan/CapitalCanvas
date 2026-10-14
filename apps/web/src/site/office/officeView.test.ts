import { describe, expect, it } from "vitest";
import { clampPan, clampZoom, panLimits, resistPan, VIEW, wheelPixels, zoomAt } from "./officeView";

describe("bounded office view", () => {
  it("has one centered minimum view and prevents zooming past either end", () => {
    expect(clampZoom(0.3)).toBe(1); expect(clampZoom(9)).toBe(2);
    for (const size of [[1450, 900], [350, 210]]) {
      expect(panLimits(1, ...size as [number, number])).toEqual({ x: 0, y: 0 });
      expect(clampPan({ x: 999, y: -999 }, panLimits(1, ...size as [number, number]))).toEqual({ x: 0, y: 0 });
    }
  });
  it("preserves the base-fit margins at the two pan extremes", () => {
    const span = 1400, viewport = 1672, zoom = 2;
    const limit = panLimits(zoom, span, 900).x;
    expect(viewport / 2 - span * zoom / 2 + limit).toBe((viewport - span) / 2);
    expect(viewport / 2 + span * zoom / 2 - limit).toBe((viewport + span) / 2);
  });
  it("allows in-bounds drag but limits stretch in all directions, even at minimum zoom", () => {
    for (const zoom of [1, 1.2, 2]) {
      const limits = panLimits(zoom, 1400, 900);
      const inside = { x: limits.x / 2, y: -limits.y / 2 };
      expect(resistPan(inside, limits).x).toBeCloseTo(inside.x);
      expect(resistPan(inside, limits).y).toBeCloseTo(inside.y);
      for (const sign of [-1, 1]) {
        const stretch = resistPan({ x: sign * (limits.x + 10000), y: sign * (limits.y + 10000) }, limits);
        expect(Math.abs(stretch.x)).toBeGreaterThan(limits.x);
        expect(Math.abs(stretch.x)).toBeLessThanOrEqual(limits.x + VIEW.maxStretch);
        expect(Math.abs(stretch.y)).toBeLessThanOrEqual(limits.y + VIEW.maxStretch);
        expect(clampPan(stretch, limits).x).toBeCloseTo(sign * limits.x);
        expect(clampPan(stretch, limits).y).toBeCloseTo(sign * limits.y);
      }
    }
  });
  it("holds the cursor's scene point still through zoom until a boundary clamps it", () => {
    const before = { zoom: 1.2, pan: { x: 40, y: -20 } }, cursor = { x: 100, y: 70 };
    const after = zoomAt(before, 1.8, cursor, panLimits(1.8, 1400, 900));
    expect((cursor.x - after.pan.x) / after.zoom).toBeCloseTo((cursor.x - before.pan.x) / before.zoom);
    expect((cursor.y - after.pan.y) / after.zoom).toBeCloseTo((cursor.y - before.pan.y) / before.zoom);
    expect(zoomAt(after, 1, cursor, panLimits(1, 1400, 900))).toEqual({ zoom: 1, pan: { x: 0, y: 0 } });
  });
  it("normalizes trackpad, line and page wheel input", () => {
    expect(wheelPixels(32, 0, 900)).toBe(wheelPixels(2, 1, 900));
    expect(wheelPixels(-1, 2, 900)).toBe(-900);
  });
});
