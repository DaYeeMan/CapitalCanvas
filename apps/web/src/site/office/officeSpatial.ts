import { BUILDING, DESK, FLOORS, SEATING, ROOM_FRAME, type FloorId, type Point, type Room, type Size } from "./layouts";
import { partitionSections } from "./partitions";

export type SeatKind = "desk" | "conference" | "armchair" | "sofa" | "stool";
export interface Seat {
  id: string; at: Point; angle: number; height: number; kind: SeatKind; home: boolean;
  approaches: Point[]; approach: Point; room?: string;
}
export interface Solid { id: string; at: Point; size: Size; angle: number }
export interface Door {
  id: string; room: string; side: "front" | "side"; center: Point; angle: number;
  start: number; end: number; hinge: Point; width: number; swing: number;
  inside: Point; outside: Point;
}
export interface OfficeSpace { seats: Seat[]; solids: Solid[]; doors: Door[] }
const SOFA_ANCHOR_FORWARD = Math.max(SEATING.sofaSitForward.man, SEATING.sofaSitForward.woman);
export const BODY_RADIUS = 0.37;
export const STRIDE_REACH = 0.73;
export const FLOOR_LIMIT = BUILDING.width / 2 - BUILDING.wallThickness / 2;
export const distance = (a: Point, b: Point) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function transform(at: Point, local: Point, angle = 0): Point {
  return [at[0] + local[0] * Math.cos(angle) + local[1] * Math.sin(angle), at[1] - local[0] * Math.sin(angle) + local[1] * Math.cos(angle)];
}
export function seatedPosition(seat: Seat, model: "man" | "woman"): Point {
  // Raised sofa poses leave a measured buffer between the calves and sofa base.
  return seat.kind === "sofa" ? transform(seat.at, [0, SEATING.sofaSitForward[model] - SOFA_ANCHOR_FORWARD], seat.angle) : seat.at;
}
export function roomDoorConfig(room: Room) {
  const left = Math.abs(room.at[0] - room.size[0] / 2 + FLOOR_LIMIT) < 0.001;
  const sideEntry = left && room.kind !== "private";
  return room.doors ?? { side: sideEntry ? "glass" as const : undefined, front: room.kind === "private" || sideEntry ? "wood" as const : "glass" as const };
}
export function roomPlants(room: Room): readonly Point[] {
  const [w, d] = room.size;
  return room.floorPlants ?? (room.kind === "private" ? [[w / 2 - 0.55, d / 2 - 0.65]] : [[-w / 2 + 0.55, -d / 2 + 0.55], [w / 2 - 0.55, -d / 2 + 0.55]]);
}

