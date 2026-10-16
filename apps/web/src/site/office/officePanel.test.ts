import { describe, expect, it } from "vitest";
import { officePanelPlacement } from "./officePanel";

describe("desk panel safe areas", () => {
  it("keeps short landscape previews at the outer right edge instead of over the desk cluster", () => {
    for (const [width, height, panelWidth] of [[568, 320, 184], [844, 390, 224]]) {
      const placement = officePanelPlacement(width * .35, height * .5, width, height, 176, panelWidth);
      const left = width * .35 - 22 + placement.left, top = height * .5 - 22 + placement.top;
      expect(left + panelWidth).toBeCloseTo(width - Math.max(24, width * .043));
      expect(top).toBeGreaterThanOrEqual(88);
      expect(top + 176).toBeLessThanOrEqual(height - 40);
      expect(placement.gap).toBe(0);
    }
  });
  it("docks phone previews below the desks with room for the city return link", () => {
    for (const [width, height] of [[320, 568], [375, 667], [390, 844], [430, 932]]) {
      const placement = officePanelPlacement(width * 0.5, height * 0.46, width, height, 176);
      const left = width * 0.5 - 22 + placement.left, top = height * 0.46 - 22 + placement.top;
      expect(left).toBeCloseTo((width - 224) / 2);
      expect(top).toBeGreaterThan(height * 0.46 + 30);
      expect(top + 176).toBeLessThanOrEqual(height - 64);
      expect(placement.gap).toBe(0);
    }
  });
  it("keeps every panel below the header and above the footer at either desktop size, including zoomed edge anchors", () => {
    for (const [width, height] of [[1280, 720], [1440, 900]]) {
      for (const x of [12, width * 0.35, width * 0.65, width - 12]) for (const y of [90, height / 2, height - 50]) {
        const placement = officePanelPlacement(x, y, width, height, 176);
        const left = x - 22 + placement.left, top = y - 22 + placement.top;
        expect(left).toBeGreaterThanOrEqual(24);
        expect(left + 224).toBeLessThanOrEqual(width - 24);
        expect(top).toBeGreaterThanOrEqual(108);
        expect(top + 176).toBeLessThanOrEqual(height - 88);
      }
    }
  });
});
