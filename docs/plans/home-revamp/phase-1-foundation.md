# Phase 1 foundation and evidence

Phase 1 is complete. This is the content and style foundation, not the finished Field layout. Phases 2–4 still own animation, hero/cards, and lower-page presentation.

## Implemented boundary

`HomePage.tsx` opts into `SiteLayout`'s `home` flag. Only that instance receives `.field-home`; policy pages continue using `.site-shell` alone. The new `.site-shell.field-home` rule in `site.css` defines the homepage tokens. No route, content, research component, solver, dependency, or workbench behavior changed.

| Token | Value / purpose |
| --- | --- |
| `--site-serif` | Reuses global Georgia/system serif stack |
| `--site-bg` | Reuses global navy `--bg` (`#03101d`) |
| `--site-muted` | Reuses global `--muted` (`#a8b4bd`) |
| `--field-text` | Cream `#f3eadb` |
| `--field-accent` | Existing `--cyan-soft` |
| `--field-border` | Blue-gray `#334452` |
| `--field-card-bg` | Navy `rgb(6 23 37 / 72%)`; starting tint, subject to brightest-frame contrast checks |
| `--field-content-max` | 1440 px |
| `--field-reading-max` | 760 px |
| `--field-section-space` | 56–112 px, fluid |
| `--field-card-gap` | 16–24 px, fluid |
| `--field-radius` | 6 px |

Existing site gutter sizing remains in use. The new card and spacing tokens establish values for later phases; those layout rules are not applied yet. The currently visible change is the homepage's base palette and serif stack. Existing illustrations and large cards remain until Phase 3.

## Responsive composition for implementation

| Width | Header and hero | Tool cards | Resources and About |
| --- | --- | --- | --- |
| 390 px | Existing stacked wordmark/navigation; 24 px gutters; centered wrapping headline | One column, full available width; no fixed card height | Single-column research rows; reading text fits viewport |
| 768 px | Stacked navigation; approximately 36 px gutters; fluid headline | One column to preserve full descriptions and tags | Stacked research metadata; bounded About copy |
| 1280 px | Wordmark left, navigation right; approximately 61 px gutters | Three equal columns with approximately 24 px gaps | Narrow method column plus flexible citation body |
| 1440 px | Same desktop arrangement; approximately 68 px gutters | Three equal columns; approximately 419 px each with 24 px gaps | Same reading hierarchy; About text capped at 760 px |

Use a content-driven breakpoint around 1024 px for the three-card row in Phase 3. Keep natural page height and wrapping tags. The media region extends from the hero behind every translucent card, including Coming soon. It ends before the solid Resources section. There is no “Explore the tools” line, arrow, or replacement central CTA. Mobile keeps all copy and controls; no new navigation system is needed.

These are implementation dimensions, not a claim that the future layout is already rendered. Current baseline and foundation both fit all four widths without horizontal overflow; final layout fidelity is checked in its owning phases.

## Exact content baseline

[Content inventory](../../design/field/baseline/content-inventory.json) was captured from the rendered DOM before edits. It contains the headline/subtitle, all three tool entries and destinations, every research entry's full text and links, About/footer text, navigation/contact/legal destinations, and every disclosure's default state. Post-change extraction matched it exactly, including hidden disclosure text.

Ithaca IDs: `black-scholes`, `crr`, `crank-nicolson`, `monte-carlo`, `psor`, `longstaff-schwartz`, `reiner-rubinstein`, `brownian-bridge`, `asian-control-variate`, `asian-lattice`.

Troy IDs: `troy-black-scholes`, `troy-crr`, `troy-monte-carlo`, `troy-heston`, `troy-merton`, `troy-variance-simulation`, `troy-market-making`.

All 17 entries, full source links, summaries, and implementation notes are retained. The two tool launch destinations and all six tags are unchanged. Current source remains authoritative; the inventory is regression evidence rather than new runtime data. No decorative preview was removed in this phase.

## Behavior baseline and validation

Flow under test: home loads, users open research groups and follow home/paper anchors, and content and focus appear in the expected section without loading a workbench.

Environment: `http://127.0.0.1:5173/`, bundled Playwright driving installed Edge headlessly. Browser plugin was unavailable; Playwright's bundled browser binary was missing, so the installed Edge channel was used without installing dependencies. Both runs used reduced-motion emulation for deterministic anchor checks.

- [Before checks](../../design/field/baseline/before-checks.json) and [after checks](../../design/field/baseline/after-checks.json) record all four widths, content count, anchor focus, and scope isolation.
- Direct Home, Resources, About, CRR, and Troy Heston anchors focus the target. Paper anchors open their containing group.
- Resources then About then Back/Forward restores section focus. Repeated About navigation keeps the correct target. Returning from Privacy to Resources works.
- Both project disclosures open through their real summary controls. Initial disclosures remain collapsed. Scroll/focus handlers were not edited.
- No console warnings/errors, page errors, blank screen, or framework error overlay appeared. No solver calls, workbench imports, Plotly, or KaTeX requests occurred during home/policy checks.
- `npm run test:web`: 54 tests passed. `npm run lint:web`: passed. `npm run build:web`: passed, with a warning about the large lazy chart chunk; this phase does not change chart bundling.

## Screenshots and design comparison

| Evidence | Desktop | Mobile |
| --- | --- | --- |
| Before, first viewport | [1440](../../design/field/baseline/before-1440-home.png) | [390](../../design/field/baseline/before-390-home.png) |
| After foundation, first viewport | [1440](../../design/field/baseline/after-1440-home.png) | [390](../../design/field/baseline/after-390-home.png) |
| Before, both research groups expanded | [1440](../../design/field/baseline/before-1440-expanded.png) | [390](../../design/field/baseline/before-390-expanded.png) |
| After foundation, both groups expanded | [1440](../../design/field/baseline/after-1440-expanded.png) | [390](../../design/field/baseline/after-390-expanded.png) |

First-viewport screenshots at 768 and 1280 px are saved alongside these files. The Field reference and latest desktop/mobile first viewports were visually inspected.

| Comparison point | Current evidence / intended next step |
| --- | --- |
| Copy | Exact before/after match; fuller original tool descriptions intentionally override abbreviated mockup text |
| Palette | Scoped navy, cream, and muted tokens established; final surface lighting belongs to Phase 2 |
| Typography | Existing serif stack reused; hero sizing, weight, and alignment remain Phase 3 work |
| Card treatment | Original illustrated cards remain; Phase 3 applies translucent backgrounds and compact layout |
| Spacing/navigation | Existing working layout retained; centered hero and right-aligned desktop navigation belong to Phase 3 |
| Motion | No media asset or playback added; Phase 2 remains not started |

Remaining validation belongs to later phases: final Field fidelity, animation, 200% zoom, screen-reader/contrast audit, and other browser engines. This result is not a claim of complete redesign or deployment.
