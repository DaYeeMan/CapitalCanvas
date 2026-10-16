import { type Group, type PointLight } from "three";
import { FLOORS, type FloorId, type Point } from "./layouts";

export const LAMP_BASE_SIZE = 0.36;

// Fade before the interior's visibility cutoff. Physical clearance makes this
// reversible and continuous through interrupted journeys and floor changes.
export function floorLightReveal(facadeLift: number, sliceLift: number) {
  const gap = facadeLift - sliceLift;
  const t = Math.max(0, Math.min(1, (gap - 0.05) / 1.15));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

const floorLights = new WeakMap<Group, { light: PointLight; intensity: number }[]>();
export function applyFloorLightReveal(group: Group, reveal: number) {
  let lamps = floorLights.get(group);
  if (!lamps) {
    lamps = [];
    group.traverse(object => {
      const light = object as PointLight;
      if (light.isPointLight && (light.name === "task-light" || light.name === "lounge-light")) lamps!.push({ light, intensity: light.intensity });
    });
    floorLights.set(group, lamps);
  }
  for (const { light, intensity } of lamps) light.intensity = intensity * reveal;
}

// Rendering and navigation share the floor-lamp footprints.
export function floorLampPositions(floor: FloorId): { id: string; at: Point }[] {
  return FLOORS[floor].fixtures.filter(f => f.kind === "lounge" || f.kind === "reading" || f.kind === "collaboration").map(f => {
    const local = f.kind === "reading" ? [-1.5, -1.3] : f.kind === "collaboration" ? [-1.35, -1.2] : [-1.9, -0.4];
    const angle = f.rotation ?? 0;
    return { id: f.id + "-lamp", at: [f.at[0] + local[0] * Math.cos(angle) + local[1] * Math.sin(angle), f.at[1] - local[0] * Math.sin(angle) + local[1] * Math.cos(angle)] as Point };
  });
}
