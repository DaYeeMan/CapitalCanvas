import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FloorId } from "./layouts";
import { readPreviewView, type PreviewView } from "./towerStructure";

export type NavigationPhase = "loading" | "moving" | "idle";
interface Navigation { view: PreviewView; origin: PreviewView; viewReset: number; phase: NavigationPhase }
export function useOfficeNavigation(reducedMotion = false, pageVisible = true) {
  const [state, setState] = useState<Navigation>(() => {
    const view = readPreviewView();
    return { view, origin: view, viewReset: 0, phase: "loading" };
  });
  const current = useRef(state);
  const preferences = useRef({ reducedMotion, pageVisible });
  const publish = useCallback((next: Navigation) => { current.current = next; setState(next); }, []);
  const select = useCallback((view: PreviewView) => {
    const value = current.current;
    if (value.view === view && (view === "city" || value.phase !== "idle")) return;
    const instant = preferences.current.reducedMotion || !preferences.current.pageVisible || value.view === view;
    publish({ view, origin: value.origin, viewReset: value.viewReset + 1, phase: instant ? "loading" : "moving" });
  }, [publish]);
  const navigate = useCallback((view: PreviewView) => {
    if (window.location.hash !== `#${view}`) window.history.pushState(null, "", `#${view}`);
    select(view);
  }, [select]);
  const skip = useCallback(() => {
    if (current.current.phase === "moving") publish({ ...current.current, phase: "loading" });
  }, [publish]);
  const presented = useCallback((floor: FloorId, reset: number) => {
    const value = current.current;
    const expected = value.view === "resources" ? "resources" : "home";
    if (value.phase !== "idle" && floor === expected && reset === value.viewReset) {
      publish({ ...value, origin: value.view, phase: "idle" });
    }
  }, [publish]);
  useLayoutEffect(() => {
    preferences.current = { reducedMotion, pageVisible };
    if (reducedMotion || !pageVisible) skip();
  }, [reducedMotion, pageVisible, skip]);
  useLayoutEffect(() => {
    const normalize = () => {
      const view = readPreviewView();
      if (window.location.hash && !["#city", "#home", "#resources"].includes(window.location.hash)) window.history.replaceState(null, "", "#city");
      return view;
    };
    normalize();
    const history = () => {
      const view = normalize();
      if (view !== current.current.view) select(view);
    };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") skip(); };
    window.addEventListener("hashchange", history); window.addEventListener("popstate", history);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("hashchange", history); window.removeEventListener("popstate", history);
      window.removeEventListener("keydown", key);
    };
  }, [select, skip]);
  return { ...state, floor: (state.view === "resources" ? "resources" : "home") as FloorId,
    settled: state.phase === "idle", instantReset: true, navigate, presented, skip };
}
