import { IcosahedronGeometry } from "three";
import { geometry, materials } from "./sceneResources";
import { Facade, Roof } from "./TowerAssembly";
import { towerMaterials } from "./towerResources";
import { DISTRICT_BUILDINGS, GROUND_Y, TOWER } from "./towerStructure";

const canopy = new IcosahedronGeometry(1, 1);
const TREES = [[-14, -7], [-14, 7], [-14, 24], [10, 25], [24, -12], [37, -9], [23, 38], [37, 26], [-30, 9]];

export function CityDistrict() {
  return <group name="grounded-district" position={[0, GROUND_Y, 0]} dispose={null}>
    <mesh geometry={geometry.box} material={towerMaterials.ground} position={[0, -0.12, 0]} scale={[700, 0.2, 700]} receiveShadow />
    {(["x", "z"] as const).map(axis => <group key={axis}>
      <mesh geometry={geometry.box} material={towerMaterials.road} position={axis === "x" ? [17, 0.01, 0] : [0, 0.01, 17]} scale={axis === "x" ? [6, 0.02, 180] : [180, 0.02, 6]} receiveShadow />
      {Array.from({ length: 19 }, (_, i) => <mesh key={i} geometry={geometry.box} material={materials.wall} position={axis === "x" ? [17, 0.025, i * 8 - 72] : [i * 8 - 72, 0.025, 17]} scale={axis === "x" ? [0.12, 0.02, 3] : [3, 0.02, 0.12]} />)}
    </group>)}
    <mesh geometry={geometry.box} material={towerMaterials.paving} position={[0, 0.08, 0]} scale={[25, 0.12, 25]} receiveShadow />
    {DISTRICT_BUILDINGS.map((building, i) => <group key={i} position={[building.x, 0.2, building.z]}>
      <mesh geometry={geometry.box} material={towerMaterials.paving} position={[0, -0.1, 0]} scale={[building.width + 3, 0.12, building.depth + 3]} receiveShadow />
      <Facade width={building.width} depth={building.depth} storeys={building.storeys} />
      <group position={[0, building.storeys * TOWER.pitch, 0]}><Roof width={building.width} depth={building.depth} /></group>
    </group>)}
    {TREES.map(([x, z], i) => <group key={i} position={[x, 0.15, z]}>
      <mesh geometry={geometry.box} material={materials.wall} scale={[2.6, 0.25, 2.6]} receiveShadow />
      <mesh geometry={geometry.cylinder} material={materials.wood} position={[0, 1.3, 0]} scale={[0.22, 2.6, 0.22]} castShadow />
      <mesh geometry={canopy} material={towerMaterials.leaf} position={[0, 3.4, 0]} scale={[1.65, 2, 1.65]} castShadow receiveShadow />
      <mesh geometry={canopy} material={towerMaterials.leaf} position={[0.85, 3, 0.5]} scale={[1.1, 1.4, 1.1]} castShadow />
    </group>)}
  </group>;
}
