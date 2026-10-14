import { BoxGeometry, CylinderGeometry, MeshStandardMaterial, DoubleSide, PlaneGeometry, DataTexture, RepeatWrapping, SRGBColorSpace, RGBAFormat, BufferGeometry, Float32BufferAttribute, LineBasicMaterial, LinearFilter, LinearMipmapLinearFilter, Matrix4, Vector3, Quaternion, Euler } from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
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
const weave = finish(64, (x, y) => 239 + ((x + y) % 2) * 10 + Math.sin(x * 2 + y * 3) * 3, 14);
const tile = finish(512, (x, y) => {
  const u = x / 512 * BUILDING.width / 2, v = y / 512 * BUILDING.depth / 2;
  const edge = u % 1 < 0.012 || v % 1 < 0.012;
  return edge ? 235 : 249 + Math.sin(Math.floor(u) * 7 + Math.floor(v) * 13) * 3;
});

function leafGeometry() {
  const outline = [[0, 0, 0], [-0.2, 0.1, 0], [-0.4, 0.45, 0], [-0.28, 0.75, 0], [0, 1, 0], [0.28, 0.75, 0], [0.4, 0.45, 0], [0.2, 0.1, 0]];
  const vertices = outline.flatMap((point, i) => {
    const next = outline[(i + 1) % outline.length];
    return [0, 0.5, 0.07, ...next, ...point, 0, 0.5, -0.07, ...point, ...next];
  });
  const leaf = new BufferGeometry();
  leaf.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  leaf.computeVertexNormals();
  return leaf;
}

// Shared for the preview's lifetime; floor switches do not allocate new resources.
export const geometry = {
  box: new BoxGeometry(1, 1, 1),
  cushion: new RoundedBoxGeometry(1, 1, 1, 2, 0.1),
  cylinder: new CylinderGeometry(0.5, 0.5, 1, 16),
  leaf: leafGeometry(),
  pane: new PlaneGeometry(1, 1),
};
type XYZ = [number, number, number];
interface Part { geometry: BufferGeometry; at: XYZ; size?: XYZ; rotation?: XYZ }
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
const seat = new RoundedBoxGeometry(0.68, 0.16, 0.66, 3, 0.065);
const back = new RoundedBoxGeometry(0.66, 0.72, 0.16, 3, 0.065);
const spokeAngles = Array.from({ length: 5 }, (_, i) => i * Math.PI * 2 / 5);
export const furnitureGeometry = {
  chairCushions: assembly([
    { geometry: seat, at: [0, 0.51, 0] },
    { geometry: back, at: [0, 0.93, 0.28], rotation: [-0.12, 0, 0] },
    { geometry: geometry.cushion, at: [0, 0.77, 0.18], size: [0.54, 0.19, 0.07] },
  ]),
  chairFrame: assembly([
    { geometry: geometry.cylinder, at: [0, 0.28, 0], size: [0.075, 0.34, 0.075] },
    ...spokeAngles.map(angle => ({ geometry: geometry.box, at: [Math.sin(angle) * 0.17, 0.105, Math.cos(angle) * 0.17] as XYZ, size: [0.06, 0.055, 0.35] as XYZ, rotation: [0, angle, 0] as XYZ })),
    ...[-1, 1].map(side => ({ geometry: geometry.box, at: [side * 0.34, 0.63, 0.09] as XYZ, size: [0.035, 0.25, 0.045] as XYZ })),
  ]),
  chairTrim: assembly([
    ...spokeAngles.map(angle => ({ geometry: geometry.cylinder, at: [Math.sin(angle) * 0.33, 0.065, Math.cos(angle) * 0.33] as XYZ, size: [0.11, 0.075, 0.11] as XYZ, rotation: [0, angle, Math.PI / 2] as XYZ })),
    ...[-1, 1].map(side => ({ geometry: geometry.cushion, at: [side * 0.34, 0.77, -0.025] as XYZ, size: [0.09, 0.065, 0.43] as XYZ })),
  ]),
  tableFrame: assembly([
    ...[-1, 1].flatMap(x => [-1, 1].map(z => ({ geometry: geometry.box, at: [x * 0.44, 0.405, z * 0.4] as XYZ, size: [0.04, 0.76, 0.055] as XYZ }))),
    ...[-1, 1].map(z => ({ geometry: geometry.box, at: [0, 0.73, z * 0.4] as XYZ, size: [0.88, 0.06, 0.035] as XYZ })),
  ]),
  armchairCushions: assembly([
    { geometry: geometry.cushion, at: [0, 0.36, 0], size: [0.88, 0.4, 0.82] },
    { geometry: geometry.cushion, at: [0, 0.78, 0.3], size: [0.86, 0.64, 0.22], rotation: [-0.1, 0, 0] },
    { geometry: geometry.cushion, at: [0, 0.58, -0.04], size: [0.64, 0.18, 0.62] },
    ...[-1, 1].map(side => ({ geometry: geometry.cushion, at: [side * 0.36, 0.62, 0] as XYZ, size: [0.17, 0.3, 0.8] as XYZ })),
  ]),
  armchairLegs: assembly([-1, 1].flatMap(x => [-1, 1].map(z => ({ geometry: geometry.cylinder, at: [x * 0.3, 0.11, z * 0.27] as XYZ, size: [0.065, 0.22, 0.065] as XYZ })))),
  sofaCushions: assembly([-0.94, 0, 0.94].flatMap(x => [
    { geometry: geometry.cushion, at: [x, 0.58, 0], size: [0.92, 0.22, 0.86] as XYZ },
    { geometry: geometry.cushion, at: [x, 0.88, -0.4], size: [0.92, 0.68, 0.25] as XYZ, rotation: [0.06, 0, 0] as XYZ },
  ].map(part => ({ ...part, at: part.at as XYZ })))),
  roundTableLegs: assembly([0, 2 * Math.PI / 3, 4 * Math.PI / 3].map(angle => ({ geometry: geometry.cylinder, at: [Math.sin(angle) * 0.28, 0.27, Math.cos(angle) * 0.28] as XYZ, size: [0.07, 0.54, 0.07] as XYZ, rotation: [Math.cos(angle) * 0.12, 0, -Math.sin(angle) * 0.12] as XYZ }))),
};
seat.dispose(); back.dispose();
const palette = {
  floor: "#f5ede2", wall: "#fcf5ea", slab: "#cad2df", wood: "#e6bd89",
  navy: "#154782", frame: "#35475e", partition: "#b5c0cd", screen: "#0b2548",
  chart: "#4e8eff", rug: "#cfced8", cream: "#fff8ec", green: "#56822c",
  leaf: "#8baa3d", white: "#ffffff", outside: "#b9d0f4", soil: "#524331",
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
Object.assign(materials.outside, { emissive: materials.outside.color, emissiveIntensity: 0.8 });
// Single panes prevent six overlapping transparent box faces from clouding rooms.
export const glassMaterial = new MeshStandardMaterial({ color: "#c4dced", transparent: true, opacity: 0.11, roughness: 0.24, depthWrite: false, side: DoubleSide });

const chartPoints = [[-0.32, -0.08], [-0.23, 0.04], [-0.13, -0.01], [-0.04, 0.09], [0.06, -0.04], [0.16, 0.12], [0.24, 0.06], [0.32, 0.17]];
export const chartGeometry = new BufferGeometry();
chartGeometry.setAttribute("position", new Float32BufferAttribute(chartPoints.slice(1).flatMap((point, i) => [...chartPoints[i], 0, ...point, 0]), 3));
export const chartMaterial = new LineBasicMaterial({ color: "#3788ff", toneMapped: false });
