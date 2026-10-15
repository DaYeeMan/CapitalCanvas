export type FloorId = "home" | "resources";
export type ToolId = "ithaca" | "troy" | "delphi";
export type Point = readonly [number, number];
export type Size = readonly [number, number];

// World units are metres. Both floors instantiate this same shell.
const FLOOR_SIDE = 20;
// Includes the existing room's top mullion; pane height stays exactly 2.9m.
export const TALL_WALL_TOP = 2.9225;
export const ROOM_FRAME = Object.freeze({ width: 0.045, paneHeight: TALL_WALL_TOP - 0.045 / 2 });
export const BUILDING = Object.freeze({ width: FLOOR_SIDE, depth: FLOOR_SIDE, slab: 0.45, wall: TALL_WALL_TOP, wallThickness: 0.32, frontWall: 0.58, floorSpacing: 7 });
export const EXTERIOR_FRAME = Object.freeze({ width: 0.32, depth: BUILDING.wallThickness, sill: 0.3, header: 0.24, cap: 0.12, roomMargin: 0.16, centerGap: 0.12 });
const REAR_OFFICE_CENTER = -FLOOR_SIDE / 2 + BUILDING.wallThickness / 2 + 2.2;
export const TOOLS = ["Ithaca", "Troy", "Delphi"] as const;
export const POD_SIZE: Size = [4.2, 4.3];
// Shared by visible furniture, seat anchors and the authored character pose.
export const DESK = Object.freeze({ width: 1.8, depth: 1.15, height: 0.82, top: 0.1, podX: 0.92, podZ: 0.59, chairOffset: 0.91, seatTop: 0.59, keyboardZ: 0.38, interactionHeight: 1.62 });
// Furniture rendering and people navigation share these local placement anchors.
export const SEATING = Object.freeze({ conferenceWidth: 3.84, conferenceRow: 0.87, approachBack: 0.83, conferenceColumns: [-1.4, 0, 1.4] as const, sofaPlaces: [-0.94, 0, 0.94] as const, sofaSitForward: { man: 0.082, woman: 0.06 } as const, loungeTableZ: 1.4 });
export const CAMERA = Object.freeze({ position: [28, 24, 28] as const, target: [0, 0, 0] as const, padding: 1.35 });

export type FurnitureKind = "bench" | "lounge" | "coffee" | "countertop" | "storage" | "copier" | "conversation" | "collaboration" | "reading" | "bookcase" | "plant";
export interface Fixture {
  id: string;
  kind: FurnitureKind;
  at: Point;
  size: Size;
  rotation?: number;
}
export interface Room { id: string; kind: "conference" | "private"; at: Point; size: Size; tableRotation?: number; floorPlants?: readonly Point[]; doors?: { side?: "glass" | "wood"; front?: "glass" | "wood"; sideToNextPane?: boolean } }
export interface DeskPod { tool: ToolId; label: typeof TOOLS[number]; at: Point }
// Distances along the northwest perimeter, in world z coordinates. Opaque wall
// fills the gaps; dividers belong only to openings, not to the cream infill.
export interface WallOpening { id: string; start: number; end: number; dividers?: readonly number[] }
export interface FloorLayout {
  id: FloorId;
  title: string;
  elevation: number;
  northwestOpenings: readonly WallOpening[];
  pods: readonly DeskPod[];
  rooms: readonly Room[];
  fixtures: readonly Fixture[];
  // Reserved clear circulation rectangles; not drawn into the scene.
  aisles: readonly { at: Point; size: Size }[];
}

