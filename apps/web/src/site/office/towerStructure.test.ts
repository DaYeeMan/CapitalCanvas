import { describe, expect, it } from "vitest";
import { BUILDING } from "./layouts";
import { DISTRICT_BUILDINGS, GROUND_Y, INTERVENING_STOREYS, levelY, readPreviewView, TOWER, TOWER_SITE, towerPose } from "./towerStructure";

describe("one tower with distant office floors", () => {
  it("places six closed storeys between Home and Resources", () => {
    expect(INTERVENING_STOREYS).toBe(6);
    expect(levelY(TOWER.homeLevel) - levelY(TOWER.resourcesLevel)).toBeCloseTo(23.8);
    expect(TOWER.pitch).toBeGreaterThan(BUILDING.wall + BUILDING.slab);
    expect(levelY(0) - BUILDING.slab).toBeCloseTo(GROUND_Y);
    // Resources must sit well above the district, with enough lower facade to
    // continue out of the office close-up instead of revealing the foundation.
    expect(levelY(TOWER.resourcesLevel) - GROUND_Y).toBeGreaterThan(20);
    expect(TOWER.width).toBe(BUILDING.width + BUILDING.wallThickness);
  });
  it("opens each floor above its lower body and clears its full interior with the upper assembly", () => {
    for (const view of ["home", "resources"] as const) {
      const pose = towerPose(view), level = view === "home" ? TOWER.homeLevel : TOWER.resourcesLevel;
      expect(pose.floorY - BUILDING.slab).toBeGreaterThan(levelY(level));
      expect(levelY(level) + TOWER.upperLift - BUILDING.slab).toBeGreaterThan(pose.floorY + BUILDING.wall);
    }
    expect(towerPose("home").middleOffset).toBe(0);
    expect(towerPose("resources").middleOffset).toBe(TOWER.upperLift);
    expect(towerPose("resources").floorY).toBeLessThan(towerPose("home").floorY - 20);
  });
  it("closes all assemblies into the same footprint and levels", () => {
    expect(towerPose("city")).toMatchObject({ capOffset: 0, middleOffset: 0, floorY: 0 });
    expect(levelY(TOWER.resourcesLevel + 1) + INTERVENING_STOREYS * TOWER.pitch).toBeCloseTo(levelY(TOWER.homeLevel));
  });
  it("preserves transition endpoints above the extended foundation and keeps the Resources upper stack rigid", () => {
    expect(GROUND_Y).toBeCloseTo(-44.65);
    expect(levelY(TOWER.homeLevel)).toBeCloseTo(0);
    expect(levelY(TOWER.resourcesLevel)).toBeCloseTo(-23.8);
    const home = towerPose("home"), resources = towerPose("resources"), city = towerPose("city");
    expect(home.floorY).toBeCloseTo(2.2);
    expect(resources.floorY).toBeCloseTo(-21.6);
    expect(resources.floorY - GROUND_Y).toBeGreaterThan(23);
    expect(home.middleOffset).toBe(0);
    expect(home.capOffset).toBe(32);
    expect(resources.middleOffset).toBe(resources.capOffset);
    expect(resources.capOffset).toBe(32);
    expect(city.middleOffset).toBe(0);
    expect(city.capOffset).toBe(0);
    expect(city.top).toBeCloseTo(12.2);
    expect(home.top).toBeCloseTo(44.2);
    expect(resources.top).toBeCloseTo(home.top);
  });
  it("keeps four subordinate buildings clear of the main tower and each other", () => {
    expect(DISTRICT_BUILDINGS).toHaveLength(4);
    const buildings = [{ x: TOWER_SITE.x, z: TOWER_SITE.z, width: TOWER.width, depth: TOWER.depth, storeys: TOWER.storeys }, ...DISTRICT_BUILDINGS];
    for (let i = 0; i < buildings.length; i++) for (const other of buildings.slice(i + 1)) {
      const b = buildings[i];
      expect(Math.abs(b.x - other.x) > (b.width + other.width) / 2 + 2 || Math.abs(b.z - other.z) > (b.depth + other.depth) / 2 + 2).toBe(true);
    }
    expect(DISTRICT_BUILDINGS.every(b => b.storeys < TOWER.storeys / 2)).toBe(true);
  });
  it("accepts only preview destinations and defaults to the city", () => {
    expect(readPreviewView("#home")).toBe("home");
    expect(readPreviewView("#resources")).toBe("resources");
    for (const hash of ["", "#city", "#office-main", "#unknown"]) expect(readPreviewView(hash)).toBe("city");
  });
});
