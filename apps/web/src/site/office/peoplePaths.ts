import { FLOORS, SEATING, type FloorId, type Point } from "./layouts";
import { BODY_RADIUS, STRIDE_REACH, createOfficeSpace, distance, pointClear, segmentClear, transform, type OfficeSpace } from "./officeSpatial";

export const WALKER_RADIUS = BODY_RADIUS;
export const WALKER_DEPTH = STRIDE_REACH * 2;
export interface NavNode { at: Point; edges: { to: number; length: number }[] }
export interface Navigation { space: OfficeSpace; nodes: NavNode[]; seatNodes: Map<string, number>; wander: number[] }
const GRID = 0.35;
const cached = new Map<FloorId, Navigation>();

export function createNavigation(floor: FloorId): Navigation {
  const space = createOfficeSpace(floor), nodes: NavNode[] = [], cells = new Map<string, number>();
  for (const door of space.doors) {
    const angle = door.angle + door.swing;
    space.solids.push({ id: `${door.id}-open-leaf`, at: transform(door.hinge, [door.width / 2, 0], angle), size: [door.width, 0.065], angle });
  }
  // Sampled graph with exact seat/door anchors. No navmesh dependency or saved routes.
  for (let x = -26; x <= 26; x++) for (let z = -26; z <= 26; z++) {
    const at: Point = [x * GRID, z * GRID];
    if (pointClear(space, at)) { cells.set(`${x},${z}`, nodes.length); nodes.push({ at, edges: [] }); }
  }
  function link(a: number, b: number) {
    if (!segmentClear(space, nodes[a].at, nodes[b].at)) return false;
    const length = distance(nodes[a].at, nodes[b].at);
    nodes[a].edges.push({ to: b, length }); nodes[b].edges.push({ to: a, length }); return true;
  }
  for (const [key, index] of cells) {
    const [x, z] = key.split(",").map(Number);
    for (const [dx, dz] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) {
      const other = cells.get(`${x + dx},${z + dz}`); if (other !== undefined) link(index, other);
    }
  }
  function insert(at: Point) {
    if (!pointClear(space, at)) return -1;
    const near = nodes.map((node, index) => ({ index, length: distance(node.at, at) })).filter(node => node.length < 1.6).sort((a, b) => a.length - b.length);
    const index = nodes.length; nodes.push({ at, edges: [] });
    for (const candidate of near.slice(0, 50)) { link(index, candidate.index); if (nodes[index].edges.length >= 8) break; }
    return index;
  }
  for (const door of space.doors) for (const offset of [-1.65, -0.8, 0, 0.8, 1.65]) insert(transform(door.center, [0, offset], door.angle));
  // Exact ends of the conference aisles bridge passages narrower than a grid cell.
  for (const room of FLOORS[floor].rooms) if (room.kind === "conference") {
    const row = SEATING.conferenceRow + SEATING.approachBack;
    for (const x of [-1, 1]) for (const z of [-row, -row / 2, 0, row / 2, row]) insert(transform(room.at, [x * (SEATING.conferenceWidth / 2 + 0.38), z], room.tableRotation ?? 0));
  }
  for (const fixture of FLOORS[floor].fixtures) if (fixture.kind === "bench") {
    for (const x of [-2.2, 0, 2.2]) insert(transform(fixture.at, [x, -0.22 + 0.91 + SEATING.approachBack], fixture.rotation ?? 0));
  }
  const candidates = new Map(space.seats.map(seat => [seat.id, seat.approaches.map(at => insert(at))]));
  const seen = new Set<number>(); let component = new Set<number>();
  for (let i = 0; i < nodes.length; i++) if (!seen.has(i)) {
    const part = new Set<number>([i]), queue = [i]; seen.add(i);
    for (let j = 0; j < queue.length; j++) for (const edge of nodes[queue[j]].edges) if (!seen.has(edge.to)) { seen.add(edge.to); part.add(edge.to); queue.push(edge.to); }
    if (part.size > component.size) component = part;
  }
  const seatNodes = new Map<string, number>();
  for (const seat of space.seats) {
    for (const index of candidates.get(seat.id)!) {
      if (index >= 0 && component.has(index)) {
        seat.approach = nodes[index].at; seatNodes.set(seat.id, index); break;
      }
    }
    if (!seatNodes.has(seat.id)) throw new Error(`${floor}: no clear approach to ${seat.id}`);
  }
  const wander = [...component].filter(index => nodes[index].edges.length >= 4 && pointClear(space, nodes[index].at, 0.65) && space.seats.every(seat => distance(nodes[index].at, seat.approach) > 0.9));
  return { space, nodes, seatNodes, wander };
}
export function navigationFor(floor: FloorId) {
  let nav = cached.get(floor); if (!nav) { nav = createNavigation(floor); cached.set(floor, nav); } return nav;
}

