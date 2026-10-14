# Office preview: phases 1–8 checkpoint

Updated October 14, 2026.

Visual stages V0–V5 and V5A–V5C are implemented and verified. V5C completed October 14, 2026. V6's rendered background/depth/shadows and V7 remain pending. Earlier checkpoints below are historical; use [VISUAL-REVIEW.md](VISUAL-REVIEW.md) for current requirements and evidence.

## Current visual checkpoint: V5C

Lowered tall exterior walls/caps to a shared 2.9225m visible top, matching the existing room top mullions while retaining 2.9m glass panes, dark interior frames, tan doors, 0.58m front cutaways, 0.32m thickness, square/slab and 7m physical floor spacing. Exterior windows now use the exact cream wall material for 0.32m jambs/posts, 0.3m sills and 0.24m headers including caps. Clear panes stop at frame faces; cream infill and window sections cover the northwest wall without gaps or overlapping endpoint posts.

Home has two equal undivided middle windows derived from the private/conference room edges, including behind the couch, with a narrow center cream section. Its separate private-office split remains. Resources has one broad centered rear-office window, solid cream separation and a distinct four-pane main run outside the office bounds. Room/furniture/door/path positions remain. Shared minimum fit uses the actual cap/mullion top; cinematic travel inherits that fit without changing camera interaction.

118 tests across 15 frontend files pass, including actual shell/room top geometry, frame/pane coverage, named openings and room-backed spans plus existing full-stride routes/view checks. Lint has zero errors and the existing Delphi hook warning. Build passes with the existing large-chunk warning. Sandbox temporary-directory/worker-resolution restrictions required a stable scratch directory and unsandboxed local verification; these were environment failures, not runtime defects.

Browser plugin not available; bundled Playwright/Edge verified native 1672×941 views and 1920×1080, 1440×900, 1280×800 and 390×844 fits on both floors. Normal/reduced motion at DPR 1/2 pass cursor anchoring, 1–2× limits, all pan edges/corners and rebound, pin-origin drag, header travel/reset and focused keyboard zoom/reset. Camera-to-DOM error stays below one CSS pixel; native pins remain 40×52 CSS pixels at native width. Reduced-motion rendering freezes while idle; static fallback selects the appropriate canonical concept. Normal-path console errors/warnings: zero. Narrow viewport is a fit smoke check, not mobile/touch approval.

Both canonical concepts, full-floor captures, exterior-window/conference-join details, zoomed views and a deterministic intermediate slide were visually inspected. At 300ms into travel, the outgoing shell/slab and incoming shell retain 98.36 CSS pixels of clearance, with all pins hidden. S4/W2/W3/W4 and W1 revalidation are complete for this pass. Evidence and live geometry/camera measurements are outside source control in this chat's visualization directory, linked in VISUAL-REVIEW.md. Native render counts: Home 800 calls/168,882 triangles; Resources 805 calls/177,806 triangles. No new performance guarantee. Remaining full-floor framing, light/material depth and blue tower surroundings belong to V6/V7; fallback artwork remains the unmodified canonical concepts. No dependency, character asset, production route or tool-launch change.

## Latest planning update: V6 live 3D background, depth and shadows

Eight user answers confirm actual abstract stepped cube/prism geometry, with larger/sharper near forms and smaller/fainter far forms using subtle haze, asymmetric reference-like clusters and cropped foreground. Home/Resources share one environment and the office camera, without decorative parallax. The environment moves gently with existing floor-slide progress, with no ambient floating/bobbing. Real soft shadows fall onto neighboring blocks and a subtle pale-blue 3D base/ground below the office.

Expanded V6/B1 with deterministic world-space placement, orthographic depth treatment, white non-glowing materials, shadow casters/receivers/coverage, base clearance below the full cinematic travel envelope, unchanged office fit/pan bounds and motion lifecycle. Validation will inspect actual scene geometry/shadow behavior under zoom/pan/transition, not just a still screenshot. Existing background already uses instanced boxes; it currently lacks the new stepped arrangement/depth/shadow setup. Runtime, assets and canonical references remain unchanged; only planning docs changed. All 30 required ledger items retain stage coverage, and document links/reference integrity are checked. No build/tests/browser validation was rerun for this planning-only revision.

