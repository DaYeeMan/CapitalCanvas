import { describe, expect, it } from "vitest";
import { ROOM_FRAME } from "./layouts";
import { partitionSections } from "./partitions";

describe("room pane and door subdivisions", () => {
  it("extends only Home's right door jamb to the next pane and keeps its left anchor", () => {
    const original = partitionSections(6.2, -2.55), revised = partitionSections(6.2, -2.55, true);
    expect(revised.door!.start).toBe(original.door!.start);
    expect(revised.door!.end).toBeCloseTo(-1.86);
    expect(revised.door!.end - revised.door!.start).toBeCloseTo(1.19);
    expect(revised.cuts.some(x => Math.abs(x + 2.05) < 1e-6)).toBe(false);
    expect(revised.panes.find(p => !p.door && p.left === revised.door!.end)?.right).toBeCloseTo(-0.62);
  });
  it("keeps room cuts ordered/bounded without slivers, overlapping or negative panes", () => {
    for (const length of [4.2, 4.4, 5.4, 6.2, 6.4]) for (const center of [undefined, -length / 2 + 0.55, length / 2 - 0.55]) {
      const { cuts, panes } = partitionSections(length, center);
      expect(new Set(cuts).size).toBe(cuts.length);
      expect(cuts[0]).toBe(-length / 2); expect(cuts.at(-1)).toBe(length / 2);
      for (let i = 1; i < cuts.length; i++) expect(cuts[i]).toBeGreaterThan(cuts[i - 1]);
      for (const pane of panes) expect(pane.right - pane.left - ROOM_FRAME.width).toBeGreaterThan(ROOM_FRAME.width);
      if (center !== undefined) expect(panes.filter(p => p.door)).toHaveLength(1);
    }
  });
});
