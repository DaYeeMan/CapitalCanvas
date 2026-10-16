import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { FloorId } from "./layouts";
import type { PreviewView } from "./towerStructure";
import { pageScene, readPreviewPage, type PreviewPage } from "./officePage";
import { readResearchTarget, type ResearchTarget } from "./officeResearch";

export type NavigationPhase = "loading" | "moving" | "idle";
interface Navigation { page: PreviewPage; view: PreviewView; origin: PreviewView; viewReset: number; phase: NavigationPhase; research: ResearchTarget | null }
export function useOfficeNavigation(reducedMotion = false, pageVisible = true) {
  const [state, setState] = useState<Navigation>(() => {
    const page = readPreviewPage(), view = pageScene(page);
    return { page, view, origin: view, viewReset: 0, phase: "loading", research: readResearchTarget(window.location.hash) };
  });
  const current = useRef(state);
  const preferences = useRef({ reducedMotion, pageVisible });
  const publish = useCallback((next: Navigation) => { current.current = next; setState(next); }, []);
  const select = useCallback((page: PreviewPage, research: ResearchTarget | null = null) => {
    const value = current.current;
    const view = pageScene(page);
    // Landing and About share the same pending/settled city pose. Changing
    // only its page must not restart a journey or reset city parallax.
    if (value.view === view && (value.page !== page || value.research?.entry !== research?.entry)) { publish({ ...value, page, research }); return; }
    if (value.view === view && (view === "city" || value.phase !== "idle")) return;
    const instant = preferences.current.reducedMotion || !preferences.current.pageVisible || value.view === view;
    publish({ page, view, origin: value.origin, viewReset: value.viewReset + 1, phase: instant ? "loading" : "moving", research });
  }, [publish]);
  const navigate = useCallback((page: PreviewPage) => {
    if (window.location.hash !== `#${page}`) window.history.pushState(null, "", `#${page}`);
    select(page);
  }, [select]);
  const skip = useCallback(() => {
    if (current.current.phase === "moving") publish({ ...current.current, phase: "loading" });
  }, [publish]);
  const dismissResearch = useCallback(() => {
    if (!current.current.research) return;
    window.history.replaceState(window.history.state, "", "#resources");
    publish({ ...current.current, research: null });
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
      const page = readPreviewPage();
      if (window.location.hash && !readResearchTarget(window.location.hash) && !["#city", "#home", "#resources", "#about"].includes(window.location.hash)) window.history.replaceState(null, "", "#city");
      return page;
    };
    normalize();
    const history = () => {
      const page = normalize();
      const research = readResearchTarget(window.location.hash);
      if (page !== current.current.page || research?.entry !== current.current.research?.entry) select(page, research);
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
    settled: state.phase === "idle", instantReset: true, navigate, presented, skip, dismissResearch };
}
