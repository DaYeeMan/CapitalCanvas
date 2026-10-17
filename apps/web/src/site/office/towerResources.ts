import { DataTexture, LinearFilter, MeshStandardMaterial, RGBAFormat, SRGBColorSpace, type MeshStandardMaterialParameters } from "three";

import { isolateExteriorLighting } from "./officeLightIsolation";

const exterior = (parameters: MeshStandardMaterialParameters) => isolateExteriorLighting(new MeshStandardMaterial(parameters));

// A shared interior finish keeps the jambs dim while a soft ceiling light and
// bright room centre cross the existing bloom threshold. It adds no lights,
// geometry or postprocessing passes, including on the mobile quality tiers.
const pixels = new Uint8Array(64 * 64 * 4);
for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) {
  const u = x / 63, v = y / 63;
  const glow = Math.exp(-((u - 0.45) ** 2 * 5 + (v - 0.78) ** 2 * 3));
  const ceiling = Math.exp(-(((v - 0.82) / 0.065) ** 2)) * Math.exp(-(((u - 0.5) / 0.42) ** 4));
  const reveal = Math.min(1, Math.min(u, 1 - u) * 13);
  const shade = Math.min(1, (0.24 + glow * 0.64 + ceiling * 0.16) * (0.5 + reveal * 0.5));
  const i = (y * 64 + x) * 4;
  pixels[i] = Math.round(255 * shade);
  pixels[i + 1] = Math.round(246 * shade);
  pixels[i + 2] = Math.round(226 * shade);
  pixels[i + 3] = 255;
}
const interior = new DataTexture(pixels, 64, 64, RGBAFormat);
interior.colorSpace = SRGBColorSpace;
interior.magFilter = interior.minFilter = LinearFilter;
interior.needsUpdate = true;

// Every connected street shares one asphalt finish; atmosphere owns distance fading.
const asphalt = exterior({ color: "#596573", roughness: 1 });

// Shared for the lifetime of the preview, like the existing office finishes.
export const towerMaterials = {
  wall: exterior({ color: "#e9e5e2", roughness: 0.85 }),
  glass: exterior({ color: "#244b62", roughness: 0.28, metalness: 0.22 }),
  glassLight: exterior({ color: "#3a5e73", roughness: 0.3, metalness: 0.15 }),
  glassShade: exterior({ color: "#203849", roughness: 0.32, metalness: 0.18 }),
  litWindow: exterior({ color: "#a28c69", map: interior, emissive: "#ffe0ac", emissiveMap: interior, emissiveIntensity: 3.4, roughness: 0.65 }),
  mullion: exterior({ color: "#31566b", roughness: 0.55 }),
  stone: exterior({ color: "#eee8dc", roughness: 0.88 }),
  roof: exterior({ color: "#7c858a", roughness: 0.95 }),
  equipment: exterior({ color: "#c1c8cb", roughness: 0.7 }),
  vent: exterior({ color: "#697981", roughness: 0.8 }),
  ground: exterior({ color: "#435260", roughness: 1 }),
  road: asphalt,
  roadFar: asphalt,
  distant: exterior({ color: "#596b7c", roughness: 1 }),
  paving: exterior({ color: "#7b8289", roughness: 1 }),
  leaf: exterior({ color: "#4f6a45", roughness: 0.95, flatShading: true }),
  leafLight: exterior({ color: "#718449", roughness: 0.95, flatShading: true }),
  leafDark: exterior({ color: "#3e583d", roughness: 0.95, flatShading: true }),
  soil: exterior({ color: "#718051", roughness: 1 }),
  bark: exterior({ color: "#8a7355", roughness: 1 }),
};

// Detailed neighbours share the office's cream masonry while keeping their
// individual glazing finishes and existing facade rhythms.
export const districtFinishes = {
  limestone: { wall: towerMaterials.wall, glass: exterior({ color: "#274a60", roughness: 0.3, metalness: 0.18 }) },
  ivory: { wall: towerMaterials.wall, glass: exterior({ color: "#365b70", roughness: 0.3, metalness: 0.18 }) },
  chalk: { wall: towerMaterials.wall, glass: exterior({ color: "#29475c", roughness: 0.32, metalness: 0.18 }) },
};
