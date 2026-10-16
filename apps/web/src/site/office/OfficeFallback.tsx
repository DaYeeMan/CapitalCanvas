import { TOOLS, type FloorId, type ToolId } from "./layouts";
import { officeToolDestination } from "./officeTools";
import { useLayoutEffect, useRef } from "react";
import type { PreviewView } from "./towerStructure";

export function OfficeFallback({ floor, view = floor, viewReset = 0, onPresented, onUnavailable, onReadResearch }: { floor: FloorId; view?: PreviewView; viewReset?: number; onPresented?: (floor: FloorId, reset: number) => void; onUnavailable?: () => void; onReadResearch?: (tool: ToolId, returnFocus: HTMLElement | null) => void }) {
  const art = useRef<HTMLImageElement>(null);
  const ready = () => { if (!art.current?.closest("canvas")) onPresented?.(floor, viewReset); };
  useLayoutEffect(() => {
    if (art.current?.closest("canvas")) return;
    onUnavailable?.();
    if (art.current?.complete) onPresented?.(floor, viewReset);
  }, [floor, view, viewReset, onPresented, onUnavailable]);
  if (view === "city") return <div className="office-fallback office-city-fallback"><img ref={art} src="/office/fallback-city.jpg" alt="Grounded District with a cream and blue glass tower" onLoad={ready} onError={ready} /><div className="office-fallback-notice"><p role="status">3D is unavailable. Showing a still of the district.</p></div></div>;
  return <div className="office-fallback">
    <img ref={art} src={`/office/fallback-${floor}.jpg`} alt={`${floor === "home" ? "Home" : "Resources"} office above the lower tower facade`} onLoad={ready} onError={ready} />
    <div className="office-fallback-notice"><p role="status">3D is unavailable. Showing a still of this floor. Use Home and Resources to switch floors.</p>
      <ul aria-label="Tool desks">{TOOLS.map(name => <li key={name}>{floor === "resources" && onReadResearch ? <button type="button" onClick={event => onReadResearch(name.toLowerCase() as ToolId, event.currentTarget)}>{name}<span className="sr-only"> — Read research</span></button> : <a href={officeToolDestination(name.toLowerCase() as ToolId, floor)}>{name}<span className="sr-only"> — {floor === "resources" ? "Read research" : "Open tool"}</span></a>}</li>)}</ul>
    </div>
  </div>;
}
