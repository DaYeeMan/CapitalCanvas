import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { readFloor, type FloorId } from "./layouts";

export function useOfficeNavigation(reducedMotion: boolean) {
  const progress = useRef(readFloor() === "resources" ? 1 : 0);
  const [floor, setFloor] = useState<FloorId>(readFloor);
  const [settled, setSettled] = useState(true);
  const [viewReset, setViewReset] = useState(0);
  const frame = useRef(0);
  const destination = useRef<FloorId>(readFloor());
  const select = useCallback((next: FloorId) => {
    cancelAnimationFrame(frame.current);
    destination.current = next;
    setViewReset(value => value + 1);
    const target = next === "resources" ? 1 : 0;
    const start = progress.current;
    const finish = () => { progress.current = target; setFloor(next); setSettled(true); };
    if (reducedMotion || document.visibilityState === "hidden" || Math.abs(start - target) < 0.001) { finish(); return; }
    setSettled(false);
    const began = performance.now();
    const tick = () => {
      const t = Math.min(1, (performance.now() - began) / 700);
      progress.current = start + (target - start) * (t * t * (3 - 2 * t));
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else finish();
    };
    frame.current = requestAnimationFrame(tick);
  }, [reducedMotion]);
  const navigate = useCallback((next: FloorId) => {
    if (window.location.hash !== `#${next}`) window.history.pushState(null, "", `#${next}`);
    select(next);
  }, [select]);
  useLayoutEffect(() => {
    const onHash = () => select(readFloor());
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && progress.current !== (destination.current === "resources" ? 1 : 0)) select(destination.current);
    };
    if (reducedMotion && progress.current !== (destination.current === "resources" ? 1 : 0)) select(destination.current);
    window.addEventListener("hashchange", onHash);
    window.addEventListener("popstate", onHash);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame.current);
      window.removeEventListener("hashchange", onHash);
      window.removeEventListener("popstate", onHash);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [select, reducedMotion]);
  return { progress, floor, settled, navigate, viewReset };
}
