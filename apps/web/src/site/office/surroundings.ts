import { BUILDING, CAMERA } from "./layouts";

export const SURROUNDINGS = Object.freeze({ referenceGround: -34, maxHeight: 8, shift: 1.25, groundSide: 150, fogNear: 90, fogFar: 165 });
const length = Math.hypot(...CAMERA.position);
const vertical = Math.hypot(CAMERA.position[0], CAMERA.position[2]) / length;
const slope = CAMERA.position[1] / length;

// The same fitted camera span drives floor travel and the scenery's safe base.
// Zoom/pan never change this span. No environment bounds enter camera fitting.
export function floorTravelDistance(cameraSpan: number) { return cameraSpan / vertical * 1.08; }
export function surroundingsPosition(cameraSpan: number, progress: number): [number, number, number] {
  const y = -floorTravelDistance(cameraSpan) - BUILDING.slab - SURROUNDINGS.maxHeight - 2;
  // A resize moves the base farther along the view direction as well as down,
  // preserving the authored composition while clearing the larger slide gap.
  const diagonal = (y - SURROUNDINGS.referenceGround) * vertical / slope / Math.SQRT2;
  return [diagonal, y + progress * SURROUNDINGS.shift, diagonal];
}

export interface SurroundingBlock { at: readonly [number, number, number]; size: readonly [number, number, number]; depth: "near" | "middle" | "far" }
// Camera-aligned anchor coordinates only author placement; every box is an
// ordinary world-axis cube/prism, lit and shadowed by the scene's real camera.
const clusters = [
  [-19, -38, 6.8, 6, 7.5, "near"], [20, -39, 7.2, 5.5, 8, "near"], [-2, -32, 6.5, 5.5, 6.5, "near"],
  [-23, -49, 5, 4.5, 5.5, "middle"], [24, -49, 5.5, 4.8, 6, "middle"], [-15.5, -55, 4.6, 4, 5, "middle"], [16, -56, 4.8, 4.2, 4.8, "middle"],
  [-21, -65, 3.8, 3.3, 3.8, "far"], [-9, -68, 3.6, 3, 3.2, "far"], [9.5, -70, 3.7, 3.2, 3.5, "far"], [22, -64, 4, 3.5, 4, "far"],
] as const;
export const SURROUNDING_BLOCKS: readonly SurroundingBlock[] = clusters.flatMap(([across, depth, w, d, h, band], i) => {
  const x = (depth + across) / Math.SQRT2, z = (depth - across) / Math.SQRT2;
  const base = h * 0.34, middle = h * 0.36, upper = h - base - middle;
  const offset = i % 2 ? 1 : -1;
  if (i % 3 === 0) return [
    { at: [x, base / 2, z], size: [w, base, d], depth: band },
    { at: [x - offset * w * 0.12, base + (h - base) / 2, z - d * 0.09], size: [w * 0.68, h - base, d * 0.8], depth: band },
    { at: [x + offset * w * 0.68, h * 0.275, z + d * 0.04], size: [w * 0.36, h * 0.55, d * 0.65], depth: band },
  ] as SurroundingBlock[];
  if (i % 3 === 1) return [
    { at: [x - offset * w * 0.21, h * 0.3, z], size: [w * 0.58, h * 0.6, d], depth: band },
    { at: [x - offset * w * 0.21, h * 0.8, z - d * 0.05], size: [w * 0.58, h * 0.4, d * 0.8], depth: band },
    { at: [x + offset * w * 0.29, h * 0.175, z + d * 0.04], size: [w * 0.42, h * 0.35, d * 0.75], depth: band },
  ] as SurroundingBlock[];
  return [
    { at: [x, base / 2, z], size: [w, base, d], depth: band },
    { at: [x + offset * w * 0.13, base + middle / 2, z - d * 0.09], size: [w * 0.72, middle, d * 0.75], depth: band },
    { at: [x + offset * w * 0.18, base + middle + upper / 2, z - d * 0.17], size: [w * 0.46, upper, d * 0.48], depth: band },
  ] as SurroundingBlock[];
});
