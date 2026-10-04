import type { ReactNode } from "react";
import { SiteNavigation, type HomeSection } from "./SiteNavigation";

export function SiteLayout({ children, active, home = false }: { children: ReactNode; active?: HomeSection; home?: boolean }) {
  return <div className={home ? "site-shell field-home" : "site-shell"}>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className="site-header">
      {home
        ? <a className="site-logo" href="/#home" aria-label="Capital Canvas home"><img src="/capital-canvas-logo.png" alt="" width={64} height={64} /><span className="site-wordmark">Capital Canvas</span></a>
        : <a className="site-wordmark" href="/#home">Capital Canvas</a>}
      <SiteNavigation active={active} />
    </header>
    <main id="main-content" tabIndex={-1} className="site-content">{children}</main>
    <footer className="site-footer">
      <div className="footer-brand"><a className="site-wordmark" href="/#home">Capital Canvas</a><p>For education and research.</p></div>
      <div className="footer-links"><nav aria-label="Legal"><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/disclaimer">Disclaimer</a><a href="/notices">Attributions</a></nav></div>
      <p className="copyright">© {new Date().getFullYear()} CapitalCanvas. Third-party works remain with their respective owners.</p>
    </footer>
  </div>;
}
