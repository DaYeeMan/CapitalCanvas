import type { FloorId, Point } from "./layouts";
import { navigationFor, findPath, type Navigation } from "./peoplePaths";
import { BODY_RADIUS, STRIDE_REACH, distance, pointSolidDistance, poseClear, seatedPosition, transform, type Door, type Seat } from "./officeSpatial";

export const STEP = 0.1, WALK_SPEED = 0.95;
export interface Person {
  id: number; model: "man" | "woman"; home: string; state: "walking" | "standing" | "waiting" | "seated";
  at: Point; previous: Point; angle: number; previousAngle: number; stride: number; previousStride: number; path: Point[]; legStart: Point;
  target: number; seat?: string; lastSeat?: string; until: number; waited: number; retryAt: number;
  typingAt: number; typingUntil: number; phase: number;
}
export interface DoorState { progress: number; holdUntil: number; user?: number; direction?: number }
export interface FloorSimulation {
  floor: FloorId; nav: Navigation; people: Person[]; doors: Map<string, DoorState>; claims: Map<string, number>;
  tick: number; random: number;
}
function random(sim: FloorSimulation) {
  // Independent, reproducible per-floor PRNG; no saved event/position history.
  let x = sim.random; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; sim.random = x >>> 0; return sim.random / 4294967296;
}
function pick<T>(sim: FloorSimulation, values: readonly T[]): T { return values[Math.floor(random(sim) * values.length)]; }
export function personSeat(sim: FloorSimulation, person: Person): Seat | undefined { return sim.nav.space.seats.find(seat => seat.id === person.seat); }

export function createFloorSimulation(floor: FloorId, seed: number): FloorSimulation {
  const nav = navigationFor(floor);
  const sim: FloorSimulation = { floor, nav, people: [], doors: new Map(nav.space.doors.map(door => [door.id, { progress: 0, holdUntil: 0 }])), claims: new Map(), tick: 0, random: seed >>> 0 || 1 };
  const homes = nav.space.seats.filter(seat => seat.home).map(seat => seat.id);
  for (let i = homes.length - 1; i > 0; i--) { const j = Math.floor(random(sim) * (i + 1)); [homes[i], homes[j]] = [homes[j], homes[i]]; }
  const seated = 4 + Math.floor(random(sim) * 2);
  for (let id = 0; id < 9; id++) {
    const person: Person = { id, model: id % 2 ? "woman" : "man", home: homes[id], state: "standing", at: [0, 0], previous: [0, 0], angle: 0, previousAngle: 0, stride: 0, previousStride: 0, path: [], legStart: [0, 0], target: -1, until: 0, waited: 0, retryAt: 0, typingAt: random(sim) * 4, typingUntil: 0, phase: random(sim) * 8 };
    if (id < seated) {
      const seat = pick(sim, nav.space.seats.filter(seat => !sim.claims.has(seat.id) && sim.people.every(other => distance(other.at, seatedPosition(seat, person.model)) > 1.0)));
      person.seat = seat.id; sim.claims.set(seat.id, id); person.at = seatedPosition(seat, person.model); person.angle = seat.angle; person.state = "seated"; person.until = 1 + random(sim) * 18;
    } else {
      const choices = nav.wander.filter(index => sim.people.every(other => distance(other.at, nav.nodes[index].at) > 1.8) && nav.space.doors.every(door => distance(door.center, nav.nodes[index].at) > 1.8));
      person.at = nav.nodes[pick(sim, choices)].at;
    }
    person.previous = person.at; person.previousAngle = person.angle; person.legStart = person.at; sim.people.push(person);
    if (person.state !== "seated") chooseTrip(sim, person, false);
  }
  return sim;
}

