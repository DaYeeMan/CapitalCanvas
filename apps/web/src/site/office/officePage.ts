import { useLayoutEffect, useRef, type RefObject } from "react";
import { readPreviewView, type PreviewView } from "./towerStructure";
import { readResearchTarget } from "./officeResearch";

export type PreviewPage = PreviewView | "about";
export const pageScene = (page: PreviewPage): PreviewView => page === "about" ? "city" : page;
export const readPreviewPage = (hash = window.location.hash): PreviewPage => readResearchTarget(hash) ? "resources" : hash === "#about" ? "about" : readPreviewView(hash);

// One reversible clock feeds HTML and the compositor, without React rerenders
// or changes to the physical scene command. Demand rendering wakes per sample.
export function useOfficePageBlend(about: boolean, instant: boolean, root: RefObject<HTMLDivElement | null>) {
  const blend = useRef(about ? 1 : 0);
  useLayoutEffect(() => {
    const node = root.current, target = about ? 1 : 0, from = blend.current;
    if (!node) return;
    let frame = 0;
    const publish = (value: number) => {
      blend.current = value;
      node.style.setProperty("--office-about-blend", String(value));
      node.dispatchEvent(new Event("office-page-blend"));
    };
    if (instant || from === target) { publish(target); return; }
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - began) / 280), eased = t * t * (3 - 2 * t);
      publish(from + (target - from) * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    const skip = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      cancelAnimationFrame(frame); publish(target);
    };
    publish(from); frame = requestAnimationFrame(tick);
    window.addEventListener("keydown", skip);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("keydown", skip); };
  }, [about, instant, root]);
  return blend;
}
