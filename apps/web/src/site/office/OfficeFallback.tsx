import homeConcept from "../../../../../docs/design/office-3d/concepts/home-approved.png";
import resourcesConcept from "../../../../../docs/design/office-3d/concepts/resources-approved.png";
import type { FloorId } from "./layouts";

export function OfficeFallback({ floor }: { floor: FloorId }) {
  return <div className="office-fallback">
    <div className="office-fallback-art"><img src={floor === "home" ? homeConcept : resourcesConcept} alt={`Approved ${floor === "home" ? "Home" : "Resources"} office concept showing three marked desk clusters`} /></div>
    <p role="status">3D is unavailable. Showing the office concept. Use Home and Resources to switch floors.</p>
    <ul aria-label="Tool desks"><li>Ithaca</li><li>Troy</li><li>Delphi</li></ul>
  </div>;
}
