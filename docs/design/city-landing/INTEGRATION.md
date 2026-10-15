# Preview integration and verification

Completed October 15, 2026 for the agreed desktop preview at `/preview/office`. The structural, motion, preview integration, and verification/finish phases are complete within this scope. Production routes, content, global styles, tools/APIs, dependencies and deployment configuration are unchanged. No deployment was performed.

## Final behavior

The user's latest clarification is authoritative: keep the floor-to-lower-tower gap, open compact equal gaps first with the upper section still visible, **then** zoom while the upper assembly continues upward. All initial opening transforms share the same normalized easing progress; the slice holds its lift during zoom. Floor-to-floor closure brings upper assembly/panels and slice down together, beginning a slight pullback before vertical travel.

- City → Home: compact equal gaps open for 1.05 seconds with the captured wide camera held (slice +2.2 m, upper assembly/panels +4.4 m); during the 1.55 second zoom, only the upper assembly continues to +32 m. Total 2.6 seconds once ready.
- Home ↔ Resources: close all outgoing pieces together with slight pullback for 0.75 seconds, traverse the closed facade for 0.9 seconds, open compact equal gaps for 0.7 seconds, then zoom and raise the upper assembly to clearance for 0.45 seconds. Total 2.8 seconds.
- Home and Resources remain 23.8 metres apart. Resources retains its six-storey base and its lower facade continues past the viewport bottom. Floor interiors and simulations remain intact.
- Logo return, replay, history, latest-destination interruption, Escape/Skip, keyboard controls and desk disclosure retain their established behavior.
- Static mode uses current preview captures for city, Home and Resources. It retains navigation/focus and omits unavailable inspection controls and camera instructions. About remains an inactive label without link-like hover feedback.

## Acceptance evidence

Live checks used the Codex in-app browser with the existing Vite server on `http://127.0.0.1:5180`, at 1280 × 720 and 1440 × 900. The flow under test was city entry → Home → distant Resources → Home → reassembled city, including interrupted and alternative paths.

| Area | Evidence and result |
| --- | --- |
| Page identity / nonblank / overlay | Preview URL and title matched; meaningful DOM, scene and controls rendered; no framework overlay |
| Landing / header | One screen, exact copy, serif heading, navy CTA, dominant tower and four supporting buildings; office links appear inside; About stays inactive |
| Coordinated entry | Latest compact opening sample had Home lift 2.199 m / upper lift 4.397 m with wide camera at −16.225 m; during zoom Home remained at 2.2 m while upper lift increased to 12.655 m and camera rose to −10.714 m |
| Both opening destinations | Browser captures show the compact opening with upper assembly visible; regression samples verify equal gaps before zoom, followed by constant slice lift and continued upper clearance for city/floor entrances to either destination |
| Joint closure | Both directions close slice and upper assembly on the same progress while pulling back without vertical camera travel; a Resources closure sample retained slice 1.455 m / upper stack 21.164 m at camera elevation −21.6 m |
| Vertical travel / continuity | Real closed facade passes between offices; Resources upper stack stays rigid; live arrivals preserve the interiors with cropped lower facade and no ground/upper cap in the close-up |
| Equivalent entry / replay | Main tower pointer activation, button and keyboard Enter reached Home; city return and subsequent entry replayed the full sequence; duplicate input is covered by navigation tests |
| Interruption / skip | Rapid Home → Resources → Home → Resources resolved the latest destination; Escape and Skip button reached exact endpoints; logo during Resources opening reassembled all pieces |
| Resize / history / inspection | Resize from 1440 × 900 to 1280 × 720 during ascent retained the destination; Back/Forward reached the expected floors; whole-tower inspection and logo return worked |
| Controls / pins / focus | Keyboard zoom reached 1.15×, Right panned −48 px and 0 reset; Tab exposed Ithaca; motion hides desk interactions and arrival focuses the stage |
| People / doors | Existing session/door behavior and spatial tests pass; visible people inherit their office transforms; optional model failure does not prevent floor use |
| Reduced motion / hidden page | Browser fixture checks described below reached exact canonical endpoints and resumed usable controls |
| Loading / failed scene / no WebGL | Early entry during delayed scene loading completed Home after readiness; scene module/WebGL failures permitted city, Home and Resources static navigation |
| Console | Normal preview walkthrough recorded no warnings/errors; fault-fixture errors were intentional and explained below |
| Scope / assets | Diff is confined to preview-owned modules/assets and design docs; three refreshed local JPEG fallback stills total 265,715 bytes; no new dependencies |

