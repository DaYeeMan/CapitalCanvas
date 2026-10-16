import { Component, lazy, Suspense, useEffect, type ReactNode } from "react";

const InformationPage = lazy(() => import("./site/InformationPage"));

const IthacaWorkbench = lazy(() => import("./IthacaWorkbench"));
const TroyWorkbench = lazy(() => import("./troy/TroyWorkbench"));
const DelphiWorkbench = lazy(() => import("./delphi/DelphiWorkbench"));
const OfficeSite = lazy(() => import("./site/office/OfficeSite"));
const titles: Record<string, string> = {
  "/": "CapitalCanvas",
  "/tools/ithaca": "Ithaca — CapitalCanvas",
  "/tools/troy": "Troy — CapitalCanvas",
  "/tools/delphi": "Delphi — CapitalCanvas",
  "/notices": "Attributions — CapitalCanvas",
  "/privacy": "Privacy — CapitalCanvas",
  "/terms": "Terms of use — CapitalCanvas",
  "/disclaimer": "Disclaimer — CapitalCanvas",
};

class WorkbenchBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <main className="route-message"><h1>Tool could not load</h1><p>Refresh the page to try again.</p><a href="/#home">Return to CapitalCanvas</a></main>
      : this.props.children;
  }
}

export default function App() {
  // Hash navigation keeps the office scene mounted. Retired preview URLs use
  // the same page and replace their history entry without losing query/hash.
  const requestedPath = window.location.pathname.replace(/\/+$/, "") || "/";
  const path = requestedPath === "/preview/office" ? "/" : requestedPath;
  useEffect(() => {
    if (requestedPath === "/preview/office") window.history.replaceState(window.history.state, "", `/${window.location.search}${window.location.hash}`);
    document.title = titles[path] ?? "Page not found — CapitalCanvas";
    const description = document.querySelector('meta[name="description"]');
    description?.setAttribute("content", path === "/tools/ithaca"
      ? "Explore theoretical option prices with Ithaca, CapitalCanvas's interactive quantitative workbench."
      : path === "/tools/troy" ? "Explore option market making, model misspecification, quoting, and inventory risk with Troy."
      : path === "/tools/delphi" ? "Compare surrogate models on Monte Carlo price and implied-volatility surfaces with Delphi."
      : "CapitalCanvas: educational quantitative tools, transparent assumptions, and research behind the methods.");
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) { robots = document.createElement("meta"); robots.setAttribute("name", "robots"); document.head.appendChild(robots); }
    robots.setAttribute("content", path === "/" || path === "/tools/ithaca" || path === "/tools/troy" || path === "/tools/delphi" ? "index,follow" : "noindex,follow");
  }, [path, requestedPath]);

  if (path === "/tools/delphi") return <WorkbenchBoundary><Suspense fallback={<main className="route-message" aria-busy="true"><p role="status">Loading Delphi…</p><a href="/#home">Return to CapitalCanvas</a></main>}><DelphiWorkbench /></Suspense></WorkbenchBoundary>;
  if (path === "/tools/troy") return <WorkbenchBoundary>
    <Suspense fallback={<main className="route-message" aria-busy="true"><p role="status">Loading Troy…</p><a href="/#home">Return to CapitalCanvas</a></main>}>
      <TroyWorkbench />
    </Suspense>
  </WorkbenchBoundary>;
  if (path === "/tools/ithaca") return <WorkbenchBoundary>
    <Suspense fallback={<main className="route-message" aria-busy="true"><p role="status">Loading Ithaca…</p><a href="/#home">Return to CapitalCanvas</a></main>}>
      <div className="ithaca-workbench"><IthacaWorkbench /></div>
    </Suspense>
  </WorkbenchBoundary>;
  return <Suspense fallback={<main className="route-message" aria-busy="true"><p role="status">{path === "/" ? "Loading office…" : "Loading page…"}</p></main>}>
    {path === "/" ? <OfficeSite /> : <InformationPage path={path} />}
  </Suspense>;
}