## Earlier planning update: V5C exterior windows and wall tops

Nine user answers confirm thick exterior frames using the exact cream wall material; Resources main glazing stops before the small rear office, which retains one separately framed broad window; Home's inter-room wall has two roughly equal undivided windows with one narrow cream section and retains its private-office openings in the new style. Broad panes sit above a low sill. Interior glass partitions/dark mullions/tan doors remain. Lower only tall northwest/rear perimeter walls to the existing glass-room visible tops, including caps; retain 0.58m low fronts, 0.32m thickness, square footprint and existing base.

Added S4/W2/W3/W4 and W1 revalidation to V5C before V6/V7, with shared frame/height file ownership, named main/private opening boundaries and replacement of obsolete full-glazing/old-window-endpoint tests. Coverage now includes 30 required items; prior V5A/V5B evidence remains historical. Recheck base fit/pan/marker projection after eventual height changes without altering the approved view interaction. Current code still has 3.4m tall walls, thin dark exterior posts and old opening spans. Only planning documents changed; runtime, assets and canonical concepts remain unchanged. Documentation coverage/links/reference integrity are checked; runtime tests/build/browser checks are not rerun for this planning-only update.

## Earlier visual checkpoint: V5A–V5B

V5A doubles shared wall thickness to 0.32m and raises front cutaways to 0.58m, retaining the 20×20 square and existing 0.45m grey slab. Rear offices derive their corner anchors from the new inner edge. Home Ithaca moves slightly screen-right to [-3,4.85], with its vertical aisle/walker moved to x=0 and the horizontal walker start at x=1.3. Home's corrected exterior opening ends at z=-1.2 to preserve projected clearance after wall thickening. Added a cream couch/table/rug in the northwest gap and a new northeast bookcase/low countertop; retained the original lounge/bookcase/coffee station. Small supporting offsets keep all furniture within the thicker walls and out of walking envelopes. Explicit Home conference door data removes the front tan doorway and makes the existing side glass entrance tan; other room defaults remain.

Navigation now matches the supplied crop with 18px regular system sans, 36px gaps, 1px underline, 14px/10px vertical padding, existing resting colors and hover #155cff / active hover #4677ff. Native header, focus targets, inert About and three pins remain.

V5B separates base camera fit from cursor-anchored 1–2× wheel zoom and bounded screen-space pan. Primary-button drag starts after 5 CSS pixels anywhere in the scene, including desk/pin overlays. Out-of-bounds motion has exponential resistance capped at 48 CSS pixels and a critically damped 0.55s return; minimum zoom has exactly zero resting pan range. Reduced motion clamps release/reset immediately. Pins/labels keep their CSS size and project from the actual camera on view revisions; busy gestures hide labels, then restore hover from the new projection. Native scroll/snap track is removed. Home/Resources/hash/history control one 700ms vertical slide and centered view reset; wheel never changes floors. Keyboard +/−, arrows and 0 work when the office is focused; browser Ctrl/Cmd zoom is preserved. Resize retains zoom and recenters pan. Visibility cancellation clamps transient overshoot, pauses rendering/people and preserves a settled zoomed view.

115 frontend tests across 15 files pass. Build passes (3D lazy chunk 1,003.44KB / 272.92KB gzip; existing chunk warning remains). Lint has zero errors and the pre-existing Delphi hook warning. Geometry/full-stride tests protect square containment, room/window/pod order, inventory and paths; new pure view tests cover zoom, limits, resistance, anchoring and wheel modes. Marker tests cover camera/gesture hover refresh; navigation tests now assert wheel/scroll do not select floors and header/hash changes do.

