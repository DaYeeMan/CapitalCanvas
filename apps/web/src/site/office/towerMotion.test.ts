import { describe, expect, it } from "vitest";
import { OrthographicCamera, Vector3 } from "three";
import { BUILDING, CAMERA, TALL_WALL_TOP } from "./layouts";
import { applyCamera, captureCamera, fittedCamera } from "./cameraFit";
import { frameForView, planJourney, sampleJourney, resizeJourney, type CameraFits } from "./towerMotion";
import { GROUND_Y, TOWER } from "./towerStructure";

const fits: CameraFits = { city: fittedCamera("city", 1280, 720), home: fittedCamera("home", 1280, 720), resources: fittedCamera("resources", 1280, 720) };
describe("tower journeys", () => {
  it("keeps city entry within 2–3 seconds and makes the split precede the close-up", () => {
    const journey = planJourney(frameForView("city", fits.city), "city", "home", fits);
    expect(journey.duration).toBeCloseTo(2.6);
    const split = sampleJourney(journey, 1.05).frame;
    expect(split.homeLift).toBeCloseTo(TOWER.sliceLift);
    expect(split.cap).toBeCloseTo(12);
    expect(split.camera).toEqual(fits.city);
    expect(split.city).toBe(1);
  });
  it("traverses the closed facade before revealing Resources and reverses upward for Home", () => {
    for (const [from, to, phase] of [["home", "resources", "descending-facade"], ["resources", "home", "ascending-facade"]] as const) {
      const journey = planJourney(frameForView(from, fits[from]), from, to, fits);
      expect(journey.duration).toBeCloseTo(2.8);
      const middle = sampleJourney(journey, 1.2);
      expect(middle.phase).toBe(phase);
      expect(middle.frame.cap).toBe(0); expect(middle.frame.middle).toBe(0);
      expect(middle.frame.homeLift).toBe(0); expect(middle.frame.resourcesLift).toBe(0);
      expect(middle.frame.homeFacade).toBe(0); expect(middle.frame.resourcesFacade).toBe(0);
      expect(middle.frame.camera.targetY).toBeLessThan(fits.home.targetY);
      expect(middle.frame.camera.targetY).toBeGreaterThan(fits.resources.targetY - TOWER.sliceLift);
    }
  });
  it("keeps the Resources upper assembly rigid and seats each slice before closing its facade", () => {
    for (const from of ["city", "home", "resources"] as const) for (const to of ["city", "home", "resources"] as const) {
      if (from === to) continue;
      const journey = planJourney(frameForView(from, fits[from]), from, to, fits);
      for (let elapsed = 0; elapsed <= journey.duration; elapsed += 0.01) {
        const { frame } = sampleJourney(journey, elapsed);
        expect(frame.homeFacade + 1e-9).toBeGreaterThanOrEqual(frame.homeLift);
        expect(frame.resourcesFacade + 1e-9).toBeGreaterThanOrEqual(frame.resourcesLift);
        if (frame.middle > 0) {
          expect(frame.middle).toBeCloseTo(frame.cap);
          expect(frame.middle).toBeCloseTo(frame.resourcesFacade);
          expect(frame.homeLift).toBe(0); expect(frame.homeFacade).toBe(0);
        }
        expect(frame.camera.height).toBeGreaterThan(0);
      }
      const end = sampleJourney(journey, journey.duration + 1);
      expect(end.complete).toBe(true); expect(end.frame).toEqual(frameForView(to, fits[to]));
    }
    expect(GROUND_Y).toBeCloseTo(-44.65);
  });
  it("retargets from the exact intermediate pose, including current camera framing", () => {
    const outbound = planJourney(frameForView("city", fits.city), "city", "home", fits);
    const interrupted = sampleJourney(outbound, 1.8).frame;
    for (const target of ["city", "resources"] as const) {
      const next = planJourney(interrupted, "city", target, fits);
      expect(sampleJourney(next, 0).frame).toEqual(interrupted);
      expect(sampleJourney(next, next.duration + 1).frame).toEqual(frameForView(target, fits[target]));
    }
  });
  it("returns each opening to the same 16-storey city", () => {
    for (const from of ["home", "resources"] as const) {
      const journey = planJourney(frameForView(from, fits[from]), from, "city", fits);
      expect(journey.duration).toBeCloseTo(from === "home" ? 1.8 : 2.2);
      expect(sampleJourney(journey, 0.3).frame.homeLift).toBe(0);
      expect(sampleJourney(journey, 0.3).frame.resourcesLift).toBe(0);
      expect(sampleJourney(journey, journey.duration + 0.01).frame).toEqual(frameForView("city", fits.city));
    }
  });
  it("resizes from the current pose without restarting the remaining journey", () => {
    const nextFits: CameraFits = { city: fittedCamera("city", 1440, 900), home: fittedCamera("home", 1440, 900), resources: fittedCamera("resources", 1440, 900) };
    for (const [from, to] of [["city", "home"], ["home", "resources"], ["resources", "city"]] as const) {
      const journey = planJourney(frameForView(from, fits[from]), from, to, fits);
      const elapsed = 1.2, frame = sampleJourney(journey, elapsed).frame;
      const resized = resizeJourney(journey, elapsed, frame, fits, nextFits);
      expect(resized.duration).toBeCloseTo(journey.duration - elapsed);
      expect(sampleJourney(resized, 0).frame).toEqual(frame);
      const end = sampleJourney(resized, resized.duration + 1).frame;
      const expected = frameForView(to, nextFits[to]);
      expect(end.homeLift).toBe(expected.homeLift); expect(end.resourcesLift).toBe(expected.resourcesLift);
      expect(end.camera.height).toBeCloseTo(expected.camera.height); expect(end.camera.centerX).toBeCloseTo(expected.camera.centerX);
    }
  });
});

