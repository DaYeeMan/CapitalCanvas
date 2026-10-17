import { Group, InstancedMesh, Matrix4, Mesh, SkinnedMesh, Vector3 } from "three";

// These subtrees change relative to the floor. Their meshes must stay attached
// to their authored parents; everything else here is static furniture/lamps.
const movingParts = new Set(["door-leaf", "shared-office-shell"]);

export function batchStaticFurniture(root: Group, lighterShadows = false) {
  const buckets = new Map<string, Mesh[]>();
  const restore: { mesh: Mesh; visible: boolean; cast: boolean; receive: boolean }[] = [];
  const instances: InstancedMesh[] = [];
  const inverse = new Matrix4(), relative = new Matrix4(), size = new Vector3();
  root.updateWorldMatrix(true, true);
  inverse.copy(root.matrixWorld).invert();
  function visit(group: Group | Mesh) {
    if (movingParts.has(group.name)) return;
    if (group instanceof Mesh && !(group instanceof SkinnedMesh) && !(group instanceof InstancedMesh) && !Array.isArray(group.material) && !group.material.transparent) {
      restore.push({ mesh: group, visible: group.visible, cast: group.castShadow, receive: group.receiveShadow });
      // Tiny handles, books, and trim contribute little to the shadow silhouette.
      if (lighterShadows) {
        if (!group.geometry.boundingBox) group.geometry.computeBoundingBox();
        relative.multiplyMatrices(inverse, group.matrixWorld);
        group.geometry.boundingBox!.clone().applyMatrix4(relative).getSize(size);
        if (Math.max(size.x, size.y, size.z) < 0.5) group.castShadow = group.receiveShadow = false;
      }
      if (group.visible) {
        const key = `${group.geometry.uuid}:${group.material.uuid}:${group.castShadow}:${group.receiveShadow}:${group.renderOrder}`;
        const bucket = buckets.get(key);
        if (bucket) bucket.push(group); else buckets.set(key, [group]);
      }
    }
    for (const child of group.children) visit(child as Group);
  }
  visit(root);
  for (const sources of buckets.values()) {
    if (sources.length < 2) continue;
    const source = sources[0];
    const batch = new InstancedMesh(source.geometry, source.material, sources.length);
    batch.name = "static-furniture-batch";
    batch.castShadow = source.castShadow; batch.receiveShadow = source.receiveShadow;
    batch.renderOrder = source.renderOrder;
    sources.forEach((mesh, i) => {
      batch.setMatrixAt(i, relative.multiplyMatrices(inverse, mesh.matrixWorld));
      mesh.visible = false;
    });
    batch.instanceMatrix.needsUpdate = true;
    batch.computeBoundingSphere();
    root.add(batch); instances.push(batch);
  }
  return () => {
    for (const { mesh, visible, cast, receive } of restore) {
      mesh.visible = visible; mesh.castShadow = cast; mesh.receiveShadow = receive;
    }
    // Only instance buffers belong to the batch. Geometry/materials are shared.
    for (const batch of instances) { root.remove(batch); batch.dispose(); }
  };
}