Browser plugin not available; bundled Playwright/Edge checked identity, meaningful scene, no framework overlay and zero normal-path console errors/warnings. Both motion modes and DPR 1/2 passed cursor zoom, both zoom caps, all pan edges/corners, minimum-zoom bounce, drag through pins, cancellation, interrupted rebound, keyboard/focus/Escape/inert activation, resize, header/history/reload and view reset. Camera-to-DOM alignment remains within one CSS pixel; pin dimensions remain 40×52 CSS pixels at native width. Fit/projection checks cover 1672×941, 1920×1080, 1440×900, 1280×800 and 390×844; narrow fit is not touch/mobile design approval. Simulated visibility events verify frozen demand-frame counts and resumed rendering; actual OS/browser lifecycle differences remain a V7 review limit. Forced WebGL fallback retains correct concept selection/native header and zero visible projected pins. Original home stays lazy, with no office/Three/GLB requests. No solver/backend or remote asset requests occurred.

Both concepts, the nav crop and latest renders were inspected with view_image: thicker perimeter/low walls, preserved square/base, Ithaca gap, new left couch and northeast inventory, relocated tan door, nav scale and zoomed fixed-size markers. Evidence stays outside the repo and is linked in VISUAL-REVIEW.md. Native-size render counts: Home 793 draw calls / 168,798 triangles; Resources 806 / 177,758. No new FPS/cross-device guarantee. No dependency, character asset, canonical concept, production route or tool-launch change. V6 light/material/background and V7 final fidelity/performance acceptance remain pending.

## Earlier planning update — Home meeting-room door

Added N5 to V5A: remove the left tan door in Home's far-left long-table meeting room, restore glazing at that position, and replace its existing glass door with a tan/pale-wood door in place. Keep the room flush and leave all other room doors unchanged. Updated the current plan, specification, decisions, index and review coverage to 26 required items. This is planning only; runtime and canonical images remain unchanged.

## Earlier planning update — couch, hover and bounded view controls

Eleven user answers confirm an additional Home cream couch/table/rug in the northwest-wall gap between glass rooms; inactive navigation hover in existing active blue and active hover in lighter blue; wheel-only cursor-focused 1–2× zoom; drag from scene/desks/pins; bounded pan with resisted stretch/release rebound; centered 1× reset with header-only floor slides; and constant on-screen pin/label size. The extra grey-band proposal is removed because the user confirms the layer already exists. S3 is withdrawn rather than marked as newly implemented.

Added [CAMERA-PLAN.md](CAMERA-PLAN.md) and V5B after V5A, before V6/V7. Updated 25-item required coverage, file ownership, marker/input coordination, resize/bounds, navigation/history, demand rendering, reduced motion, fallback and focused verification. Superseded locked zoom/pan and wheel-to-switch-floor rules in the current specification; historical implementation records below remain unchanged. No runtime, assets, production routes or approved image changes. Documentation links/coverage and unchanged concepts are checked; runtime tests/build/browser interactions are not rerun for this planning-only update.

## Earlier planning update — shell, Home spacing/inventory, typography and background

Earlier planning checkpoint: added V5A with shared thicker walls/taller front edges, a proposed grey bottom band (now withdrawn), a slight screen-right move for Home's whole Ithaca cluster with coordinated walking paths, a new bookshelf/low countertop on Home's upper-right wall and navigation typography matching the deployed-home crop with current colors. V6 explicitly includes white cube/rectangular-prism stacks, not just softened blue towers. Its earlier 22-item coverage is superseded by the current 25 required items.

Saved one user-supplied navigation crop under `references/navigation-deployed.png`; canonical office concepts remain unchanged. Updated the visual plan, review ledger and supporting design/decision/index documents. No runtime, layout, material, model or production-file edits were made for this planning request. V5A must finish before V6 lighting and V7 final comparisons. Planning verification checks coverage, links and reference integrity; prior test/build/browser results below have not been rerun for documentation-only changes.

## Earlier visual checkpoint: V3–V5

| Stage | Result | Evidence |
| --- | --- | --- |
| V3 | Shared shaped chair cushions, five-spoke bases/casters, refined desk frames/screens/keyboard/mouse and capped partitions; closer seats use shared DESK dimensions; rug footprint remains 4.2×4.3m and hit height is 1.62m | Native-size sample crop, chair/rug/hover-volume and seat tests; all six pods reuse the same cached kit |
| V4 | Segmented glass, vertical mullions, door headers/handles and wood panels; no glass over the private office rear wall; 4.2m six-chair conference tables, fuller lounges/wood supports, pointed broad foliage and clearer coffee/printer details | Both floors and room/north-office detail crops compared with canonical references; canopy/fixture/aisle tests |
| V5 | Same two licensed GLBs with fuller proportions and larger heads, about 1.84m actual standing height; per-rig seated hips/hands/feet aligned; paused first frame redraw fixed; full-stride route envelopes | Actual skin-bound/hash/rig/clip/pose tests plus 18 independent browser rigs, active/inactive motion, reduced-motion and simulated visibility pause checks |

