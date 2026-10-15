import { BoxGeometry, CylinderGeometry, MeshStandardMaterial, DoubleSide, PlaneGeometry, DataTexture, RepeatWrapping, SRGBColorSpace, RGBAFormat, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LinearFilter, LinearMipmapLinearFilter, Matrix4, Vector3, Quaternion, Euler } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries, toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";
import { BUILDING } from "./layouts";

// Deterministic, project-authored finishes. No remote textures or environment downloads.
function finish(size: number, sample: (x: number, y: number) => number, repeat = 1) {
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const offset = (y * size + x) * 4;
    pixels.fill(Math.round(sample(x, y)), offset, offset + 3);
    pixels[offset + 3] = 255;
  }
  const texture = new DataTexture(pixels, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeat, repeat);
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}
const wood = finish(128, (x, y) => 242 + Math.sin(y * 0.55 + Math.sin(x * 0.035) * 2) * 4 + Math.sin(y * 3.7 + x * 0.1) * 2);
const weave = finish(64, (x, y) => 239 + ((x + y) % 2) * 8 + Math.sin(x * 2 + y * 3) * 2, 12);
const tile = finish(512, (x, y) => {
  const u = x / 512 * BUILDING.width / 2, v = y / 512 * BUILDING.depth / 2;
  const edge = u % 1 < 0.009 || v % 1 < 0.009;
  return edge ? 214 : 230 + Math.sin(Math.floor(u) * 7 + Math.floor(v) * 13) * 20;
});

function leafGeometry() {
  // Curved, pointed leaves retain a central ridge, with shared vertices along
  // each surface so daylight reads as a gradient instead of a triangle fan.
  const vertices: number[] = [], indices: number[] = [];
  for (const side of [1, -1]) {
    const start = vertices.length / 3;
    for (let row = 0; row <= 10; row++) {
      const t = row / 10, bulge = Math.sin(Math.PI * t);
      for (const u of [-1, -0.5, 0, 0.5, 1]) vertices.push(u * 0.32 * Math.max(0.003, bulge ** 0.8), t, bulge * (0.12 + side * (0.018 + 0.07 * Math.sqrt(1 - u * u))));
    }
    for (let row = 0; row < 10; row++) for (let col = 0; col < 4; col++) {
      const a = start + row * 5 + col, b = a + 1, c = a + 5, d = c + 1;
      indices.push(...(side === 1 ? [a, b, d, a, d, c] : [a, d, b, a, c, d]));
    }
  }
  const leaf = new BufferGeometry();
  leaf.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  leaf.setIndex(indices);
  leaf.computeVertexNormals();
  return leaf;
}

