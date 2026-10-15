import { describe, expect, it } from "vitest";
import { Children, isValidElement, type ReactNode } from "react";
import { Vector3, OrthographicCamera } from "three";
import { BUILDING, CAMERA, DESK, EXTERIOR_FRAME, FLOORS, POD_SIZE, ROOM_FRAME, TALL_WALL_TOP, overlaps, readFloor, solidWallSpans, windowSections } from "./layouts";
import { furnitureGeometry, exteriorGlassMaterial, glassMaterial } from "./sceneResources";
import { OfficeShell } from "./OfficeShell";
import { Block, DoorPivot, OfficeRoom } from "./Furniture";

function blocks(node: ReactNode): Parameters<typeof Block>[0][] {
  return Children.toArray(node).flatMap(child => {
    if (!isValidElement<{ children?: ReactNode }>(child)) return [];
    if (child.type === Block) return [child.props as Parameters<typeof Block>[0]];
    // Geometry assertions inspect the leaf's authored children, while its frame
    // hook is exercised by browser/lifecycle checks inside a real Canvas.
    if (child.type === DoorPivot) return blocks(child.props.children);
    if (typeof child.type === "function") return blocks((child.type as (props: unknown) => ReactNode)(child.props));
    return blocks(child.props.children);
  });
}

describe("office floor invariants", () => {
  it("aligns rendered perimeter bodies/caps and room mullions at the actual shared visible top", () => {
    expect(ROOM_FRAME.paneHeight).toBe(2.9);
    expect(BUILDING.wall).toBe(TALL_WALL_TOP);
    for (const floor of Object.values(FLOORS)) {
      const shell = blocks(OfficeShell({ openings: floor.northwestOpenings }));
      const tops = shell.map(b => b.at[1] + b.size[1] / 2);
      expect(Math.max(...tops)).toBeCloseTo(TALL_WALL_TOP);
      const caps = shell.filter(b => b.size[1] === EXTERIOR_FRAME.cap);
      expect(caps).toHaveLength(2);
      for (const cap of caps) expect(cap.at[1] + cap.size[1] / 2).toBeCloseTo(TALL_WALL_TOP);
      const panes = shell.filter(b => b.glass);
      for (const pane of panes) {
        expect(pane.at[1] - pane.size[1] / 2).toBeCloseTo(EXTERIOR_FRAME.sill);
        expect(pane.at[1] + pane.size[1] / 2).toBeCloseTo(TALL_WALL_TOP - EXTERIOR_FRAME.header);
      }
      for (const room of floor.rooms) {
        const mullions = blocks(OfficeRoom({ room })).filter(b => b.tone === "frame" && b.size[1] === ROOM_FRAME.width);
        expect(Math.max(...mullions.map(b => b.at[1] + b.size[1] / 2))).toBeCloseTo(TALL_WALL_TOP);
      }
      // Exterior structure uses the exact wall material; the two existing low
      // front cutaways keep their cream material and 0.58m height.
      expect(shell.filter(b => b.tone === "cream")).toHaveLength(2);
      for (const low of shell.filter(b => b.tone === "cream")) expect(low.size[1]).toBe(BUILDING.frontWall);
      expect(shell.some(b => b.tone === "frame")).toBe(false);
    }
  });
  it("retains Home furniture and authors both conference wood entries explicitly", () => {
    const fixtures = FLOORS.home.fixtures;
    expect(fixtures.find(f => f.id === "window-couch")?.kind).toBe("lounge");
    expect(fixtures.find(f => f.id === "lounge")?.kind).toBe("lounge");
    for (const id of ["right-bookcase", "northeast-bookcase"]) expect(fixtures.find(f => f.id === id)?.kind).toBe("bookcase");
    expect(fixtures.find(f => f.id === "northeast-countertop")?.kind).toBe("countertop");
    expect(fixtures.find(f => f.id === "coffee")?.kind).toBe("coffee");
    expect(FLOORS.home.rooms.find(r => r.kind === "conference")?.doors).toEqual({ side: "wood", sideToNextPane: true });
    expect(FLOORS.resources.rooms.find(r => r.kind === "conference")?.doors).toEqual({ front: "wood" });
    expect(FLOORS.resources.rooms.find(r => r.kind === "private")?.doors).toBeUndefined();
    const couch = fixtures.find(f => f.id === "window-couch")!;
    const [meeting, office] = FLOORS.home.rooms;
    expect(couch.at[1] - couch.size[1] / 2).toBeGreaterThan(office.at[1] + office.size[1] / 2);
    expect(couch.at[1] + couch.size[1] / 2).toBeLessThan(meeting.at[1] - meeting.size[1] / 2);
  });
  it("removes only each wall-backed rear upright and separates exterior glass from room panes", () => {
    for (const floor of Object.values(FLOORS)) {
      for (const room of floor.rooms) {
        const parts = blocks(OfficeRoom({ room }));
        const corners = parts.filter(b => b.tone === "frame" && b.size[0] === 0.055 && b.size[2] === 0.055 && b.size[1] === ROOM_FRAME.paneHeight);
        expect(corners).toHaveLength(room.kind === "private" ? 3 : 4);
        if (room.kind === "private") expect(corners.some(b => b.at[0] === -room.size[0] / 2 && b.at[2] === -room.size[1] / 2)).toBe(false);
        expect(parts.filter(b => b.tone === "wood" && b.size[1] === 2.55 && !b.glass)).toHaveLength(1);
        expect(parts.filter(b => b.glass).every(b => !b.exterior)).toBe(true);
      }
      const shell = blocks(OfficeShell({ openings: floor.northwestOpenings }));
      expect(shell.filter(b => b.glass).every(b => b.exterior)).toBe(true);
    }
    const pane = { at: [0, 1, 0] as [number, number, number], size: [1, 2, 0.06] as [number, number, number], glass: true };
    expect(Block(pane).props.material).toBe(glassMaterial);
    expect(Block({ ...pane, exterior: true }).props.material).toBe(exteriorGlassMaterial);
    expect(glassMaterial.opacity).toBe(0.11);
    expect(exteriorGlassMaterial.opacity).toBeGreaterThan(glassMaterial.opacity);
  });
  it("keeps shaped chairs and desks within the rug and projected interaction volume", () => {
    expect(furnitureGeometry.conferenceChairTrim.boundingBox!.max.y).toBeLessThan(DESK.height - DESK.top / 2);
    const chairParts = [furnitureGeometry.chairCushions, furnitureGeometry.chairFrame, furnitureGeometry.chairTrim];
    for (const geometry of chairParts) {
      const bounds = geometry.boundingBox!;
      expect(DESK.podX + Math.max(Math.abs(bounds.min.x), Math.abs(bounds.max.x))).toBeLessThan(POD_SIZE[0] / 2);
      expect(DESK.podZ + DESK.chairOffset + Math.max(Math.abs(bounds.min.z), Math.abs(bounds.max.z))).toBeLessThan(POD_SIZE[1] / 2);
      expect(bounds.min.y).toBeGreaterThanOrEqual(0);
      expect(bounds.max.y).toBeLessThan(DESK.interactionHeight);
    }
    expect(DESK.podX + DESK.width / 2).toBeLessThan(POD_SIZE[0] / 2);
    expect(1.27 + 0.6 / 2).toBeLessThan(DESK.interactionHeight);
  });
  it("fits both floors inside one immutable square shell", () => {
    expect(Object.isFrozen(BUILDING)).toBe(true);
    expect(BUILDING.width).toBe(BUILDING.depth);
    expect(FLOORS.home.elevation - FLOORS.resources.elevation).toBe(BUILDING.floorSpacing);
    for (const floor of Object.values(FLOORS)) {
      for (const item of [...floor.rooms, ...floor.fixtures, ...floor.pods.map(p => ({ at: p.at, size: POD_SIZE }))]) {
        expect(Math.abs(item.at[0]) + item.size[0] / 2).toBeLessThanOrEqual(BUILDING.width / 2 - BUILDING.wallThickness / 2);
        expect(Math.abs(item.at[1]) + item.size[1] / 2).toBeLessThanOrEqual(BUILDING.depth / 2 - BUILDING.wallThickness / 2);
      }
    }
  });
  it("keeps exactly three tool pods ordered left to right from the actual camera", () => {
    const camera = new OrthographicCamera(); camera.position.set(...CAMERA.position); camera.lookAt(...CAMERA.target); camera.updateMatrixWorld();
    for (const floor of Object.values(FLOORS)) {
      expect(floor.pods.map(p => p.tool)).toEqual(["ithaca", "troy", "delphi"]);
      const xs = floor.pods.map(p => new Vector3(p.at[0], 2.2, p.at[1]).applyMatrix4(camera.matrixWorldInverse).x);
      expect(xs[0]).toBeLessThan(xs[1]); expect(xs[1]).toBeLessThan(xs[2]);
    }
  });
  it("keeps furniture out of reserved walking aisles and rooms away from pods", () => {
    for (const floor of Object.values(FLOORS)) {
      const pods = floor.pods.map(p => ({ at: p.at, size: POD_SIZE }));
      for (const aisle of floor.aisles) {
        expect(aisle.size[0]).toBeGreaterThanOrEqual(1.2);
        for (const obstacle of [...floor.rooms, ...floor.fixtures, ...pods]) expect(overlaps(aisle, obstacle), `${floor.id}: aisle overlaps furniture`).toBe(false);
      }
      for (const pod of pods) for (const obstacle of [...floor.rooms, ...floor.fixtures, ...pods.filter(p => p !== pod)]) expect(overlaps(pod, obstacle), `${floor.id}: pod overlaps furniture`).toBe(false);
      const obstacles = [...floor.rooms, ...floor.fixtures];
      for (let i = 0; i < obstacles.length; i++) for (let j = i + 1; j < obstacles.length; j++) {
        expect(overlaps(obstacles[i], obstacles[j]), `${floor.id}: ${obstacles[i].id} overlaps ${obstacles[j].id}`).toBe(false);
      }
    }
  });
  it("places Resources' meeting room on the right and Home's flush into the left corner", () => {
    expect(FLOORS.resources.rooms.find(r => r.kind === "conference")!.at[0]).toBeGreaterThan(0);
    const room = FLOORS.home.rooms.find(r => r.kind === "conference")!;
    expect(room.at[0] - room.size[0] / 2).toBeCloseTo(-BUILDING.width / 2 + BUILDING.wallThickness / 2);
    expect(room.at[1] + room.size[1] / 2).toBeCloseTo(BUILDING.depth / 2 - BUILDING.wallThickness / 2);
    expect(room.tableRotation).toBe(Math.PI / 2);
  });
  it("keeps Home's outer pods above the lower middle pod without touching rugs", () => {
    const camera = new OrthographicCamera(); camera.position.set(...CAMERA.position); camera.lookAt(...CAMERA.target); camera.updateMatrixWorld();
    const positions = FLOORS.home.pods.map(p => new Vector3(p.at[0], 0, p.at[1]).applyMatrix4(camera.matrixWorldInverse));
    expect(positions[0].y).toBeGreaterThan(positions[1].y);
    expect(positions[2].y).toBeGreaterThan(positions[1].y);
    const middle = FLOORS.home.pods[1];
    for (const pod of [FLOORS.home.pods[0], FLOORS.home.pods[2]]) expect(overlaps({ at: pod.at, size: POD_SIZE }, { at: middle.at, size: POD_SIZE }, 0.8)).toBe(false);
    expect(FLOORS.home.pods).not.toBe(FLOORS.resources.pods);
  });
  it("covers each northwest wall completely with disjoint cream frames, infill and clear panes", () => {
    for (const floor of Object.values(FLOORS)) {
      let end = -BUILDING.depth / 2;
      for (const opening of floor.northwestOpenings) {
        expect(opening.start).toBeGreaterThanOrEqual(end);
        expect(opening.end).toBeGreaterThan(opening.start);
        expect(opening.end).toBeLessThanOrEqual(BUILDING.depth / 2);
        const sections = windowSections(opening);
        expect(sections[0].start).toBe(opening.start);
        expect(sections.at(-1)!.end).toBe(opening.end);
        for (let i = 0; i < sections.length; i++) {
          const section = sections[i];
          expect(section.end).toBeGreaterThan(section.start);
          expect(section.start).toBeGreaterThanOrEqual(opening.start);
          expect(section.end).toBeLessThanOrEqual(opening.end);
          if (i) expect(section.start).toBe(sections[i - 1].end);
          if (!section.glass) expect(section.end - section.start).toBeCloseTo(EXTERIOR_FRAME.width);
          else expect(section.end - section.start).toBeGreaterThan(1.5);
        }
        end = opening.end;
      }
      const coverage = [...solidWallSpans(floor.northwestOpenings), ...floor.northwestOpenings].sort((a, b) => a.start - b.start);
      expect(coverage[0].start).toBe(-BUILDING.depth / 2);
      expect(coverage.at(-1)!.end).toBe(BUILDING.depth / 2);
      for (let i = 1; i < coverage.length; i++) expect(coverage[i].start).toBe(coverage[i - 1].end);
      expect(coverage.reduce((sum, span) => sum + span.end - span.start, 0)).toBeCloseTo(BUILDING.depth);
    }
  });
  it("fills Home's inter-room gap with exactly two equal undivided windows and a narrow cream pier", () => {
    const floor = FLOORS.home;
    const office = floor.rooms.find(r => r.kind === "private")!;
    const conference = floor.rooms.find(r => r.kind === "conference")!;
    const windows = floor.northwestOpenings.filter(o => o.id !== "private-office");
    expect(windows.map(o => o.id)).toEqual(["middle-rear", "middle-conference"]);
    expect(windows[0].start).toBeCloseTo(office.at[1] + office.size[1] / 2 + EXTERIOR_FRAME.roomMargin);
    expect(windows[1].end).toBeCloseTo(conference.at[1] - conference.size[1] / 2 - EXTERIOR_FRAME.roomMargin);
    expect(windows[0].end - windows[0].start).toBeCloseTo(windows[1].end - windows[1].start);
    expect(windows[1].start - windows[0].end).toBeCloseTo(EXTERIOR_FRAME.centerGap);
    for (const opening of windows) expect(windowSections(opening).filter(s => s.glass)).toHaveLength(1);
    const couch = floor.fixtures.find(f => f.id === "window-couch")!;
    expect(windows[0].start).toBeLessThan(couch.at[1] - couch.size[1] / 2);
    expect(windows[1].end).toBeGreaterThan(couch.at[1] + couch.size[1] / 2);
    expect(floor.northwestOpenings.find(o => o.id === "private-office")!.dividers).toHaveLength(1);
  });
  it("separates Resources' broad office window from its main run without moving the office", () => {
    const floor = FLOORS.resources;
    const office = floor.rooms.find(r => r.kind === "private")!;
    const [privateWindow, main] = floor.northwestOpenings;
    expect(privateWindow.id).toBe("private-office"); expect(main.id).toBe("main-run");
    expect((privateWindow.start + privateWindow.end) / 2).toBeCloseTo(office.at[1]);
    expect(privateWindow.start).toBeGreaterThan(office.at[1] - office.size[1] / 2);
    expect(privateWindow.end).toBeLessThan(office.at[1] + office.size[1] / 2);
    expect(windowSections(privateWindow).filter(s => s.glass)).toHaveLength(1);
    expect(main.start).toBeGreaterThan(office.at[1] + office.size[1] / 2);
    expect(main.start - privateWindow.end).toBeCloseTo(EXTERIOR_FRAME.roomMargin * 2);
    expect(windowSections(main).filter(s => s.glass)).toHaveLength(4);
  });
  it("keeps Home's broad middle apertures and jambs outside the solid conference backdrop", () => {
    const room = FLOORS.home.rooms.find(r => r.kind === "conference")!;
    const start = room.at[1] - room.size[1] / 2;
    const end = room.at[1] + room.size[1] / 2;
    for (const opening of FLOORS.home.northwestOpenings) expect(opening.end <= start || opening.start >= end).toBe(true);
    const infill = solidWallSpans(FLOORS.home.northwestOpenings).find(span => span.start < start && span.end >= end)!;
    expect(infill).toBeDefined();
    const nearest = FLOORS.home.northwestOpenings.at(-1)!;
    expect(start - nearest.end).toBeCloseTo(EXTERIOR_FRAME.roomMargin);
    expect(start - windowSections(nearest).filter(s => s.glass).at(-1)!.end).toBeCloseTo(EXTERIOR_FRAME.roomMargin + EXTERIOR_FRAME.width);
  });
  it("anchors both rear private offices at the wall junction", () => {
    for (const floor of Object.values(FLOORS)) {
      const room = floor.rooms.find(r => r.kind === "private")!;
      expect(room.at[0] - room.size[0] / 2).toBeCloseTo(-BUILDING.width / 2 + BUILDING.wallThickness / 2);
      expect(room.at[1] - room.size[1] / 2).toBeCloseTo(-BUILDING.depth / 2 + BUILDING.wallThickness / 2);
    }
  });
  it("restores Resources' lounge bookcase and places its side bench behind the right pod", () => {
    const floor = FLOORS.resources;
    expect(floor.fixtures.find(f => f.id === "lounge-bookcase")?.kind).toBe("bookcase");
    const bench = floor.fixtures.find(f => f.id === "right-benches")!;
    const pod = floor.pods.find(p => p.tool === "delphi")!;
    expect(bench.at[0]).toBeGreaterThan(pod.at[0]);
    expect(bench.at[1]).toBeLessThan(pod.at[1]);
  });
  it("keeps the new seating and foreground furniture but removes the storage enclosure", () => {
    expect(FLOORS.home.fixtures.find(f => f.id === "central-seating")?.kind).toBe("collaboration");
    expect(FLOORS.resources.rooms.map(r => r.id)).toEqual(["conference", "private"]);
    expect(FLOORS.resources.fixtures.find(f => f.id === "printer")?.kind).toBe("copier");
    expect(FLOORS.resources.fixtures.find(f => f.id === "foreground-benches")?.kind).toBe("bench");
    expect(FLOORS.resources.fixtures.find(f => f.id === "foreground-reading")?.kind).toBe("reading");
  });
  it("handles direct anchors and ignores unrelated hashes", () => {
    expect(readFloor("#resources")).toBe("resources"); expect(readFloor("#home")).toBe("home"); expect(readFloor("#office-main")).toBe("home");
  });
});
