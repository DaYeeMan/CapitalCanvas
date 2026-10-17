import { useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import type { DirectionalLight } from "three";
import { OfficeFrameBudget, type QualityTier, type RenderQuality } from "./renderQuality";
import type { MotionRuntime } from "./TowerMotionDriver";

export function OfficeQuality({ tier, quality, active, settled, runtime, light, element, onTier }: {
  tier: QualityTier; quality: RenderQuality; active: boolean; settled: boolean;
  runtime: RefObject<MotionRuntime>; light: RefObject<DirectionalLight | null>;
  element: RefObject<HTMLDivElement | null>; onTier: (tier: QualityTier) => void;
}) {
  const { setDpr, invalidate } = useThree();
  const budget = useRef(new OfficeFrameBudget());
  useLayoutEffect(() => {
    setDpr(Math.min(window.devicePixelRatio || 1, quality.dpr));
    invalidate();
  }, [quality.dpr, setDpr, invalidate]);
  useLayoutEffect(() => {
    const shadow = light.current?.shadow;
    if (!shadow) return;
    if (shadow.mapSize.x !== quality.shadowSize) {
      shadow.map?.dispose(); shadow.map = null;
      shadow.mapPass?.dispose(); shadow.mapPass = null;
      shadow.mapSize.set(quality.shadowSize, quality.shadowSize);
    }
    shadow.blurSamples = quality.shadowBlur; shadow.needsUpdate = true;
    invalidate();
  }, [quality.shadowSize, quality.shadowBlur, light, invalidate]);
  useLayoutEffect(() => { budget.current.reset(); }, [active]);
  useLayoutEffect(() => {
    if (element.current) {
      element.current.dataset.quality = tier;
      element.current.dataset.renderDpr = String(Math.min(window.devicePixelRatio || 1, quality.dpr));
      element.current.dataset.renderSamples = String(quality.samples);
    }
  }, [tier, quality.dpr, quality.samples, element]);
  useFrame(() => {
    const next = budget.current.sample(performance.now(), tier, active && runtime.current.ready, settled);
    if (next !== tier) onTier(next);
  }, 0);
  return null;
}
