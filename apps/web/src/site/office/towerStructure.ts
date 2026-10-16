import { BUILDING, type FloorId } from "./layouts";

export type PreviewView = "city" | FloorId;

// Shared with the cutaway wall handoff so the closed seam has one envelope.
export const FACADE_BAND = Object.freeze({ centerY: -0.18, height: 0.54 });

// One fixed site placement for the complete tower and its landscaped plot.
// Trim only the rear paving to preserve the full sidewalks on both streets.
export const TOWER_SITE = Object.freeze({ x: -1.5, z: -1.5, plotSize: 27.2, rearTrim: 1.7 });
export const TOWER_PLOT = Object.freeze({
  x: TOWER_SITE.x, z: TOWER_SITE.z + TOWER_SITE.rearTrim / 2,
  width: TOWER_SITE.plotSize, depth: TOWER_SITE.plotSize - TOWER_SITE.rearTrim,
});
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

// Surround the rounded plot with continuous paving up to the asphalt edges.
// Meet the east edge of the left neighbour's paved plot, closing the alley gap.
const plotLeft = DISTRICT_BUILDINGS[0].x + (DISTRICT_BUILDINGS[0].width + 5) / 2;
export const TOWER_SIDEWALK = Object.freeze({
  x: (plotLeft + 13.6) / 2, z: -0.5, width: 13.6 - plotLeft, depth: 28.2,
});
