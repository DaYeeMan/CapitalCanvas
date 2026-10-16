import { ExtrudeGeometry, IcosahedronGeometry } from "three";
import { geometry, materials } from "./sceneResources";
import { Boxes, Facade, Roof, type Box } from "./TowerAssembly";
import { towerMaterials } from "./towerResources";
import { DISTRICT_BUILDINGS, GROUND_Y, TOWER, TOWER_SITE, TOWER_PLOT, TOWER_SIDEWALK } from "./towerStructure";
import { cityRoadParts } from "./cityRoads";
import { roundedPlotOutline, towerSidewalkGeometry } from "./cityPlot";
import { CityStreetLights } from "./CityStreetLights";

const canopy = new IcosahedronGeometry(1, 1);
const leaf = new IcosahedronGeometry(1, 0);
const styles = ["vertical", "curtain", "punched", "vertical"] as const;
const finishes = ["limestone", "ivory", "chalk", "ivory"] as const;
const sidewalk = new ExtrudeGeometry(roundedPlotOutline(1, 1), { depth: 1, bevelEnabled: false, curveSegments: 5 });
sidewalk.rotateX(-Math.PI / 2); sidewalk.translate(0, -0.5, 0);
const towerWalk = towerSidewalkGeometry();

// The four authored neighbours retain their detailed architecture. All distant
// context blocks stay blank, without window geometry or emissive accents.
const CONTEXT = [
  [-48, -29, 9, 8, 11], [-48, -7, 7, 8, 7], [-47, 7, 8, 7, 5],
  [-26.9, -32, 11, 9, 15], [-10, -32, 9, 8, 8], [7, -32, 7, 7, 5],
  [30, -32, 12, 9, 13], [53, -29, 11, 12, 11], [51.3, 3, 7, 9, 6],
  [-56.4, -7, 8, 9, 8], [-76.6, -30, 10, 9, 12], [-47, -55, 9, 9, 10],
  [-21, -57, 11, 9, 14], [-89, -8.9, 10, 9, 10], [-87, -35, 8, 9, 6],
  [-83, 7, 9, 8, 5], [-108, -8, 9, 9, 10], [-101, 8, 7, 8, 7],
] as const;
const TREES = [
  [TOWER_SITE.x - 12.5, TOWER_SITE.z - 9, 1], [TOWER_SITE.x - 12.5, TOWER_SITE.z + 7, 0.9],
  [TOWER_SITE.x + 12.3, TOWER_SITE.z - 9, 1.05], [TOWER_SITE.x + 12.3, TOWER_SITE.z + 8.5, 0.95],
  [-31, -25, 0.95], [-7, -24, 0.85], [23, -25, 0.9], [48, 22, 0.8],
  [-57, -10, 0.8], [-56, -27, 0.85], [-30, -38.8, 0.9], [-71, -23.8, 0.85],
] as const;
const STREET_TREES = [[-57.3, 8, 0.85], [0.3, -23.8, 0.85]] as const;
const plotTrees = DISTRICT_BUILDINGS.flatMap((b, index) => [
  [b.x - b.width / 2 - 1.2, b.z - b.depth / 2 + 1.4, 0.9 + index * 0.04],
  [b.x + b.width / 2 + 1.2, b.z + b.depth / 2 - 1.5, 1],
] as const);

