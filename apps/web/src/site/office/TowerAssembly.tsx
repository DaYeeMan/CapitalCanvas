import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import { InstancedMesh, Matrix4, MeshStandardMaterial, type BufferGeometry, type Group } from "three";
import type { ThreeEvent } from "@react-three/fiber";
import { geometry, materials } from "./sceneResources";
import { BUILDING } from "./layouts";
import { levelY, TOWER } from "./towerStructure";
import { districtFinishes, towerMaterials } from "./towerResources";

export type Box = { at: [number, number, number]; size: [number, number, number] };
export function Boxes({ boxes, material, shadow = true, shape = geometry.box }: { boxes: Box[]; material: MeshStandardMaterial; shadow?: boolean; shape?: BufferGeometry }) { // taste-skill-ignore: physical 3D daylight shadows, not UI box shadows.
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
  // VSM includes receiving surfaces in its map. Lifted upper assemblies stop
  // participating so they cannot darken the exposed office.
  return <instancedMesh ref={mesh} args={[shape, material, boxes.length]} castShadow={shadow} receiveShadow={shadow} dispose={null} />; // taste-skill-ignore: physical 3D daylight shadows.
}

// Opaque exterior panels avoid loading interiors for decorative storeys. The
// same bay rhythm and footprint continue through all three authored poses.
export function Facade({ width = TOWER.width, depth = TOWER.depth, storeys, hollow = false, shadow = true, style = "frame", finish }: { width?: number; depth?: number; storeys: number; hollow?: boolean; shadow?: boolean; style?: "frame" | "vertical" | "curtain" | "punched"; finish?: keyof typeof districtFinishes }) { // taste-skill-ignore: physical 3D daylight shadows.
  const parts = useMemo(() => {
    const cream: Box[] = [], glass: Box[] = [], bars: Box[] = [], light: Box[] = [], shade: Box[] = [], stone: Box[] = [];
    const height = storeys * TOWER.pitch;
    if (!hollow) stone.push({ at: [0, height / 2 - BUILDING.slab, 0], size: [width - 0.8, height, depth - 0.8] });
    for (const side of [-1, 1]) {
      for (const axis of ["x", "z"] as const) {
        const span = axis === "x" ? depth : width;
        const edge = side * (axis === "x" ? width : depth) / 2;
        const bays = Math.max(2, Math.round(span / (style === "vertical" ? 2.2 : style === "curtain" ? 4.4 : 3.4)));
        const box = (along: number, y: number, w: number, h: number, thickness: number, outward = 0): Box => axis === "x"
          ? { at: [edge + side * outward, y, along], size: [thickness, h, w] }
          : { at: [along, y, edge + side * outward], size: [w, h, thickness] };
        if (hollow) stone.push(box(0, height / 2 - BUILDING.slab, span - 0.6, height, 0.08, -0.43));
        // Physical piers and spandrels sit in front of recessed glazing. Each
        // facade segment stays within its original footprint and storey range.
        for (let bay = 0; bay <= bays; bay++) {
          const along = -span / 2 + 0.24 + bay * (span - 0.48) / bays;
          const pier = style === "curtain" && bay > 0 && bay < bays ? 0.12 : style === "vertical" ? 0.62 : style === "punched" ? 0.85 : 0.48;
          cream.push(box(along, height / 2 - BUILDING.slab, pier, height, 0.48, -0.24));
        }
        for (let row = 0; row < storeys; row++) {
          if (row === 0 || style === "frame" || style === "punched") cream.push(box(0, row * TOWER.pitch - 0.18, span, style === "punched" ? 0.9 : 0.54, 0.42, -0.21));
        }
        for (let row = 0; row < storeys; row++) for (let bay = 0; bay < bays; bay++) {
          const along = -span / 2 + (bay + 0.5) * span / bays;
          const continuous = style === "vertical" || style === "curtain";
          const paneHeight = continuous ? TOWER.pitch : style === "punched" ? 2.35 : 2.8;
          const y = row * TOWER.pitch + 1.38, paneWidth = span / bays - (style === "punched" ? 0.8 : 0.34);
          glass.push(box(along, y, paneWidth, paneHeight, 0.06, -0.3));
          // Broad reflected sky and a shaded return read as glass at city scale,
          // without transparent sorting or a second interior behind every pane.
          light.push(box(along - paneWidth * 0.28, y + 0.12, paneWidth * 0.22, paneHeight * 0.9, 0.012, -0.262));
          shade.push(box(along + paneWidth * 0.34, y - 0.55, paneWidth * 0.26, style === "frame" ? 1.55 : paneHeight * 0.55, 0.012, -0.261));
          if (style !== "vertical") bars.push(box(along, y, 0.055, paneHeight, 0.09, -0.24));
          bars.push(box(along, continuous ? row * TOWER.pitch - 0.18 : y - 0.48, paneWidth, 0.055, 0.09, -0.24));
          if (style === "frame") stone.push(box(along, row * TOWER.pitch + 0.07, paneWidth, 0.1, 0.48, -0.24));
        }
      }
    }
    return { cream, glass, bars, light, shade, stone };
  }, [width, depth, storeys, hollow, style]);
  const palette = finish ? districtFinishes[finish] : { wall: materials.wall, glass: towerMaterials.glass };
  return <group><Boxes boxes={parts.stone} material={towerMaterials.stone} shadow={shadow} /><Boxes boxes={parts.cream} material={palette.wall} shadow={shadow} /><Boxes boxes={parts.glass} material={palette.glass} shadow={shadow} /><Boxes boxes={parts.light} material={towerMaterials.glassLight} shadow={shadow} /><Boxes boxes={parts.shade} material={towerMaterials.glassShade} shadow={shadow} /><Boxes boxes={parts.bars} material={towerMaterials.mullion} shadow={shadow} /></group>;
}

