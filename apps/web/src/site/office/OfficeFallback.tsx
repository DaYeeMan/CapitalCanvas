import homeConcept from "../../../../../docs/design/office-3d/concepts/home-approved.png";
import resourcesConcept from "../../../../../docs/design/office-3d/concepts/resources-approved.png";
import type { FloorId } from "./layouts";
import { useLayoutEffect, useRef } from "react";

export function OfficeFallback({ floor, viewReset = 0, onPresented }: { floor: FloorId; viewReset?: number; onPresented?: (floor: FloorId, reset: number) => void }) {
  const art = useRef<HTMLImageElement>(null);
  const ready = () => { if (!art.current?.closest("canvas")) onPresented?.(floor, viewReset); };
  useLayoutEffect(() => {
    if (art.current?.complete && !art.current.closest("canvas")) onPresented?.(floor, viewReset);
  }, [floor, viewReset, onPresented]);
  return <div className="office-fallback">
    <div className="office-fallback-art"><img ref={art} src={floor === "home" ? homeConcept : resourcesConcept} alt={`Approved ${floor === "home" ? "Home" : "Resources"} office concept showing three marked desk clusters`} onLoad={ready} onError={ready} /></div>
    <p role="status">3D is unavailable. Showing the original office concept; furniture, windows and doors differ from the live scene. Use Home and Resources to switch floors.</p>
    <ul aria-label="Tool desks"><li>Ithaca</li><li>Troy</li><li>Delphi</li></ul>
  </div>;
}