export function createOfficeSpace(floor: FloorId): OfficeSpace {
  const seats: Seat[] = [], solids: Solid[] = [], doors: Door[] = [];
  const solid = (id: string, parent: Point, local: Point, size: Size, angle = 0, rotation = 0) => solids.push({ id, at: transform(parent, local, angle), size, angle: angle + rotation });
  function seat(id: string, parent: Point, local: Point, rotation: number, kind: SeatKind, height: number = DESK.seatTop, angle = 0, room?: string) {
    const at = transform(parent, local, angle), facing = angle + rotation;
    // Fit the seated pose independently while keeping the clear approach points.
    const sofaApproach = 0.96 - SOFA_ANCHOR_FORWARD;
    const offsets: Point[] = kind === "sofa" ? [[0, sofaApproach], [-0.85, sofaApproach], [0.85, sofaApproach]] : [[0, -SEATING.approachBack], [-0.82, 0], [0.82, 0], [0, -1.15], [-1.15, 0], [1.15, 0], [-1.35, 0], [1.35, 0]];
    const approaches = offsets.map(offset => transform(at, offset, facing));
    seats.push({ id, at, angle: facing, kind, height, home: kind === "desk", approaches, approach: approaches[0], room });
    if (kind !== "sofa" && kind !== "stool") solid(`${id}-chair`, parent, kind === "armchair" ? local : transform(local, [0, 0.04], rotation + Math.PI), kind === "armchair" ? [0.9, 0.9] : [0.78, 0.78], angle, rotation + Math.PI);
    if (kind === "stool") solid(`${id}-stool`, parent, local, [0.5, 0.5], angle);
  }
  function desk(id: string, parent: Point, local: Point, rotation = 0, angle = 0, room?: string) {
    const at = transform(parent, local, angle);
    solid(`${id}-table`, parent, local, [DESK.width, DESK.depth], angle, rotation);
    seat(id, at, transform([0, 0], [0, DESK.chairOffset], angle + rotation), angle + rotation + Math.PI, "desk", DESK.seatTop, 0, room);
  }
  for (const pod of FLOORS[floor].pods) {
    for (const x of [-1, 1]) for (const z of [-1, 1]) desk(`${pod.tool}-${x}-${z}`, pod.at, [x * DESK.podX, z * DESK.podZ], z < 0 ? Math.PI : 0);
  }
  for (const fixture of FLOORS[floor].fixtures) {
    const { id, at, kind, rotation: angle = 0 } = fixture;
    if (kind === "bench") for (const x of [-0.95, 0.95]) desk(`${id}-${x}`, at, [x, -0.22], 0, angle);
    else if (kind === "lounge") {
      solid(`${id}-sofa`, at, [0, -0.4], [3.2, 1.14], angle);
      solid(`${id}-table`, at, [0, SEATING.loungeTableZ], [1.6, 0.8], angle);
      for (const x of SEATING.sofaPlaces) seat(`${id}-${x}`, at, [x, -0.4 + SOFA_ANCHOR_FORWARD], 0, "sofa", 0.69, angle);
    } else if (kind === "coffee") {
      solid(`${id}-counter`, at, [0, -0.5], [3.1, 0.75], angle);
      for (const x of [-0.7, 0.7]) seat(`${id}-${x}`, at, [x, 0.55], Math.PI, "stool", 0.76, angle);
    } else if (kind === "conversation") {
      solid(`${id}-table`, at, [0, 0], [0.7, 0.7], angle);
      for (const x of [-0.7, 0.7]) seat(`${id}-${x}`, at, [x, 0], x < 0 ? Math.PI / 2 : -Math.PI / 2, "armchair", 0.67, angle);
    } else if (kind === "collaboration") {
      solid(`${id}-table`, at, [0, 0], [1.05, 1.05], angle);
      for (const r of [0, Math.PI * 2 / 3, Math.PI * 4 / 3]) seat(`${id}-${r}`, at, [Math.sin(r) * 1.05, Math.cos(r) * 1.05], r + Math.PI, "armchair", 0.67, angle);
    } else if (kind === "reading") {
      solid(`${id}-table`, at, [0, 0.4], [1.05, 1.05], angle);
      for (const x of [-1, 1]) seat(`${id}-${x}`, at, [x, 0.6], x < 0 ? Math.PI / 2 : -Math.PI / 2, "armchair", 0.67, angle);
      solid(`${id}-books`, at, [0, -1.43], [1.8, 0.56], angle);
      solid(`${id}-plant`, at, [1.35, -0.8], [1, 0.94], angle);
    } else {
      const size: Size = kind === "plant" ? [1, 0.94] : kind === "copier" ? [0.75, 0.75] : kind === "storage" ? [2, 0.62] : fixture.size;
      // Fixture size already includes its world rotation for wall bookcases/counters.
      solids.push({ id, at, size, angle: 0 });
    }
  }
  for (const room of FLOORS[floor].rooms) {
    const [w, d] = room.size, config = roomDoorConfig(room);
    const sideEntry = Math.abs(room.at[0] - w / 2 + FLOOR_LIMIT) < 0.001 && room.kind !== "private";
    function wall(side: "front" | "side" | "rear" | "left", at: Point, length: number, angle: number, center?: number, extend = false) {
      const partition = partitionSections(length, center, extend);
      const parent = transform(room.at, at);
      for (const pane of partition.panes) if (!pane.door) solid(`${room.id}-${side}-${pane.left}`, parent, [(pane.left + pane.right) / 2, 0], [pane.right - pane.left, 0.06], angle);
      for (const x of partition.cuts) solid(`${room.id}-${side}-jamb-${x}`, parent, [x, 0], [0.055, 0.055], angle);
      if (partition.door) {
        const { start, end } = partition.door;
        const center = transform(parent, [(start + end) / 2, 0], angle);
        // Front opens into the room; side opens outward beside its wall. Both
        // park against the near jamb, leaving the far half of the passage clear.
        doors.push({ id: `${room.id}-${side}`, room: room.id, side: side as "front" | "side", center, angle, start, end, hinge: transform(parent, [start + ROOM_FRAME.width / 2, 0], angle), width: end - start - 0.045, swing: side === "side" ? -Math.PI / 2 : Math.PI / 2, inside: transform(center, [0, -1.65], angle), outside: transform(center, [0, 1.65], angle) });
      }
    }
    wall("left", [-w / 2, 0], d, Math.PI / 2);
    wall("rear", [0, -d / 2], w, 0);
    wall("side", [w / 2, 0], d, Math.PI / 2, config.side ? -d / 2 + 0.55 : undefined, config.sideToNextPane);
    wall("front", [0, d / 2], w, 0, config.front ? room.kind === "private" || sideEntry ? -w / 2 + 0.55 : w / 2 - 0.55 : undefined);
    if (room.kind === "private") {
      desk(`${room.id}-desk`, room.at, [0, -0.4], 0, 0, room.id);
      solid(`${room.id}-books`, room.at, [-w / 2 + 1, -d / 2 + 0.17], [1.5, 0.56]);
    } else {
      const rotation = room.tableRotation ?? 0;
      solid(`${room.id}-table`, room.at, [0, 0], [SEATING.conferenceWidth, 1.4], rotation);
      for (const x of SEATING.conferenceColumns) for (const z of [-1, 1]) seat(`${room.id}-${x}-${z}`, room.at, [x, z * SEATING.conferenceRow], z < 0 ? 0 : Math.PI, "conference", DESK.seatTop, rotation, room.id);
    }
    roomPlants(room).forEach((at, i) => solid(`${room.id}-plant-${i}`, room.at, at, [1, 0.94]));
  }
  return { seats, solids, doors };
}

