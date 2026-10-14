import { useEffect, useId, useRef, useState, type Ref } from "react";
import type { ToolId } from "./layouts";

export function LocationMarker({ tool, label, active, anchorRef, hitRef }: { tool: ToolId; label: string; active: boolean; anchorRef: Ref<HTMLDivElement>; hitRef: Ref<HTMLDivElement> }) {
  const gradientId = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [viewBusy, setViewBusy] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const hoverState = useRef(false);
  const busyState = useRef(false);
  const changeHover = (next: boolean) => {
    if (hoverState.current === next) return;
    hoverState.current = next; setHovered(next);
    if (next) setDismissed(false);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const scene = root.current?.closest(".office-scene");
    const refresh = (event: Event) => {
      const { tool: hoveredTool, busy } = (event as CustomEvent<{ tool?: string; busy: boolean }>).detail;
      clearTimeout(closeTimer.current);
      if (busyState.current !== busy) { busyState.current = busy; setViewBusy(busy); }
      const next = !busy && hoveredTool === tool;
      if (hoverState.current !== next) {
        hoverState.current = next; setHovered(next);
        if (next) setDismissed(false);
      }
    };
    scene?.addEventListener("office-view-hover", refresh);
    return () => scene?.removeEventListener("office-view-hover", refresh);
  }, [tool]);
  const open = active && !viewBusy && !dismissed && (hovered || focused);
  return <div ref={root} className="office-tool" data-tool={tool} data-open={open} onPointerEnter={() => { clearTimeout(closeTimer.current); if (root.current?.closest<HTMLElement>(".office-scene")?.dataset.viewBusy !== "true") changeHover(true); }} onPointerLeave={() => { closeTimer.current = setTimeout(() => changeHover(false), 120); }}>
    <div ref={hitRef} className="office-desk-hit" aria-hidden="true" style={{ pointerEvents: active ? "auto" : "none" }} />
    <div ref={anchorRef} className="office-location-anchor">
      <button className="office-location" type="button" aria-label={label} aria-disabled="true" aria-describedby={open ? `${gradientId}-name` : undefined} disabled={!active} onFocus={() => { setFocused(true); setDismissed(false); }} onBlur={() => setFocused(false)} onKeyDown={event => { if (event.key === "Escape") setDismissed(true); }} onClick={event => { event.preventDefault(); event.stopPropagation(); }}>
      <svg viewBox="0 0 40 52" aria-hidden="true" focusable="false">
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#51a2ff" /><stop offset=".5" stopColor="#1461ff" /><stop offset="1" stopColor="#1246e8" /></linearGradient></defs>
        <path fill={`url(#${gradientId})`} d="M20 1C9.5 1 2 8.8 2 18.5c0 12 18 32.5 18 32.5s18-20.5 18-32.5C38 8.8 30.5 1 20 1Z" />
        <circle cx="20" cy="18.5" r="8" fill="white" />
      </svg>
        <span id={`${gradientId}-name`} className="office-tool-name" role="tooltip" hidden={!open}>{label}</span>
      </button>
    </div>
  </div>;
}
