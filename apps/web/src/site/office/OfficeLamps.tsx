import { CylinderGeometry, MeshStandardMaterial } from "three";
import { geometry } from "./sceneResources";
import { floorLampPositions, LAMP_BASE_SIZE } from "./officeLighting";
import type { FloorId } from "./layouts";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const frame = new MeshStandardMaterial({ color: "#28343d", metalness: 0.4, roughness: 0.5 });
const emitter = new MeshStandardMaterial({ color: "#fff3df", emissive: "#ffe6bd", emissiveIntensity: 2.2, roughness: 0.6 });
const shade = new CylinderGeometry(0.12, 0.18, 0.16, 16);
const floorShade = new CylinderGeometry(0.21, 0.25, 0.33, 20);
const taskParts = [
  geometry.cylinder.clone().scale(0.21, 0.05, 0.21).translate(0, 0.025, 0),
  geometry.cylinder.clone().scale(0.025, 0.43, 0.025).translate(0, 0.24, 0),
  geometry.box.clone().scale(0.25, 0.028, 0.028).rotateZ(-0.28).translate(-0.105, 0.46, 0),
  shade.clone().translate(-0.22, 0.43, 0),
];
const taskFrame = mergeGeometries(taskParts);
taskParts.forEach(part => part.dispose());
shade.dispose();

export function TaskLamp({ illuminate = false }: { illuminate?: boolean }) {
  return <group name="desk-task-lamp" dispose={null}>
    <mesh geometry={taskFrame!} material={frame} />
    <mesh geometry={geometry.cylinder} material={emitter} position={[-0.22, 0.345, 0]} scale={[0.25, 0.015, 0.25]} />
    <pointLight name="task-light" position={[-0.22, 0.31, 0]} color="#ffe0b2" intensity={illuminate ? 3.6 : 2.4} distance={6.5} decay={1.3} />
  </group>;
}

export function OfficeLamps({ floor }: { floor: FloorId }) {
  return <group name="lounge-floor-lamps" dispose={null}>{floorLampPositions(floor).map(lamp => <group key={lamp.id} name={lamp.id} position={[lamp.at[0], 0, lamp.at[1]]}>
    <mesh geometry={geometry.cylinder} material={frame} position={[0, 0.025, 0]} scale={[LAMP_BASE_SIZE, 0.05, LAMP_BASE_SIZE]} />
    <mesh geometry={geometry.cylinder} material={frame} position={[0, 0.86, 0]} scale={[0.035, 1.68, 0.035]} />
    <mesh geometry={floorShade} material={emitter} position={[0, 1.84, 0]} />
    <pointLight name="lounge-light" position={[0, 1.65, 0]} color="#ffe3bc" intensity={14} distance={9} decay={1.7} />
  </group>)}</group>;
}