108 tests across 14 files pass; lint has zero errors and the pre-existing Delphi hook warning; production build passes with the existing chunk warning. Browser QA used bundled Playwright/Edge because Browser is unavailable. Identity, meaningful scene, no overlay/normal-path console warnings, hover/focus/Escape and inert activation, travel-disabled markers, floor navigation/history/reload, five viewport fits and DPR alignment passed. Both GLBs, manifest and credits were regenerated from the same verified external source files; the /notices entry describes the changes. A package-name-plus-version React key fixes the duplicate scheduler notice warning found during attribution QA. No dependency, reference PNG, production route or worker-count change.

Current screenshots and details are `office-v345-*.png` in the chat visualization directory, linked in the review ledger. Mesh/rig numeric validation keeps hips above the chair, hands at the keyboard and shoe soles above the floor. The 0.9m body-width / 1.5m stride envelope is inside reserved aisles; Resources' endpoints were shortened to preserve furniture and walker clearance. Actual source topology remains faceted; softer lighting/materials/skyline and final fidelity/performance acceptance are still V6/V7. The renderer recorded 744 draw calls/164,070 triangles on Home and 806/177,758 on Resources at 1672×941; no new frame-rate guarantee is claimed.

## Earlier visual checkpoint: V0–V2

| Stage | Result | Evidence |
| --- | --- | --- |
| V0 | Both floors use one 20×20 square; both small rear offices meet the wall junction; Home cabinet/books/plant, room art/shelving/wood door and Resources lounge bookcase restored; side desks/amenities reblocked and seats/paths updated | Shared square/containment tests, corner and seat tests, repeated walker clearance tests, live scene inspection and native-size captures |
| V1 | Named northwest openings replace the eight-bay boolean mask; Home's leftmost opening spans z=-2.5 to -1 and clears both the conference-backed wall and projected glass-room silhouette; cream infill has no window-only posts; Resources stays fully glazed | Opening coverage/no-overlap and projected-edge invariants plus Home window crop |
| V2 | Full-viewport desktop scene behind native header; shared fixed camera `[28, 24, 28]`, padding `1.015`; larger floor occupancy; Times/Arial header tuning; paused-scene marker projection corrected | Both floor captures at 1672×941, fitting at four other sizes, DPR 1/2 alignment and reduced-motion navigation |

The native-size square spans approximately x=106–1566 (87% of 1672 pixels), compared with roughly 74% in the previous checkpoint. All floor corners, workstations and pins remain in view. The illustrations crop the slab edges; the implementation retains the specified full-floor fitting. Furniture/person silhouettes and lighting/background still differ and remain assigned to V3–V6. No new dependency, GLB/clip change, reference regeneration or production migration was introduced.

Validation: 101 tests across 13 files pass; lint has zero errors and the existing Delphi hook warning; build passes with the existing large-chunk warning. Browser plugin not available, so bundled Playwright/Edge checked meaningful content, identity, no overlay, zero normal-path console errors/warnings, whole-desk/pin/focus/Escape labels, inert pointer/Enter/Space, disabled travel markers, header/scroll/history/reload/resize, reduced-motion instant switching and frozen frames. Both floors fit at 1672×941, 1920×1080, 1440×900, 1280×800 and 390×844. DPR 1/2 pin coordinates differ by less than one CSS pixel. Forced WebGL failure retained the correct concept/native navigation with no visible pins. Original homepage lazy isolation and Resources link passed; no solver/backend or remote asset calls occurred. Narrow fitting is not mobile design approval; no new cross-device frame-rate claim is made.

