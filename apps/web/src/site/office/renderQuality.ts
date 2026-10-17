export type QualityTier = "high" | "balanced" | "low";

export interface RenderQuality {
  dpr: number;
  samples: number;
  shadowSize: number;
  shadowBlur: number;
  contactSamples: number;
  blurDiagonals: boolean;
  bloomScale: number;
}

export function officeRenderQuality(tier: QualityTier, moving: boolean, mobile = false): RenderQuality {
  if (tier === "high") return { dpr: moving ? 1 : 1.5, samples: 4, shadowSize: 2048, shadowBlur: 12, contactSamples: 8, blurDiagonals: true, bloomScale: 1 };
  // Adaptive effects may get cheaper on desktop, but a settled floor must keep
  // the original sharpness even after sustained slow frames lower its tier.
  const dpr = mobile || moving ? 1 : 1.5;
  if (tier === "balanced") return { dpr, samples: mobile ? 2 : 4, shadowSize: 1024, shadowBlur: 6, contactSamples: 4, blurDiagonals: false, bloomScale: 0.5 };
  return { dpr, samples: mobile ? 0 : 4, shadowSize: 1024, shadowBlur: 4, contactSamples: 2, blurDiagonals: false, bloomScale: 0 };
}

export function officeUsesMobileQuality(): boolean {
  if (typeof window === "undefined") return false;
  // A touch-capable desktop with a mouse should retain desktop sharpness.
  return Boolean(window.matchMedia?.("(pointer: coarse)").matches && !window.matchMedia?.("(any-pointer: fine)").matches);
}

export function initialOfficeTier(): QualityTier {
  return officeUsesMobileQuality() ? "balanced" : "high";
}

// Touch is only a conservative starting hint. A consistently fast device gets
// one full-quality probe; after a slowdown, downgrades stick for this visit.
export class OfficeFrameBudget {
  private frames: number[] = [];
  private last: number | null = null;
  private cooldownUntil = 0;
  private healthyWindows = 0;
  private canProbeHigh = true;

  reset() { this.frames = []; this.last = null; this.healthyWindows = 0; }

  sample(now: number, tier: QualityTier, active: boolean, allowUpgrade = true): QualityTier {
    if (!active || tier === "low") { this.reset(); return tier; }
    const elapsed = this.last === null ? 0 : now - this.last;
    this.last = now;
    if (now < this.cooldownUntil || elapsed <= 0) { this.frames = []; return tier; }
    this.frames.push(Math.min(elapsed, 250));
    if (this.frames.length < 90) return tier;
    const sorted = this.frames.sort((a, b) => a - b);
    const p90 = sorted[Math.floor(sorted.length * 0.9)];
    const slow = p90 > (tier === "high" ? 25 : 34);
    this.frames = [];
    if (!slow) {
      this.healthyWindows = allowUpgrade && p90 < 19 ? this.healthyWindows + 1 : 0;
      if (tier === "balanced" && this.canProbeHigh && this.healthyWindows >= 3) {
        this.canProbeHigh = false; this.healthyWindows = 0;
        return "high";
      }
      return tier;
    }
    this.canProbeHigh = false; this.healthyWindows = 0;
    this.cooldownUntil = now + 4000;
    return tier === "high" ? "balanced" : "low";
  }
}
