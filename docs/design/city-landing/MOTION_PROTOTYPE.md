# Motion prototype

Implemented in `/preview/office`, using the approved Grounded District direction and the revised 16-storey tower. Production pages, global styles, dependencies, office layouts, character assets, and people/door simulations remain unchanged. The character renderer now skips mixers when its actual office parent is hidden.

## Journeys

| Journey | Ready-scene duration | Choreography |
| --- | --- | --- |
| City → Home | 2.6 s | Settle parallax; lift exterior envelope/cap; raise Home; zoom to the original office fit. The split precedes the close-up. |
| Home → Resources | 2.8 s | Reseat Home; close its exterior; descend past real closed facade; lift the entire upper stack; raise Resources and arrive. |
| Resources → Home | 2.8 s | Reseat Resources; close the upper stack; ascend the facade; lift Home's cap/envelope and raise Home. |
| Home → city | 1.8 s | Reseat the slice, reassemble while pulling back, finish the city camera settle. |
| Resources → city | 2.2 s | Same return with more time for the tall upper assembly. |

Timings start when the scene/session is ready. Direct floor hashes open the requested floor without an entrance. Back/Forward uses the same motion model without adding history entries. The logo returns to city; every settled city entry replays the entrance. The button and main tower share the entry action. Small pointer parallax runs only in the idle city and returns to canonical framing on entry.

Floor navigation and the logo can retarget a journey from its current physical/camera pose. Repeated requests for the current in-flight destination are ignored. Escape and the visible Skip animation button settle the selected destination. Reduced motion and hidden-page navigation use immediate endpoints; changing either preference during travel skips the remaining travel. Unknown preview hashes normalize to city.

Pins and desk hit regions unmount throughout travel. They return after the actual destination frame renders, and keyboard focus moves to the main stage. Existing pan/zoom, keyboard reset and desk disclosures resume at arrival. The header and landing copy follow the camera's district blend; the header remains readable against the facade. Floor links are inert while visually hidden, with the logo and Skip animation available during entry. About stays inactive. Whole-tower inspection remains available at either settled floor.

## Structure and ownership

- `towerStructure.ts` remains authoritative: Home level 13, Resources level 6, six intervening storeys and six storeys beneath Resources. Canonical origins remain 0 and −23.8 m; exposed origins are +2.2 and −21.6 m; ground is −44.65 m.
- `towerMotion.ts` supplies deterministic waypoints, easing, endpoint construction, pose-continuous retargeting and remaining-time resize. Motion is sampled from elapsed time; no React state updates run per animation frame.
- `TowerAssembly.tsx` keeps the cap, intermediate structure and both exterior envelopes mounted. The office-level envelopes are hollow perimeter panels, so the original interiors reveal behind their moving exterior rather than swapping in a different floor. The full envelope lifts with its matching upper section; the office's own back windows/walls remain intact.
- Each office has its own persistent transform group. At Resources, enclosed Home and its supporting deck move with the intermediate upper stack. Resources and the fixed six-storey base stay separate. The base and district have no animated offsets.
- `TowerMotionDriver.tsx` applies world transforms, shared camera motion, parallax, background/light blending, presentation readiness and shadow flags. Both shadow casting and receiving are disabled on lifted exterior groups under VSM and restored on closure.
- `cameraFit.ts` shares the canonical district/inspection/office camera targets. Motion captures the current pan/zoom framing when taking over and finishes at the existing office fit. Resize preserves remaining geometry waypoints and time while adapting camera endpoints. `OfficeViewControls` owns the camera only after arrival.
- Marker and desk-hit projection reads the selected office's actual world matrix. People retain the same session throughout travel and inherit their office transform.

No GSAP, ScrollTrigger, new artwork, extra sections, or additional rendering stack was introduced.

## Verification

The motion tests cover the pre-zoom split, closed-facade traversal in both directions, reveal ordering, rigid Resources stack, sampled intermediate poses, exact endpoints, retarget continuity, remaining-time resize, city restoration, captured pan/zoom and office camera handoff. Navigation checks cover duplicate input, stale acknowledgements, history, skip, reduced motion, hidden pages and cleanup. The final full suite passed 175 tests across 22 files. Web build passed; lint passed with one pre-existing unrelated warning in `DelphiSurface.tsx`. Vite retains its existing large-chunk warning. Tests/build used the established sandbox workaround for temporary-file/worker realpath restrictions. Final diff checks were clean and runtime changes remained confined to preview-owned modules.

Real-browser checks use the live Vite app in the Codex in-app browser at 1280 × 720 and 1440 × 900. Checked entry/replay, down/up facade travel, both city returns, intermediate reveal frames, exact floor heights, lower-facade crop, interruption by logo, rapid floor retargeting, Escape/Skip animation, Back/Forward, resize during descent, and retained keyboard zoom/pan/reset and focused desk labels. Screenshots are session artifacts outside the repository.

The final clean-reload walkthrough matched the preview URL/title, showed meaningful DOM and rendered content, had no framework error overlay, and recorded no app console warnings/errors. Whole-tower inspection and return from it also passed. The browser viewport override was cleared after testing; a reload refreshed a stale compositor image after that reset.

Observed renderer measurements in this browser session (not cross-device guarantees):

| Sample | Frames / intervals | Median interval | 95th percentile | Maximum |
| --- | --- | --- | --- | --- |
| Home → Resources, 1280 × 720, with keyframe capture | 330 | 8.3 ms | 9.7 ms | 43 ms |
| Resources → Home, 1440 × 900 | 338 | 8.3 ms | 9.3 ms | 14.1 ms |
| Descent with desktop resize | 332 | 8.3 ms | 10.1 ms | 17 ms |

These are frame-to-frame renderer intervals from the current development session, including browser/CPU scheduling. They are not GPU timer measurements. GPU vendor/model was not recorded. Renderer-reported resource counts remained at 53 geometries and 187 textures across inspected repeated journeys after warm-up. Observed endpoint render counts were 651 calls / 213,478 triangles for Home, 697 / 217,182 for Resources, and 128 / 15,564 for city; these are renderer counters including shadow work, not separate performance budgets.

## Design review and remaining integration

Taste review retains the approved art direction: an architectural financial workspace, serif headline, navy action, sparse grounded district, cream structure and blue glazing. The signature move is the tower opening; no unrelated scroll patterns or decorative animation were added. Browser captures show the split before zoom, a closed exterior between destinations, and the original interior composition at arrival. The facade remains simpler than the generated architectural reference; final material/detail polish belongs to integration.

The generic taste inspector's image-count, scroll-motion and phone requirements are outside this approved one-screen 3D desktop brief. Review used the in-app browser, actual motion keyframes, DOM states and the approved references. No new direction draw was made. Desktop-scoped visual assessment: design 7.5, usability 8, creativity 8, content 7.5 (weighted 7.75); this is a prototype review, not mobile or launch approval.

Browser-level reduced-motion emulation, hidden-tab lifecycle emulation and a WebGL-disabled browser run remain for integration; the preference/navigation/fallback unit checks pass. Interruption preserves positions/framing, while velocity can ease into the new route rather than remain derivative-continuous. No continuous collision solver or automated pixel comparison of every possible interruption frame is claimed. Mobile behavior, production rollout, functional About and tool activation remain out of scope.
