import { DESK, FLOORS, type FloorId, type Point } from "./layouts";

export interface WalkRoute { from: Point; to: Point; phase: number; model: "man" | "woman" }
export const WALKER_RADIUS = 0.45;
export const WALKER_DEPTH = 1.5;
export const WALK_ROUTES: Record<FloorId, readonly WalkRoute[]> = {
  home: [
    { from: [0, 0.8], to: [0, 8.6], phase: 0.15, model: "woman" },
    { from: [1.3, 2.75], to: [8.5, 2.75], phase: 0.7, model: "man" },
  ],
  resources: [
    { from: [2.55, -2.45], to: [2.55, 8.8], phase: 0.7, model: "woman" },
    { from: [-2.7, 6.25], to: [1.3, 6.25], phase: 0.2, model: "man" },
  ],
};
export function walkSample(route: WalkRoute, seconds: number) {
  const length = Math.hypot(route.to[0] - route.from[0], route.to[1] - route.from[1]);
  const travel = length / 0.65, pause = 0.8, cycle = 2 * (travel + pause);
  const t = (seconds + route.phase * cycle) % cycle;
  const returning = t >= travel + pause;
  const leg = returning ? t - travel - pause : t;
  const walking = leg < travel;
  const fraction = Math.min(leg / travel, 1);
  const p = returning ? 1 - fraction : fraction;
  return { x: route.from[0] + (route.to[0] - route.from[0]) * p, z: route.from[1] + (route.to[1] - route.from[1]) * p, walking, angle: Math.atan2((route.to[0] - route.from[0]) * (returning ? -1 : 1), (route.to[1] - route.from[1]) * (returning ? -1 : 1)) };
}
export function seatedWorkers(floor: FloorId) {
  const seats = FLOORS[floor].pods.flatMap(pod => [-1, 1].map(side => ({ id: `${pod.tool}-${side}`, x: pod.at[0] + side * DESK.podX, z: pod.at[1] + side * (DESK.podZ + DESK.chairOffset), angle: side > 0 ? Math.PI : 0, model: (side > 0 ? "woman" : "man") as "man" | "woman" })));
  const room = FLOORS[floor].rooms.find(room => room.kind === "private")!;
  return [...seats, { id: "private", x: room.at[0], z: room.at[1] - 0.4 + DESK.chairOffset, angle: Math.PI, model: "man" as const }];
}
