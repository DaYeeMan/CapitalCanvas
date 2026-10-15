import type { FloorId } from "./layouts";
import { useLayoutEffect, useRef } from "react";
import type { PreviewView } from "./towerStructure";

export function OfficeFallback({ floor, view = floor, viewReset = 0, onPresented, onUnavailable }: { floor: FloorId; view?: PreviewView; viewReset?: number; onPresented?: (floor: FloorId, reset: number) => void; onUnavailable?: () => void }) {
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
      <ul aria-label="Tool desks"><li>Ithaca</li><li>Troy</li><li>Delphi</li></ul>
    </div>
  </div>;
}
