import { describe, expect, it } from "vitest";
import { BUILDING, CAMERA } from "./layouts";
import { floorTravelDistance, SURROUNDING_BLOCKS, SURROUNDINGS, surroundingsPosition } from "./surroundings";
import { materials } from "./sceneResources";

describe("rendered office surroundings", () => {
  it("keeps the ground and every stack below the complete slide envelope at every fit", () => {
    const forward = CAMERA.position.map(v => v / Math.hypot(...CAMERA.position));
    for (const span of [18, 20, 28, 55, 110]) {
      const travel = floorTravelDistance(span);
      const lowestOffice = -travel - BUILDING.slab;
      // At the deepest corner of the incoming floor, scenery is still farther
      // from the fixed camera, proving no occlusion for any zoom/pan/progress.
      const backOfOffice = -forward[0] * (BUILDING.width + BUILDING.wallThickness) / 2
        + lowestOffice * forward[1] - forward[2] * (BUILDING.depth + BUILDING.wallThickness) / 2;
      for (const progress of [0, 0.2, 0.5, 0.8, 1]) {
        const root = surroundingsPosition(span, progress);
        expect(root[1]).toBeLessThan(lowestOffice);
        for (const block of SURROUNDING_BLOCKS) {
          expect(root[1] + block.at[1] + block.size[1] / 2).toBeLessThan(lowestOffice);
          const nearestFace = block.at.reduce((sum, v, i) => sum + (root[i] + v + block.size[i] / 2) * forward[i], 0);
          expect(nearestFace).toBeLessThan(backOfOffice);
          const maxX = root[0] + block.at[0] + block.size[0] / 2;
          const maxZ = root[2] + block.at[2] + block.size[2] / 2;
          expect(maxX < -BUILDING.width / 2 || maxZ < -BUILDING.depth / 2).toBe(true);
        }
      }
    }
  });
  it("has deterministic near/middle/far groups, non-glowing materials and no idle movement", () => {
    expect(SURROUNDING_BLOCKS).toHaveLength(33);
    for (const depth of ["near", "middle", "far"]) expect(SURROUNDING_BLOCKS.filter(b => b.depth === depth).length).toBeGreaterThan(3);
    expect(new Set(SURROUNDING_BLOCKS.map(b => b.size.join(","))).size).toBeGreaterThan(20);
    expect(Math.max(...SURROUNDING_BLOCKS.map(b => b.at[1] + b.size[1] / 2))).toBe(SURROUNDINGS.maxHeight);
    expect(materials.outside.emissive.getHex()).toBe(0);
    expect(materials.outsideGround.emissive.getHex()).toBe(0);
    expect(materials.outside.color.r).toBeGreaterThan(0.9);
    expect(materials.outside.fog).toBe(true);
    const home = surroundingsPosition(20, 0), resources = surroundingsPosition(20, 1);
    expect(resources[1] - home[1]).toBe(SURROUNDINGS.shift);
    expect(resources[0]).toBe(home[0]); expect(resources[2]).toBe(home[2]);
    expect(surroundingsPosition(20, 0.5)).toEqual(surroundingsPosition(20, 0.5));
  });
});
