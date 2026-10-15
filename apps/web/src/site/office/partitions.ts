import { ROOM_FRAME } from "./layouts";

// Jamb centers define each pane/door's faces. Tiny endpoint intervals are
// occupied by the touching room corner and door jamb, rather than glass slivers.
export function partitionSections(length: number, center?: number, extendToNextPane = false) {
  const bays = Math.ceil(length / 1.3);
  const regular = Array.from({ length: bays + 1 }, (_, i) => -length / 2 + i * length / bays);
  const door = center === undefined ? undefined : {
    start: Math.max(-length / 2, center - 0.5),
    end: Math.min(length / 2, extendToNextPane ? regular.find(x => x >= center + 0.5 - 1e-6) ?? length / 2 : center + 0.5),
  };
  const posts = regular.filter(x => !door || x <= door.start - 0.1 || x >= door.end + 0.1 || x === -length / 2 || x === length / 2);
  if (door) posts.push(door.start, door.end);
  const cuts = [...new Set(posts)].sort((a, b) => a - b);
  const panes = cuts.slice(1).flatMap((right, i) => {
    const left = cuts[i];
    return right - left <= ROOM_FRAME.width * 2 ? [] : [{ left, right, door: Boolean(door && Math.abs(left - door.start) < 1e-6 && Math.abs(right - door.end) < 1e-6) }];
  });
  return { cuts, panes, door };
}
