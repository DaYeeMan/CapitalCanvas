import { describe, expect, it } from "vitest";
import { Box3, BoxGeometry, Group, Mesh, Vector3 } from "three";
import { BUILDING } from "./layouts";
import { FACADE_BAND } from "./towerStructure";
import { applyCutawayWallHandoff, cutawayWallPose } from "./officeWallHandoff";
import { fittedCamera } from "./cameraFit";
import { frameForView, planJourney, sampleJourney, type CameraFits } from "./towerMotion";

const fits: CameraFits = { city: fittedCamera("city", 1440, 900), home: fittedCamera("home", 1440, 900), resources: fittedCamera("resources", 1440, 900) };
const bandTop = FACADE_BAND.centerY + FACADE_BAND.height / 2;

describe("cutaway wall handoff", () => {
  it("places both front walls fully behind the opaque band on either side of the visibility cutoff", () => {
    const office = new Group(), front = new Group(), east = new Group(), south = new Group();
    front.name = "cutaway-front-walls"; east.name = "cutaway-east-wall"; south.name = "cutaway-south-wall";
    const xWall = new Mesh(new BoxGeometry(BUILDING.wallThickness, BUILDING.frontWall, BUILDING.depth));
    const zWall = new Mesh(new BoxGeometry(BUILDING.width, BUILDING.frontWall, BUILDING.wallThickness));
    xWall.position.set(BUILDING.width / 2, BUILDING.frontWall / 2, 0);
    zWall.position.set(0, BUILDING.frontWall / 2, BUILDING.depth / 2);
    east.add(xWall); south.add(zWall); front.add(east, south); office.add(front);
    for (const facade of [0, 0.009999, 0.01, 0.010001]) {
      const slice = facade / 2;
      applyCutawayWallHandoff(office, facade, slice); office.position.y = slice; office.updateMatrixWorld(true);
      for (const wall of [xWall, zWall]) {
        const bounds = new Box3().setFromObject(wall);
        expect(bounds.min.y).toBeCloseTo(slice);
        expect(bounds.max.y).toBeLessThan(facade + bandTop - 0.005);
      }
      expect(new Box3().setFromObject(xWall).max.x).toBeLessThan((BUILDING.width + BUILDING.wallThickness) / 2 - 0.005);
      expect(new Box3().setFromObject(zWall).max.z).toBeLessThan((BUILDING.depth + BUILDING.wallThickness) / 2 - 0.005);
    }
    // Reopening restores the original bounds without accumulated scaling/offset.
    applyCutawayWallHandoff(office, 32, 2.2); office.position.y = 0; office.updateMatrixWorld(true);
    expect(new Box3().setFromObject(xWall).getSize(new Vector3()).y).toBeCloseTo(BUILDING.frontWall);
    expect(east.position.x).toBeCloseTo(0); expect(south.position.z).toBeCloseTo(0);
    xWall.geometry.dispose(); zWall.geometry.dispose();
  });

  it("keeps full open geometry and smoothly conceals the wall on all six journeys", () => {
    expect(cutawayWallPose(4.4, 2.2)).toEqual({ height: BUILDING.frontWall, inset: 0 });
    expect(cutawayWallPose(32, 2.2)).toEqual({ height: BUILDING.frontWall, inset: 0 });
    for (const from of ["city", "home", "resources"] as const) for (const to of ["city", "home", "resources"] as const) {
      if (from === to) continue;
      const journey = planJourney(frameForView(from, fits[from]), from, to, fits);
      const previous = { home: cutawayWallPose(journey.from.homeFacade, journey.from.homeLift), resources: cutawayWallPose(journey.from.resourcesFacade, journey.from.resourcesLift) };
      for (let elapsed = 0; elapsed <= journey.duration; elapsed += 0.002) {
        const frame = sampleJourney(journey, elapsed).frame;
        for (const floor of ["home", "resources"] as const) {
          const facade = frame[`${floor}Facade`], slice = frame[`${floor}Lift`], pose = cutawayWallPose(facade, slice);
          expect(pose.height).toBeGreaterThan(0); expect(pose.height).toBeLessThanOrEqual(BUILDING.frontWall);
          expect(Math.abs(pose.height - previous[floor].height)).toBeLessThan(0.04);
          if (facade <= 0.01) expect(slice + pose.height).toBeLessThan(facade + bandTop);
          previous[floor] = pose;
        }
      }
    }
  });
});
