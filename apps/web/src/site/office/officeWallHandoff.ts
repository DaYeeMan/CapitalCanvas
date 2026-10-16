import type { Group } from "three";
import { BUILDING } from "./layouts";
import { FACADE_BAND } from "./towerStructure";

const seamInset = 0.01;
const closedHeight = FACADE_BAND.centerY + FACADE_BAND.height / 2 - seamInset;

export function cutawayWallPose(facadeLift: number, sliceLift: number) {
  const gap = facadeLift - sliceLift;
  const t = Math.max(0, Math.min(1, (gap - 0.05) / 1.15));
  const reveal = t * t * t * (t * (t * 6 - 15) + 10);
  return { height: closedHeight + (BUILDING.frontWall - closedHeight) * reveal, inset: seamInset * (1 - reveal) };
}

const walls = new WeakMap<Group, { front: Group; east: Group; south: Group }>();
export function applyCutawayWallHandoff(office: Group, facadeLift: number, sliceLift: number) {
  let parts = walls.get(office);
  if (!parts) {
    const front = office.getObjectByName("cutaway-front-walls") as Group | undefined;
    const east = front?.getObjectByName("cutaway-east-wall") as Group | undefined;
    const south = front?.getObjectByName("cutaway-south-wall") as Group | undefined;
    if (!front || !east || !south) return;
    parts = { front, east, south }; walls.set(office, parts);
  }
  // Scale from the floor plane, then tuck behind the exterior skin. By the
  // visibility cutoff these walls are fully covered by the opaque facade band.
  const pose = cutawayWallPose(facadeLift, sliceLift);
  parts.front.scale.y = pose.height / BUILDING.frontWall;
  parts.east.position.x = -pose.inset; parts.south.position.z = -pose.inset;
}