export function claimSeat(sim: FloorSimulation, person: Person, seat: Seat) {
  if (sim.claims.has(seat.id)) return false;
  const target = sim.nav.seatNodes.get(seat.id)!;
  const path = findPath(sim.nav, person.at, target);
  if (!path.length) return false;
  sim.claims.set(seat.id, person.id); person.seat = seat.id; person.target = target; person.path = path; person.legStart = person.at; person.state = "walking"; return true;
}
function releaseSeat(sim: FloorSimulation, person: Person) {
  if (person.seat && sim.claims.get(person.seat) === person.id) sim.claims.delete(person.seat);
  person.lastSeat = person.seat ?? person.lastSeat; person.seat = undefined;
}
function chooseTrip(sim: FloorSimulation, person: Person, allowSeat = true) {
  const seated = sim.people.filter(other => other.state === "seated").length;
  const chance = seated < 3 ? 0.95 : seated > 5 ? 0.35 : 0.85;
  if (allowSeat && random(sim) < chance) {
    const available = sim.nav.space.seats.filter(seat => !sim.claims.has(seat.id) && seat.id !== person.lastSeat);
    const home = available.find(seat => seat.id === person.home);
    const near = available.filter(seat => distance(person.at, seat.approach) < 7);
    const seat = home && random(sim) < 1 / 3 ? home : pick(sim, near.length ? near : available);
    if (seat && claimSeat(sim, person, seat)) return;
  }
  const near = sim.nav.wander.filter(index => { const d = distance(person.at, sim.nav.nodes[index].at); return d > 2 && d < 4.5; });
  person.target = pick(sim, near.length ? near : sim.nav.wander);
  person.path = findPath(sim.nav, person.at, person.target); person.legStart = person.at; person.state = "walking";
  if (!person.path.length) { person.state = "standing"; person.until = sim.tick * STEP + 1; }
}

function capsule(sim: FloorSimulation, person: Person, at = person.at, angle = person.angle, stride = person.stride): { a: Point; b: Point; radius: number } {
  if (person.state === "seated") {
    const kind = personSeat(sim, person)?.kind;
    return { a: at, b: transform(at, [0, kind === "desk" || kind === "conference" ? 0.47 : kind === "sofa" ? 0.55 : 0.32], angle), radius: 0.33 };
  }
  const reach = (STRIDE_REACH - BODY_RADIUS) * stride;
  return { a: transform(at, [0, -reach], angle), b: transform(at, [0, reach], angle), radius: BODY_RADIUS };
}
function pointSegmentDistance(point: Point, a: Point, b: Point) {
  const dx = b[0] - a[0], dz = b[1] - a[1], length = dx * dx + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dz) / length)) : 0;
  return distance(point, [a[0] + dx * t, a[1] + dz * t]);
}
function segmentDistance(a: Point, b: Point, c: Point, d: Point) {
  const cross = (p: Point, q: Point, r: Point) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  // Collinear disjoint segments still use endpoint distances.
  if (cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0) return 0;
  return Math.min(pointSegmentDistance(a, c, d), pointSegmentDistance(b, c, d), pointSegmentDistance(c, a, b), pointSegmentDistance(d, a, b));
}
export function peopleClear(sim: FloorSimulation, a: Person, b: Person) {
  const ca = capsule(sim, a), cb = capsule(sim, b);
  return segmentDistance(ca.a, ca.b, cb.a, cb.b) >= ca.radius + cb.radius - 1e-5;
}
function leaf(door: Door, progress: number) {
  const angle = door.angle + door.swing * progress;
  return { id: door.id, at: transform(door.hinge, [door.width / 2, 0], angle), size: [door.width, 0.065] as const, angle };
}
function leafClear(sim: FloorSimulation, door: Door, progress: number, person: Person) {
  const body = capsule(sim, person), obstacle = leaf(door, progress);
  for (let i = 0; i <= 4; i++) if (pointSolidDistance([body.a[0] + (body.b[0] - body.a[0]) * i / 4, body.a[1] + (body.b[1] - body.a[1]) * i / 4], obstacle) < body.radius) return false;
  return true;
}
export function crossesDoor(door: Door, from: Point, to: Point) {
  const a = transform([0, 0], [from[0] - door.center[0], from[1] - door.center[1]], -door.angle);
  const b = transform([0, 0], [to[0] - door.center[0], to[1] - door.center[1]], -door.angle);
  if (a[1] * b[1] > 0 || Math.abs(a[1] - b[1]) < 1e-6) return false;
  const t = a[1] / (a[1] - b[1]); return Math.abs(a[0] + (b[0] - a[0]) * t) < door.width / 2 + 0.03;
}
function plansDoor(person: Person, door: Door) {
  let from = person.at, length = 0;
  for (const to of person.path) {
    if (crossesDoor(door, from, to)) return true;
    length += distance(from, to); if (length > 4) return false; from = to;
  }
  return false;
}
function doorSide(door: Door, at: Point) {
  return transform([0, 0], [at[0] - door.center[0], at[1] - door.center[1]], -door.angle)[1];
}
function clearOfThreshold(sim: FloorSimulation, person: Person, door: Door) {
  const body = capsule(sim, person);
  const points = [body.a, body.b].map(at => transform([0, 0], [at[0] - door.center[0], at[1] - door.center[1]], -door.angle));
  return points.every(at => at[1] > body.radius + 0.06) || points.every(at => at[1] < -body.radius - 0.06) || points.every(at => at[0] > door.width / 2 + body.radius + 0.06) || points.every(at => at[0] < -door.width / 2 - body.radius - 0.06);
}

