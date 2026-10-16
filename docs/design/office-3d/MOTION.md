# Office motion contract

Implemented and integrated at `/`, using the approved Grounded District direction and revised 16-storey tower. The latest October 15 clarification uses compact equal gaps before zoom: selected slice +2.2 m, upper assembly/panels +4.4 m. During zoom, the slice stays put and the upper assembly continues to +32 m. Floor-to-floor closure moves both together while the camera pulls back slightly. See [current architecture](DESIGN.md) and [After Hours design decisions](../office-redesign/README.md). Promotion to the homepage preserves these journeys, office layouts, character assets, and people/door simulations.

## Journeys

The fixed x/z setback in `TOWER_SITE` applies to every tower assembly and both office slices together. Motion continues in their original local vertical coordinates. Office and inspection fits include the site position, and settled controls measure the same translated bounds, preserving camera handoffs and desk projection.

About shares the existing city pose. Landing ↔ About changes only the content/footer and reading-gradient blend over 280ms; it does not issue a structural scene command or reset parallax. Either floor → About uses the same 2.6s city return below, with About copy/footer/shade synchronized to the final pullback and no intermediate landing copy. About → either floor uses the existing city entry. History, reversals, Escape, visibility and reduced motion retain their existing scene semantics.

| Journey | Ready-scene duration | Choreography |
| --- | --- | --- |
| City → Home | 2.6 s | Hold the city camera while compact equal gaps open for 1.05 s; zoom for 1.55 s while only the upper assembly/panels continue upward. |
| Home → Resources | 2.8 s | Close all moving Home pieces together with slight pullback for 0.75 s; descend the closed facade for 0.9 s; open compact equal gaps for 0.7 s; zoom and clear the upper stack for 0.45 s. |
| Resources → Home | 2.8 s | Close Resources and its upper stack together with pullback; ascend the facade; open compact equal gaps around Home; zoom while its cap/envelope rises clear, using the same durations as descent. |
| Home → city | 2.6 s | Pull back for 1.55 s while the slice stays lifted and the upper assembly returns to the compact split; close all gaps together during the final 1.05 s pullback. |
| Resources → city | 2.6 s | Reverse the Resources entry in the same two stages, retaining its rigid upper stack. |

The final return stage uses the remaining 10% of the city camera pullback. Headline, explanation and entry button fade/slide in from the same sampled progress as that camera movement, reaching their final state together with no trailing CSS settle. Return geometry reverses entry exactly: the slice holds while the upper assembly descends, then all gaps close together. Reversing an early entry before zoom skips the already-complete pullback and closes the partial split directly. Resize preserves the current copy reveal; skip/reduced motion use immediate endpoints.

Timings start when the scene/session is ready. Direct floor hashes open the requested floor without an entrance. Back/Forward uses the same motion model without adding history entries. The logo returns to city; every settled city entry replays the entrance. The button and main tower share the entry action. Small pointer parallax runs only in the idle city. Entry captures its actual camera position, holds that framing during separation and moves continuously into the office.

Floor navigation and the logo can retarget a journey from its current physical/camera pose. Repeated requests for the current in-flight destination are ignored. Escape and the visible Skip animation button settle the selected destination. Reduced motion and hidden-page navigation use immediate endpoints; changing either preference during travel skips the remaining travel. Published research hashes select Resources and the matching library without additional camera resets on that floor. Unknown hashes normalize to city.

Pins and desk hit regions unmount throughout travel. They return after the actual destination frame renders, and keyboard focus moves to the main stage. Existing pan/zoom, keyboard reset and desk disclosures resume at arrival. The header remains readable against the facade. City-content reveal has its own sampled progress, independent of the district atmosphere. Floor links are inert while visually hidden, with the logo and Skip animation available during entry. About is available from the header throughout the office. Whole-tower inspection is no longer exposed in the interface.

## Structure and ownership

- `towerStructure.ts` remains authoritative: Home level 13, Resources level 6, six intervening storeys and six storeys beneath Resources. Canonical origins remain 0 and −23.8 m; exposed origins are +2.2 and −21.6 m; ground is −44.65 m.
- `towerMotion.ts` supplies deterministic waypoints, easing, endpoint construction, pose-continuous retargeting and remaining-time resize. Motion is sampled from elapsed time; no React state updates run per animation frame.
- `TowerAssembly.tsx` keeps the cap, intermediate structure and both exterior envelopes mounted. The office-level envelopes are hollow perimeter panels, so the original interiors reveal behind their moving exterior rather than swapping in a different floor. The full envelope lifts with its matching upper section; the office's own back windows/walls remain intact.
- Each office has its own persistent transform group. At Resources, enclosed Home and its supporting deck move with the intermediate upper stack. Resources and the fixed six-storey base stay separate. The base and district have no animated offsets.
- `TowerMotionDriver.tsx` applies world transforms, shared camera motion, parallax, background/light blending, presentation readiness and shadow flags. Exterior groups retain their authored shadow flags; shadow coverage and key-light placement vary continuously with framing. Office lamps are isolated from exterior materials and fade by actual facade-to-slice clearance. Front cutaway walls retract behind the facade before the interior becomes hidden.
- `cameraFit.ts` shares the canonical district/inspection/office camera targets. Motion captures the current pan/zoom framing when taking over and finishes at the existing office fit. Resize preserves remaining geometry waypoints and time while adapting camera endpoints. `OfficeViewControls` owns the camera only after arrival.
- Marker and desk-hit projection reads the selected office's actual world matrix. People retain the same session throughout travel and inherit their office transform.

No GSAP, ScrollTrigger, new artwork, extra sections, or additional rendering stack was introduced.

## Verification

Motion tests cover compact equal-gap opening before zoom, closed-facade traversal, the rigid Resources stack, intermediate poses, exact endpoints, retarget continuity, remaining-time resize, synchronized city-copy reveal and camera ownership. Navigation tests cover duplicate input, stale acknowledgements, history, skip, reduced motion, hidden pages and cleanup. Wall/light continuity tests cover the interior visibility boundary and restoration of open geometry and authored lamp strengths.

Desktop Edge/Playwright walkthroughs cover both entries, floor-to-floor travel, both city returns, inspection, pan/zoom, interruption, resize, history, Escape and reduced motion at 1280 × 720 and 1440 × 900. Current source and tests govern dimensions and timing; generated reference images are approximate. Screenshots and temporary QA fixtures are session artifacts outside the repository. About additionally passes stationary-city parity, both floor returns, content/gradient synchronization, history/reversal, keyboard, visibility, resize and fallback checks. Mobile floor endpoints now start at 2× with a 1×–4× touch zoom range, while desktop remains 1×–2×. Portrait/landscape touch checks cover navigation, pinch, pan, cancellation and native research scrolling. Physical-device/Safari checks and production integration remain separate work.
