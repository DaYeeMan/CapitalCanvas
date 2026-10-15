import { MeshStandardMaterial } from "three";

// Shared for the lifetime of the preview, like the existing office finishes.
export const towerMaterials = {
  glass: new MeshStandardMaterial({ color: "#75b3de", roughness: 0.45, metalness: 0.08 }),
  mullion: new MeshStandardMaterial({ color: "#35688b", roughness: 0.6 }),
  ground: new MeshStandardMaterial({ color: "#f4f2ed", roughness: 1 }),
  road: new MeshStandardMaterial({ color: "#e0e4e7", roughness: 1 }),
  paving: new MeshStandardMaterial({ color: "#fdfaf3", roughness: 1 }),
  leaf: new MeshStandardMaterial({ color: "#71964a", roughness: 0.95 }),
};