export function nearestNode(nav: Navigation, at: Point, allowed?: (to: Point) => boolean) {
  const candidates = nav.nodes.map((node, i) => ({ i, length: distance(at, node.at) })).filter(candidate => nav.nodes[candidate.i].edges.length).sort((a, b) => a.length - b.length);
  return candidates.slice(0, 50).find(candidate => (!allowed || allowed(nav.nodes[candidate.i].at)) && (candidate.length < 1e-6 || segmentClear(nav.space, at, nav.nodes[candidate.i].at)))?.i ?? -1;
}

export function findPath(nav: Navigation, from: Point, target: number, blocked?: (at: Point) => boolean): Point[] {
  const blockedSegment = (a: Point, b: Point) => {
    if (!blocked) return false;
    const samples = Math.max(1, Math.ceil(distance(a, b) / 0.2));
    for (let i = 1; i <= samples; i++) if (blocked([a[0] + (b[0] - a[0]) * i / samples, a[1] + (b[1] - a[1]) * i / samples])) return true;
    return false;
  };
  const start = nearestNode(nav, from, at => !blockedSegment(from, at)); if (start < 0) return [];
  const cost = new Float64Array(nav.nodes.length).fill(Infinity), previous = new Int32Array(nav.nodes.length).fill(-1);
  const heap: { node: number; score: number }[] = [];
  const push = (node: number, score: number) => {
    let i = heap.length; heap.push({ node, score });
    while (i > 0) { const p = (i - 1) >> 1; if (heap[p].score <= score) break; heap[i] = heap[p]; i = p; } heap[i] = { node, score };
  };
  const pop = () => {
    const first = heap[0], last = heap.pop()!; if (!heap.length) return first;
    let i = 0;
    while (i * 2 + 1 < heap.length) { let c = i * 2 + 1; if (c + 1 < heap.length && heap[c + 1].score < heap[c].score) c++; if (heap[c].score >= last.score) break; heap[i] = heap[c]; i = c; }
    heap[i] = last; return first;
  };
  cost[start] = 0; push(start, distance(nav.nodes[start].at, nav.nodes[target].at));
  const visited = new Set<number>();
  while (heap.length) {
    const { node } = pop(); if (visited.has(node)) continue; visited.add(node);
    if (node === target) break;
    for (const edge of nav.nodes[node].edges) {
      if (blockedSegment(nav.nodes[node].at, nav.nodes[edge.to].at)) continue;
      const next = cost[node] + edge.length;
      if (next < cost[edge.to]) { cost[edge.to] = next; previous[edge.to] = node; push(edge.to, next + distance(nav.nodes[edge.to].at, nav.nodes[target].at)); }
    }
  }
  if (!Number.isFinite(cost[target])) return [];
  const route: Point[] = [];
  for (let node = target; node !== start; node = previous[node]) route.push(nav.nodes[node].at);
  route.push(nav.nodes[start].at); route.reverse();
  const result: Point[] = []; let at = from;
  for (let i = 0; i < route.length;) {
    let end = i;
    for (let j = Math.min(route.length - 1, i + 30); j > i; j--) if (segmentClear(nav.space, at, route[j]) && !blockedSegment(at, route[j])) { end = j; break; }
    if (distance(at, route[end]) > 0.01) result.push(route[end]); at = route[end]; i = end + 1;
  }
  return result;
}
