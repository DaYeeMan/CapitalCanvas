import { describe, expect, it } from "vitest";
import { OrthographicCamera, Vector3 } from "three";
import { applyCamera, fittedCamera } from "./cameraFit";
import { BUILDING, FLOORS, TALL_WALL_TOP } from "./layouts";
import { levelY, TOWER, TOWER_SITE, towerPose } from "./towerStructure";

describe("mobile camera framing", () => {
  it("changes scale continuously as phone browser chrome changes viewport height", () => {
    const a = fittedCamera("city", 390, 739), b = fittedCamera("city", 390, 740), c = fittedCamera("city", 390, 741);
    expect(Math.abs(a.height - b.height) / b.height).toBeLessThan(.005);
    expect(Math.abs(c.height - b.height) / b.height).toBeLessThan(.005);
  });
  it.each([[320, 568], [375, 667], [390, 844], [430, 932], [568, 320], [844, 390]])("brings the city and office closer at %i × %i while retaining reachable desks", (width, height) => {
    for (const view of ["city", "home", "resources"] as const) {
      const fit = fittedCamera(view, width, height);
      const desktopAtSameAspect = fittedCamera(view, width * 4, height * 4);
      expect(fit.height).toBeLessThan(desktopAtSameAspect.height);
      const camera = new OrthographicCamera(); applyCamera(camera, fit, width / height);
      const screen = (point: Vector3) => { const p = point.project(camera); return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2 }; };
      if (view === "city") {
        const roof = [-1, 1].flatMap(x => [-1, 1].map(z => screen(new Vector3(TOWER_SITE.x + x * TOWER.width / 2, towerPose(view).top, TOWER_SITE.z + z * TOWER.depth / 2))));
        expect(Math.min(...roof.map(p => p.y))).toBeGreaterThanOrEqual(height > width ? 123.9 : 95.9);
        expect(Math.min(...roof.map(p => p.x))).toBeGreaterThan(0);
        expect(Math.max(...roof.map(p => p.x))).toBeLessThan(width);
      } else {
        for (const pod of FLOORS[view].pods) {
          const pin = screen(new Vector3(TOWER_SITE.x + pod.at[0], fit.targetY + 2.8, TOWER_SITE.z + pod.at[1]));
          expect(pin.x).toBeGreaterThan(22); expect(pin.x).toBeLessThan(width - 22);
          expect(pin.y).toBeGreaterThan(height > width ? 110 : 72);
          expect(pin.y).toBeLessThan(height - 64);
        }
        if (height > width) {
          const points = [-1, 1].flatMap(x => [-BUILDING.slab, TALL_WALL_TOP].flatMap(y => [-1, 1].map(z => screen(new Vector3(TOWER_SITE.x + x * TOWER.width / 2, fit.targetY + y, TOWER_SITE.z + z * TOWER.depth / 2)))));
          expect(Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x))).toBeGreaterThan(width * 1.8);
        }
        const upperBottom = levelY((view === "home" ? TOWER.homeLevel : TOWER.resourcesLevel) + 1) + TOWER.upperLift - BUILDING.slab;
        const upperEdge = [-1, 1].flatMap(x => [-1, 1].map(z => screen(new Vector3(TOWER_SITE.x + x * TOWER.width / 2, upperBottom, TOWER_SITE.z + z * TOWER.depth / 2))));
        expect(Math.max(...upperEdge.map(p => p.y))).toBeLessThan(height > width ? 110 : 72);
      }
    }
  });
});