const PRIVATE_ROOM: Room = { id: "private", kind: "private", at: [REAR_OFFICE_CENTER, REAR_OFFICE_CENTER], size: [4.4, 4.4] };
const HOME_CONFERENCE: Room = { id: "conference", kind: "conference", at: [-BUILDING.width / 2 + BUILDING.wallThickness / 2 + 2.1, BUILDING.depth / 2 - BUILDING.wallThickness / 2 - 3.1], size: [4.2, 6.2], tableRotation: Math.PI / 2, floorPlants: [[-1.55, -2.55]], doors: { side: "wood", sideToNextPane: true } };
const officeStart = PRIVATE_ROOM.at[1] - PRIVATE_ROOM.size[1] / 2;
const officeEnd = PRIVATE_ROOM.at[1] + PRIVATE_ROOM.size[1] / 2;
const middleStart = officeEnd + EXTERIOR_FRAME.roomMargin;
const middleEnd = HOME_CONFERENCE.at[1] - HOME_CONFERENCE.size[1] / 2 - EXTERIOR_FRAME.roomMargin;
const middleCenter = (middleStart + middleEnd) / 2;
const mainEnd = BUILDING.depth / 2 - BUILDING.wallThickness / 2;

// Opening bounds include their endpoint jambs. Internal posts are centered on
// divider coordinates; panes stop at the actual frame faces.
export function windowSections(opening: WallOpening) {
  const width = EXTERIOR_FRAME.width;
  const posts = [
    { start: opening.start, end: opening.start + width },
    ...(opening.dividers ?? []).map(z => ({ start: z - width / 2, end: z + width / 2 })),
    { start: opening.end - width, end: opening.end },
  ];
  return posts.flatMap((post, i) => [
    ...(i ? [{ start: posts[i - 1].end, end: post.start, glass: true }] : []),
    { ...post, glass: false },
  ]);
}

export function solidWallSpans(openings: readonly WallOpening[]) {
  return [
    ...openings.map((opening, i) => ({ start: i ? openings[i - 1].end : -BUILDING.depth / 2, end: opening.start })),
    { start: openings.at(-1)?.end ?? -BUILDING.depth / 2, end: BUILDING.depth / 2 },
  ].filter(span => span.end > span.start);
}