// Distance to a rotated rectangular obstacle; used for torso and stride checks.
export function pointSolidDistance(point: Point, solid: Solid) {
  return Math.sqrt(solidDistanceSquared(point, solid));
}
const solidAngles = new WeakMap<Solid, { c: number; s: number }>();
function solidDistanceSquared(point: Point, solid: Solid) {
  let rotation = solidAngles.get(solid);
  if (!rotation) { rotation = { c: Math.cos(solid.angle), s: Math.sin(solid.angle) }; solidAngles.set(solid, rotation); }
  const dx = point[0] - solid.at[0], dz = point[1] - solid.at[1];
  const x = Math.max(0, Math.abs(dx * rotation.c - dz * rotation.s) - solid.size[0] / 2);
  const z = Math.max(0, Math.abs(dx * rotation.s + dz * rotation.c) - solid.size[1] / 2);
  return x * x + z * z;
}
export function pointClear(space: OfficeSpace, point: Point, radius = BODY_RADIUS) {
  const squared = (radius - 1e-6) ** 2;
  return Math.abs(point[0]) + radius < FLOOR_LIMIT && Math.abs(point[1]) + radius < FLOOR_LIMIT && space.solids.every(solid => solidDistanceSquared(point, solid) >= squared);
}
export function poseClear(space: OfficeSpace, at: Point, angle: number, stride = 1) {
  // Bounds both Idle (0.361m radial) and Walk (0.324m transverse, 0.698m
  // longitudinal) skins, including clearance around hands and feet.
  const reach = (STRIDE_REACH - BODY_RADIUS) * stride;
  return [-reach, 0, reach].every(offset => pointClear(space, transform(at, [0, offset], angle)));
}
export function segmentClear(space: OfficeSpace, from: Point, to: Point) {
  const length = distance(from, to), angle = Math.atan2(to[0] - from[0], to[1] - from[1]);
  const samples = Math.max(1, Math.ceil(length / 0.1));
  for (let i = 0; i <= samples; i++) {
    const at: Point = [from[0] + (to[0] - from[0]) * i / samples, from[1] + (to[1] - from[1]) * i / samples];
    // Shorten the gait into Idle at turns/arrival; feet cannot extend past a
    // segment endpoint into the wall. Rendering uses the same stride factor.
    const stride = Math.min(1, Math.min(length * i / samples, length * (1 - i / samples)) / (STRIDE_REACH - BODY_RADIUS));
    if (!poseClear(space, at, angle, stride)) return false;
  }
  return true;
}