function districtParts() {
  const stone: Box[] = [], soil: Box[] = [], bark: Box[] = [], paving: Box[] = [], curb: Box[] = [];
  const seams: Box[] = [], context: Box[] = [];
  const leaves: Box[][] = [[], [], []], shrubs: Box[][] = [[], [], []];
  const add = (list: Box[], x: number, y: number, z: number, w: number, h: number, d: number) => list.push({ at: [x, y, z], size: [w, h, d] });
  const plot = (x: number, z: number, w: number, d: number) => {
    add(curb, x, 0.08, z, w, 0.16, d);
    add(paving, x, 0.12, z, w - 0.28, 0.16, d - 0.28);
    for (let dx = -w / 2 + 2; dx < w / 2 - 1; dx += 2) add(seams, x + dx, 0.205, z, 0.018, 0.008, d - 0.8);
    for (let dz = -d / 2 + 2; dz < d / 2 - 1; dz += 2) add(seams, x, 0.205, z + dz, w - 0.8, 0.008, 0.018);
  };
  plot(TOWER_PLOT.x, TOWER_PLOT.z, TOWER_PLOT.width, TOWER_PLOT.depth);
  DISTRICT_BUILDINGS.forEach(b => plot(b.x, b.z, b.width + 5, b.depth + 5));
  // The curved apron owns this entire rectangle, so street strips cannot
  // overlap it or leave rectangular cutouts beneath the rounded plot corners.
  const streets = cityRoadParts([TOWER_SIDEWALK,
    ...DISTRICT_BUILDINGS.map(b => ({ x: b.x, z: b.z, width: b.width + 5, depth: b.depth + 5 }))]);
  CONTEXT.forEach(([x, z, w, d, h]) => add(context, x, h / 2, z, w, h, d));

  const planter = (x: number, z: number, w: number, d: number, count: number) => {
    add(stone, x, 0.42, z, w, 0.42, d);
    add(soil, x, 0.64, z, w - 0.2, 0.035, d - 0.2);
    for (let i = 0; i < count; i++) {
      const along = (i + 0.5) / count - 0.5;
      const px = x + (w > d ? along * (w - 0.3) : Math.sin(i * 2.4) * w * 0.12);
      const pz = z + (d >= w ? along * (d - 0.3) : Math.cos(i * 2.4) * d * 0.12);
      const height = 0.65 + (i % 3) * 0.2;
      add(shrubs[i % 3], px, 0.66 + height * 0.55, pz, 0.55, height, 0.56);
      add(shrubs[(i + 1) % 3], px + 0.17, 0.81, pz + 0.18, 0.38, 0.42, 0.4);
    }
  };
  // Planted ribbons leave the entry doors and sidewalk approaches open.
  for (const side of [-1, 1]) {
    planter(TOWER_SITE.x + side * 7.4, TOWER_SITE.z + 11.35, 4.4, 1.35, 7);
    planter(TOWER_SITE.x + 11.35, TOWER_SITE.z + side * 6.6, 1.35, 5, 8);
    planter(TOWER_SITE.x - 11.35, TOWER_SITE.z + side * 5, 1.15, 6, 8);
  }
  DISTRICT_BUILDINGS.forEach(b => {
    for (const side of [-1, 1]) planter(b.x + side * b.width * 0.34, b.z + b.depth / 2 + 0.8, b.width * 0.27, 1.1, 5);
    planter(b.x + b.width / 2 + 0.8, b.z, 1.1, b.depth - 2, 10);
  });
  [...TREES, ...plotTrees, ...STREET_TREES].forEach(([x, z, scale], index) => {
    // The two new trees stand on bare ground, 20cm below the paved plots.
    const baseY = index < TREES.length + plotTrees.length ? 0 : -0.2;
    add(stone, x, baseY + 0.3, z, 2.35, 0.24, 2.35); add(soil, x, baseY + 0.43, z, 2.08, 0.04, 2.08);
    add(bark, x, baseY + 1.9 * scale, z, 0.24 * scale, 3.3 * scale, 0.24 * scale);
    // Overlapping asymmetric crowns replace the old two-ball silhouette.
    for (let i = 0; i < 9; i++) {
      const angle = i * 2.4 + index, ring = i === 0 ? 0 : 0.95;
      const y = i === 0 ? 5.3 : 3.9 + (i % 3) * 0.53;
      add(leaves[(i + index) % 3], x + Math.cos(angle) * ring * scale, baseY + y * scale, z + Math.sin(angle) * ring * scale,
        (1.05 + i % 2 * 0.16) * scale, (1.35 + i % 3 * 0.12) * scale, 1.06 * scale);
    }
  });
  return { stone, soil, bark, paving, curb, ...streets, seams, context, leaves, shrubs };
}
const parts = districtParts();

