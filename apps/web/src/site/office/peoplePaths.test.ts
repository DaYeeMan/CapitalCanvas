import { describe, expect, it } from "vitest";
import { navigationFor, findPath } from "./peoplePaths";
import { distance, segmentClear, pointSolidDistance, transform } from "./officeSpatial";
import { furnitureGeometry, foliageGeometry } from "./sceneResources";

describe.each(["home", "resources"] as const)("%s people navigation", floor => {
  it("bounds the actual chair backs/casters and plant leaves used in rendering", () => {
    const { space } = navigationFor(floor);
    for (const seat of space.seats) {
      const solid = space.solids.find(solid => solid.id === `${seat.id}-chair`); if (!solid) continue;
      const parts = seat.kind === "armchair" ? [furnitureGeometry.armchairCushions, furnitureGeometry.armchairLegs] : [furnitureGeometry.chairCushions, furnitureGeometry.chairFrame, seat.kind === "conference" ? furnitureGeometry.conferenceChairTrim : furnitureGeometry.chairTrim];
      for (const part of parts) {
        const bounds = part.boundingBox!;
        for (const x of [bounds.min.x, bounds.max.x]) for (const z of [bounds.min.z, bounds.max.z]) expect(pointSolidDistance(transform(seat.at, [x, z], seat.angle + Math.PI), solid), seat.id).toBeLessThan(1e-6);
      }
    }
    for (const part of foliageGeometry) {
      expect(Math.max(Math.abs(part.boundingBox!.min.x), Math.abs(part.boundingBox!.max.x))).toBeLessThan(0.5);
      expect(Math.max(Math.abs(part.boundingBox!.min.z), Math.abs(part.boundingBox!.max.z))).toBeLessThan(0.47);
    }
  });
  it("connects every rendered seat and room through safe full-stride segments", () => {
    const nav = navigationFor(floor);
    expect(nav.space.seats.filter(seat => seat.home).length).toBeGreaterThanOrEqual(9);
    expect(new Set(nav.space.seats.map(seat => seat.kind))).toEqual(new Set(["desk", "conference", "armchair", "sofa", "stool"]));
    const start = nav.nodes[nav.wander[0]].at;
    for (const seat of nav.space.seats) {
      const route = findPath(nav, start, nav.seatNodes.get(seat.id)!);
      expect(route.length, seat.id).toBeGreaterThan(0);
      expect(distance(route.at(-1)!, seat.approach)).toBeLessThan(0.01);
      let previous = start;
      for (const point of route) { expect(segmentClear(nav.space, previous, point), seat.id).toBe(true); previous = point; }
    }
    expect(nav.space.doors).toHaveLength(2);
  });
});
