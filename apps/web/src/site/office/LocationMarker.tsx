import { useEffect, useId, useLayoutEffect, useRef, useState, type Ref } from "react";
import type { FloorId, ToolId } from "./layouts";
import { OFFICE_TOOLS, officeToolDestination } from "./officeTools";

export function LocationMarker({ tool, label, floor = "home", active, anchorRef, hitRef }: { tool: ToolId; label: string; floor?: FloorId; active: boolean; anchorRef: Ref<HTMLDivElement>; hitRef: Ref<HTMLDivElement> }) {
  const id = useId();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [viewBusy, setViewBusy] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const hoverState = useRef(false);
  const busyState = useRef(false);
  const claimPanel = () => root.current?.closest(".office-scene")?.dispatchEvent(new CustomEvent("office-tool-intent", { detail: tool }));
  const changeHover = (next: boolean) => {
    if (hoverState.current === next) return;
    hoverState.current = next; setHovered(next);
    if (next) { claimPanel(); setDismissed(false); }
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    const scene = root.current?.closest(".office-scene");
    const claim = (event: Event) => {
      if ((event as CustomEvent<string>).detail === tool) return;
      hoverState.current = false; setHovered(false); setFocused(false); setDismissed(true);
    };
    const refresh = (event: Event) => {
      const { tool: hoveredTool, busy } = (event as CustomEvent<{ tool?: string; busy: boolean }>).detail;
      clearTimeout(closeTimer.current);
      if (busyState.current !== busy) {
        busyState.current = busy; setViewBusy(busy);
        if (busy) { setFocused(false); setDismissed(true); }
      }
      const next = !busy && hoveredTool === tool;
      if (hoverState.current !== next) {
        hoverState.current = next; setHovered(next);
        if (next) { scene?.dispatchEvent(new CustomEvent("office-tool-intent", { detail: tool })); setDismissed(false); }
      }
    };
    scene?.addEventListener("office-view-hover", refresh);
    scene?.addEventListener("office-tool-intent", claim);
    return () => { scene?.removeEventListener("office-view-hover", refresh); scene?.removeEventListener("office-tool-intent", claim); };
  }, [tool]);
  const open = active && !viewBusy && !dismissed && (hovered || focused);
  useLayoutEffect(() => {
    root.current?.closest(".office-scene")?.dispatchEvent(new Event("office-panel-layout"));
  }, [open]);
  return <div ref={root} className="office-tool" data-tool={tool} data-open={open}
    onPointerEnter={() => { clearTimeout(closeTimer.current); if (root.current?.closest<HTMLElement>(".office-scene")?.dataset.viewBusy !== "true") changeHover(true); }}
    onPointerLeave={() => { closeTimer.current = setTimeout(() => changeHover(false), 160); }}
    onFocus={() => { claimPanel(); setFocused(true); setDismissed(false); }}
    onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
    onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); trigger.current?.focus(); setDismissed(true); } }}>
    <div ref={hitRef} className="office-desk-hit" aria-hidden="true" style={{ pointerEvents: active ? "auto" : "none" }} />
    <div ref={anchorRef} className="office-location-anchor">
      <button ref={trigger} className="office-location" type="button" aria-label={label} aria-expanded={open} aria-controls={id + "-panel"} disabled={!active}
        onClick={event => { event.stopPropagation(); claimPanel(); setDismissed(false); setFocused(true); trigger.current?.focus(); }}>
        <svg viewBox="0 0 40 40" aria-hidden="true" focusable="false"><path d="M20 8 32 20 20 32 8 20Z" /><circle cx="20" cy="20" r="3" /></svg>
      </button>
      <section id={id + "-panel"} className="office-tool-panel" aria-label={label + " details"} hidden={!open} inert={!open} aria-hidden={!open}>
        <h2>{label}</h2>
        <p>{OFFICE_TOOLS[tool].description}</p>
        <a href={officeToolDestination(tool, floor)}>{floor === "resources" ? "Read research" : "Open tool"}<span aria-hidden="true">→</span></a>
      </section>
    </div>
  </div>;
}