function Entrance({ width, depth, large = false }: { width: number; depth: number; large?: boolean }) {
  const doorWidth = large ? 3.8 : 2.5;
  return <group position={[0, 0, depth / 2]}>
    <mesh geometry={geometry.box} material={towerMaterials.glassShade} position={[0, 1.45, 0.02]} scale={[doorWidth, 2.7, 0.1]} />
    <mesh geometry={geometry.box} material={materials.wall} position={[0, 2.95, 0.8]} scale={[Math.min(width - 1, doorWidth + 1.6), 0.22, 2]} castShadow receiveShadow />
    {[-1, 1].map(side => <group key={side}>
      <mesh geometry={geometry.box} material={towerMaterials.stone} position={[side * (doorWidth / 2 + 0.3), 1.45, 1.48]} scale={[0.28, 2.9, 0.28]} castShadow receiveShadow />
      <mesh geometry={geometry.box} material={towerMaterials.mullion} position={[side * 0.09, 1.2, 0.09]} scale={[0.035, 0.45, 0.06]} />
    </group>)}
    <mesh geometry={geometry.box} material={towerMaterials.mullion} position={[0, 1.45, 0.08]} scale={[0.06, 2.8, 0.05]} />
    <mesh geometry={geometry.box} material={towerMaterials.stone} position={[0, 0.08, 0.9]} scale={[doorWidth + 1.6, 0.16, 2]} receiveShadow />
  </group>;
}

export function CityDistrict() {
  return <group name="grounded-district" position={[0, GROUND_Y, 0]} dispose={null}>
    <CityStreetLights />
    <mesh geometry={geometry.box} material={towerMaterials.ground} position={[0, -0.12, 0]} scale={[700, 0.2, 700]} receiveShadow />
    <Boxes boxes={parts.roads} material={towerMaterials.road} /><Boxes boxes={parts.farRoads} material={towerMaterials.roadFar} />
    <Boxes boxes={parts.sidewalks} material={towerMaterials.paving} />
    <mesh name="tower-sidewalk" geometry={towerWalk} material={towerMaterials.paving} receiveShadow />
    <Boxes boxes={parts.paving} material={towerMaterials.paving} shape={sidewalk} /><Boxes boxes={parts.curb} material={towerMaterials.stone} shape={sidewalk} />
    <Boxes boxes={parts.seams} material={towerMaterials.roof} shadow={false} /><Boxes boxes={parts.markings} material={materials.wall} shadow={false} />
    <Boxes boxes={parts.context} material={towerMaterials.distant} shadow={false} />
    <group position={[TOWER_SITE.x, 0.45, TOWER_SITE.z]}><Entrance width={TOWER.width} depth={TOWER.depth} large /></group>
    {DISTRICT_BUILDINGS.map((building, i) => <group key={i} position={[building.x, 0.65, building.z]}>
      <Facade width={building.width} depth={building.depth} storeys={building.storeys} style={styles[i]} finish={finishes[i]} />
      <group position={[0, building.storeys * TOWER.pitch - 0.45, 0]}><Roof width={building.width} depth={building.depth} /></group>
      <Entrance width={building.width} depth={building.depth} />
    </group>)}
    <Boxes boxes={parts.stone} material={towerMaterials.stone} /><Boxes boxes={parts.soil} material={towerMaterials.soil} />
    <Boxes boxes={parts.bark} material={towerMaterials.bark} shape={geometry.cylinder} />
    {([towerMaterials.leaf, towerMaterials.leafLight, towerMaterials.leafDark]).map((material, i) => <group key={i}>
      <Boxes boxes={parts.leaves[i]} material={material} shape={canopy} />
      <Boxes boxes={parts.shrubs[i]} material={material} shape={leaf} />
    </group>)}
  </group>;
}
