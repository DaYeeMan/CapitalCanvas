import type { MouseEvent } from "react";
import { contactEmail, contactHref } from "../siteInfo";
import type { PreviewPage } from "./officePage";
import "./officeChrome.css";

export function OfficeHeader({ active, onNavigate }: { active?: PreviewPage; onNavigate?: (page: PreviewPage) => void }) {
  const follow = (event: MouseEvent<HTMLAnchorElement>, page: PreviewPage) => {
    if (!onNavigate || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(page);
  };
  return <header className="office-header">
    <a className="office-wordmark" href="/" aria-label="Capital Canvas city" onClick={event => follow(event, "city")}><img src="/capital-canvas-logo.png" alt="" width="48" height="48" />Capital Canvas</a>
    <nav aria-label="Office floors">
      {(["home", "resources", "about"] as const).map(page => <a key={page} href={`/#${page}`} aria-current={active === page ? "page" : undefined} onClick={event => follow(event, page)}>{page === "home" ? "Home" : page === "resources" ? "Resources" : "About"}</a>)}
    </nav>
  </header>;
}

export function OfficeFooter({ hidden = false, inert = false }: { hidden?: boolean; inert?: boolean }) {
  return <footer className="office-about-footer" aria-hidden={hidden} inert={inert}><div className="office-about-footer-content">
    <div className="office-about-footer-contact"><p>Emmanuel Zhang</p><a href={contactHref}>{contactEmail}</a></div>
    <nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a><a href="/notices">Attributions</a></nav>
    <p className="office-about-copyright">© {new Date().getFullYear()} CapitalCanvas. Third-party works remain with their respective owners.</p>
  </div></footer>;
}
