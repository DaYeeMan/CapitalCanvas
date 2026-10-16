import type { Box } from "./TowerAssembly";

// axis is the fixed coordinate; start/end follow the other coordinate.
export type Street = { axis: "x" | "z"; at: number; start: number; end: number; primary: boolean };
export type Plot = { x: number; z: number; width: number; depth: number };
export const STREET_WIDTH = 6.8;
export const SIDEWALK_WIDTH = 1.2;
export const CITY_STREETS: readonly Street[] = [
  { axis: "x", at: 17, start: -80, end: 78, primary: true },
  { axis: "z", at: 17, start: -120, end: 78, primary: true },
  { axis: "x", at: -37, start: -80, end: 20.4, primary: false },
  { axis: "x", at: 42.2, start: -65, end: 20.4, primary: false },
  { axis: "z", at: -18, start: -120, end: 62, primary: true },
  { axis: "x", at: -65, start: -65, end: 20.4, primary: false },
  { axis: "z", at: -45, start: -95, end: 45.6, primary: false },
];
type Rect = { left: number; right: number; back: number; front: number };
const contains = (r: Rect, x: number, z: number) => x > r.left && x < r.right && z > r.back && z < r.front;
const rect = (street: Street, margin = 0): Rect => {
  const half = STREET_WIDTH / 2 + margin;
  return street.axis === "x"
    ? { left: street.at - half, right: street.at + half, back: street.start, front: street.end }
    : { left: street.start, right: street.end, back: street.at - half, front: street.at + half };
};

export function cityRoadParts(plots: readonly Plot[]) {
  const roads: Box[] = [], farRoads: Box[] = [], sidewalks: Box[] = [], markings: Box[] = [];
  const surfaces = CITY_STREETS.map(street => rect(street));
  const borders = CITY_STREETS.map(street => rect(street, SIDEWALK_WIDTH));
  const lots = plots.map(p => ({ left: p.x - p.width / 2, right: p.x + p.width / 2, back: p.z - p.depth / 2, front: p.z + p.depth / 2 }));
  const bounds = [...surfaces, ...borders, ...lots];
  const unique = (values: number[]) => [...new Set(values.map(n => Math.round(n * 1e6) / 1e6))].sort((a, b) => a - b);
  const xs = unique(bounds.flatMap(r => [r.left, r.right]));
  const zs = unique(bounds.flatMap(r => [r.back, r.front]));
  // Partition the street union once: crossing asphalt never has two coplanar
  // owners. Sidewalk strips also stop at the authored plots and intersections.
  for (let i = 1; i < xs.length; i++) for (let j = 1; j < zs.length; j++) {
    const x = (xs[i - 1] + xs[i]) / 2, z = (zs[j - 1] + zs[j]) / 2;
    const owners = surfaces.flatMap((r, index) => contains(r, x, z) ? [CITY_STREETS[index]] : []);
    const asphalt = owners.length > 0;
    if (!asphalt && (!borders.some(r => contains(r, x, z)) || lots.some(r => contains(r, x, z)))) continue;
    const list = asphalt ? owners.some(s => s.primary) ? roads : farRoads : sidewalks;
    list.push({ at: [x, asphalt ? 0.014 : 0.12, z], size: [xs[i] - xs[i - 1], asphalt ? 0.025 : 0.16, zs[j] - zs[j - 1]] });
  }
  for (const street of CITY_STREETS) {
    const crossings = CITY_STREETS.filter(other => other.axis !== street.axis
      && other.at >= street.start && other.at <= street.end
      && street.at >= other.start && street.at <= other.end).map(other => other.at).sort((a, b) => a - b);
    const line = (along: number, length: number, offset: number, width: number) => {
      if (length < 0.01) return;
      markings.push({ at: [street.axis === "x" ? street.at + offset : along, 0.055, street.axis === "x" ? along : street.at + offset],
        size: [street.axis === "x" ? width : length, 0.012, street.axis === "x" ? length : width] });
    };
    for (let along = street.start + 2; along < street.end - 2; along += 6) {
      if (!crossings.some(at => Math.abs(along - at) < 6.8)) line(along, 2.6, 0, 0.1);
    }
    let start = street.start;
    for (const end of [...crossings.map(at => at - STREET_WIDTH / 2), street.end]) {
      for (const side of [-1, 1]) line((start + end) / 2, end - start, side * 3.1, 0.07);
      start = end + STREET_WIDTH;
    }
    // Crosswalks belong to their approach, rather than overlapping copies
    // from both streets. Keep them at the two central complete junctions.
    for (const at of crossings.filter(at => street.at === 17 && at === 17
      || street.axis === "x" && street.at === 17 && at === -18
      || street.axis === "z" && street.at === -18 && at === 17)) {
      for (const side of [-1, 1]) for (let stripe = 0; stripe < 8; stripe++) {
        line(at + side * 4.9, 2.05, -2.55 + stripe * 0.73, 0.4);
      }
    }
  }
  return { roads, farRoads, sidewalks, markings };
}