export function Roof({ width = TOWER.width, depth = TOWER.depth, shadow = true }: { width?: number; depth?: number; shadow?: boolean }) { // taste-skill-ignore: physical 3D daylight shadows.
  const parts = useMemo(() => {
    const parapet: Box[] = [], equipment: Box[] = [], vents: Box[] = [];
    for (const side of [-1, 1]) {
      parapet.push({ at: [side * (width / 2 - 0.2), 0.4, 0], size: [0.4, 0.6, depth] });
      parapet.push({ at: [0, 0.4, side * (depth / 2 - 0.2)], size: [width, 0.6, 0.4] });
    }
    const units = width > 15 ? [[3.6, -2.4], [-3.8, 2.7]] : [[1.8, -1.5]];
    for (const [x, z] of units) {
      equipment.push({ at: [x, 0.82, z], size: [1.8, 1.05, 1.5] });
      vents.push({ at: [x, 1.36, z], size: [1.4, 0.04, 1.15] });
      for (let i = 0; i < 5; i++) parapet.push({ at: [x, 1.39, z - 0.5 + i * 0.25], size: [1.5, 0.055, 0.045] });
      for (let i = 0; i < 4; i++) vents.push({ at: [x, 0.54 + i * 0.2, z + 0.76], size: [1.4, 0.08, 0.02] });
    }
    return { parapet, equipment, vents };
  }, [width, depth]);
  return <group dispose={null}>
    <mesh geometry={geometry.box} material={materials.wall} position={[0, -0.25, 0]} scale={[width, 0.4, depth]} receiveShadow={shadow} />
    <mesh geometry={geometry.box} material={towerMaterials.roof} position={[0, 0.05, 0]} scale={[width - 0.7, 0.12, depth - 0.7]} receiveShadow={shadow} />
    {width > 15 && <><mesh geometry={geometry.box} material={towerMaterials.stone} position={[-2, 0.93, -2.5]} scale={[4.6, 1.65, 4.4]} castShadow={shadow} receiveShadow={shadow} /><mesh geometry={geometry.box} material={materials.wall} position={[-2, 1.78, -2.5]} scale={[4.8, 0.15, 4.6]} castShadow={shadow} /></>}
    <Boxes boxes={parts.parapet} material={materials.wall} shadow={shadow} /><Boxes boxes={parts.equipment} material={towerMaterials.equipment} shadow={shadow} /><Boxes boxes={parts.vents} material={towerMaterials.vent} shadow={shadow} />
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
