import { describe, expect, it, vi } from "vitest";
import { initialOfficeTier, OfficeFrameBudget, officeRenderQuality, type QualityTier } from "./renderQuality";

describe("office quality policy", () => {
  it("keeps strong-device atmosphere and shadows unchanged and only reduces resolution in motion", () => {
    const settled = officeRenderQuality("high", false);
    expect(settled).toMatchObject({ dpr: 1.5, samples: 4, shadowSize: 2048, bloomScale: 1 });
    expect(officeRenderQuality("high", true)).toEqual({ ...settled, dpr: 1 });
  });
  it("keeps slow mobile devices at DPR 1 with lighter effects even after settling", () => {
    for (const tier of ["balanced", "low"] as const) {
      expect(officeRenderQuality(tier, true, true)).toEqual(officeRenderQuality(tier, false, true));
      const quality = officeRenderQuality(tier, false, true);
      expect(quality.dpr).toBe(1);
      expect(quality.shadowSize).toBe(1024);
      expect(quality.contactSamples).toBeLessThan(8);
    }
  });
  it.each(["high", "balanced", "low"] as const)("restores desktop resolution and anti-aliasing after travel at the %s tier", tier => {
    const moving = officeRenderQuality(tier, true);
    const settled = officeRenderQuality(tier, false);
    expect(moving.dpr).toBe(1);
    expect(settled.dpr).toBe(1.5);
    expect(settled.samples).toBe(4);
    if (tier !== "high") expect(settled.shadowSize).toBeLessThan(officeRenderQuality("high", false).shadowSize);
  });
  it.each([
    [false, true, "high"],
    [true, false, "balanced"],
    [true, true, "high"],
  ] as const)("classifies coarse=%s and fine=%s as %s", (coarse, fine, expected) => {
    vi.stubGlobal("window", { matchMedia: (query: string) => ({ matches: query === "(pointer: coarse)" ? coarse : fine }) });
    try { expect(initialOfficeTier()).toBe(expected); }
    finally { vi.unstubAllGlobals(); }
  });
  it("ignores isolated stalls and inactive gaps, but downgrades sustained slow rendering", () => {
    const budget = new OfficeFrameBudget();
    let now = 0, tier: QualityTier = "high";
    const frames = (count: number, ms: number, active = true) => {
      for (let i = 0; i < count; i++) tier = budget.sample(now += ms, tier, active);
    };
    frames(30, 16); frames(1, 100); frames(60, 16);
    expect(tier).toBe("high");
    frames(1, 5000, false); frames(100, 16);
    expect(tier).toBe("high");
    frames(180, 40);
    expect(tier).toBe("balanced");
    frames(60, 40); // No second downgrade during the cooldown.
    expect(tier).toBe("balanced");
    frames(240, 40);
    expect(tier).toBe("low");
    // A real downgrade must not leave desktop floors blurry afterward.
    expect(officeRenderQuality(tier, false)).toMatchObject({ dpr: 1.5, samples: 4 });
  });
  it("lets fast touch devices try full quality once after settling without quality oscillation", () => {
    const budget = new OfficeFrameBudget();
    let now = 0, tier: QualityTier = "balanced";
    const frames = (count: number, ms: number, settled: boolean) => {
      for (let i = 0; i < count; i++) tier = budget.sample(now += ms, tier, true, settled);
    };
    frames(300, 16, false);
    expect(tier).toBe("balanced");
    frames(300, 16, true);
    expect(tier).toBe("high");
    frames(180, 30, true);
    expect(tier).toBe("balanced");
    frames(600, 16, true);
    expect(tier).toBe("balanced");
  });
});
