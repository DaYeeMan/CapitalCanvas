import { BUILDING, type FloorId } from "./layouts";

export type PreviewView = "city" | FloorId;

// The office interiors keep their local coordinates. Only their parent groups
// move; these tower levels are independent of the older layout metadata.
export const TOWER = {
  pitch: 3.4,
  homeLevel: 13,
  resourcesLevel: 6,
  storeys: 16,
  sliceLift: 2.2,
  upperLift: 32,
  width: BUILDING.width + BUILDING.wallThickness,
  depth: BUILDING.depth + BUILDING.wallThickness,
} as const;
export const GROUND_Y = -TOWER.homeLevel * TOWER.pitch - BUILDING.slab;
export const INTERVENING_STOREYS = TOWER.homeLevel - TOWER.resourcesLevel - 1;
export const levelY = (level: number) => (level - TOWER.homeLevel) * TOWER.pitch;

export function readPreviewView(hash = window.location.hash): PreviewView {
  return hash === "#home" ? "home" : hash === "#resources" ? "resources" : "city";
}

export function towerPose(view: PreviewView) {
  const open = view !== "city";
  const resources = view === "resources";
  return {
    view,
    floor: (resources ? "resources" : "home") as FloorId,
    floorY: levelY(resources ? TOWER.resourcesLevel : TOWER.homeLevel) + (open ? TOWER.sliceLift : 0),
    middleOffset: resources ? TOWER.upperLift : 0,
    capOffset: open ? TOWER.upperLift : 0,
    top: levelY(TOWER.storeys) + (open ? TOWER.upperLift : 0) + 2,
  };
}

export const DISTRICT_BUILDINGS = [
  { x: -24.5, z: 3.9, width: 11, depth: 12, storeys: 3 },
  { x: 3.4, z: 29.1, width: 13, depth: 10, storeys: 2 },
  { x: 29.6, z: 3.4, width: 11, depth: 13, storeys: 3 },
  { x: 29.1, z: 29.6, width: 10, depth: 11, storeys: 2 },
] as const;