function reroute(sim: FloorSimulation, person: Person, time: number) {
  // A stopped person may already be inside the planning margin. Allow paths
  // that increase clearance, rather than trapping them inside that exclusion.
  const occupied = sim.people.filter(other => other !== person).map(other => capsule(sim, other));
  const blocked = (at: Point) => occupied.some(body => pointSegmentDistance(at, body.a, body.b) < Math.min(pointSegmentDistance(person.at, body.a, body.b) - 0.01, body.radius + BODY_RADIUS + 0.12));
  let route = findPath(sim.nav, person.at, person.target, blocked);
  if (!route.length || person.waited > 4) {
    // A nearby clear passing point/backtrack breaks head-on waits in narrow aisles.
    const candidates = sim.nav.wander.filter(index => { const at = sim.nav.nodes[index].at, d = distance(person.at, at); return d > 0.8 && d < 3.5 && !blocked(at); });
    const choices = [...candidates].sort((a, b) => distance(person.at, sim.nav.nodes[a].at) - distance(person.at, sim.nav.nodes[b].at));
    for (const target of choices.slice(0, 12)) {
      route = findPath(sim.nav, person.at, target, blocked);
      if (route.length) { releaseSeat(sim, person); person.target = target; break; }
    }
  }
  if (route.length) { person.path = route; person.legStart = person.at; }
  person.retryAt = time + 1 + random(sim);
}

