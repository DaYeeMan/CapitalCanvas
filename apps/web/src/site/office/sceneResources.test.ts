import { describe, expect, it } from "vitest";
import { Vector3 } from "three";
import { foliageGeometry, furnitureGeometry, roundedBox } from "./sceneResources";

describe("refined furniture and foliage envelopes", () => {
  it("rounds thin cushions in world units while preserving their authored bounds", () => {
    const size: [number, number, number] = [0.92, 0.22, 0.86];
    const cushion = roundedBox(size);
    expect(roundedBox([...size])).toBe(cushion);
    cushion.computeBoundingBox();
    const dimensions = cushion.boundingBox!.getSize(new Vector3());
    dimensions.toArray().forEach((value, i) => expect(value).toBeCloseTo(size[i], 5));
    // A substantial radius on all three axes survives the thin cushion height.
    const positions = cushion.getAttribute("position");
    const corner = new Vector3(...size).multiplyScalar(0.5);
    let nearest = Infinity;
    for (let i = 0; i < positions.count; i++) nearest = Math.min(nearest, new Vector3().fromBufferAttribute(positions, i).distanceTo(corner));
    expect(nearest).toBeGreaterThan(0.05);
  });

  it("contains the fuller canopy in the reserved one-metre plant footprint", () => {
    for (const leaves of foliageGeometry) {
      const bounds = leaves.boundingBox!;
      for (const edge of [bounds.min.x, bounds.max.x, bounds.min.z, bounds.max.z]) expect(Math.abs(edge)).toBeLessThanOrEqual(0.5);
      expect(bounds.min.y).toBeGreaterThan(0.54);
      expect(bounds.max.y).toBeLessThan(1.65);
      const normals = leaves.getAttribute("normal");
      for (let i = 0; i < normals.count; i++) expect(new Vector3().fromBufferAttribute(normals, i).length()).toBeCloseTo(1, 4);
    }
  });

  it("keeps lounge upholstery within the existing fixture footprints", () => {
    const sofa = furnitureGeometry.sofaCushions.boundingBox!;
    expect(sofa.max.x - sofa.min.x).toBeLessThan(3.2);
    expect(Math.max(Math.abs(sofa.min.z), Math.abs(sofa.max.z))).toBeLessThan(0.56);
    const chair = furnitureGeometry.armchairCushions.boundingBox!;
    expect(Math.max(Math.abs(chair.min.x), Math.abs(chair.max.x))).toBeLessThan(0.45);
    expect(Math.max(Math.abs(chair.min.z), Math.abs(chair.max.z))).toBeLessThan(0.45);
  });
});
