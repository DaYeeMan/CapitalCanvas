# Phase 1 — Foundation and content

Status: complete. See [foundation and evidence](phase-1-foundation.md).

## Deliverable

Establish the content baseline and responsive visual foundation before changing the homepage composition.

## Work

- [x] Capture the current homepage at desktop and mobile widths, including both expanded research groups. Use local source as the baseline; compare deployed copy if it becomes available rather than silently replacing differences.
- [x] Record all source content and destinations below. The generated `content-reference.txt` is a cross-check, not a runtime data source.
- [x] Set scoped homepage tokens for navy surfaces, cream text, readable muted text, cyan accents, serif headings, gutters, spacing, and fine dividers. Reuse installed fonts and existing CSS variables where appropriate.
- [x] Define responsive composition: restrained header, centered hero without an “Explore the tools” line, three translucent navy tool cards that stack on phones, research rows that stack on phones, and a readable About section. The hero surface continues behind the cards.
- [x] Keep workbench styles isolated. `SiteLayout.tsx` and `site.css` also serve policy pages; use a homepage-specific class for home-only layout and media changes rather than changing every `.site-shell` indiscriminately.

## Content baseline

| Area | Content that must remain |
| --- | --- |
| Navigation | Capital Canvas wordmark; Home, Resources, About; existing anchors and skip link |
| Hero | “Explore pricing and market dynamics”; “Visual tools for understanding financial models” |
| Ithaca | Name, full description, Options / Analytical Pricing / Numerical Pricing tags, Launch Ithaca destination |
| Troy | Name, full description, Market Making / Dynamics / Model Risk tags, Launch Troy destination |
| Third tool | Non-interactive Coming soon state; no invented name or date |
| Ithaca research | Nine papers plus Asian running-average implementation note: 10 entries |
| Troy research | Six papers plus quoting/order-flow/inventory implementation note: 7 entries |
| Each paper | Stable ID, method category, title, authors, year, source URL, access label, full summary, full implementation text |
| About | Full existing paragraph; Emmanuel Zhang; `dymteam23@gmail.com` and mailto link |
| Footer | Capital Canvas; education/research line; Privacy, Terms, Disclaimer, Attributions; dynamic copyright year and ownership sentence |

Read `HomePage.tsx`, `ResearchContent.tsx`, `research.ts`, `troyResearch.ts`, `siteInfo.ts`, `SiteLayout.tsx`, and `SiteNavigation.tsx` under `apps/web/src/site/`. `ResearchContent.tsx` is also used by Ithaca; preserve that shared behavior.

## Completion checks

- [x] All 17 entries and their existing anchor IDs are accounted for, including shared papers with Troy-specific implementation text.
- [x] Decorative preview removal does not remove descriptions, tags, or launch links.
- [x] The layout plan works at 390, 768, 1280, and 1440 CSS pixels without inventing a mobile navigation system.
- [x] Existing route, scroll, focus, and disclosure behavior is recorded for later comparison.

Proceed to the surface asset and homepage implementation once this baseline is established. No separate approval meeting is required for routine layout choices within the selected concept.