export function stepSimulation(sim: FloorSimulation) {
  const time = ++sim.tick * STEP;
  for (const person of sim.people) { person.previous = person.at; person.previousAngle = person.angle; person.previousStride = person.stride; }
  const priority = [...sim.people].sort((a, b) => b.waited - a.waited || (a.id + Math.floor(time / 5)) % 9 - (b.id + Math.floor(time / 5)) % 9);
  for (const door of sim.nav.space.doors) {
    const state = sim.doors.get(door.id)!;
    if (state.user !== undefined) {
      const user = sim.people[state.user];
      if (doorSide(door, user.at) * (state.direction ?? 1) < -1.05 || distance(user.at, door.center) > 2.6 || (!plansDoor(user, door) && clearOfThreshold(sim, user, door))) state.user = undefined;
    }
    const travelers = priority.filter(person => plansDoor(person, door) && distance(person.at, door.center) < 2.5);
    if (travelers.length) {
      state.holdUntil = time + 1;
      if (state.user === undefined) { state.user = travelers[0].id; state.direction = Math.sign(doorSide(door, travelers[0].at)); }
    }
    if (sim.people.some(person => distance(person.at, door.center) < 1.3)) state.holdUntil = time + 1;
    const progress = Math.max(0, Math.min(1, state.progress + (state.holdUntil > time ? 1 : -1) * STEP / 0.5));
    if (sim.people.every(person => leafClear(sim, door, progress, person))) state.progress = progress;
  }
  for (const person of priority) {
    if (person.state === "seated") {
      const seat = personSeat(sim, person)!;
      if (time >= person.typingAt) { person.typingUntil = time + 1 + random(sim) * 2; person.typingAt = person.typingUntil + 2 + random(sim) * 3; }
      if (time < person.until) continue;
      const departure: Person = { ...person, state: "standing", at: seat.approach, stride: 0 };
      if (sim.people.some(other => other !== person && !peopleClear(sim, departure, other))) continue;
      person.at = seat.approach; person.previous = person.at; person.state = "standing"; person.stride = 0; releaseSeat(sim, person); chooseTrip(sim, person, false); continue;
    }
    if (person.state === "standing") { if (time >= person.until) chooseTrip(sim, person); continue; }
    if (!person.path.length) {
      const seat = personSeat(sim, person);
      if (seat) {
        const arrival: Person = { ...person, at: seatedPosition(seat, person.model), angle: seat.angle, state: "seated", stride: 0 };
        if (sim.people.some(other => other !== person && !peopleClear(sim, arrival, other))) {
          person.state = "waiting"; person.waited += STEP;
          if (person.waited > 3) { releaseSeat(sim, person); chooseTrip(sim, person, false); }
          continue;
        }
        person.at = arrival.at; person.previous = person.at; person.angle = seat.angle; person.state = "seated"; person.stride = 0; person.until = time + 10 + random(sim) * 10;
      } else if (random(sim) < 0.3) { person.state = "standing"; person.stride = 0; person.until = time + 1 + random(sim) * 2; }
      else chooseTrip(sim, person);
      person.waited = 0; continue;
    }
    const target = person.path[0], remaining = distance(person.at, target), amount = Math.min(WALK_SPEED * STEP, remaining);
    const angle = Math.atan2(target[0] - person.at[0], target[1] - person.at[1]);
    const turn = Math.atan2(Math.sin(angle - person.angle), Math.cos(angle - person.angle));
    if (Math.abs(turn) > 0.05 && person.stride < 0.01) {
      // Turn in compact Idle before extending the stride along the new leg.
      // The Idle skin fits the circular body margin at every orientation.
      person.angle += Math.max(-0.6, Math.min(0.6, turn)); person.state = "walking"; person.stride = 0; continue;
    }
    const at: Point = remaining < 1e-6 ? target : [person.at[0] + (target[0] - person.at[0]) * amount / remaining, person.at[1] + (target[1] - person.at[1]) * amount / remaining];
    const stride = Math.min(1, Math.min(distance(at, person.legStart), distance(at, target)) / (STRIDE_REACH - BODY_RADIUS));
    const proposed: Person = { ...person, state: "walking", at, angle, stride };
    const doorWait = sim.nav.space.doors.some(door => {
      const state = sim.doors.get(door.id)!;
      // People traveling in the same direction share the opening. Giving a
      // follower exclusive ownership would block the person ahead of them.
      const opposite = state.user !== person.id && Math.sign(doorSide(door, person.at)) !== state.direction;
      return plansDoor(person, door) && distance(at, door.center) < 1.65 && (state.progress < 1 || opposite);
    });
    const safe = !doorWait && poseClear(sim.nav.space, at, angle, stride) && sim.people.every(other => other === person || peopleClear(sim, proposed, other)) && sim.nav.space.doors.every(door => leafClear(sim, door, sim.doors.get(door.id)!.progress, proposed));
    if (safe) {
      person.at = at; person.angle = angle; person.state = "walking"; person.stride = stride; person.waited = 0;
      if (remaining <= amount + 1e-6) { person.path.shift(); person.legStart = person.at; }
    } else {
      person.state = "waiting"; person.stride = 0; person.waited += STEP;
      if (person.waited > (doorWait ? 4 : 1) && time >= person.retryAt) reroute(sim, person, time);
    }
  }
}

export function advanceSimulation(sim: FloorSimulation, seconds: number, maxSteps = Infinity) {
  const target = Math.floor((seconds + 1e-8) / STEP); let steps = 0;
  while (sim.tick < target && steps++ < maxSteps) stepSimulation(sim);
  return sim.tick >= target;
}

export class PeopleSession {
  readonly floors: Record<FloorId, FloorSimulation>;
  time = 0; ready = true; paused: boolean;
  private last: number;
  constructor(seed: number, now: number, paused: boolean) {
    this.floors = { home: createFloorSimulation("home", seed), resources: createFloorSimulation("resources", seed ^ 0x9e3779b9) }; this.last = now; this.paused = paused;
  }
  target(now: number) { if (!this.paused) this.time += Math.max(0, now - this.last) / 1000; this.last = now; return this.time; }
  setPaused(paused: boolean, now: number) { this.target(now); this.paused = paused; }
  advance(now: number, budgetMs = 8) {
    this.target(now); const end = performance.now() + budgetMs;
    do {
      const a = advanceSimulation(this.floors.home, this.time, 10), b = advanceSimulation(this.floors.resources, this.time, 10);
      this.ready = a && b; if (this.ready) return true;
    } while (performance.now() < end);
    return false;
  }
}
