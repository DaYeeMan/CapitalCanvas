import { type BufferGeometry } from "three";
import { toCreasedNormals } from "three/addons/utils/BufferGeometryUtils.js";

const prepared = new WeakMap<BufferGeometry, BufferGeometry>();

// Smooth the supplied triangulated surfaces while retaining sharp garment
// edges. Only normals change; expanded skin attributes still refer to exactly
// the same joints/weights/positions. All rig clones share this prepared mesh.
export function characterGeometry(source: BufferGeometry) {
  let result = prepared.get(source);
  if (!result) {
    result = toCreasedNormals(source.index ? source : source.clone(), Math.PI / 3);
    prepared.set(source, result);
    prepared.set(result, result);
  }
  return result;
}