export const FLOORS: Record<FloorId, FloorLayout> = {
  home: {
    id: "home", title: "Home office", elevation: 0,
    northwestOpenings: [
      { id: "private-office", start: officeStart, end: officeEnd - EXTERIOR_FRAME.roomMargin, dividers: [PRIVATE_ROOM.at[1]] },
      { id: "middle-rear", start: middleStart, end: middleCenter - EXTERIOR_FRAME.centerGap / 2 },
      { id: "middle-conference", start: middleCenter + EXTERIOR_FRAME.centerGap / 2, end: middleEnd },
    ],
    pods: [
      { tool: "ithaca", label: "Ithaca", at: [-3, 4.85] },
      { tool: "troy", label: "Troy", at: [5, 5.8] },
      { tool: "delphi", label: "Delphi", at: [6, -1.3] },
    ],
    aisles: [
      { at: [0, 4.75], size: [1.2, 9.5] },
      { at: [4.75, 2.75], size: [9.3, 1.2] },
    ],
    rooms: [
      // The left and front edges meet the shell's inner perimeter exactly.
      HOME_CONFERENCE,
      { ...PRIVATE_ROOM, floorPlants: [] },
    ],
    fixtures: [
      { id: "lounge", kind: "lounge", at: [-2.4, -7.9], size: [4, 3.8] },
      { id: "window-couch", kind: "lounge", at: [-7.9, 0.9], size: [3.8, 4], rotation: Math.PI / 2 },
      { id: "central-seating", kind: "collaboration", at: [-0.5, -2.5], size: [3.2, 3.2] },
      { id: "central-plant", kind: "plant", at: [1.7, -2.5], size: [1, 1] },
      { id: "coffee", kind: "coffee", at: [2.8, -8.65], size: [3.2, 1.8] },
      { id: "printer", kind: "copier", at: [5.1, -8.6], size: [0.9, 1.1] },
      { id: "conversation", kind: "conversation", at: [6, -6.9], size: [2.2, 2.2] },
      { id: "northeast-bookcase", kind: "bookcase", at: [6.6, -9.45], size: [1.8, 0.6] },
      { id: "northeast-countertop", kind: "countertop", at: [8.6, -9.35], size: [1.8, 0.8] },
      { id: "right-bookcase", kind: "bookcase", at: [9.2, -2.5], size: [0.6, 1.8], rotation: -Math.PI / 2 },
      { id: "right-benches", kind: "bench", at: [9.03, -5.5], size: [1.6, 3.9], rotation: -Math.PI / 2 },
      { id: "storage", kind: "storage", at: [-6.8, -4.7], size: [2, 0.7] },
      { id: "window-plant", kind: "plant", at: [-9.2, -2], size: [1, 1] },
      { id: "office-plant", kind: "plant", at: [-4.9, -7.5], size: [1, 1] },
      { id: "sofa-plant", kind: "plant", at: [0.2, -8.3], size: [1, 1] },
      { id: "right-plant", kind: "plant", at: [9.2, -0.5], size: [1, 1] },
    ],
  },
  resources: {
    id: "resources", title: "Resources office", elevation: -BUILDING.floorSpacing,
    northwestOpenings: [
      { id: "private-office", start: officeStart + EXTERIOR_FRAME.roomMargin, end: officeEnd - EXTERIOR_FRAME.roomMargin },
      { id: "main-run", start: middleStart, end: mainEnd, dividers: [1, 2, 3].map(i => middleStart + (mainEnd - middleStart) * i / 4) },
    ],
    pods: [
      { tool: "ithaca", label: "Ithaca", at: [-3.8, 3.5] },
      { tool: "troy", label: "Troy", at: [-0.4, -1.5] },
      { tool: "delphi", label: "Delphi", at: [5.3, 3] },
    ],
    aisles: [
      { at: [2.55, 3.25], size: [1.2, 12.9] },
      { at: [-0.7, 6.25], size: [5.7, 1.2] },
    ],
    rooms: [
      { id: "conference", kind: "conference", at: [4.4, -6.5], size: [5.4, 6.4], doors: { front: "wood" } },
      PRIVATE_ROOM,
    ],
    fixtures: [
      { id: "window-benches", kind: "bench", at: [-8.65, 3], size: [2.3, 3.9], rotation: Math.PI / 2 },
      { id: "right-benches", kind: "bench", at: [9.03, -4.5], size: [1.6, 3.9], rotation: -Math.PI / 2 },
      { id: "foreground-benches", kind: "bench", at: [-0.5, 8], size: [3.9, 2.3] },
      { id: "foreground-reading", kind: "reading", at: [5.5, 8.05], size: [3.7, 3.5] },
      { id: "lounge", kind: "lounge", at: [-7.9, -2.9], size: [3.8, 4], rotation: Math.PI / 2 },
      { id: "lounge-bookcase", kind: "bookcase", at: [-9.1, 0.15], size: [0.6, 1.8], rotation: Math.PI / 2 },
      { id: "coffee", kind: "coffee", at: [0.1, -8.7], size: [3.2, 1.8] },
      { id: "printer", kind: "copier", at: [-3, -8.4], size: [0.9, 1.1] },
      { id: "conversation", kind: "conversation", at: [-4.6, -3.2], size: [2.4, 2.4] },
      { id: "right-bookcase", kind: "bookcase", at: [9.25, -1.3], size: [0.6, 1.8], rotation: -Math.PI / 2 },
      { id: "window-plant", kind: "plant", at: [-9.2, 5.9], size: [1, 1] },
      { id: "corner-plant", kind: "plant", at: [9.1, 0.3], size: [1, 1] },
    ],
  },
};

export function readFloor(hash = window.location.hash): FloorId { return hash === "#resources" ? "resources" : "home"; }

export function overlaps(a: { at: Point; size: Size }, b: { at: Point; size: Size }, clearance = 0): boolean {
  return Math.abs(a.at[0] - b.at[0]) < (a.size[0] + b.size[0]) / 2 + clearance
    && Math.abs(a.at[1] - b.at[1]) < (a.size[1] + b.size[1]) / 2 + clearance;
}
