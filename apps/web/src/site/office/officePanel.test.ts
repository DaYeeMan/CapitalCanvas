import { describe, expect, it } from "vitest";
import { officePanelPlacement } from "./officePanel";

describe("desk panel safe areas", () => {
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
