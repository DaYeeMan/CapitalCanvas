import { describe, expect, it } from "vitest";
import { advanceSimulation, claimSeat, createFloorSimulation, peopleClear, PeopleSession, STEP, stepSimulation } from "./peopleSimulation";
import { distance, poseClear, seatedPosition, transform } from "./officeSpatial";

describe.each(["home", "resources"] as const)("%s autonomous workers", floor => {
  it.each([1, 17, 777])("escapes crowded aisles/door queues without starving anyone (seed %s)", seed => {
    const sim = createFloorSimulation(floor, seed), visits = new Map(sim.people.map(person => [person.id, new Set<string>()]));
    const kinds = new Set<string>(); let maxWait = 0;
    for (let tick = 0; tick < 6000; tick++) {
      stepSimulation(sim);
      for (const person of sim.people) {
        maxWait = Math.max(maxWait, person.waited);
        if (person.state === "seated") { visits.get(person.id)!.add(person.seat!); kinds.add(sim.nav.space.seats.find(seat => seat.id === person.seat)!.kind); }
      }
    }
    expect(maxWait).toBeLessThan(30);
    for (const [id, seats] of visits) expect(seats.size, `person ${id}`).toBeGreaterThan(3);
    expect(kinds).toEqual(new Set(["desk", "conference", "armchair", "sofa", "stool"]));
  }, 30000);
  it("keeps nine identities, unique home desks, safe occupants and exclusive seat claims across repeated cycles", () => {
    const sim = createFloorSimulation(floor, 1234), visited = new Map(sim.people.map(person => [person.id, new Set<string>()]));
    expect(sim.people).toHaveLength(9); expect(new Set(sim.people.map(person => person.home)).size).toBe(9);
    let seatedSamples = 0, walkingSamples = 0, openSamples = 0;
    for (let tick = 0; tick < 2400; tick++) {
      stepSimulation(sim);
      for (const person of sim.people) {
        visited.get(person.id)!.add(person.state);
        if (person.seat) expect(sim.claims.get(person.seat)).toBe(person.id);
        if (person.state === "seated") {
          const seat = sim.nav.space.seats.find(seat => seat.id === person.seat)!;
          expect(person.at).toEqual(seatedPosition(seat, person.model));
          seatedSamples++; visited.get(person.id)!.add(seat.kind);
        }
        else expect(poseClear(sim.nav.space, person.at, person.angle, person.stride)).toBe(true);
        if (person.state === "walking") walkingSamples++;
        for (const other of sim.people) if (person.id < other.id) expect(peopleClear(sim, person, other), `tick ${tick}: ${person.id}/${other.id}`).toBe(true);
      }
      for (const [seat, owner] of sim.claims) expect(sim.people[owner].seat).toBe(seat);
      if ([...sim.doors.values()].some(door => door.progress > 0.99)) openSamples++;
    }
    for (const states of visited.values()) expect(states).toContain("walking");
    for (const states of visited.values()) expect(states).toContain("seated");
    expect(openSamples).toBeGreaterThan(0);
    expect(seatedSamples / (2400 * 9)).toBeGreaterThan(0.25);
    expect(walkingSamples / (2400 * 9)).toBeGreaterThan(0.2);
  }, 30000);
  it("reserves a seat once and chooses around occupied home desks", () => {
    const sim = createFloorSimulation(floor, 5), [a, b] = sim.people.filter(person => !person.seat);
    const seat = sim.nav.space.seats.find(seat => !sim.claims.has(seat.id) && distance(a.at, seat.approach) > 1)!;
    expect(claimSeat(sim, a, seat)).toBe(true); expect(claimSeat(sim, b, seat)).toBe(false);
    expect(sim.claims.get(seat.id)).toBe(a.id);
  });
  it("opens before a staged approach, shares the doorway with a follower, and closes after clearance", () => {
    const sim = createFloorSimulation(floor, 22), door = sim.nav.space.doors.find(door => door.room === "private")!;
    sim.claims.clear();
    const parked: typeof sim.people = [];
    for (const person of sim.people) {
      person.seat = undefined; person.path = []; person.state = "standing"; person.stride = 0; person.until = Infinity;
      if (person.id < 2) continue;
      const node = sim.nav.wander.find(index => distance(sim.nav.nodes[index].at, door.center) > 5 && parked.every(other => distance(other.at, sim.nav.nodes[index].at) > 1.5))!;
      person.at = sim.nav.nodes[node].at; parked.push(person);
    }
    const [a, b] = sim.people;
    for (const [person, offset, end] of [[a, 1.65, -2.5], [b, 2.5, -1.65]] as const) {
      person.at = transform(door.center, [0, offset], door.angle); person.previous = person.at; person.legStart = person.at;
      person.angle = door.angle + Math.PI;
      person.path = [transform(door.center, [0, 0.7], door.angle), transform(door.center, [0, end], door.angle)]; person.state = "walking";
    }
    stepSimulation(sim); expect(sim.doors.get(door.id)!.progress).toBeGreaterThan(0); expect(a.state).toBe("waiting");
    let sharedOpen = false;
    for (let i = 0; i < 160; i++) {
      stepSimulation(sim); expect(peopleClear(sim, a, b)).toBe(true);
      if (sim.doors.get(door.id)!.progress === 1 && a.state === "walking" && b.state === "walking") sharedOpen = true;
      for (const person of [a, b]) if (!person.path.length) { person.state = "standing"; person.stride = 0; person.until = Infinity; }
    }
    expect(sharedOpen).toBe(true);
    expect(a.at).toEqual(transform(door.center, [0, -2.5], door.angle));
    expect(b.at).toEqual(transform(door.center, [0, -1.65], door.angle));
    expect(sim.doors.get(door.id)!.progress).toBe(0);
  });
  it("gives exactly the same state after continuous and batched elapsed-time advancement", () => {
    const a = createFloorSimulation(floor, 998), b = createFloorSimulation(floor, 998);
    for (let i = 1; i <= 600; i++) advanceSimulation(a, i * STEP);
    while (!advanceSimulation(b, 60, 73)) { /* bounded catch-up batches */ }
    expect(b.people).toEqual(a.people); expect(b.claims).toEqual(a.claims); expect(b.doors).toEqual(a.doors); expect(b.random).toBe(a.random);
  }, 30000);
});
it("separates unseen elapsed time from reduced-motion pause without any persisted history", () => {
  const session = new PeopleSession(12, 1000, false);
  while (!session.advance(61000, 100)) { /* returning after a hidden minute */ }
  expect(session.floors.home.tick).toBe(600); expect(session.floors.resources.tick).toBe(600);
  session.setPaused(true, 61000); const before = structuredClone(session.floors.home.people);
  session.advance(121000); expect(session.floors.home.people).toEqual(before);
  session.setPaused(false, 121000); while (!session.advance(122000, 100)) { /* resume */ }
  expect(session.floors.home.tick).toBe(610);
  expect(createFloorSimulation("home", 13).people.map(person => person.home)).not.toEqual(createFloorSimulation("home", 12).people.map(person => person.home));
}, 30000);
it("catches up a long hidden interval in bounded batches without retaining state history", () => {
  const a = createFloorSimulation("home", 77), b = createFloorSimulation("home", 77);
  advanceSimulation(a, 600);
  let batches = 0; while (!advanceSimulation(b, 600, 100)) batches++;
  expect(batches).toBeGreaterThan(1); expect(b.people).toEqual(a.people); expect(b.doors).toEqual(a.doors); expect(b.claims).toEqual(a.claims);
}, 30000);
