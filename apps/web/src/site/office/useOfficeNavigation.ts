import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { readFloor, type FloorId } from "./layouts";

export type NavigationPhase = "idle" | "fade-out" | "hidden" | "fade-in";
export const FADE = { out: 250, in: 250 } as const;
interface Navigation { floor: FloorId; phase: NavigationPhase; viewReset: number; instantReset: boolean }

export function useOfficeNavigation(reducedMotion: boolean) {
  const [state, setState] = useState<Navigation>(() => ({ floor: readFloor(), phase: "idle", viewReset: 0, instantReset: true }));
  const current = useRef(state), destination = useRef(state.floor);
  const reduced = useRef(reducedMotion);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const publish = useCallback((next: Navigation) => { current.current = next; setState(next); }, []);
  const immediate = useCallback((floor: FloorId) => {
    clearTimeout(timer.current);
    publish({ floor, phase: "idle", viewReset: current.current.viewReset + 1, instantReset: true });
  }, [publish]);
  const commitHidden = useCallback(() => {
    clearTimeout(timer.current);
    publish({ floor: destination.current, phase: "hidden", viewReset: current.current.viewReset + 1, instantReset: true });
  }, [publish]);
  const select = useCallback((next: FloorId) => {
    destination.current = next;
    if (reduced.current || document.visibilityState === "hidden") { immediate(next); return; }
    const previous = current.current;
    if (next === previous.floor && (previous.phase === "hidden" || previous.phase === "fade-in")) return;
    if (previous.phase === "hidden") { commitHidden(); return; }
    if (previous.phase === "fade-out") return;
    if (previous.phase === "idle" && next === previous.floor) {
      publish({ ...previous, viewReset: previous.viewReset + 1, instantReset: false });
      return;
    }
    clearTimeout(timer.current);
    // CSS fades from its current opacity if another choice arrives during fade-in.
    publish({ ...previous, phase: "fade-out" });
    timer.current = setTimeout(commitHidden, FADE.out);
  }, [commitHidden, immediate, publish]);
  const navigate = useCallback((next: FloorId) => {
    if (window.location.hash !== `#${next}`) window.history.pushState(null, "", `#${next}`);
    select(next);
  }, [select]);
  const presented = useCallback((floor: FloorId, reset: number) => {
    const committed = current.current;
    if (committed.phase !== "hidden" || committed.floor !== floor || committed.viewReset !== reset) return;
    clearTimeout(timer.current);
    // Wait for the destination's rendered camera/marker state, not just a timer.
    timer.current = setTimeout(() => {
      publish({ ...current.current, phase: "fade-in" });
      timer.current = setTimeout(() => publish({ ...current.current, phase: "idle" }), FADE.in);
    }, 0);
  }, [publish]);
  useLayoutEffect(() => {
    reduced.current = reducedMotion;
    if (reducedMotion && current.current.phase !== "idle") immediate(destination.current);
  }, [reducedMotion, immediate]);
  useLayoutEffect(() => {
    const onHistory = () => { const next = readFloor(); if (next !== destination.current) select(next); };
    const onVisibility = () => {
      if (document.visibilityState === "hidden" && current.current.phase !== "idle") immediate(destination.current);
    };
    window.addEventListener("hashchange", onHistory);
    window.addEventListener("popstate", onHistory);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearTimeout(timer.current);
      window.removeEventListener("hashchange", onHistory);
      window.removeEventListener("popstate", onHistory);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [select, immediate]);
  return { ...state, settled: state.phase === "idle", navigate, presented };
}