// Shared for the preview's lifetime; floor switches do not allocate new resources.
export const geometry = {
  box: new BoxGeometry(1, 1, 1),
  cylinder: new CylinderGeometry(0.5, 0.5, 1, 16),
  leaf: leafGeometry(),
  pane: new PlaneGeometry(1, 1),
};
type XYZ = [number, number, number];
// Keep a world-space plan radius and a generous vertical bevel. Stretching a
// unit rounded cube used to flatten thin cushion/table edges into square slabs.
const roundedBoxes = new Map<string, BufferGeometry>();
export function roundedBox(size: XYZ, radius = Math.min(0.1, Math.min(size[0], size[2]) * 0.42)) {
  const key = `${size.join(",")}:${radius}`;
  let result = roundedBoxes.get(key);
  if (!result) {
    const height = Math.max(size[1], radius * 2.5);
    result = new RoundedBoxGeometry(size[0], height, size[2], 2, radius);
    result.scale(1, size[1] / height, 1);
    roundedBoxes.set(key, result);
  }
  return result;
}
interface Part { geometry: BufferGeometry; at: XYZ; size?: XYZ; rotation?: XYZ }
const padded = (at: XYZ, size: XYZ, rotation?: XYZ): Part => ({ geometry: roundedBox(size), at, rotation });
// Batch repeated furniture parts by material, rather than adding a draw call
// for every spoke, caster or cushion on every chair. Source primitives stay shared.
function assembly(parts: Part[]) {
  const pieces = parts.map(part => {
    const copy = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
    return copy.applyMatrix4(new Matrix4().compose(new Vector3(...part.at), new Quaternion().setFromEuler(new Euler(...(part.rotation ?? [0, 0, 0]))), new Vector3(...(part.size ?? [1, 1, 1]))));
  });
  const result = mergeGeometries(pieces)!;
  pieces.forEach(piece => piece.dispose());
  result.computeBoundingBox(); result.computeBoundingSphere();
  return result;
}
const seat = new RoundedBoxGeometry(0.68, 0.16, 0.66, 3, 0.075);
const back = new RoundedBoxGeometry(0.66, 0.72, 0.16, 3, 0.075);
// A gently narrower crown and cupped front keep the existing seat/worker
// anchors and outer envelope while giving the back a less rectangular profile.
const backPositions = back.getAttribute("position");
for (let i = 0; i < backPositions.count; i++) {
  const x = backPositions.getX(i), y = backPositions.getY(i), z = backPositions.getZ(i);
  backPositions.setXYZ(i, x * (1 - 0.13 * Math.max(0, y / 0.36)), y, z + 0.045 * (x / 0.33) ** 2);
}
toCreasedNormals(back);
const spokeAngles = Array.from({ length: 5 }, (_, i) => i * Math.PI * 2 / 5);
function chairTrimGeometry(armHeight = 0.77) {
  return assembly([
    ...spokeAngles.map(angle => ({ geometry: geometry.cylinder, at: [Math.sin(angle) * 0.33, 0.065, Math.cos(angle) * 0.33] as XYZ, size: [0.11, 0.075, 0.11] as XYZ, rotation: [0, angle, Math.PI / 2] as XYZ })),
    ...[-1, 1].map(side => padded([side * 0.34, armHeight, -0.025], [0.09, 0.065, 0.43])),
  ]);
}
export const furnitureGeometry = {
  chairCushions: assembly([
    { geometry: seat, at: [0, 0.51, 0] },
    { geometry: back, at: [0, 0.93, 0.28], rotation: [-0.12, 0, 0] },
    padded([0, 0.77, 0.18], [0.54, 0.19, 0.07]),
  ]),
  chairFrame: assembly([
    { geometry: geometry.cylinder, at: [0, 0.28, 0], size: [0.075, 0.34, 0.075] },
    ...spokeAngles.map(angle => ({ geometry: geometry.box, at: [Math.sin(angle) * 0.17, 0.105, Math.cos(angle) * 0.17] as XYZ, size: [0.06, 0.055, 0.35] as XYZ, rotation: [0, angle, 0] as XYZ })),
    ...[-1, 1].map(side => ({ geometry: geometry.cylinder, at: [side * 0.34, 0.63, 0.09] as XYZ, size: [0.035, 0.25, 0.045] as XYZ })),
  ]),
  chairTrim: chairTrimGeometry(),
  conferenceChairTrim: chairTrimGeometry(0.72),
  tableFrame: assembly([
    ...[-1, 1].flatMap(x => [-1, 1].map(z => ({ geometry: geometry.cylinder, at: [x * 0.44, 0.405, z * 0.4] as XYZ, size: [0.04, 0.76, 0.055] as XYZ }))),
    ...[-1, 1].map(z => ({ geometry: geometry.box, at: [0, 0.73, z * 0.4] as XYZ, size: [0.88, 0.06, 0.035] as XYZ })),
  ]),
  armchairCushions: assembly([
    padded([0, 0.36, 0], [0.88, 0.4, 0.82]),
    padded([0, 0.78, 0.3], [0.86, 0.64, 0.22], [-0.1, 0, 0]),
    padded([0, 0.58, -0.04], [0.64, 0.18, 0.62]),
    ...[-1, 1].map(side => padded([side * 0.36, 0.62, 0], [0.17, 0.3, 0.8])),
  ]),
  armchairLegs: assembly([-1, 1].flatMap(x => [-1, 1].map(z => ({ geometry: geometry.cylinder, at: [x * 0.3, 0.11, z * 0.27] as XYZ, size: [0.065, 0.22, 0.065] as XYZ })))),
  sofaCushions: assembly([-0.94, 0, 0.94].flatMap(x => [
    padded([x, 0.58, 0], [0.92, 0.22, 0.86]),
    padded([x, 0.88, -0.4], [0.92, 0.68, 0.25], [0.06, 0, 0]),
  ])),
  roundTableLegs: assembly([0, 2 * Math.PI / 3, 4 * Math.PI / 3].map(angle => ({ geometry: geometry.cylinder, at: [Math.sin(angle) * 0.28, 0.27, Math.cos(angle) * 0.28] as XYZ, size: [0.07, 0.54, 0.07] as XYZ, rotation: [Math.cos(angle) * 0.12, 0, -Math.sin(angle) * 0.12] as XYZ }))),
};
seat.dispose(); back.dispose();
// Staggered outer/middle/upright leaves, batched into two tones. Each plant
// shares the same two meshes, rather than allocating one mesh per leaf.
const foliage = Array.from({ length: 12 }, (_, i): Part => {
  const tier = i % 3, angle = i * 2.399963229728653;
  return { geometry: geometry.leaf, at: [Math.sin(angle) * 0.035, 0.59 + tier * 0.045, Math.cos(angle) * 0.035], size: [[0.9, 0.64, 1], [0.82, 0.8, 1], [0.72, 0.96, 1]][tier] as XYZ, rotation: [0.12 * Math.sin(i * 1.8), angle, [0.7, 0.42, 0.12][tier]] };
});
export const foliageGeometry = [0, 1].map(tone => assembly(foliage.filter((_, i) => i % 2 === tone)));
const palette = {
  floor: "#f5ede2", wall: "#fcf5ea", slab: "#cad2df", wood: "#e6bd89",
  navy: "#154782", frame: "#35475e", partition: "#b5c0cd", screen: "#0b2548",
  chart: "#4e8eff", rug: "#c5c3d2", cream: "#fff8ec", green: "#568637",
  leaf: "#81a849", white: "#ffffff", soil: "#524331",
  metal: "#9caab7", trim: "#263447",
};
export type Tone = keyof typeof palette;
export const materials = Object.fromEntries(Object.entries(palette).map(([key, color]) => [key, new MeshStandardMaterial({ color, roughness: 0.85 })])) as Record<Tone, MeshStandardMaterial>;
Object.assign(materials.wood, { map: wood, roughness: 0.68 });
Object.assign(materials.floor, { map: tile, roughness: 0.84 });
Object.assign(materials.rug, { map: weave, roughness: 1 });
Object.assign(materials.navy, { roughness: 0.94 });
Object.assign(materials.frame, { metalness: 0.25, roughness: 0.55 });
Object.assign(materials.screen, { roughness: 0.32, emissive: materials.screen.color, emissiveIntensity: 0.15 });
// Single panes prevent six overlapping transparent box faces from clouding rooms.
export const glassMaterial = new MeshStandardMaterial({ color: "#c4dced", transparent: true, opacity: 0.11, roughness: 0.24, depthWrite: false, side: DoubleSide });
export const exteriorGlassMaterial = new MeshStandardMaterial({ color: "#9ac9ed", transparent: true, opacity: 0.23, roughness: 0.18, metalness: 0.08, depthWrite: false, side: DoubleSide });

const chartPoints = [[-0.32, -0.08], [-0.23, 0.04], [-0.13, -0.01], [-0.04, 0.09], [0.06, -0.04], [0.16, 0.12], [0.24, 0.06], [0.32, 0.17]];
export const chartGeometry = new BufferGeometry();
chartGeometry.setAttribute("position", new Float32BufferAttribute(chartPoints.slice(1).flatMap((point, i) => [...chartPoints[i], 0, ...point, 0]), 3));
export const chartMaterial = new LineBasicMaterial({ color: "#3788ff", toneMapped: false });
