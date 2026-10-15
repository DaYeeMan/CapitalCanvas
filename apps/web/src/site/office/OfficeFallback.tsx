import homeConcept from "../../../../../docs/design/office-3d/concepts/home-approved.png";
import resourcesConcept from "../../../../../docs/design/office-3d/concepts/resources-approved.png";
import type { FloorId } from "./layouts";
import { useLayoutEffect, useRef } from "react";
import cityConcept from "../../../../../docs/design/city-landing/storyboard/01-grounded-city.png";
import type { PreviewView } from "./towerStructure";

export function OfficeFallback({ floor, view = floor, viewReset = 0, onPresented }: { floor: FloorId; view?: PreviewView; viewReset?: number; onPresented?: (floor: FloorId, reset: number) => void }) {
  const art = useRef<HTMLImageElement>(null);
  const ready = () => { if (!art.current?.closest("canvas")) onPresented?.(floor, viewReset); };
  useLayoutEffect(() => {
    if (art.current?.complete && !art.current.closest("canvas")) onPresented?.(floor, viewReset);
  }, [floor, view, viewReset, onPresented]);
  if (view === "city") return <div className="office-fallback office-city-fallback"><img ref={art} src={cityConcept} alt="Grounded District concept with a cream and blue glass tower" onLoad={ready} onError={ready} /><p role="status">3D is unavailable. Showing the district concept.</p></div>;
  return <div className="office-fallback">
    <div className="office-fallback-art"><img ref={art} src={floor === "home" ? homeConcept : resourcesConcept} alt={`Approved ${floor === "home" ? "Home" : "Resources"} office concept showing three marked desk clusters`} onLoad={ready} onError={ready} /></div>
    <p role="status">3D is unavailable. Showing the original office concept; furniture, windows and doors differ from the live scene. Use Home and Resources to switch floors.</p>
    <ul aria-label="Tool desks"><li>Ithaca</li><li>Troy</li><li>Delphi</li></ul>
  </div>;
}
