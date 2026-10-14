import { Component, lazy, Suspense, type ReactNode } from "react";
import { FLOORS, type FloorId } from "./layouts";
import { OfficeFallback } from "./OfficeFallback";
import { useReducedMotion, usePageVisible } from "./motion";
import { useOfficeNavigation } from "./useOfficeNavigation";
import "./office.css";

const OfficeCanvas = lazy(() => import("./OfficeCanvas"));
class SceneBoundary extends Component<{ floor: FloorId; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <OfficeFallback floor={this.props.floor} /> : this.props.children; }
}

export default function OfficePreview() {
  const reducedMotion = useReducedMotion();
  const visible = usePageVisible();
  const { progress, floor, settled, navigate, viewReset } = useOfficeNavigation(reducedMotion);
  return <div className="office-preview" data-floor={floor} data-traveling={!settled}>
    <a className="office-skip" href="#office-main" onClick={event => { event.preventDefault(); document.getElementById("office-main")?.focus(); }}>Skip to office</a>
    <header className="office-header">
      <a className="office-wordmark" href="#home" aria-label="CapitalCanvas preview home" onClick={event => { event.preventDefault(); navigate("home"); }}>CapitalCanvas</a>
      <nav aria-label="Office floors">
        <a href="#home" aria-current={floor === "home" ? "page" : undefined} onClick={event => { event.preventDefault(); navigate("home"); }}>Home</a>
        <a href="#resources" aria-current={floor === "resources" ? "page" : undefined} onClick={event => { event.preventDefault(); navigate("resources"); }}>Resources</a>
        <span>About</span>
      </nav>
    </header>
    <main id="office-main" className="office-stage" tabIndex={0} aria-label="Office floors" aria-describedby="office-instructions">
      <h1 className="sr-only">{FLOORS[floor].title}</h1>
      <p id="office-instructions" className="sr-only">Use Home and Resources to switch floors. When 3D is available, scroll to zoom and drag to pan. With the office focused, use plus or minus to zoom, arrow keys to pan, and zero to reset. Hover or focus a marked desk to reveal its tool name. Desk activation is not enabled.</p>
      <SceneBoundary floor={floor}>
        <Suspense fallback={<p className="office-loading" role="status">Loading office&#8230;</p>}><OfficeCanvas floor={floor} progress={progress} settled={settled} animate={visible && !reducedMotion} pageVisible={visible} reducedMotion={reducedMotion} viewReset={viewReset} /></Suspense>
      </SceneBoundary>
    </main>
  </div>;
}
