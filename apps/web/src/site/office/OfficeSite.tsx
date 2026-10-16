import { Component, lazy, Suspense, useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { FLOORS, type FloorId, type ToolId } from "./layouts";
import { OfficeResearchDialog } from "./OfficeResearchDialog";
import { OfficeFallback } from "./OfficeFallback";
import { useReducedMotion, usePageVisible } from "./motion";
import { useOfficeNavigation } from "./useOfficeNavigation";
import type { PreviewView } from "./towerStructure";
import { OfficeHeader, OfficeFooter } from "./OfficeChrome";
import { useOfficePageBlend } from "./officePage";
import "./office.css";

const OfficeCanvas = lazy(() => import("./OfficeCanvas"));
class SceneBoundary extends Component<{ floor: FloorId; view: PreviewView; viewReset: number; onPresented: (floor: FloorId, reset: number) => void; onUnavailable: () => void; onReadResearch: (tool: ToolId, returnFocus: HTMLElement | null) => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <OfficeFallback floor={this.props.floor} view={this.props.view} viewReset={this.props.viewReset} onPresented={this.props.onPresented} onUnavailable={this.props.onUnavailable} onReadResearch={this.props.onReadResearch} /> : this.props.children; }
}

export default function OfficeSite() {
  const reducedMotion = useReducedMotion();
  const visible = usePageVisible();
  const { page, view, origin, floor, phase, settled, navigate, viewReset, instantReset, presented, skip, research, dismissResearch } = useOfficeNavigation(reducedMotion, visible);
  const root = useRef<HTMLDivElement>(null);
  const about = page === "about", landing = page === "city";
  const aboutBlend = useOfficePageBlend(about, reducedMotion || !visible || phase === "loading", root);
  const [unavailable, setUnavailable] = useState(false);
  const [researchWindow, setResearchWindow] = useState<{ tool: ToolId; returnFocus: HTMLElement | null; viewReset: number } | null>(null);
  const readResearch = useCallback((tool: ToolId, returnFocus: HTMLElement | null) => setResearchWindow({ tool, returnFocus, viewReset }), [viewReset]);
  const closeResearch = useCallback(() => { setResearchWindow(null); dismissResearch(); }, [dismissResearch]);
  const sceneUnavailable = useCallback(() => setUnavailable(true), []);
  const city = view === "city";
  const officeChrome = !city || origin !== "city";
  const activeResearch = research ?? (researchWindow?.viewReset === viewReset ? researchWindow : null);
  useLayoutEffect(() => {
    if (phase === "moving") return;
    root.current?.style.setProperty("--city-presence", city ? "1" : "0");
    root.current?.style.setProperty("--city-copy-reveal", city ? "1" : "0");
    if (settled && viewReset > 0) document.getElementById("office-main")?.focus({ preventScroll: true });
  }, [phase, city, settled, viewReset, page]);
  return <div ref={root} className="office-theme office-preview" data-page={page} data-view={view} data-floor={floor} data-traveling={!settled} data-phase={phase} data-city-idle={city && settled} data-renderer={unavailable ? "static" : "3d"}>
    <a className="office-skip" href="#office-main" onClick={event => { event.preventDefault(); document.getElementById("office-main")?.focus(); }}>Skip to office</a>
    <OfficeHeader active={page} onNavigate={navigate} />
    <main id="office-main" className="office-stage" tabIndex={0} aria-label={about ? "About Capital Canvas" : city ? "CapitalCanvas district" : "Office floors"} aria-describedby="office-instructions" aria-busy={!settled}>
      {!city && <h1 className="sr-only">{FLOORS[floor].title}</h1>}
      <p className="sr-only" role="status">{phase === "moving" ? `Travelling to ${about ? "About Capital Canvas" : city ? "the district" : FLOORS[floor].title}. Press Escape to skip animation.` : settled ? about ? "About Capital Canvas ready" : city ? "District ready" : `${FLOORS[floor].title} ready` : "Loading scene"}</p>
      <p id="office-instructions" className="sr-only">{about ? "Use Home or Resources to enter a floor. The logo returns to the landing page. Contact and legal links are below." : unavailable ? "Use the entry button, Home, Resources and About to view the pages. The logo returns to the district." : city ? "Enter CapitalCanvas using the button or the main tower, or select About to read about the project." : "Use Home and Resources to switch floors, or About to return to the city and read about the project. In the office, scroll or pinch to zoom and drag to pan. On touch screens, drag with one finger and pinch with two. With the office focused, use plus or minus to zoom, arrow keys to pan, and zero to reset. Hover, tap or focus a marked desk to discover a tool. Tab into the panel to open the tool or read its research. The Back to city link returns to the district."}</p>
      <SceneBoundary floor={floor} view={view} viewReset={viewReset} onPresented={presented} onUnavailable={sceneUnavailable} onReadResearch={readResearch}>
        <Suspense fallback={null}><OfficeCanvas view={view} origin={origin} overview={false} floor={floor} phase={phase} settled={settled} animate={visible && !reducedMotion && !city} pageVisible={visible} reducedMotion={reducedMotion} viewReset={viewReset} instantReset={instantReset} aboutBlend={aboutBlend} onPresented={presented} onUnavailable={sceneUnavailable} onEnter={() => navigate("home")} onReadResearch={readResearch} /></Suspense>
      </SceneBoundary>
      {phase === "loading" && <p className="office-loading" aria-hidden="true">Preparing the studio&#8230;</p>}
      <div className="office-city-copy" aria-hidden={!landing} inert={!landing || !settled}><div className="office-landing-content">
        <h1>A Different<br />Perspective</h1>
        <p>Visual tools for understanding<br />financial models</p>
        <button className="office-enter" onClick={() => navigate("home")}>Enter Capital Canvas <span aria-hidden="true">⟶</span></button>
      </div></div>
      <section className="office-about-copy" aria-labelledby="office-about-title" aria-hidden={!about} inert={!about || !settled}><div className="office-about-content">
        <h1 id="office-about-title">About<br />Capital Canvas</h1>
        <p>I built Capital Canvas to make financial models easier to understand through visualization and experimentation. My goal is to help people build intuition for pricing models and market dynamics, whether you're new to quantitative finance or already have experience in the field.</p>
      </div></section>
    </main>
    <OfficeFooter hidden={!about} inert={!about || !settled} />
    {officeChrome && <a className="office-back" href="#city" inert={city || !settled} aria-hidden={city || !settled} onClick={event => { event.preventDefault(); navigate("city"); }}><span aria-hidden="true">←</span> Back to city</a>}
    {phase === "moving" && <button className="office-skip-animation" onClick={skip}>Skip animation</button>}
    {activeResearch && view === "resources" && settled && <OfficeResearchDialog key={activeResearch.tool + (research?.entry ?? "")} tool={activeResearch.tool} initialEntry={research?.entry} returnFocus={research ? null : researchWindow?.returnFocus ?? null} onClose={closeResearch} />}
  </div>;
}
