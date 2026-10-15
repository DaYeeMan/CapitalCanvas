import { describe, expect, it } from "vitest";
import type { Box } from "./TowerAssembly";
import { cityRoadParts } from "./cityRoads";
import { DISTRICT_BUILDINGS } from "./towerStructure";

const plots = [{ x: 0, z: 0, width: 27.2, depth: 27.2 },
  ...DISTRICT_BUILDINGS.map(b => ({ ...b, width: b.width + 5, depth: b.depth + 5 }))];
const parts = cityRoadParts(plots);
const roads = [...parts.roads, ...parts.farRoads];
const area = (a: Box, b: Box) => Math.max(0, Math.min(a.at[0] + a.size[0] / 2, b.at[0] + b.size[0] / 2)
  - Math.max(a.at[0] - a.size[0] / 2, b.at[0] - b.size[0] / 2))
  * Math.max(0, Math.min(a.at[2] + a.size[2] / 2, b.at[2] + b.size[2] / 2)
  - Math.max(a.at[2] - a.size[2] / 2, b.at[2] - b.size[2] / 2));
const covers = (box: Box, x: number, z: number) => Math.abs(box.at[0] - x) < box.size[0] / 2
  && Math.abs(box.at[2] - z) < box.size[2] / 2;

describe("grounded city streets", () => {
  it("connects the left background street continuously to the diagonal road", () => {
    for (const z of [2.1, 5.1, 8.1, 11.1, 14.1, 17.1, 20.1]) {
      expect(roads.filter(box => covers(box, -64.9, z))).toHaveLength(1);
    }
  });
  it("gives intersections a single asphalt surface without coplanar overlaps", () => {
    for (let i = 0; i < roads.length; i++) for (const other of roads.slice(i + 1)) {
      expect(area(roads[i], other)).toBeLessThan(1e-8);
    }
    // This left-hand junction previously overlapped light and dark roads.
    expect(roads.filter(box => covers(box, -36.9, 17.1))).toHaveLength(1);
    expect(roads.filter(box => covers(box, 17.1, 17.1))).toHaveLength(1);
  });
  it("keeps pale sidewalk strips outside asphalt and existing building plots", () => {
    for (const sidewalk of parts.sidewalks) {
      for (const road of roads) expect(area(sidewalk, road)).toBeLessThan(1e-8);
      for (const plot of plots) expect(area(sidewalk, { at: [plot.x, 0, plot.z], size: [plot.width, 1, plot.depth] })).toBeLessThan(1e-8);
    }
    expect(parts.sidewalks.some(box => covers(box, 12.9, 23.1))).toBe(true);
    expect(parts.sidewalks.some(box => covers(box, 23.1, 12.9))).toBe(true);
  });
  it("extends exactly the two central streets past the foreground buildings", () => {
    expect(roads.some(box => covers(box, 17.1, 60.1))).toBe(true);
    expect(roads.some(box => covers(box, 60.1, 17.1))).toBe(true);
    expect(roads.some(box => covers(box, 42.2, 60.1))).toBe(false);
    expect(roads.some(box => covers(box, 60.1, 42.2))).toBe(false);
  });
  it("keeps every surface positive and road paint safely above asphalt", () => {
    for (const box of [...roads, ...parts.sidewalks, ...parts.markings]) {
      expect([...box.at, ...box.size].every(Number.isFinite)).toBe(true);
      expect(box.size.every(size => size >= 0.01)).toBe(true);
    }
    const asphaltTop = Math.max(...roads.map(box => box.at[1] + box.size[1] / 2));
    expect(parts.markings.every(box => box.at[1] - box.size[1] / 2 > asphaltTop + 0.01)).toBe(true);
  });
});
