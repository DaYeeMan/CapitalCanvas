import { describe, expect, it } from "vitest";
import { Mesh, MeshBasicMaterial, Raycaster, Vector3 } from "three";
import type { Box } from "./TowerAssembly";
import { cityRoadParts } from "./cityRoads";
import { DISTRICT_BUILDINGS, TOWER_PLOT, TOWER_SIDEWALK } from "./towerStructure";
import { towerSidewalkGeometry } from "./cityPlot";

const plots = [TOWER_PLOT,
  ...DISTRICT_BUILDINGS.map(b => ({ ...b, width: b.width + 5, depth: b.depth + 5 }))];
const parts = cityRoadParts([TOWER_SIDEWALK, ...plots.slice(1)]);
const walk = new Mesh(towerSidewalkGeometry(), new MeshBasicMaterial());
const hitsWalk = (x: number, z: number) => new Raycaster(new Vector3(x, 1, z), new Vector3(0, -1, 0)).intersectObject(walk);
const roads = [...parts.roads, ...parts.farRoads];
const area = (a: Box, b: Box) => Math.max(0, Math.min(a.at[0] + a.size[0] / 2, b.at[0] + b.size[0] / 2)
  - Math.max(a.at[0] - a.size[0] / 2, b.at[0] - b.size[0] / 2))
  * Math.max(0, Math.min(a.at[2] + a.size[2] / 2, b.at[2] + b.size[2] / 2)
  - Math.max(a.at[2] - a.size[2] / 2, b.at[2] - b.size[2] / 2));
const covers = (box: Box, x: number, z: number) => Math.abs(box.at[0] - x) < box.size[0] / 2
  && Math.abs(box.at[2] - z) < box.size[2] / 2;

describe("grounded city streets", () => {
  it("joins the left neighbour without an alley gap or holes at its rounded corners", () => {
    const neighbour = plots[1], edge = neighbour.x + neighbour.width / 2;
    expect(TOWER_SIDEWALK.x - TOWER_SIDEWALK.width / 2).toBeCloseTo(edge);
    for (const [x, z] of [[-16.1, 11.1], [-16.1, 12.3], [-16.1, 12.9], [edge - 0.1, 12.3], [edge - 0.1, -4.5]]) {
      expect(hitsWalk(x, z)[0]?.point.y).toBeCloseTo(0.2);
      expect(parts.sidewalks.some(box => covers(box, x, z))).toBe(false);
    }
    expect(hitsWalk(edge - 0.1, neighbour.z)).toHaveLength(0);
  });
  it("preserves the complete front and rear sidewalk widths after trimming the back of the plot", () => {
    for (const [x, z] of [[12.5, 0], [13.3, 0], [0, 12.5], [0, 13.3], [13.3, 13.3], [0, -14.4], [0, -13.5]]) {
      expect(hitsWalk(x, z).length).toBeGreaterThan(0);
      expect(parts.sidewalks.some(box => covers(box, x, z))).toBe(false);
    }
    const main = plots[0];
    const plotBox: Box = { at: [main.x, 0, main.z], size: [main.width, 1, main.depth] };
    for (const road of roads) expect(area(plotBox, road)).toBeLessThan(1e-8);
  });
  it("fills the rounded corner cutouts at sidewalk height without covering the plot or asphalt", () => {
    const p = TOWER_PLOT;
    for (const dx of [-1, 1]) for (const dz of [-1, 1]) {
      const x = p.x + dx * (p.width / 2 - 0.1), z = p.z + dz * (p.depth / 2 - 0.1);
      expect(hitsWalk(x, z)[0]?.point.y).toBeCloseTo(0.2);
      expect(hitsWalk(x, z + dz * 0.2)[0]?.point.y).toBeCloseTo(0.2);
    }
    for (const [x, z] of [[p.x, p.z], [13.7, 0], [0, 13.7], [0, -14.7]]) expect(hitsWalk(x, z)).toHaveLength(0);
    const apron: Box = { at: [TOWER_SIDEWALK.x, 0, TOWER_SIDEWALK.z], size: [TOWER_SIDEWALK.width, 1, TOWER_SIDEWALK.depth] };
    for (const box of [...roads, ...parts.sidewalks]) expect(area(apron, box)).toBeLessThan(1e-8);
  });
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