## Failure and lifecycle method

The browser control surface exposes viewport controls but no native media, page-lifecycle or WebGL-disable emulation. A temporary loopback-only proxy on port 5181 injected a fixture before the same Vite app loaded. Its script and screenshots live outside the repository; no testing switch, route, setting or backdoor was added to the app. The fixture server was stopped after use.

The fixture exercised the real browser-rendered React/R3F application with:

- Reduced-motion `matchMedia` state initially enabled, normal motion restored, then a preference change during facade travel. Entry/floor selection used exact poses and a mid-flight change settled Home.
- `visibilityState`/`visibilitychange` signals during descent. Returning visible produced settled Resources at −21.6 m with upper stack at +32 m and usable controls.
- WebGL context creation returning `null`. The scene boundary displayed current stills; entry, Resources selection and logo return worked without inspection controls. Expected Three.js/React context-creation errors were confined to this fixture.
- HTTP 503 for the lazy `OfficeCanvas` module. The outer scene boundary recovered to static navigation. Expected failed-import errors were confined to the fixture.
- HTTP 503 for character GLBs. The existing local people boundary removed the unavailable characters while leaving live offices and floor travel usable. Expected model-load errors were confined to the fixture.
- A five-second delay for the lazy canvas module. The entry button remained available and recorded Home before scene readiness; Home then completed without a destination reset.

These are browser-level injected conditions, not tests of OS settings, native tab suspension, CSS media emulation, GPU-driver failure or every possible asset outage. Hook/navigation/fallback tests additionally protect preference subscription, presentation guards, cleanup and scene-failure navigation.

## Rendering measurements

Earlier integration baseline measurements (before the compact-gap/joint-closure refinement), not cross-device guarantees or GPU timers:

| Earlier integration sample | Intervals | Median | 95th percentile | Maximum |
| --- | ---: | ---: | ---: | ---: |
| Home → Resources, 1280 × 720, warm | 332 | 8.4 ms | 9.6 ms | 15.3 ms |
| Resources → Home, resize to 1280 × 720 during ascent | 334 | 8.3 ms | 9.4 ms | 16.6 ms |
| History return to Home, 1280 × 720 | 336 | 8.3 ms | 9.2 ms | 15.0 ms |
| Keyboard city-entry replay, 1280 × 720, warm | 273 | 9.6 ms | 10.8 ms | 13.9 ms |
| Home → Resources, 1440 × 900, warm | 328 | 8.4 ms | 9.5 ms | 30.7 ms |

Those warm observations met the proposed 60 fps travel target on that development session, with an isolated longer interval in the 1440 sample. The latest compact-gap walkthrough at 1280 × 720 measured Home → Resources median 8.3 ms / p95 10.2 ms / maximum 46.3 ms while capturing frames, and Resources → Home median 8.3 ms / p95 9.7 ms / maximum 15.7 ms. A cold/delayed first-entry fixture recorded a 334.3 ms maximum interval, so cold shader/asset initialization remains a practical performance limitation. GPU model was unavailable through the browser inspection surface. Do not infer hardware-independent smoothness from these results.

Before the architecture follow-up below, repeated journeys retained 53 geometries / 187 textures. Earlier endpoint renderer counters including shadow work were Home 651 calls / 213,478 triangles, Resources 697 / 217,182, and city 128 / 15,564. Static mode allocates no scene renderer. The three fallback stills replace runtime imports of the larger generated concept PNGs; original reference files remain preserved.

