import { BoxGeometry, Group, InstancedMesh, Matrix4, Mesh, MeshStandardMaterial, SkinnedMesh } from "three";
import { describe, expect, it, vi } from "vitest";
import { batchStaticFurniture } from "./staticFurniture";

describe("static furniture batching", () => {
  it("preserves transformed placement, shared assets, and restores originals without touching animated subtrees", () => {
    const geometry = new BoxGeometry(), material = new MeshStandardMaterial();
    const root = new Group(), nested = new Group(), door = new Group(), shell = new Group();
    root.position.set(8, 40, -3); root.rotation.y = 0.7;
    nested.position.set(3, 0, -5); nested.rotation.y = -0.4; nested.scale.setScalar(0.8);
    door.name = "door-leaf"; shell.name = "shared-office-shell";
    root.add(nested, door, shell);
    const a = new Mesh(geometry, material), b = new Mesh(geometry, material);
    a.position.set(1, 0, 2); b.position.set(3, 1, 0); a.castShadow = b.castShadow = true;
    nested.add(a); root.add(b);
    const doorMesh = new Mesh(geometry, material), wall = new Mesh(geometry, material);
    door.add(doorMesh); shell.add(wall);
    const glass = new Mesh(geometry, new MeshStandardMaterial({ transparent: true }));
    const person = new SkinnedMesh(geometry, material);
    root.add(glass, person);
    root.updateWorldMatrix(true, true);
    const authored = [a.matrixWorld.clone(), b.matrixWorld.clone()];
    const disposeGeometry = vi.spyOn(geometry, "dispose"), disposeMaterial = vi.spyOn(material, "dispose");
    const restore = batchStaticFurniture(root);
    const batch = root.children.find(child => child instanceof InstancedMesh) as InstancedMesh;
    expect(batch.count).toBe(2);
    expect(a.visible || b.visible).toBe(false);
    expect([doorMesh, wall, glass, person].every(mesh => mesh.visible)).toBe(true);
    root.updateWorldMatrix(true, true);
    for (let i = 0; i < 2; i++) {
      const instance = new Matrix4(); batch.getMatrixAt(i, instance);
      const world = instance.premultiply(batch.matrixWorld);
      world.elements.forEach((value, j) => expect(value).toBeCloseTo(authored[i].elements[j], 5));
    }
    const disposeBatch = vi.spyOn(batch, "dispose");
    restore();
    expect(a.visible && b.visible && a.castShadow && b.castShadow).toBe(true);
    expect(root.children).not.toContain(batch);
    expect(disposeBatch).toHaveBeenCalledOnce();
    expect(disposeGeometry).not.toHaveBeenCalled(); expect(disposeMaterial).not.toHaveBeenCalled();
    const restoreAgain = batchStaticFurniture(root); restoreAgain();
    expect(root.children.filter(child => child instanceof InstancedMesh)).toHaveLength(0);
  });
  it("only simplifies tiny shadows when requested, including singleton furniture, and restores them", () => {
    const root = new Group(), trim = new Mesh(new BoxGeometry(0.1, 0.3, 0.2), new MeshStandardMaterial());
    trim.castShadow = trim.receiveShadow = true; root.add(trim);
    const strong = batchStaticFurniture(root);
    expect(trim.castShadow && trim.receiveShadow).toBe(true); strong();
    const slow = batchStaticFurniture(root, true);
    expect(trim.castShadow || trim.receiveShadow).toBe(false); slow();
    expect(trim.castShadow && trim.receiveShadow).toBe(true);
  });
});
