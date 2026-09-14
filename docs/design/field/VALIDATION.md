# Field homepage validation

Subsequent owner-requested refinements remove the header motion control, connect launch labels and arrows with one underline, expose more of the Home surface below its text, and horizontally mirror About. The 62 tests, lint, build, and four-width browser checks pass after these refinements. Device reduced-motion handling still works. The results below record the original delivery snapshot; explicit pause-control checks and its screenshots describe that earlier version.

The Field homepage revamp is complete locally. No commit, push, or deployment was performed. This note records validation evidence, not a future implementation plan.

## Result and changed code

`HomePage.tsx`, `SiteLayout.tsx`, and scoped `site.css` provide the hero, three translucent cards, solid research section, animated About section, and solid footer. `FieldBackground.tsx` and `useFieldMotionRestricted.ts` own playback and preference handling; `FieldBackground.test.tsx` covers their lifecycle. Existing research data, shared research content, policies, workbenches, and solver code are unchanged.

Durable behavior is documented in [product context](../../PRODUCT.md). Completed phase plans and their README link were removed. The concepts, content baseline, asset source, and verification evidence remain useful references.

## Checks

- `npm run test:web`: 62 tests passed in 6 files, including existing route/isolation/hash coverage and focused media lifecycle tests.
- `npm run lint:web`: passed.
- `npm run build:web`: passed. The existing lazy Plotly chart chunk still emits a size warning; it is not loaded on Home.
- `git diff --check`: passed.
- [Homepage browser checks](final/checks.json): all hero copy, tool descriptions/tags, all 17 complete research entries and URLs, About, and footer match the baseline. No central “Explore the tools” line; all three cards are translucent with opaque text and no dependence on backdrop blur.
- [Research checks](phase4/checks.json), rerun against the final source: keyboard open/close for both project groups and all 16 Implementation disclosures; all 17 direct anchors expand, focus, and clear the sticky header. Contact and legal links are keyboard reachable.
- Direct Home/Resources/About/CRR/Troy-Heston routes, repeated navigation, and Back/Forward passed. Full loads of all paper URLs passed. Skip-to-content works.
- Desktop/mobile screenshots at 390, 768, 1280, and 1440 pixels are in [final](final/). Expanded research, long titles, About, and footer fit without horizontal scrolling. A CSS zoom of 2 at 1440 pixels also passes; this checks content zoom, not OS scaling.
- Actual video playback, shared pause/resume, offscreen pause, document-visibility events, live and initial reduced motion, data saving, autoplay rejection, aborted media, and stalled media were exercised. Posters keep the interface usable when video cannot play.
- Fresh Home requests contain no solver calls or heavy workbench/chart imports. About has no early video element. Tool and policy views have no decorative media. Initial reduced-motion/data-saving visits make no video request.
- [Playback measurements](final/delivery-checks.json): Edge 153.0.4234.32 crossed two complete loop boundaries, with no media error and 0 dropped frames out of 480. No layout-shift entries were observed during playback. Disclosures and navigation remain responsive.
- Encoded video: 416,138 bytes; observed local transfer: 416,438 bytes. Poster: 26,162 bytes; observed transfer: 26,462 bytes. Both stay below the asset delivery targets. Local dev transfer figures include response overhead and do not predict production caching.
- [Full-resolution contrast](final/contrast.json): every pixel of all 240 decoded 1920 × 1080 frames was checked. Minimum muted-text contrast with 68% navy is 4.953:1; with the exact 72% tool-card fill it is [5.075:1](final/card-contrast.json). The brightest frame is 215. These conservative checks cover the overlays behind copy, including the exact card fill color. Cream headings and cyan controls have greater luminance than the tested muted text.

## Tool smoke and limits

Ithaca and Troy open from their launch links and return to the focused Home anchor. Ithaca controls render. Troy completes its browser simulation and renders charts; screenshots are saved in `final/`.

An Ithaca solve could not be verified. Starting the existing local solver environment fails because Windows Application Control blocks SciPy's `_internal_matfuncs` DLL. No backend or environment repair was attempted within this presentation-only task.

Browser coverage is installed Edge (Chromium). Playwright Firefox and WebKit executables are not installed, so a second engine and Safari playback remain untested. Visibility was exercised through document visibility events and component tests; no physical background-tab or mobile-device test is claimed.

Local review URL used: `http://127.0.0.1:5175/`. Run `npm run dev:web -- --host 127.0.0.1` to reopen the preview; Vite reports the available port. Production publication remains separate.
