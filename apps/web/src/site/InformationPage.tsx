import { useEffect } from "react";
import { OfficeHeader, OfficeFooter } from "./office/OfficeChrome";
import "./information.css";
import notices from "./notices.json";

const pages: Record<string, { title: string; sections: [string, string][] }> = {
  "/privacy": { title: "Privacy", sections: [
    ["Calculations", "Ithaca and Delphi send model inputs to the solver service; Delphi also sends its numerical reference. Troy runs in your browser. Inputs and results stay in application memory, with no accounts or saved calculation history. Do not enter personal or confidential information."],
    ["Hosting", "Vercel hosts the site and may process IP addresses and request metadata for delivery, security, and diagnostics. Application logs record request metadata, not calculation bodies. The application adds no advertising or analytics trackers. Vercel controls infrastructure-log retention."],
    ["Contact", "If you email the project, Gmail processes your address and message. Correspondence stays in the mailbox until deleted. Use the contact below for privacy questions or to request deletion of your correspondence."]
  ] },
  "/notices": { title: "Attributions", sections: [] },
};

export default function InformationPage({ path }: { path: string }) {
  const page = pages[path];
  useEffect(() => { document.getElementById("page-title")?.focus({ preventScroll: true }); }, [path]);
  return <div className="office-theme information-site">
    <a className="skip-link" href="#main-content">Skip to content</a>
    <OfficeHeader />
    <main id="main-content" tabIndex={-1} className="information-content"><section className="information-page">
    <span className="policy-date">{page ? "Updated October 31, 2026" : "404"}</span>
    <h1 id="page-title" tabIndex={-1}>{page?.title ?? "Page not found"}</h1>
    {page ? <>
      {page.sections.map(([heading, body]) => <section key={heading}><h2>{heading}</h2><p>{body}</p></section>)}
      {path === "/privacy" && <p>Provider notices: <a href="https://vercel.com/legal/privacy-notice">Vercel</a> · <a href="https://policies.google.com/privacy">Google</a>.</p>}
      {path === "/notices" && <>
        <section><h2>Office characters</h2>
          <p><a href="https://poly.pizza/m/JFrLIKqvCH">Business Man</a> (<a href="https://creativecommons.org/publicdomain/zero/1.0/">CC0 1.0</a>) and <a href="https://poly.pizza/m/sOUciDsoVV">Suit</a> (<a href="https://creativecommons.org/licenses/by/3.0/">CC BY 3.0</a>) by Quaternius.</p>
          <p>Modified for CapitalCanvas with office colors, adjusted proportions, and adapted poses and animations. The modified Suit remains under CC BY 3.0. No endorsement is implied. <a href="/office/people/CREDITS.md">Full character credits and modifications</a>.</p>
        </section>
        <section><h2>Software and fonts</h2><p>Third-party copyright notices and licenses are preserved below.</p>
          <details className="license-entry"><summary>View software and font licenses</summary>
            {notices.map(notice => <details className="license-entry" key={`${notice.name}@${notice.version}`}><summary>{notice.name} {notice.version}</summary><pre>{notice.text}</pre></details>)}
          </details>
        </section>
      </>}
    </> : <p>This page is not available. Return to CapitalCanvas to explore the tools and research.</p>}
    {!page && <a href="/#home">Return home</a>}
    </section></main>
    <OfficeFooter />
  </div>;
}