One browser-discovered issue was corrected in OfficeCanvas: DOM marker nodes can remount after a paused Canvas frame during instant floor switches. Ref attachment now advances a projection revision and invalidates rendering, so the new pins receive their projected coordinates. React review retained shared geometry/materials, lazy loading, typed layouts and no per-frame React state.

Final screenshots/detail crops are outside source control in the chat visualization directory as `office-v012-*.png`; the review ledger links the two full floors and lists detail evidence. Approved reference PNGs and earlier authorized deletions remain intact.

## Earlier functional phases 1–8 (historical baseline)

| Phase | Status | Evidence |
| --- | --- | --- |
| 1. Dependencies and asset plan | Complete | Pinned dependencies; validated clothed GLBs, clips, rigs, dimensions, licenses and hashes in ASSETS.md/manifest |
| 2. Isolated preview | Implemented | Lazy `/preview/office` route, native header, direct floor anchors, About as text, noindex, loading and static concept fallback |
| 3. Floor blockouts | Implemented | One 22x18 metre shell; shared camera/geometry; three named pods per floor; distinct conference-room positions; secondary workstations/amenities and reserved aisles |
| 4. Materials, lighting and native overlays | Implemented and browser-verified | Shared procedural finishes, furniture detail, single-pane glass, neutral tone mapping, variance shadows, instanced surroundings, native projected SVG pins |
| 5. Tool-name disclosure | Implemented and verified | Whole-desk/pin hover, keyboard focus, Escape dismissal, three targets per floor and inert activation |
| 6. Vertical floor travel | Implemented and verified | Native scroll progress, sticky Canvas, shared header/wheel/keyboard/history path, resize preservation and reduced motion |
| 7. Animated people | Implemented and verified | Nine workers per floor, independent GLB rigs, clear aisle routes, seated activity, active-floor/visibility pause and cleanup |
| 8. Verification and review | Functional checks complete; visual refinement pending | 97 tests, build, lint, baseline reference inspection, browser flow/fallback/isolation checks and host performance sample |

## Approved layout revision

The latest Home and Resources PNGs replace the previous references in place under `concepts/`; their source identifiers and SHA-256 hashes are recorded in [README.md](README.md). The static scene and fallback use this revision. No duplicate superseded concepts are retained.

Home's long-table meeting room meets the far-left shell corner, with its doorway facing the interior. The outer tool pods sit higher than the middle pod in camera space, with clear gaps between their rugs. Selected northwest window bays are opaque. The central component is a round table with three armchairs and a plant, without a bookshelf. The rear sofa lounge, right coffee counter, standalone printer, conversation nook, bookcase and unmarked workbench complete the layout.

Resources retains the right-side meeting room and fully glazed northwest wall. Its foreground now contains an unmarked two-person workbench and a two-armchair reading nook. The low partitioned storage enclosure is removed; the printer and coffee station remain standalone. Both pages retain exactly three location pins and the identical outer floor geometry.

The obsolete enclosed-support room type and rendering branch were removed. Current plans and required license records remain; the previously authorized repository cleanup is preserved. The earlier request authorized all remaining functional phases. No production migration or new About/tool-launch behavior was added.

## Phase 4 implementation

- Tuned cream tile, pale wood, navy upholstery, gray partitions and green foliage against the approved references. Deterministic DataTexture wood grain, fabric weave and tile variation are shared and mipmapped; there are no remote textures or environment downloads.
- Added reusable cushion/tabletop bevels, sofa cushions, chair arms, desk plants, blue decorative monitor/whiteboard charts and clearer coffee/printer details. Existing furniture transforms, room bounds, shared shell and reserved aisles remain unchanged.
- Replaced transparent boxes with single double-sided glass planes, retaining depth testing and disabling depth writes. Interiors remain visible through overlapping rooms from the fixed camera.
- Added warm directional daylight, cool fill and neutral tone mapping. Built-in variance shadows use a 2048 map, radius 8 and eight blur samples. The unused shader-injection approach is removed; normal browser runs have no shader warnings.
- Added nine pale blue neighboring towers in one instanced mesh, below the office slab and outside its footprint. They do not influence the shared camera-fit bounds.
- Replaced mesh pins with filled blue-gradient SVG location icons in the native DOM. The scene projects them through its actual fitted camera in CSS pixels. This avoids extra React roots, DPR-dependent positioning and per-frame React state; phase 5 adds the disclosure behavior below.