## Gates and visual review

- Full web tests after compact-gap and joint-closure refinement: **179 passed across 22 files**. Latest focused motion/structure/navigation set: **24 passed**; earlier integrated fallback/shell checks remain in the full suite.
- `npm run lint:web`: passed, with the existing unrelated `DelphiSurface.tsx:43` dependency warning.
- `npm run build:web`: passed, including TypeScript. Existing Vite large-chunk warning remains.
- Diff whitespace/isolation checks: passed. Tests/build used the established Windows sandbox temporary-file workaround.
- React review: stable availability callback, scoped boundary state, effect cleanup retained, lazy scene preserved, no frame-by-frame React updates or new dependency.
- Taste/redesign review: retain the selected serif/navy hierarchy, grounded sparse composition and original live interiors. Targeted finishing fixes address misleading fallback controls, inactive About hover and outdated fallback artwork. No new visual direction or decorative motion was introduced.

Reference comparison: the generated district has richer facade/landscape detail than this deliberately simple live district; the supplied opened-floor reference guides materials/framing rather than replacing actual interiors. Both desktop arrival views keep the lower facade cropped past the bottom. No generated storyboard was replaced for this timing-only change; TRANSITION.md and the sampled timeline now own the exact order and durations.

Session captures include `integrated-grounded-city.jpg`, `integrated-home-separation.jpg`, `integrated-home-arrival.jpg`, `integrated-facade-descent.jpg`, `integrated-resources-separation.jpg`, `integrated-resources-arrival.jpg`, and lifecycle/failure screenshots. They are outside the repository. Shipped stills and capture provenance are documented in [office ASSETS.md](../office-3d/ASSETS.md#static-preview-alternatives).

The later timing refinement supersedes the old separation captures. Current motion evidence is `balanced-home-opening.jpg`, `balanced-home-zoom.jpg`, `balanced-home-closing.jpg`, `balanced-resources-opening.jpg`, `balanced-resources-opening-1440.jpg`, `balanced-resources-closing.jpg` and `balanced-motion-proof.json`, also outside the repository. The latest walkthrough covered both directions at 1280 × 720 and 1440 × 900. `balanced-final-check.json` records the restored city view and empty application console. Separate browser-tool telemetry produced unrelated network errors during this walkthrough. No fallback artwork regeneration was needed because final geometry and camera poses did not change.

Mobile/touch behavior, cross-browser/device certification, continuous collision proof for every arbitrary interruption, derivative-continuous retargeting, functional About, tool activation, and production rollout remain outside this completed desktop preview scope.

## District architecture follow-up — October 15, 2026

The user confirmed a close match to `storyboard/01-grounded-city.png`, with the tower footprint, floor elevations and choreography preserved. The detailed group remains the main tower and four neighbours. Surrounding context stays blank and pale; no cars or street furniture were added. The existing Grounded District direction applies to this component refinement; no new direction draw, concept or copy was needed.

| Reference evidence / initial mismatch | Implemented treatment |
| --- | --- |
| Cream frames around recessed glazing; original windows were flat blue rectangles | Physical piers, spandrels and sills; recessed opaque blue glazing with mullions, reflected sky strips and shaded returns. The existing hollow moving floor envelopes remain hollow |
| Related buildings with different window proportions | Vertical bays on two neighbours, a low curtain-wall pavilion and a framed mid-rise; retained the approved heights/positions and simple massing |
| Roofs have visible rims and small mechanical units | Raised perimeter parapets, recessed roof decks, tower stair enclosure and vented HVAC units, all carried by the existing roof/upper assembly |
| Low planting and fuller trees at street level | Planted ribbons around facades, clustered low shrubs and asymmetric faceted tree crowns with three greens; entry approaches remain open |
| Roads and buildings share a ground plane | Rounded sidewalk corners, light paving joints, curbs, crossings, lane/edge markings and quieter peripheral roads; twelve blank context volumes with minimal detail |

Visual review used the in-app browser via CUA at 1440 × 900, 1280 × 720 and its normal viewport. City → Enter CapitalCanvas → Home → Resources → Home → logo → city completed with the original interiors, lower facades extending past the screen bottom and the existing staged separation. The application console had no warnings/errors. Page identity, meaningful content, absence of a framework overlay, screenshots and navigation state all passed. Separate browser-tool telemetry errors were unrelated to the page. Mobile and other browsers were not certified.

The warm 1440 Home → Resources sample recorded 336 intervals, median 8.3 ms / p95 9.0 ms / maximum 31.2 ms; city reassembly recorded 217 intervals, median 8.4 ms / p95 9.2 ms / maximum 10.6 ms. Latest endpoint counters were city 140 calls / 66,328 triangles and Resources 705 calls / 230,334 triangles, including shadow passes. Both retained 55 geometries / 187 textures. These are session observations, not device guarantees. Repeated building, planting and road details use shared geometry/material instance batches; no dependency or per-frame React state was added.

`npm run build:web` and `npm run lint:web` passed after the final geometry changes, with the existing Vite chunk-size and unrelated Delphi hook warnings. The focused tower structure/motion regression set passed 16 tests. Taste source lint passed with explicit exceptions for physical 3D lighting shadows, which are required by the approved reference. Visual inspection used the live browser; the standalone page inspector was not run. Generic image-count, decorative-motion and page-redesign requirements were excluded from this targeted 3D component pass.

The second visual review fixed three initial issues: flat facades, oversimplified tree crowns and square sidewalk corners. Desktop-only subjective critique: design 7.5, usability 8, creativity 7.5, content 7; weighted score 7.6/10. The tower is intentionally taller than the generated reference to preserve the approved 16-storey structure. Reflections remain stylized opaque treatments, and lighting/landscape detail remain simpler than the generated artwork. These are the remaining fidelity differences, rather than a claim of a pixel-exact match.

Current evidence outside the repository: `district-detail-final-1440.jpg`, `district-detail-final-1280.jpg`, `district-home-final-1440.jpg`, `district-resources-final-1440.jpg` and `district-architecture-proof.json`. Fallback stills were refreshed through the existing temporary loopback capture fixture at 1280 × 720 and the fixture was stopped afterward. Current sizes/provenance are in [ASSETS.md](../office-3d/ASSETS.md#static-preview-alternatives). Original generated references and storyboard images were preserved.

## Closer composition and atmospheric edges — October 15, 2026

The user approved a roughly 10% zoom, a slight upward/leftward city shift and soft blur/fade at the far edges. They confirmed removal of the large lower-left blank block, small bottom-centre block and large block below the front detailed neighbour, retaining the smaller farther-right block. These correspond to removal of context positions `(9,56)`, `(31,57)` and `(55,31)`, with `(55,2)` retained. Tower geometry, office fits and choreography stay unchanged.

`cameraFit.ts` reduces the city viewing height to 90% and adjusts its horizontal/vertical offsets, giving about 11% apparent magnification. A regression check projects every main-tower corner at 1280 × 720 and 1440 × 900 to keep its full silhouette inside the viewport and clear of the left copy column. The headline, body and CTA retain their existing positions and typography.

Road tails now extend to −160 m on the outward axes, with rear/side road links, pale background volumes and a few plants extending the district leftward/upward. Detailed buildings remain limited to the main tower and four neighbours. Eighteen blank context volumes remain after the three foreground removals and nine distant additions; their instanced geometry stays inexpensive.

`CityAtmosphere.ts` uses the existing Three.js postprocessing modules without a new dependency. It reconstructs world-space surface positions from depth to keep the central district sharp while applying a nine-sample blur up to 4.5 CSS pixels to peripheral geometry. The haze fades after tone mapping and before colour-space conversion, preserving the native background colour. HTML copy/controls remain crisp. The effect fades with city presence during entry; settled offices use their original direct renderer. Targets resize with viewport/DPR, and passes/targets dispose on unmount. React review confirmed no frame-by-frame state updates, retained lazy scene loading and stable refs.

| Current verification | Result |
| --- | --- |
| In-app browser, 1440 × 900 and 1280 × 720 | Closer framing, all three removals, retained right-hand block, extended roads and sharp-centre/soft-edge rendering verified |
| Identity/content/overlay/console | Correct preview URL/title, meaningful content, no framework overlay and no application warnings/errors |
| Interactions | City → Home → Resources → Home → city, plus warm entrance replay at 1440; entry/return repeated at 1280; normal viewport restored |
| Full web suite | 180 passed across 22 files |
| Focused framing/motion/structure/fallback tests | 20 passed |
| Build / lint | Passed, with existing Vite chunk-size and unrelated Delphi hook warnings |
| Taste source lint | Passed; visual review used the live browser, not the standalone inspector |
| Fallback | City still refreshed at 1440 × 900; existing 1280 × 720 office stills remain current; temporary capture fixture stopped |

At 1440, a warm entrance measured median 11.7 ms / p95 13.1 ms / maximum 18.7 ms across 227 intervals. City reassembly measured median 8.9 ms / p95 13.1 ms / maximum 18.6 ms across 186 intervals. Cold first entry still has a material/shader startup hitch (458.6 ms maximum in this session), so these are warm-session observations rather than a guarantee of first-run or cross-device smoothness. The effect adds one shared fullscreen geometry and four target textures: after both offices have rendered, repeated journeys retained 56 geometries / 191 textures. The compositor aggregates draw counters across scene/shadow/postprocessing passes, so its city counter (261 calls / 137,024 triangles) is not directly comparable to older single-render counters.

The first visual review revealed that the road tails faded too early and tone mapping tinted the haze. The final pass extended their visible fade range, strengthened peripheral road colour and moved haze blending after tone mapping. Desktop subjective critique: design 8, usability 8, creativity 7.5, content 7; weighted score 7.8/10. The approved Grounded District direction was retained, with no redraw. The live tower remains taller and more stylized than the generated reference, as required by the approved structure. Mobile and other browsers remain unverified.

Current screenshots/proof outside the repository: `district-composition-final-1440.jpg`, `district-composition-final-1280.jpg`, `district-composition-home.jpg`, `district-composition-proof.json` and `district-composition-final-check.json`. They supersede the preceding city composition captures; the original generated reference/storyboard stays unchanged.

## Reference roads, facade variety and fade — October 15, 2026

The user confirmed a small gap above the tower and cream/blue finishes close to `storyboard/01-grounded-city.png`. Roads now use explicit extents around the occupied plots: the empty foreground street row and long outward tails are removed, with neutral gray paving, white edge lines, dashed centers and crossings retained. The four neighbors use narrow continuous vertical bays, broad curtain glazing and inset framed windows, with limestone, ivory and chalk wall finishes. Distant context remains pale and blank as in the reference. The main tower's facade, interior endpoints and motion sequence are preserved.

The atmosphere compositor now fades crisp surfaces into the native background in world space; the nine-sample blur pass is removed. The city camera raises the district using a viewport-relative roof margin without changing the office camera fits. The framing regression checks the six-percent margin of the conservative tower bounds at 1280 × 720 and 1440 × 900. The actual modeled roof also remains comfortably inside the viewport at both sizes.

Validation: 25 focused structure, motion, shell and fallback tests passed. Production build, ESLint and taste source lint passed; existing large-bundle and unrelated Delphi hook warnings remain. Initial sandbox failures were resolved with the existing temporary-directory workaround for Vitest and an unsandboxed build. Live visual review used the Codex in-app browser after standalone Playwright launch failed in the Windows sandbox. Correct identity, meaningful content, no framework overlay, clean application console and city → Home → Resources → city navigation passed. Desktop screenshots at both sizes verify the varied facades, bounded roads, roof gap and unblurred fade. The standalone taste page inspector and mobile/cross-browser certification were not run; the existing component direction was retained without a new draw. Subjective desktop review: design 8, usability 8, creativity 7.5, content 7 (7.8 overall); geometry and landscaping remain more stylized than the generated reference.

The city fallback was refreshed at 1440 × 900 through a temporary loopback-only proxy that hid the existing HTML overlays, then the proxy was stopped. No runtime capture flag or dependency was introduced. Current evidence outside the repository: `city-final-1440.jpg` and `city-final-1280.jpg`. The updated fallback's size is recorded in the office asset inventory.

## Street alignment and intersection repair — October 15, 2026

The user clarified that the missing white space meant pale sidewalk strips, and requested two foreground streets extending down the two isometric diagonals. This supersedes the preceding foreground-tail removal. Both central streets now continue to 78 m; the world-space foreground fade starts at 40 m and reaches the background before the geometry ends. Other streets retain bounded front extents. Asphalt stays 6.8 m wide with 1.2 m pale sidewalk strips, dashed centers, edge lines and central crosswalks.

The reported left-junction flicker had a concrete geometry cause: independently drawn road boxes shared the same top plane, including overlapping primary and pale secondary materials. `cityRoads.ts` now partitions their union into disjoint surfaces, with one asphalt owner per intersection. Sidewalk strips exclude asphalt and building plots, and all lane/crosswalk paint has explicit clearance above the road surface. Regression tests check positive dimensions, no asphalt overlaps, single ownership at the affected left junction, sidewalk clearance and exactly two central foreground extensions.

Four neighboring building plots were repositioned to meet the street-side sidewalk strips. Their trees and planters follow their new positions. Several context volumes and two background trees were also moved out of street corridors. Main-tower coordinates, camera fits, office interiors and choreography are unchanged by this pass.

Validation: 21 focused street, tower-structure and motion tests passed; production build, ESLint and taste source lint passed, with the existing bundle-size and unrelated Delphi hook warnings. In-app browser review at 1440 × 900 and 1280 × 720 confirmed street alignment, visible sidewalk strips and fading diagonal foreground roads. Pointer movements across the city produced the existing parallax with no visible junction tearing in the sampled views. City → Home → city completed normally, with no relevant application warnings/errors or framework overlay. Structural non-overlap tests provide the regression proof beyond those sampled frames; this is not an exhaustive GPU/device certification. Mobile and other browsers remain unverified.

The original Grounded District direction and reference were retained. The standalone taste page inspector was not run; source lint and live screenshots supplied the component review. Desktop visual assessment remains 7.8/10 overall, with more stylized landscaping and a taller main tower than the generated artwork. Current screenshots outside the repository are `street-layout-final-1440.jpg` and `street-layout-final-1280.jpg`. The static city fallback was refreshed at 1440 × 900 with the existing temporary loopback capture fixture, which was stopped after use.

The subsequent browser marker identified a missing left-background connection: the street at x = −65 stopped at z = 3 before reaching the diagonal street at z = 17. Its extent now reaches z = 20.4, completing the junction with matching sidewalk strips and automatically interrupted lane markings. A continuity regression samples the repaired span and checks that each sample has exactly one asphalt owner. All five street tests and the production build passed; the 920 × 764 live view and 1440 × 900 refreshed fallback show the connection, with no application warnings/errors. Evidence: `left-road-fixed.jpg` outside the repository. The temporary capture fixture was stopped after use.

The road-color follow-up replaces the separate primary/secondary asphalt materials with the same shared material instance (`#bec5cd`, roughness 1). Spatial atmosphere continues to own the gradual distance fade, so connected streets have no material-color step at their junctions. The live 920 × 764 view and refreshed 1440 × 900 fallback were visually checked with no application warnings/errors. Evidence: `unified-road-color.jpg` outside the repository.