describe("office camera handoff", () => {
  it("captures a panned and zoomed office without a jump when motion takes over", () => {
    const office = new OrthographicCamera(), takeover = new OrthographicCamera(), aspect = 1280 / 720;
    applyCamera(office, fits.home, aspect);
    office.zoom = 1.7; office.left -= 0.8; office.right -= 0.8; office.top += 0.4; office.bottom += 0.4; office.updateProjectionMatrix();
    applyCamera(takeover, captureCamera(office, fits.home.targetY), aspect);
    for (const point of [new Vector3(0, fits.home.targetY, 0), new Vector3(8, fits.home.targetY + 2.8, -8)]) {
      const a = point.clone().project(office), b = point.clone().project(takeover);
      expect(a.x).toBeCloseTo(b.x, 10); expect(a.y).toBeCloseTo(b.y, 10);
    }
  });
  it("matches the existing office fit exactly at both destination elevations", () => {
    for (const view of ["home", "resources"] as const) {
      const fit = fits[view], original = new OrthographicCamera(), motion = new OrthographicCamera();
      original.position.set(CAMERA.position[0], CAMERA.position[1] + fit.targetY, CAMERA.position[2]); original.lookAt(0, fit.targetY, 0); original.updateMatrixWorld();
      const bounds = [-1, 1].flatMap(x => [-BUILDING.slab, TALL_WALL_TOP].flatMap(y => [-1, 1].map(z => new Vector3(x * (BUILDING.width + BUILDING.wallThickness) / 2, y + fit.targetY, z * (BUILDING.depth + BUILDING.wallThickness) / 2).applyMatrix4(original.matrixWorldInverse))));
      const xs = bounds.map(p => p.x), ys = bounds.map(p => p.y), aspect = 1280 / 720;
      const height = Math.max(Math.max(...ys) - Math.min(...ys), (Math.max(...xs) - Math.min(...xs)) / aspect) * CAMERA.padding;
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      original.left = cx - height * aspect / 2; original.right = cx + height * aspect / 2; original.top = cy + height / 2; original.bottom = cy - height / 2; original.updateProjectionMatrix();
      applyCamera(motion, fit, aspect);
      for (const point of [new Vector3(0, fit.targetY, 0), new Vector3(8, fit.targetY + 2.8, -8)]) {
        const a = point.clone().project(original), b = point.clone().project(motion);
        expect(a.x).toBeCloseTo(b.x, 10); expect(a.y).toBeCloseTo(b.y, 10);
      }
    }
  });
});
