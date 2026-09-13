# Phase 5 — Verification and delivery

Status: not started.

## Deliverable

A complete locally verified homepage revamp, including the actual animation and all preserved content, with concise evidence and no unsupported deployment claim.

## Automated checks

- [ ] Run `npm run test:web`, `npm run lint:web`, and `npm run build:web` from the repository root.
- [ ] Extend the existing `apps/web/src/App.test.tsx` checks only where the revamp introduces meaningful regression risk. Preserve route isolation, home anchors, initial hash focus, paper-group expansion, legal routes, and both tool launch routes.
- [ ] Add focused media lifecycle checks for reduced motion, explicit pause, visibility changes, cleanup, and playback rejection. Unit mocks do not prove browser decoding or smooth playback; verify those in a browser too.
- [ ] Compare all 17 rendered research entries and their expanded copy/links against the baseline. Preserve all tool descriptions/tags and About/footer copy. Avoid tests that merely duplicate CSS or screenshot text.
- [ ] Solver regression tests are needed if solver code or contracts change unexpectedly; otherwise the frontend suite and tool browser smoke are sufficient for this presentation-only scope.

## Browser acceptance

- [ ] Inspect desktop and mobile views at 390, 768, 1280, and 1440 CSS pixels, including both open research groups, long titles, About, footer, and 200% zoom.
- [ ] Check keyboard focus, skip link, disclosure controls, motion toggle, contact, and all navigation links. Check text contrast over the brightest frame, not just the poster.
- [ ] Confirm the central “Explore the tools” line is absent. Check all three translucent card backgrounds over moving and still surfaces, including without backdrop blur; card text and launch links stay fully opaque and readable.
- [ ] Test direct `/#home`, `/#resources`, `/#about`, `/#crr`, and `/#troy-heston` loads, refresh, repeated clicks, and Back/Forward. Confirm headings clear the sticky header and the containing research group opens.
- [ ] Check normal motion, live reduced-motion changes, explicit pause, hidden-tab/offscreen pause, autoplay denial, and failed/slow video loading. Observe multiple loop boundaries in Chromium and another available engine; document any untested browser.
- [ ] Inspect network behavior on a fresh home visit: poster/content appears before video readiness, no solver calls or heavy tool imports, no media downloads on tool/policy routes, and no eager About video load. Check a reduced-motion visit before any cached media hides a download issue.
- [ ] Record actual selected media size, transfer behavior, and layout stability against Phase 2 targets. Home must remain responsive while video plays and while Resources disclosures open.
- [ ] Open Ithaca and Troy, verify their controls/charts render, and return home. If a local solver is available, complete one Ithaca solve; record an unavailable API honestly rather than changing backend scope.

## Handoff and completion

- [ ] Save a few final screenshots next to the Field concepts and record commands, browser coverage, media measurements, and any material limitations in a short validation note.
- [ ] Update `docs/PRODUCT.md` to describe the implemented design and media behavior. Remove completed phase plans and the README plan link after extracting durable information, matching the owner's documentation cleanup preference.
- [ ] Report changed files and the local preview result. Deployment is separate: if subsequently requested, verify a preview through the existing project workflow before production publication.

Stop when the full local result meets these conditions. Do not add another tool, rewrite policies, reopen historical infrastructure tasks, or expand into a site-wide framework migration.
