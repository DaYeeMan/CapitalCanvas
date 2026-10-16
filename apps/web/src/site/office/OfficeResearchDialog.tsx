import { useEffect, useId, useRef } from "react";
import { AsianLatticeContent, TroyMarketMakingContent } from "../ResearchContent";
import { OFFICE_TOOLS } from "./officeTools";
import { officeResearch } from "./officeResearch";
import type { ToolId } from "./layouts";
import "./officeResearch.css";

export function OfficeResearchDialog({ tool, onClose, returnFocus }: { tool: ToolId; onClose: () => void; returnFocus: HTMLElement | null }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const outsidePress = useRef(false);
  const heading = useId();
  const content = officeResearch[tool];
  let index = 0;
  useEffect(() => {
    const node = dialog.current!;
    node.showModal();
    return () => {
      node.close();
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    };
  }, [returnFocus]);
  const outside = (x: number, y: number) => {
    const bounds = dialog.current!.getBoundingClientRect();
    return x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom;
  };
  return <dialog ref={dialog} className="office-research" aria-labelledby={heading}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      event.stopPropagation();
      if (event.key !== "Tab") return;
      const controls = [...event.currentTarget.querySelectorAll<HTMLElement>("button, a[href], summary, [tabindex='0']")].filter(element => element.getClientRects().length > 0);
      const target = event.shiftKey && document.activeElement === controls[0] ? controls.at(-1) : !event.shiftKey && document.activeElement === controls.at(-1) ? controls[0] : null;
      if (target) { event.preventDefault(); target.focus({ preventScroll: true }); }
    }}
    onPointerDown={event => { outsidePress.current = event.target === event.currentTarget && outside(event.clientX, event.clientY); }}
    onClick={event => { if (outsidePress.current && event.target === event.currentTarget && outside(event.clientX, event.clientY)) onClose(); outsidePress.current = false; }}>
    <div className="office-research-titlebar"><span>Research &amp; methods</span>
      <button type="button" className="office-research-close" aria-label="Close research" autoFocus onClick={onClose}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg></button>
    </div>
    <div className="office-research-heading"><h2 id={heading}>{OFFICE_TOOLS[tool].name}</h2><span>{content.count} references</span></div>
    <div className="office-research-scroll" tabIndex={0} role="region" aria-label={`${OFFICE_TOOLS[tool].name} references`}>
      {content.groups.map(group => <section key={group.title} aria-label={group.title}>
        <h3 className="office-research-group">{group.title}</h3>
        {group.entries.map(entry => {
          const number = ++index;
          return <details className="office-research-entry" key={entry.id} open={number === 1 ? true : undefined}>
            <summary><span className="office-research-index">{String(number).padStart(2, "0")}</span><span className="office-research-name">{entry.title}</span><span className="office-research-year">{entry.year}</span><span className="office-research-chevron" aria-hidden="true" /></summary>
            <div className="office-research-body"><p className="office-research-authors">{entry.authors} · {entry.year}</p><p>{entry.summary}</p>
              <div className="office-research-source"><span>{entry.method} · {entry.access}</span><a href={entry.source} target="_blank" rel="noreferrer">Read source <span aria-hidden="true">↗</span><span className="sr-only"> (opens in a new tab)</span></a></div>
            </div>
          </details>;
        })}
      </section>)}
      {content.note && <section aria-label="Implementation"><h3 className="office-research-group">Implementation</h3>
        <details className="office-research-entry"><summary><span className="office-research-index">{String(content.count).padStart(2, "0")}</span><span className="office-research-name">{content.note === "asian" ? "Asian options: a running-average state" : "Quoting, order flow, and inventory"}</span><span className="office-research-year">Implementation note</span><span className="office-research-chevron" aria-hidden="true" /></summary>
          <div className="office-research-body office-research-note">{content.note === "asian" ? <AsianLatticeContent sourceTarget="_blank" /> : <TroyMarketMakingContent />}</div>
        </details>
      </section>}
    </div>
  </dialog>;
}
