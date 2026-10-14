import { describe, expect, it } from "vitest";
import { BUILDING, DESK, FLOORS, POD_SIZE, overlaps, type FloorId } from "./layouts";
import { seatedWorkers, WALK_ROUTES, WALKER_RADIUS, WALKER_DEPTH, walkSample, type WalkRoute } from "./peoplePaths";

function walkEnvelope(route: WalkRoute, time: number) {
  const sample = walkSample(route, time);
  const alongX = route.from[0] !== route.to[0];
  return { at: [sample.x, sample.z] as const, size: (alongX ? [WALKER_DEPTH, WALKER_RADIUS * 2] : [WALKER_RADIUS * 2, WALKER_DEPTH]) as readonly [number, number] };
}

describe("office walking routes", () => {
  it("keeps the fuller character clearance radius clear of furniture and the perimeter throughout each route", () => {
    for (const floor of Object.keys(FLOORS) as FloorId[]) {
      const layout = FLOORS[floor];
      const obstacles = [...layout.rooms, ...layout.fixtures, ...layout.pods.map(pod => ({ at: pod.at, size: POD_SIZE }))];
      for (const route of WALK_ROUTES[floor]) for (let time = 0; time < 120; time += 0.2) {
        const person = walkEnvelope(route, time);
        expect(Math.abs(person.at[0]) + person.size[0] / 2).toBeLessThan(BUILDING.width / 2);
        expect(Math.abs(person.at[1]) + person.size[1] / 2).toBeLessThan(BUILDING.depth / 2);
        expect(layout.aisles.some(aisle => Math.abs(person.at[0] - aisle.at[0]) + person.size[0] / 2 <= aisle.size[0] / 2 + 1e-6 && Math.abs(person.at[1] - aisle.at[1]) + person.size[1] / 2 <= aisle.size[1] / 2 + 1e-6)).toBe(true);
        for (const obstacle of obstacles) expect(overlaps(person, obstacle), `${floor}: ${JSON.stringify(person)} intersects ${JSON.stringify(obstacle)}`).toBe(false);
      }
    }
  });
  it("keeps the two walkers apart across repeated cycles", () => {
    for (const floor of Object.keys(FLOORS) as FloorId[]) for (let time = 0; time < 180; time += 0.1) {
      const [a, b] = WALK_ROUTES[floor].map(route => walkSample(route, time));
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeGreaterThan(WALKER_RADIUS * 2);
      const [boxA, boxB] = WALK_ROUTES[floor].map(route => walkEnvelope(route, time));
      expect(overlaps(boxA, boxB)).toBe(false);
    }
  });
  it("provides seven seated workers and two bounded, pausing routes on each floor", () => {
    for (const floor of Object.keys(FLOORS) as FloorId[]) {
      expect(seatedWorkers(floor)).toHaveLength(7);
      for (const route of WALK_ROUTES[floor]) expect(Array.from({ length: 400 }, (_, time) => walkSample(route, time / 10)).some(sample => !sample.walking)).toBe(true);
    }
  });
  it("moves the private-office seat with its room and keeps it inside the enclosure", () => {
    for (const floor of Object.keys(FLOORS) as FloorId[]) {
      const room = FLOORS[floor].rooms.find(room => room.kind === "private")!;
      const seat = seatedWorkers(floor).find(seat => seat.id === "private")!;
      expect(seat.x).toBe(room.at[0]);
      expect(seat.z).toBeCloseTo(room.at[1] - 0.4 + DESK.chairOffset);
      expect(Math.abs(seat.x - room.at[0]) + 0.3).toBeLessThan(room.size[0] / 2);
      expect(Math.abs(seat.z - room.at[1]) + 0.3).toBeLessThan(room.size[1] / 2);
    }
  });
});