The approved PNGs remain unchanged and serve only as references/fallback images. No new npm package or generated image was needed for the remaining phases.

## Remaining phases implemented

- **Disclosure:** A projected convex hull follows each marked desk volume, excluding adjacent furniture. Whole-desk hover, pin hover and keyboard focus show the same native name. A 120 ms close grace bridges pointer movement; Escape dismisses the name. Buttons have visible keyboard focus and do nothing on click, Enter or Space. Markers are disabled/hidden during travel.
- **Floor travel:** A native two-viewport scroll track contains one sticky scene. scrollTop/clientHeight supplies all progress; header links, wheel/trackpad, Page Up/Down, direct hashes and history use that same source. Both floors move during travel, with a camera-derived cinematic separation that keeps the upper slab from obscuring Resources at rest. Resize preserves progress. Reduced motion selects an endpoint immediately.
- **People:** Two local clothed Quaternius GLBs supply independent cloned rigs for seven seated workers and two walkers on each floor. Supplied Walk/Idle clips and an authored DeskIdle loop animate them. Paths stay clear of furniture, perimeter and each other. Only the active settled floor advances; hidden tabs and reduced motion pause movement/mixers. Per-person skeleton GPU resources are disposed on unmount while cached geometry/materials remain shared.
- **Asset delivery:** The unsuitable free superhero base meshes were rejected. The selected Business Man/Suit binaries, source and output hashes, preparation script, attribution, modifications and full license texts are saved. `/notices` includes the character credit; there are 31 notice entries. No paid acquisition was made.

## Preview

Run `npm run dev:web -- --host 127.0.0.1` and open `/preview/office#home` or `/preview/office#resources`. Scroll or use the header to move between floors; focus a pin to reveal its tool name. The existing `/`, research anchors, tools and policies retain their route contracts.

The floor scene is lazy-loaded independently of the native header/fallback. The homepage does not import it. No solver requests, tool launches, About route, modal or new financial calculation is introduced.

## Intentional milestone limits

- All functional preview phases are implemented. Visual refinement and its review remain pending under VISUAL-PLAN.md; the preview is not a production migration.
- Tool activation remains inert; About remains plain noninteractive text. Resource readers are not migrated into the office.
- The fixed camera fits the same shared bounds on both floors. There are no orbit controls.
- Shared physical elevations encode Home above Resources. Travel exaggerates their visual separation to one fitted viewport to preserve the cutaway view.
- The characters follow the requested low-poly direction. Their mesh style and the sharper procedural skyline differ from the generated illustration; no screenshot is used as the interactive scene.
- Desktop is the target. A narrow viewport fits the entire floor without overflow; a designed mobile/touch presentation remains later work.

## Verification

Browser checks used bundled Playwright with Edge because the Browser plugin was not available in that session. Home/Resources, hover, travel and fallback screenshots and both approved concepts were inspected with view_image. That baseline inspection covered perimeter/room placement, desk spacing, northwest window coverage, palette, glass, furniture, shadows, surroundings, pins, typography and people. It did not establish finished reference fidelity: the Home window overlap and differences in framing, furniture, character proportions and rendering remain open in VISUAL-REVIEW.md. The verification results below belong to the earlier runtime checkpoint and were not rerun for this documentation-only change.

Focused tests cover floor containment, tool ordering using the actual camera, furniture/room/rug clearance, window infill, reserved aisles, repeated walking cycles and walker separation, hover-to-pin continuity, focus/Escape disclosure, inert activation, travel-disabled markers, scroll-derived active navigation/history, direct anchors, noindex, inert About and homepage lazy-loading isolation. The complete frontend suite passes 97 tests across 13 files. Lint has zero errors and one pre-existing hook dependency warning in DelphiSurface.tsx. Production build passes; Vite reports the large lazy 3D and existing Plotly chunks.

Sandboxed full-suite/build attempts encountered worker/temp-file resolution permission errors. The same checks passed outside that sandbox without application workarounds.

