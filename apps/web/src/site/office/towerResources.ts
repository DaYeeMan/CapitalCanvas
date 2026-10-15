import { MeshStandardMaterial } from "three";

// Every connected street shares one asphalt finish; atmosphere owns distance fading.
const asphalt = new MeshStandardMaterial({ color: "#bec5cd", roughness: 1 });

// Shared for the lifetime of the preview, like the existing office finishes.
export const towerMaterials = {
  glass: new MeshStandardMaterial({ color: "#3e82a7", roughness: 0.28, metalness: 0.22 }),
  glassLight: new MeshStandardMaterial({ color: "#84bbd0", roughness: 0.3, metalness: 0.15 }),
  glassShade: new MeshStandardMaterial({ color: "#286483", roughness: 0.32, metalness: 0.18 }),
  mullion: new MeshStandardMaterial({ color: "#31566b", roughness: 0.55 }),
  stone: new MeshStandardMaterial({ color: "#eee8dc", roughness: 0.88 }),
  roof: new MeshStandardMaterial({ color: "#dedbd3", roughness: 0.95 }),
  equipment: new MeshStandardMaterial({ color: "#c1c8cb", roughness: 0.7 }),
  vent: new MeshStandardMaterial({ color: "#697981", roughness: 0.8 }),
  ground: new MeshStandardMaterial({ color: "#f4f2ed", roughness: 1 }),
  road: asphalt,
  roadFar: asphalt,
  distant: new MeshStandardMaterial({ color: "#eef0f0", roughness: 1 }),
  paving: new MeshStandardMaterial({ color: "#fdfaf3", roughness: 1 }),
  leaf: new MeshStandardMaterial({ color: "#6c8b37", roughness: 0.95, flatShading: true }),
  leafLight: new MeshStandardMaterial({ color: "#9ab54f", roughness: 0.95, flatShading: true }),
  leafDark: new MeshStandardMaterial({ color: "#537733", roughness: 0.95, flatShading: true }),
  soil: new MeshStandardMaterial({ color: "#718051", roughness: 1 }),
  bark: new MeshStandardMaterial({ color: "#8a7355", roughness: 1 }),
};

// Related cream masonry and blue glazing, with a distinct finish per neighbour.
export const districtFinishes = {
  limestone: { wall: new MeshStandardMaterial({ color: "#e4d9c4", roughness: 0.9 }), glass: new MeshStandardMaterial({ color: "#347da1", roughness: 0.3, metalness: 0.18 }) },
  ivory: { wall: new MeshStandardMaterial({ color: "#f2e9d8", roughness: 0.88 }), glass: new MeshStandardMaterial({ color: "#478eaf", roughness: 0.3, metalness: 0.18 }) },
  chalk: { wall: new MeshStandardMaterial({ color: "#e8e4da", roughness: 0.92 }), glass: new MeshStandardMaterial({ color: "#306f92", roughness: 0.32, metalness: 0.18 }) },
};
