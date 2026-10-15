# Structural prototype

Structural phase implemented in preview on October 14, 2026. This document records that phase and the current geometry; the subsequent [motion prototype](MOTION_PROTOTYPE.md) is now implemented. Production pages, shared site styles, dependencies, existing interior layouts, furniture, character assets, people simulations, and door behavior are unchanged.

## Inspect it

Run `npm run dev:web -- --host 127.0.0.1` and use the port Vite reports. The development session for this work uses port 5180.

| Destination | Inspection |
| --- | --- |
| `/preview/office` or `#city` | Closed tower, four supporting buildings, roads and trees on continuous pale ground. Exact landing copy, serif heading and compact wordmark follow Grounded District. Button and tower both select Home. |
| `#home` | Original live Home interior above its lower facade. The upper assembly is outside the close-up. |
| `#resources` | Original live Resources interior six storeys above the district, with lower facade extending below the viewport. |
| View whole tower | On either floor, frames the actual separated assembly. Pins and office pan/zoom are hidden until Return to office. |
| Logo | Selects the fully reassembled city. |

Home/Resources/About appear inside; About remains inactive. Direct hashes and browser Back/Forward select the authored state. Same-floor selection resets office framing. Office keyboard zoom, pan and reset, pointer controls, and desk hover/focus disclosures remain available in close-up. Character sessions persist across pose selection.

The structural phase first presented these as static poses. Live navigation now animates between them; direct floor links still open settled poses. The canvas remains mounted. The inspection view shows arrival clearance, not the intermediate peak-split storyboard frame.

## Authored geometry

`apps/web/src/site/office/towerStructure.ts` owns the level system.

| Property | Prototype value |
| --- | --- |
| Existing interior footprint | 20 × 20 m, unchanged |
| Exterior footprint | 20.32 × 20.32 m, including existing perimeter wall thickness |
| Storey pitch | 3.4 m |
| Total closed storeys | 16, indexed 0–15 |
| Home | Level 13, canonical local/world origin 0 m |
| Resources | Level 6, canonical world origin −23.8 m |
| Intervening closed storeys | Six, levels 7–12 |
| Lower base beneath Resources | Six storeys; facade continues below the office viewport |
| Exposed slice lift | 2.2 m above its canonical level |
| Upper assembly arrival lift | 32 m, enough to clear the close-up frustum |

At Home, the two-storey cap and Home's retractable front panels lift. At Resources, all six intermediate storeys, enclosed Home, cap and Resources front panels lift as the tall upper assembly. The selected office remains a complete interior group; its people and DOM marker/hit projection use its world elevation. The remaining lower body stays in place.

Following visual review, four storeys were added beneath Resources so it no longer sits near the ground. Both office elevations and their 23.8 metre separation stay unchanged; the district ground moves down with the extended foundation. Resources is now 20.85 metres above ground before its reveal lift. The city and inspection camera bounds derive from that same ground elevation.

The [current motion contract](TRANSITION.md#current-structure-and-motion-contract) records fixed/moving assembly ownership, exact endpoint heights, and the static scene work needed before interpolation. A focused regression test protects the unchanged office endpoints, the lowered ground, the seated middle section at Home, and the rigid middle/cap lift at Resources. Full animated-path verification remains a motion-phase gate.

Closed storeys use opaque exterior geometry and instanced window/mullion boxes. No decorative interiors or additional simulations are loaded for the tower or neighboring buildings. Repeated geometry/materials are shared; per-instance GPU buffers are released on unmount. The lifted upper assembly stops casting shadows onto the selected office. Shadow coverage and camera far plane cover the wider district and separated tower.

## Verification

- Existing baseline: 157 web tests passed before runtime changes.
- Updated web suite: 163 tests across 21 files passed, including shared tower separation/clearance, district spacing, destination readiness/history, preview navigation, and city/floor fallback checks.
- Web build passed. Vite reports its existing large-chunk warning; no dependency was added.
- Web lint passed with no errors and one unrelated pre-existing warning in `DelphiSurface.tsx`.
- Tests/build ran outside the filesystem sandbox after sandboxed runs hit temporary-file/worker realpath restrictions.
- Real browser: Codex in-app browser, live Vite app, 1440 × 900 and 1280 × 720. Visually checked city, Home, Resources, both whole-tower poses, upper clearance and lower-facade crop. Verified CTA/tower entry, logo return, Back/Forward, keyboard zoom/pan/reset and focused desk labels. Browser screenshots are retained as session artifacts outside the repository.
- Source isolation: runtime changes stay under `apps/web/src/site/office/`; `App.tsx`, production page components, global CSS, package files and deployment settings are untouched.

Fallback component tests cover readiness and image failure; a WebGL-disabled browser run and browser motion-preference emulation were not performed in this structural phase. Existing reduced-motion simulation tests still pass. No frame-time/GPU benchmark or mobile acceptance claim is made.

## Next phase

The [motion phase](MOTION_PROTOTYPE.md) now implements entrance, separate down/up journeys, reverse city reassembly, city pointer parallax, camera handoff, focus transfer and interruption handling. Next is preview integration and finish: remaining browser failure/preference checks, broader benchmarking and final exterior/typography polish against the approved direction. Keep mobile behavior deferred.
