import { describe, expect, it } from "vitest";
import { Group, PointLight } from "three";
import { fittedCamera } from "./cameraFit";
import { applyFloorLightReveal, floorLightReveal } from "./officeLighting";
import { frameForView, planJourney, sampleJourney, type CameraFits } from "./towerMotion";

const fits: CameraFits = { city: fittedCamera("city", 1440, 900), home: fittedCamera("home", 1440, 900), resources: fittedCamera("resources", 1440, 900) };

describe("office light continuity", () => {
  it("has no light contribution at either side of the interior visibility boundary", () => {
    for (const facade of [0, 0.009999, 0.01, 0.010001, 0.05]) {
      expect(floorLightReveal(facade, 0)).toBe(0);
      expect(floorLightReveal(facade, facade / 2)).toBe(0);
    }
    expect(floorLightReveal(4.4, 2.2)).toBe(1);
    expect(floorLightReveal(32, 2.2)).toBe(1);
  });

  it("fades continuously with physical clearance on every opening and closing journey", () => {
    for (const from of ["city", "home", "resources"] as const) for (const to of ["city", "home", "resources"] as const) {
      if (from === to) continue;
      const journey = planJourney(frameForView(from, fits[from]), from, to, fits);
      const previous = { home: Number(from === "home"), resources: Number(from === "resources") };
      const sawFade = { home: false, resources: false };
      for (let elapsed = 0; elapsed <= journey.duration; elapsed += 0.001) {
        const frame = sampleJourney(journey, elapsed).frame;
        for (const floor of ["home", "resources"] as const) {
          const reveal = floorLightReveal(frame[`${floor}Facade`], frame[`${floor}Lift`]);
          expect(reveal).toBeGreaterThanOrEqual(0); expect(reveal).toBeLessThanOrEqual(1);
          expect(Math.abs(reveal - previous[floor])).toBeLessThan(0.05);
          if (frame[`${floor}Facade`] <= 0.01) expect(reveal).toBe(0);
          if (reveal > 0 && reveal < 1) sawFade[floor] = true;
          previous[floor] = reveal;
        }
      }
      if (from !== "city") expect(sawFade[from]).toBe(true);
      if (to !== "city") expect(sawFade[to]).toBe(true);
    }
  });

  it("restores authored lamp strengths after repeated fades without dimming other lights", () => {
    const home = new Group(), resources = new Group();
    const task = new PointLight(0xffffff, 3.6), lounge = new PointLight(0xffffff, 14), other = new PointLight(0xffffff, 19);
    const resourceTask = new PointLight(0xffffff, 2.4);
    task.name = resourceTask.name = "task-light"; lounge.name = "lounge-light";
    const nested = new Group(); nested.add(task, lounge); home.add(nested, other); resources.add(resourceTask);
    for (const reveal of [0, 0.2, 0.9, 0.1, 0, 1]) {
      applyFloorLightReveal(home, reveal);
      expect(task.intensity).toBeCloseTo(3.6 * reveal);
      expect(lounge.intensity).toBeCloseTo(14 * reveal);
      expect(other.intensity).toBe(19);
      expect(resourceTask.intensity).toBe(2.4);
    }
    applyFloorLightReveal(resources, 0.5);
    expect(resourceTask.intensity).toBe(1.2); expect(task.intensity).toBe(3.6);
  });
});