Final browser QA passed at the PNGs' native 1672x941 size, plus 1920x1080, 1440x900, 1280x800 and a 390x844 fit check. Pins remain ordered and inside the viewport, with no horizontal overflow. Positions/CSS dimensions match within one pixel between DPR 1 and DPR 2. The tested flow was Home → desk/pin hover and keyboard focus → inert activation → Resources click/slide → Back/Forward/reload → wheel up/down → Page Up/Down → resize. Markers disable while traveling and recover at both endpoints. About remains noninteractive.

Renderer inspection confirmed 18 unique worker rigs, nine workers per floor, moving active walkers, subtle seated head activity, unchanged inactive workers and paused hidden-tab rendering. Reduced-motion screenshots remained identical over time, with direct floor selection for header and wheel input. All animation-track endpoints match for seamless loops. The latest seated pose raises forearms to desk height and keeps the feet above the floor.

Page identity, meaningful content, absence of framework overlays, zero normal-path console warnings/page errors and no backend/solver or remote asset requests were verified. The original homepage makes no office/Three/model requests, retains its `/#resources` link, and opens/focuses the `/#crr` paper reference. `/tools/ithaca`, `/tools/troy`, `/tools/delphi`, `/privacy`, `/terms` and `/notices` render their existing headings/titles. Forced WebGL failure reaches the approved image fallback; Home/Resources still navigate and zero projected pins remain visible. Renderer diagnostics in that deliberately unsupported context are expected.

The earlier checkpoint screenshots and both source concepts were inspected together with view_image. The comparison below records that implementation baseline; remaining differences are refinement work, not final visual acceptance.

| Comparison point | Milestone result / remaining difference |
| --- | --- |
| Shell perimeter | Shared rectangular geometry and camera fit; no northeast wall bump or right exit corridor |
| Main desk anchors | Three pins and explicit Ithaca/Troy/Delphi ordering on both floors |
| Room arrangements | Home conference room flush at far-left corner; Resources conference room on right; both have six-seat long tables and a private office |
| Home northwest window | Open bay index 5 overlaps the conference-backed wall span; repositioning is planned as V1, not yet implemented |
| Header/copy | CapitalCanvas / Home / Resources / About retained as native text; stronger navy serif wordmark; visible copy diff has no added/removed labels or CTA |
| Furniture density | Approved inventory retained; added bevels/cushions, chart lines, plants and amenity details inside existing footprints; deliberately simple geometry remains consistent with the requested low-poly direction |
| Lighting/materials | Neutral tone mapping restores cream/pale wood color; subtle mapped finishes and blurred shadows replace flat surfaces/hard edges; glass no longer stacks six transparent faces per panel |
| Background | Pale blue instanced tower silhouettes and sky gradient now present; procedural scenery has sharper edges than the generated illustration |
| Marker treatment | Three crisp native filled pins; whole-desk/pin and keyboard name expansion; edge-aware native labels; inert activation |
| People and motion | Clothed low-poly GLB workers, seven seated/two walking per floor; subtle seated activity; vertically sliding floors; reduced-motion and visibility pause |

React review checked lazy boundaries, stable motion/visibility subscriptions, timeout/listener/observer/mixer/skeleton cleanup, shared resources, scoped CSS, typed layout/route ownership, native focus, stable SVG IDs and absence of per-frame React state. Projection only changes on progress/viewport/floor changes. The lazy 3D chunk is approximately 985 kB before gzip; the two local GLBs total about 2.05 MB. A 120-frame Edge sample at 1672x941 measured median 16.7 ms and p95 16.8 ms, with 752 draw calls and 113,570 triangles on Resources. This is evidence for the available host, not a cross-device performance guarantee.

Above-the-fold copy remains CapitalCanvas / Home / Resources / About; Ithaca/Troy/Delphi appear only through the approved disclosure. Loading/fallback messages are native text; no marketing copy or CTA was added. Commands: `npm --prefix apps/web run test`, `npm --prefix apps/web run lint`, `npm --prefix apps/web run build`, and the notice generator. Browser scripts ran inline; final screenshots are outside the repo in the chat's visualization directory as `office-final-*.png`. No QA report or trace was committed to source.
