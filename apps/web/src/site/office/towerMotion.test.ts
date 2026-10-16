import { describe, expect, it } from "vitest";
import { OrthographicCamera, Vector3 } from "three";
import { BUILDING, CAMERA, TALL_WALL_TOP } from "./layouts";
import { applyCamera, captureCamera, fittedCamera, inspectionCamera } from "./cameraFit";
import { frameForView, planJourney, sampleJourney, resizeJourney, type CameraFits } from "./towerMotion";
import { GROUND_Y, TOWER, TOWER_SITE, towerPose } from "./towerStructure";

const fits: CameraFits = { city: fittedCamera("city", 1280, 720), home: fittedCamera("home", 1280, 720), resources: fittedCamera("resources", 1280, 720) };
describe("closer district framing", () => {
  it("keeps the full main tower in frame and clear of the left copy column at both desktop sizes", () => {
    for (const [width, height] of [[1280, 720], [1440, 900]]) {
      const camera = new OrthographicCamera();
      applyCamera(camera, fittedCamera("city", width, height), width / height);
      const corners = [-1, 1].flatMap(x => [GROUND_Y, towerPose("city").top].flatMap(y =>
        [-1, 1].map(z => new Vector3(TOWER_SITE.x + x * TOWER.width / 2, y, TOWER_SITE.z + z * TOWER.depth / 2).project(camera))));
      for (const corner of corners) {
        expect(corner.x).toBeGreaterThan(0);
        expect(corner.x).toBeLessThan(1);
        expect(corner.y).toBeGreaterThan(-0.8);
        expect(corner.y).toBeLessThan(0.95);
      }
      // A small, viewport-relative roof gap survives desktop resizes.
      const roofGap = (1 - Math.max(...corners.map(corner => corner.y))) / 2;
      expect(roofGap).toBeGreaterThan(0.04);
      expect(roofGap).toBeLessThan(0.06);
    }
  });
});
describe("tower journeys", () => {
  it("keeps city entry within 2–3 seconds and makes the split precede the close-up", () => {
    const journey = planJourney(frameForView("city", fits.city), "city", "home", fits);
    expect(journey.duration).toBeCloseTo(2.6);
    const split = sampleJourney(journey, 1.05).frame;
    expect(split.homeLift).toBeCloseTo(TOWER.sliceLift);
    expect(split.cap).toBeCloseTo(TOWER.sliceLift * 2);
    expect(split.camera).toEqual(fits.city);
    expect(split.city).toBe(1);
  });
  it("opens balanced gaps together, then holds the slice while the upper assembly clears during zoom", () => {
    for (const destination of ["home", "resources"] as const) {
      for (const origin of ["city", destination === "home" ? "resources" : "home"] as const) {
        const journey = planJourney(frameForView(origin, fits[origin]), origin, destination, fits);
        const openingIndex = journey.steps.findIndex(step => step.phase === `opening-${destination}`);
        const start = journey.steps.slice(0, openingIndex).reduce((sum, step) => sum + step.duration, 0);
        const opening = journey.steps[openingIndex];
        const camera = sampleJourney(journey, start).frame.camera;
        for (const fraction of [0.01, 0.25, 0.5, 0.75, 0.99]) {
          const { frame } = sampleJourney(journey, start + opening.duration * fraction);
          const slice = destination === "home" ? frame.homeLift : frame.resourcesLift;
          const facade = destination === "home" ? frame.homeFacade : frame.resourcesFacade;
          expect(slice).toBeGreaterThan(0);
          expect(frame.cap - slice).toBeCloseTo(slice, 10);
          expect(facade).toBeCloseTo(frame.cap, 10);
          if (destination === "resources") expect(frame.middle).toBeCloseTo(frame.cap, 10);
          for (const key of ["targetY", "centerX", "centerY", "height"] as const) expect(frame.camera[key]).toBeCloseTo(camera[key], 10);
        }
        const zooming = sampleJourney(journey, start + opening.duration + 0.2).frame;
        expect(zooming.cap).toBeGreaterThan(TOWER.sliceLift * 2);
        expect(zooming.cap).toBeLessThan(TOWER.upperLift);
        expect(destination === "home" ? zooming.homeLift : zooming.resourcesLift).toBe(TOWER.sliceLift);
        expect(zooming.camera).not.toEqual(camera);
      }
    }
  });
  it("closes the slice and upper assembly together in either direction while pulling back in place", () => {
    for (const [origin, destination] of [["home", "resources"], ["resources", "home"]] as const) {
      const from = frameForView(origin, fits[origin]);
      const journey = planJourney(from, origin, destination, fits);
      for (const fraction of [0.01, 0.25, 0.5, 0.75, 0.99]) {
        const { frame, phase } = sampleJourney(journey, 0.75 * fraction);
        const slice = origin === "home" ? frame.homeLift : frame.resourcesLift;
        expect(phase).toBe("closing-floor");
        expect(slice).toBeGreaterThan(0); expect(slice).toBeLessThan(TOWER.sliceLift);
        expect(slice / TOWER.sliceLift).toBeCloseTo(frame.cap / TOWER.upperLift, 10);
        expect(frame.camera.targetY).toBe(from.camera.targetY);
        expect(frame.camera.height).toBeGreaterThan(from.camera.height);
        if (origin === "resources") expect(frame.middle).toBeCloseTo(frame.cap, 10);
      }
      const closed = sampleJourney(journey, 0.75);
      expect(closed.frame.cap).toBe(0); expect(closed.frame.homeLift).toBe(0); expect(closed.frame.resourcesLift).toBe(0);
      expect(closed.phase).toBe(origin === "home" ? "descending-facade" : "ascending-facade");
    }
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
  it("keeps facades above the slices and the Resources upper assembly rigid throughout travel", () => {
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
  it("returns in two stages with exactly the reverse structural order of entry on either floor", () => {
    for (const floor of ["home", "resources"] as const) {
      const entry = planJourney(frameForView("city", fits.city), "city", floor, fits);
      const journey = planJourney(frameForView(floor, fits[floor]), floor, "city", fits);
      expect(journey.steps.map(step => step.phase)).toEqual(["withdrawing-office", "returning-city"]);
      expect(journey.duration).toBeCloseTo(entry.duration);
      const geometry = ["homeLift", "resourcesLift", "middle", "cap", "homeFacade", "resourcesFacade"] as const;
      for (let time = 0; time <= journey.duration; time += 0.025) {
        const back = sampleJourney(journey, time).frame;
        const forward = sampleJourney(entry, entry.duration - time).frame;
        for (const key of geometry) expect(back[key]).toBeCloseTo(forward[key], 8);
      }
      expect(sampleJourney(journey, journey.duration + 0.01).frame).toEqual(frameForView("city", fits.city));
    }
  });
  it("holds the slice through the first pullback, then closes all gaps and completes copy with the final zoom", () => {
    for (const floor of ["home", "resources"] as const) {
      const journey = planJourney(frameForView(floor, fits[floor]), floor, "city", fits);
      const compact = sampleJourney(journey, 1.55).frame;
      const slice = floor === "home" ? "homeLift" : "resourcesLift";
      expect(compact[slice]).toBe(TOWER.sliceLift);
      expect(compact.cap).toBeCloseTo(TOWER.sliceLift * 2);
      for (const time of [0.1, 0.7, 1.4]) {
        const frame = sampleJourney(journey, time).frame;
        expect(frame[slice]).toBe(TOWER.sliceLift); expect(frame.cityCopy).toBe(0);
      }
      for (const fraction of [0.01, 0.25, 0.5, 0.75, 0.99]) {
        const frame = sampleJourney(journey, 1.55 + 1.05 * fraction).frame;
        const cameraProgress = (frame.camera.height - compact.camera.height) / (fits.city.height - compact.camera.height);
        expect(frame.cityCopy).toBeCloseTo(cameraProgress, 10);
        expect(frame[slice] / TOWER.sliceLift).toBeCloseTo(1 - frame.cityCopy, 10);
        expect(frame.cap - frame[slice]).toBeCloseTo(frame[slice], 10);
      }
      expect(sampleJourney(journey, journey.duration).frame.cityCopy).toBe(1);
    }
  });
  it("never reopens a slice when returning from an interrupted early entry", () => {
    for (const floor of ["home", "resources"] as const) {
      const entry = planJourney(frameForView("city", fits.city), "city", floor, fits);
      const from = sampleJourney(entry, 0.3).frame;
      const journey = planJourney(from, "city", "city", fits);
      expect(journey.steps.map(step => step.phase)).toEqual(["returning-city"]);
      for (let time = 0; time <= journey.duration; time += 0.05) {
        const frame = sampleJourney(journey, time).frame;
        expect(frame.cap).toBeLessThanOrEqual(from.cap + 1e-9);
        expect(frame.homeLift).toBeLessThanOrEqual(from.homeLift + 1e-9);
        expect(frame.resourcesLift).toBeLessThanOrEqual(from.resourcesLift + 1e-9);
      }
    }
  });
  it("resizes from the current pose without restarting the remaining journey", () => {
    const nextFits: CameraFits = { city: fittedCamera("city", 1440, 900), home: fittedCamera("home", 1440, 900), resources: fittedCamera("resources", 1440, 900) };
    for (const [from, to] of [["city", "home"], ["home", "resources"], ["resources", "city"]] as const) {
      const journey = planJourney(frameForView(from, fits[from]), from, to, fits);
      const elapsed = to === "city" ? 1.9 : 1.2, frame = sampleJourney(journey, elapsed).frame;
      const resized = resizeJourney(journey, elapsed, frame, fits, nextFits);
      expect(resized.duration).toBeCloseTo(journey.duration - elapsed);
      expect(sampleJourney(resized, 0).frame).toEqual(frame);
      if (to === "city") expect(frame.cityCopy).toBeGreaterThan(0);
      const end = sampleJourney(resized, resized.duration + 1).frame;
      const expected = frameForView(to, nextFits[to]);
      expect(end.homeLift).toBe(expected.homeLift); expect(end.resourcesLift).toBe(expected.resourcesLift);
      expect(end.camera.height).toBeCloseTo(expected.camera.height); expect(end.camera.centerX).toBeCloseTo(expected.camera.centerX);
    }
  });
});

describe("office camera handoff", () => {
  it("inspects from the actual zoomed pose, reverses without a jump and reaches both exact fits", () => {
    for (const floor of ["home", "resources"] as const) {
      const from = { ...fits[floor], height: fits[floor].height / 1.7, centerX: 1.2 };
      const to = fittedCamera(floor, 1280, 720, true);
      const start = inspectionCamera(from, to, 0), end = inspectionCamera(from, to, 1);
      expect(start.targetY).toBe(from.targetY); expect(start.height).toBeCloseTo(from.height, 10);
      expect(end.targetY).toBe(to.targetY); expect(end.height).toBeCloseTo(to.height, 10);
      const middle = inspectionCamera(from, to, 0.4);
      expect(middle.height).toBeGreaterThan(from.height); expect(middle.height).toBeLessThan(to.height);
      expect(inspectionCamera(middle, fits[floor], 0).height).toBeCloseTo(middle.height, 10);
      expect(inspectionCamera(middle, fits[floor], 1).height).toBeCloseTo(fits[floor].height, 10);
    }
  });
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
      const bounds = [-1, 1].flatMap(x => [-BUILDING.slab, TALL_WALL_TOP].flatMap(y => [-1, 1].map(z => new Vector3(TOWER_SITE.x + x * (BUILDING.width + BUILDING.wallThickness) / 2, y + fit.targetY, TOWER_SITE.z + z * (BUILDING.depth + BUILDING.wallThickness) / 2).applyMatrix4(original.matrixWorldInverse))));
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
