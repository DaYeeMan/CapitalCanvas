import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { InstancedMesh, Matrix4, MeshStandardMaterial, type Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { geometry, materials } from "./sceneResources";
import { BUILDING } from "./layouts";
import { levelY, TOWER } from "./towerStructure";
import { towerMaterials } from "./towerResources";

type Box = { at: [number, number, number]; size: [number, number, number] };
function Boxes({ boxes, material, shadow = true }: { boxes: Box[]; material: MeshStandardMaterial; shadow?: boolean }) {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    const node = mesh.current!;
    const matrix = new Matrix4();
    boxes.forEach((box, i) => { matrix.makeScale(...box.size); matrix.setPosition(...box.at); node.setMatrixAt(i, matrix); });
    node.instanceMatrix.needsUpdate = true;
    node.computeBoundingSphere();
    // Instance buffers are owned here; geometry and materials remain shared.
    return () => { node.dispose(); };
  }, [boxes]);
  // VSM also draws shadow receivers into its map. Disable both flags on a
  // lifted upper assembly so it cannot leave a floating ceiling shadow.
  return <instancedMesh ref={mesh} args={[geometry.box, material, boxes.length]} castShadow={shadow} receiveShadow={shadow} dispose={null} />;
}

// Opaque exterior panels avoid loading interiors for decorative storeys. The
// same bay rhythm and footprint continue through all three authored poses.
export function Facade({ width = TOWER.width, depth = TOWER.depth, storeys, hollow = false, shadow = true }: { width?: number; depth?: number; storeys: number; hollow?: boolean; shadow?: boolean }) {
  const parts = useMemo(() => {
    const cream: Box[] = [], glass: Box[] = [], bars: Box[] = [];
    const height = storeys * TOWER.pitch;
    if (!hollow) cream.push({ at: [0, height / 2 - BUILDING.slab, 0], size: [width, height, depth] });
    for (const side of [-1, 1]) {
      for (const axis of ["x", "z"] as const) {
        const span = axis === "x" ? depth : width;
        const edge = side * (axis === "x" ? width : depth) / 2;
        const bays = Math.max(2, Math.round(span / 3.4));
        const box = (along: number, y: number, w: number, h: number, thickness: number, outward = 0): Box => axis === "x"
          ? { at: [edge + side * outward, y, along], size: [thickness, h, w] }
          : { at: [along, y, edge + side * outward], size: [w, h, thickness] };
        if (hollow) cream.push(box(0, height / 2 - BUILDING.slab, span, height, 0.32));
        for (let row = 0; row < storeys; row++) for (let bay = 0; bay < bays; bay++) {
          const along = -span / 2 + (bay + 0.5) * span / bays;
          const y = row * TOWER.pitch + 1.2;
          glass.push(box(along, y, span / bays - 0.5, 2.48, 0.08, 0.18));
          bars.push(box(along, y, 0.045, 2.48, 0.1, 0.235));
        }
      }
    }
    return { cream, glass, bars };
  }, [width, depth, storeys, hollow]);
  return <group><Boxes boxes={parts.cream} material={materials.wall} shadow={shadow} /><Boxes boxes={parts.glass} material={towerMaterials.glass} shadow={shadow} /><Boxes boxes={parts.bars} material={towerMaterials.mullion} shadow={shadow} /></group>;
}

export function Roof({ width = TOWER.width, depth = TOWER.depth, shadow = true }: { width?: number; depth?: number; shadow?: boolean }) {
  return <group dispose={null}>
    <mesh geometry={geometry.box} material={materials.wall} scale={[width + 0.2, 0.35, depth + 0.2]} receiveShadow={shadow} />
    <mesh geometry={geometry.box} material={materials.slab} position={[0, 0.2, 0]} scale={[width - 1, 0.12, depth - 1]} receiveShadow={shadow} />
    <mesh geometry={geometry.box} material={materials.wall} position={[-2, 1, -2]} scale={[4, 1.8, 4]} castShadow={shadow} receiveShadow={shadow} />
    <mesh geometry={geometry.box} material={materials.slab} position={[3, 0.65, -2]} scale={[2, 0.8, 2]} castShadow={shadow} receiveShadow={shadow} />
  </group>;
}

export interface TowerGroups { middle: Group | null; cap: Group | null; homeFacade: Group | null; resourcesFacade: Group | null }
export function TowerAssembly({ groups, canEnter, onEnter }: { groups: RefObject<TowerGroups>; canEnter: boolean; onEnter: () => void }) {
  const enter = (event: ThreeEvent<MouseEvent>) => { if (canEnter) { event.stopPropagation(); onEnter(); } };
  return <group name="capital-canvas-tower" onClick={enter} dispose={null}>
    <group position={[0, levelY(0), 0]}><Facade storeys={TOWER.resourcesLevel} /></group>
    <group ref={node => { groups.current.resourcesFacade = node; }} name="resources-facade"><Facade storeys={1} hollow /></group>
    <group ref={node => { groups.current.middle = node; }} name="intervening-storeys"><Facade storeys={TOWER.homeLevel - TOWER.resourcesLevel - 1} />
      <mesh geometry={geometry.box} material={materials.wall} position={[0, (TOWER.homeLevel - TOWER.resourcesLevel - 1) * TOWER.pitch - BUILDING.slab / 2, 0]} scale={[TOWER.width, BUILDING.slab, TOWER.depth]} receiveShadow />
    </group>
    <group ref={node => { groups.current.homeFacade = node; }} name="home-facade"><Facade storeys={1} hollow /></group>
    <group ref={node => { groups.current.cap = node; }} name="upper-cap">
      <Facade storeys={TOWER.storeys - TOWER.homeLevel - 1} />
      <group position={[0, (TOWER.storeys - TOWER.homeLevel - 1) * TOWER.pitch, 0]}><Roof /></group>
    </group>
    <mesh geometry={geometry.box} material={materials.wall} position={[0, levelY(TOWER.resourcesLevel) - BUILDING.slab / 2, 0]} scale={[TOWER.width, BUILDING.slab, TOWER.depth]} receiveShadow />
  </group>;
}
