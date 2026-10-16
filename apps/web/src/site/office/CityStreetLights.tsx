import { DataTexture, MeshBasicMaterial, MeshStandardMaterial, RGBAFormat, SRGBColorSpace } from "three";
import { geometry } from "./sceneResources";
import { TOWER_SITE } from "./towerStructure";

const positions = [
  [TOWER_SITE.x - 13.6, TOWER_SITE.z - 6], [TOWER_SITE.x - 13.6, TOWER_SITE.z + 8.5],
  [TOWER_SITE.x + 13.6, TOWER_SITE.z - 8], [TOWER_SITE.x + 13.6, TOWER_SITE.z + 8],
  [-31.2, 12], [22.5, 34.8], [37.7, -1], [-28, -18],
  // Continue the reference's light rhythm around the blank context blocks.
  [-61, 8], [-58.2, -22], [3.3, -22], [26.8, -22], [-74.4, -22],
] as const;
const post = new MeshStandardMaterial({ color: "#34434c", metalness: 0.5, roughness: 0.6 });
const bulb = new MeshStandardMaterial({ color: "#fff0d1", emissive: "#ffdfaa", emissiveIntensity: 3 });
const pixels = new Uint8Array(64 * 64 * 4);
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  const offset = (y * 64 + x) * 4, distance = Math.hypot(x - 31.5, y - 31.5) / 31.5;
  pixels.set([255, 198, 118, Math.round(Math.max(0, 1 - distance) ** 2 * 110)], offset);
}
const poolTexture = new DataTexture(pixels, 64, 64, RGBAFormat);
poolTexture.colorSpace = SRGBColorSpace;
poolTexture.needsUpdate = true;
const pool = new MeshBasicMaterial({ map: poolTexture, transparent: true, depthWrite: false, toneMapped: false });

export function CityStreetLights() {
  return <group name="city-street-lights" dispose={null}>{positions.map(([x, z], index) => <group key={index} position={[x, 0, z]}>
    <mesh geometry={geometry.cylinder} material={post} position={[0, 1.55, 0]} scale={[0.095, 3.1, 0.095]} />
    <mesh geometry={geometry.cylinder} material={post} position={[0, 0.15, 0]} scale={[0.3, 0.3, 0.3]} />
    <mesh geometry={geometry.cylinder} material={bulb} position={[0, 3.2, 0]} scale={[0.3, 0.4, 0.3]} />
    <mesh geometry={geometry.pane} material={pool} position={[0, 0.232, 0]} rotation-x={-Math.PI / 2} scale={[9, 9, 1]} />
    <pointLight color="#ffe1b2" position={[0, 3.1, 0]} intensity={19} distance={13} decay={1.8} />
  </group>)}</group>;
}
