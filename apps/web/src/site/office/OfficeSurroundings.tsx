import { useLayoutEffect, useRef } from "react";
import { Color, Matrix4, Vector3, Quaternion, type InstancedMesh } from "three";
import { geometry, materials } from "./sceneResources";

// Subdued neighboring towers stay below the office slab and outside its footprint.
const towers = [
  [-16, -8, -8, 5, 9, 6], [-17, -7, 5, 4, 8, 5], [-12, -8, 15, 5, 9, 5],
  [0, -9, 16, 5, 8, 5], [12, -7, 14, 4, 8, 5], [17, -8, 4, 5, 9, 5],
  [17, -8, -10, 5, 8, 6], [4, -8, -15, 5, 9, 5], [-10, -8, -15, 4, 8, 5],
] as const;
export function OfficeSurroundings() {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const matrix = new Matrix4(), rotation = new Quaternion(), position = new Vector3(), scale = new Vector3();
    towers.forEach(([x, y, z, w, h, d], i) => {
      matrix.compose(position.set(x, y, z), rotation, scale.set(w, h, d));
      mesh.current!.setMatrixAt(i, matrix);
      mesh.current!.setColorAt(i, new Color(i % 2 ? "#dce8ff" : "#f1f5ff"));
    });
    mesh.current!.instanceMatrix.needsUpdate = true;
    mesh.current!.instanceColor!.needsUpdate = true;
  }, []);
  return <instancedMesh ref={mesh} name="distant-buildings" args={[geometry.box, materials.outside, towers.length]} dispose={null} />;
}
