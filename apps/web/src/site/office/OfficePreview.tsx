import { Component, lazy, Suspense, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FLOORS, type FloorId } from "./layouts";
import { OfficeFallback } from "./OfficeFallback";
import { useReducedMotion, usePageVisible } from "./motion";
import { useOfficeNavigation } from "./useOfficeNavigation";
import { INTERVENING_STOREYS, type PreviewView } from "./towerStructure";
import "./office.css";

const OfficeCanvas = lazy(() => import("./OfficeCanvas"));
class SceneBoundary extends Component<{ floor: FloorId; view: PreviewView; viewReset: number; onPresented: (floor: FloorId, reset: number) => void; onUnavailable: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <OfficeFallback floor={this.props.floor} view={this.props.view} viewReset={this.props.viewReset} onPresented={this.props.onPresented} onUnavailable={this.props.onUnavailable} /> : this.props.children; }
}

export default function OfficePreview() {
  const reducedMotion = useReducedMotion();
  const visible = usePageVisible();
  const { view, origin, floor, phase, settled, navigate, viewReset, instantReset, presented, skip } = useOfficeNavigation(reducedMotion, visible);
  const root = useRef<HTMLDivElement>(null);
  const [unavailable, setUnavailable] = useState(false);
  const sceneUnavailable = useCallback(() => setUnavailable(true), []);
  const [overviewReset, setOverviewReset] = useState<number | null>(null);
  const overview = overviewReset === viewReset && view !== "city" && settled;
  const city = view === "city";
  useLayoutEffect(() => {
    if (phase === "moving") return;
    root.current?.style.setProperty("--city-presence", city ? "1" : "0");
    if (settled && viewReset > 0) document.getElementById("office-main")?.focus({ preventScroll: true });
  }, [phase, city, settled, viewReset]);
  return <div ref={root} className="office-preview" data-view={view} data-floor={floor} data-overview={overview} data-traveling={!settled} data-phase={phase} data-city-idle={city && settled} data-renderer={unavailable ? "static" : "3d"}>
    <a className="office-skip" href="#office-main" onClick={event => { event.preventDefault(); document.getElementById("office-main")?.focus(); }}>Skip to office</a>
    <header className="office-header">
      <a className="office-wordmark" href="#city" aria-label="CapitalCanvas preview city" onClick={event => { event.preventDefault(); navigate("city"); }}><img src="/office/capital-canvas-logo-navy.png" alt="" width="64" height="64" />CapitalCanvas</a>
      <nav aria-label="Office floors" aria-hidden={city && phase !== "moving"} inert={city && phase !== "moving"} hidden={city && phase !== "moving"}>
        <a href="#home" aria-current={!city && floor === "home" ? "page" : undefined} onClick={event => { event.preventDefault(); navigate("home"); }}>Home</a>
        <a href="#resources" aria-current={!city && floor === "resources" ? "page" : undefined} onClick={event => { event.preventDefault(); navigate("resources"); }}>Resources</a>
        <span>About</span>
      </nav>
    </header>
    <main id="office-main" className="office-stage" tabIndex={0} aria-label={city ? "CapitalCanvas district" : "Office floors"} aria-describedby="office-instructions" aria-busy={!settled}>
      {!city && <h1 className="sr-only">{FLOORS[floor].title}</h1>}
      <p className="sr-only" role="status">{phase === "moving" ? `Travelling to ${city ? "the district" : FLOORS[floor].title}. Press Escape to skip animation.` : settled ? city ? "District ready" : `${FLOORS[floor].title} ready` : "Loading scene"}</p>
      <p id="office-instructions" className="sr-only">{unavailable ? "Use the entry button, Home and Resources to view the district and office stills. The logo returns to the district." : city ? "Enter CapitalCanvas using the button or the main tower." : "Use Home and Resources to switch floors. View whole tower to inspect the building structure. In the office, scroll to zoom and drag to pan. With the office focused, use plus or minus to zoom, arrow keys to pan, and zero to reset. Hover or focus a marked desk to reveal its tool name. Desk activation is not enabled."}</p>
      <SceneBoundary floor={floor} view={view} viewReset={viewReset} onPresented={presented} onUnavailable={sceneUnavailable}>
        <Suspense fallback={<p className="office-loading" role="status">Loading office&#8230;</p>}><OfficeCanvas view={view} origin={origin} overview={overview} floor={floor} phase={phase} settled={settled} animate={visible && !reducedMotion && !city} pageVisible={visible} reducedMotion={reducedMotion} viewReset={viewReset} instantReset={instantReset} onPresented={presented} onUnavailable={sceneUnavailable} onEnter={() => navigate("home")} /></Suspense>
      </SceneBoundary>
      <div className="office-city-copy" aria-hidden={!city} inert={!city || phase === "moving"}>
        <h1>Explore pricing and<br />market dynamics</h1>
        <p>Visual tools for understanding financial models</p>
        <button className="office-enter" onClick={() => navigate("home")}>Enter CapitalCanvas <span aria-hidden="true">⟶</span></button>
      </div>
    </main>
    {phase === "moving" && <button className="office-skip-animation" onClick={skip}>Skip animation</button>}
    {!city && settled && !unavailable && <aside className="office-structure-controls" aria-label="Tower inspection">
      {overview && <p>{INTERVENING_STOREYS} closed storeys between Home and Resources</p>}
      <button aria-pressed={overview} onClick={() => setOverviewReset(overview ? null : viewReset)}>{overview ? "Return to office" : "View whole tower"}</button>
    </aside>}
  </div>;
}
