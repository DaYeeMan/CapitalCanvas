# Office visual refinement plan

Status: V0–V5 and V5A–V5C implemented and verified. V5C exterior windows/wall height completed October 14, 2026; V6's real 3D surroundings, depth/shadows and V7 remain pending. Nine window/height answers and eight background answers are recorded in [DECISIONS.md](DECISIONS.md). See [PROGRESS.md](PROGRESS.md) and completion evidence in [VISUAL-REVIEW.md](VISUAL-REVIEW.md).

The functional preview from phases 1–8 is the starting point. This pass brings its composition, furniture, people and rendering closer to the approved [Home](concepts/home-approved.png) and [Resources](concepts/resources-approved.png) images. Those images remain the visual authority, with the user's recorded corrections/additions taking precedence, including the new Home couch and camera interaction. [DESIGN.md](DESIGN.md) defines current behavior and layout constraints. No reference regeneration is needed.

## Scope and ownership

Keep the isolated preview, fixed isometric camera angle, three tool identities and inert tool activation/About. Wheel zoom, elastic pan and header-only floor slides are implemented. Both floors share one 20×20 square; V5A's wall thickness/front edges, furniture, door and header changes are completed checkpoints. New V5C revises exterior window style/spans and lowers tall walls, preserving those other results. The grey-band addition stays withdrawn. Production migration, tool launching, camera rotation and extra character animation remain outside scope.

All implementation paths below are relative to `apps/web/src/site/office/`. These are edits to existing modules, not instructions to scaffold another app. Each stage ends with the listed evidence and an update to [VISUAL-REVIEW.md](VISUAL-REVIEW.md). Do not mark visual fidelity complete from passing functional tests alone.

| Order | Stage | Primary files | Completion evidence |
| --- | --- | --- | --- |
| V0 | Square both floors and correct their layouts | `layouts.ts`, `OfficeShell.tsx`, `OfficeFloor.tsx`, `Furniture.tsx`, `peoplePaths.ts`, `layouts.test.ts`, `peoplePaths.test.ts` | Equal world-space width/depth; both rear offices corrected; Home north inventory and Resources lounge/bench corrections blocked; clear aisles and seats |
| V1 | Correct Home window placement | `layouts.ts`, `OfficeShell.tsx`, `OfficeFloor.tsx`, `layouts.test.ts` | Window outside conference-backed wall span; Home reference comparison; Resources glazing retained |
| V2 | Match framing and proportions | `OfficeCanvas.tsx`, `layouts.ts`, `office.css`; `LocationMarker.tsx` only if pin shape needs tuning | Both floors compared at 1672×941 with one shared fit rule; no hidden pins or clipped workstations; header/pin proportions checked |
| V3 | Refine one desk cluster, then reuse | `Furniture.tsx`, `sceneResources.ts`; bounds in `layouts.ts` and seat anchors in `peoplePaths.ts` if affected | One fully reviewed pod silhouette, then all six pods; rugs, hover regions and seats aligned |
| V4 | Refine rooms and supporting furniture | `Furniture.tsx`, `sceneResources.ts`; `layouts.ts` only where placement needs tuning | Readable glass rooms, fuller lounges and amenities on both floors without blocking paths |
| V5 | Match character presence and seating | `OfficePeople.tsx`, `peoplePaths.ts`; existing character preparation script/assets only if necessary | Fuller, appropriately sized people; hands/feet/chairs aligned; existing motion lifecycle preserved |
| V5A | Correct shell proportions, Home spacing/inventory and header | `layouts.ts`, `OfficeShell.tsx`, `Furniture.tsx`, `peoplePaths.ts`, `sceneResources.ts`, `office.css`; fit bounds in `OfficeCanvas.tsx` if affected; existing geometry/path tests | Thicker walls/taller front edges, Home Ithaca gap, northeast shelf/counter, additional couch/table/rug and revised meeting-room door; screenshot-matched nav type and hover colors; existing grey base retained |
| V5B | Add bounded zoom/pan and revise floor navigation | `OfficePreview.tsx`, `OfficeCanvas.tsx`, `useOfficeNavigation.ts`, `LocationMarker.tsx`, `office.css`; planned `OfficeViewControls.tsx`, `officeView.ts` and focused tests | 1–2× cursor-anchored wheel zoom, drag from scene/desks/pins, bounded resting pan and resisted snap-back; header-only floor slide/reset; constant-size aligned markers; see [CAMERA-PLAN.md](CAMERA-PLAN.md) |
| V5C | Revise exterior windows and align tall wall tops | `layouts.ts`, `OfficeShell.tsx`, `Furniture.tsx` shared height constants, `OfficeViewControls.tsx` shell fit bounds, `layouts.test.ts`; existing path/view checks | Thick cream exterior frames; Home two broad middle windows; Resources main run separated from one rear-office window; tall wall/cap tops match glass rooms; low front walls retained |
| V6 | Finish light, materials and rendered 3D surroundings | `OfficeCanvas.tsx`, `sceneResources.ts`, `OfficeSurroundings.tsx`, `office.css`; focused environment bounds/shadow checks if needed | Softer daylight/material depth; real white stepped block stacks at near/mid/far depths with haze, rendered soft shadows and pale-blue base; shared camera and gentle floor-slide movement |
| V7 | Verify and present both floors | Existing office tests, browser QA, `PROGRESS.md`, `VISUAL-REVIEW.md` | Updated screenshot comparison, interaction checks, measured performance and remaining differences |

V0–V5 and V5A–V5C are completed checkpoints. Window/height geometry and shared base fit/pan bounds are verified. V6 lighting/background and V7 remain the next stages when authorized. Reuse refined furniture and people rather than repeating their completed passes.

## Review coverage audit

All 30 required discrepancies/checks in [VISUAL-REVIEW.md](VISUAL-REVIEW.md) are assigned below. S3 stays withdrawn; S4/W2/W3/W4 are new, with W1 revalidation assigned to V5C. This is complete coverage of known findings, not a guarantee that implementation comparisons cannot reveal another mismatch. Add newly observed discrepancies to the ledger before claiming completion.

| Stage | Review IDs | Required result |
| --- | --- | --- |
| V0 | S1, N1, N2, R1, R2, R3 | Shared square; corrected rear offices on both floors; Home north inventory; Resources lounge bookcase and right workbench placement. N2/R1/R2 have blockout acceptance here and detail acceptance in V4. |
| V1 | W1 | Home opening outside conference-backed wall; Resources glazing preserved |
| V2 | C1, H1 | Reference-like shared framing; header and pin proportions tuned after camera fitting |
| V3 | F1 | Refined reusable pod/chair geometry with aligned seats, rugs and hit regions |
| V4 | N2, R1, R2, F2, F3, F4 | Complete planned furniture/accessories, glass/door detailing and fuller plants on both floors |
| V5 | P1 | Fuller character presence and correct seated alignment without motion regressions |
| V5A | S2, F5, N3, N4, N5, H1, H2 | Shared wall/front-edge proportions, Home Ithaca spacing, northeast shelf/counter, additional couch/table/rug, meeting-room door revision, smaller deployed-site nav type and hover colors |
| V5B | I1, I2 | Bounded 1–2× wheel zoom/elastic drag, aligned constant-size markers, header-only floor switching and view reset; current full-floor fit is minimum zoom |
| V5C | S4, W2, W3, W4, W1 revalidation | Tall wall/cap alignment, cream exterior frame profile, separate Resources office window and Home's two-window middle run; preserve conference backdrop/window separation with revised tests |
| V6 | L1, L2, B1 | Soft daylight/material depth, tile/rug treatment and real 3D near/far white cube/prism stacks with rendered shadows/haze, a pale-blue base and coordinated floor-slide movement |
| V7 | Q1, H1 and all above | Final header/pin check, evidence for every item, runtime regression checks and honest remaining-difference report |

Each stage's file ownership is in the table above. No required recorded item is merely a suggestion without an implementation stage. User answers define the new couch composition, hover states and view interaction in the sections below and CAMERA-PLAN.md. Exact wall dimensions, furniture offsets, wheel sensitivity and spring tuning remain implementation choices to review against those requirements.

## V0 — Square footprint and both-floor layout corrections

Before V0 the shared shell was 22 metres wide and 18 metres deep. V0 now uses one 20 metre side length for both width and depth in `BUILDING`. This keeps approximately the previous floor area while correcting the aspect ratio, without stretching furniture or enlarging empty space. The prior 22×18 dimensions below are baseline evidence, not a current design requirement.

Recalculate shell corners, perimeter-anchored rooms/fixtures, window spans, rugs, camera-fit bounds and background clearance from that shared square. Reblock both interiors instead of uniformly stretching furniture. Keep Home's long-table room flush far left and Resources' long-table room on the right; retain their distinct layouts, three named pods and Resources foreground furnishings. Revalidate walker paths, private-office seat anchors and furniture containment after moving any room or fixture.

Home's north area means the rear/top portion of the fixed-camera image around the **smaller private glass office**, not the far-left long-table conference room. In the current render the private office sits too far along the solid rear wall and leaves a large strip between itself and the northwest window wall. Reposition and size it toward the rear corner where the northwest glazing meets the solid wall, matching the reference's silhouette, orientation and relationship to the sofa on its right. Select exact coordinates from projected comparisons after the square shell is established; do not simply retain `private.at = [-5.3, -6.6]`.

Use this north-area inventory to distinguish missing components from existing simplified ones:

| Reference component | Current baseline | Planned correction |
| --- | --- | --- |
| Small glass private office, desk and navy chair | Present, but position and enclosure composition differ | Reposition/reblock enclosure and workstation together; include inward doorway and pale wood door panel |
| Private-office wall art/chart and low rear shelving/books | Absent from the private-room renderer | Add reference wall art and compact book storage in the rear office area; coordinate opaque backing and glass |
| White square planters framing office/window edges | Plants exist but placement/scale does not establish the reference arrangement | Place them relative to the corrected room corners and wall, preserving door and aisle clearance |
| Low pale-wood cabinet outside/front-left of private office, with books and small plant | Plain storage fixture exists; reference top accessories are absent | Reposition with the room and add books/plant; keep it outside the central three-chair nook |
| Cream sofa, navy pillow, pale-wood coffee table and rug to the office's right | Present in simplified form | Match orientation, spacing and proportion to the corrected private room and rear wall; refine later in V4 |
| Coffee counter/stools, standalone printer, right conversation nook/bookcase and perimeter desk | Present, with layout/detail differences | Audit the full rear/right sequence against the reference and reposition after the shell changes; fill only confirmed inventory gaps |

This inventory is a minimum reconciliation list, not a claim that every existing fixture must be replaced. During reblocking compare the entire north-area reference crop and record any additional visible omissions in the review ledger. Do not add unsupported furniture merely to fill the expanded floor. Existing people may be repositioned with furniture; no extra workers or animations are required by this correction.

The Resources reblock also needs explicit reference corrections: move its smaller private office toward the rear corner rather than preserving the same offset as the current Home office; account for its wall art, wood door panel, rear book storage and planters. Add the missing low bookcase beside the window-side sofa, keeping the existing two-armchair/round-table component and coffee table together as a coherent lounge. Reposition the right unmarked workbench from its current foreground-edge placement toward the reference side/back relationship to the right tool pod, coordinating its nearby bookcase and planters. Verify these relationships after the square footprint change rather than copying Home's new transforms.

Acceptance: `BUILDING.width === BUILDING.depth`; Home and Resources instantiate the same square slab and corners; no northeast protrusion or hallway. The small Home office occupies the reference's rear-corner area with no unintended wall pocket, and its cabinet, plants, shelving/art and adjacent lounge have accounted-for placements. Resources' small office also occupies its reference rear-corner area, its lounge includes the missing bookcase footprint, and its right bench sits beside/behind the right tool pod rather than on the foreground edge. The rooms, glass planes, doors and furniture do not overlap incorrectly; walkers and seated workers remain aligned. Add meaningful shared-square/containment checks and update route clearance tests. Capture both floor blockouts and detail crops of both rear offices, the Resources lounge and right bench before moving to V1/V2; detailed cushions and accessories may finish in V4.

## V1 — Home leftmost window correction

The user reports that the leftmost Home window appears inside the glass meeting room and does not match the reference. Keep the meeting room flush in the far-left corner; move the window into the intended open-office portion of the northwest exterior wall. The conference-backed portion should read as the intended cream wall backdrop, without an exterior opening intruding into the room.

Superseded 22×18 baseline source evidence (the boolean mask has now been replaced):

- `OfficeShell.tsx` places eight equally spaced bays on the northwest perimeter at world `x = -11`. Home's `northwestWindows` is `[true, true, false, true, false, true, false, false]`.
- Home conference bounds are approximately `x = [-10.92, -6.72]`, `z = [2.72, 8.92]`.
- Open bay index 5 is centered at `z = 3.375` and spans approximately `[2.29, 4.46]`. Its wall span overlaps the conference bounds. This is a placement/coverage problem relative to the room, not evidence that the pane's x coordinate has moved off the exterior wall.
- The flush-left room omits its own left glass panel and relies on the shell at that edge, so shell glazing determines the room backdrop.

Proposed implementation:

1. After V0 fixes the square footprint and room locations, define named northwest wall segments/openings in floor layout data, with explicit start/end positions where needed. Replace the positional boolean mask if it cannot express the reference placement accurately. Keep slab, corners and structural dimensions shared; derive coverage from the revised room bounds rather than the baseline numbers above.
2. Position Home's leftmost opening beyond the conference-backed wall span. Select its exact width and offset by comparing the fixed-camera projection with the approved Home image; generated pixels are not CAD dimensions.
3. Render cream infill and window jambs from those segments. Distinguish structural posts from window-specific frames so closed wall sections do not retain misleading window outlines.
4. Pass the wall description through `OfficeFloor.tsx` to a generic `OfficeShell.tsx`. Avoid conference-specific coordinates hidden inside the shared shell. Coordinate `OfficeRoom` edges only if a duplicated frame or seam remains.
5. Keep Resources' continuous northwest glazing and right-side conference room. Do not apply Home's opaque segment globally.

Acceptance: no Home exterior aperture overlaps the conference-backed northwest span; no glass shows through its wall backdrop; no conflicting room/shell frames; leftmost opening visibly matches the intended reference location. The room stays flush at the corner and both floors retain identical outer bounds. Add a focused geometric invariant for this mismatch and preserve Resources glazing coverage checks.

Implemented V1: Home's `leftmost` opening spans world z `[-2.5, -1]`; the conference-backed wall starts at `3.72`. The intervening cream wall keeps the opening outside both the room's world-space span and its projected silhouette. An initial shorter gap still read as a window inside the glass room in the close-up, so the opening and its nearby plant moved farther along the wall before this checkpoint. Named openings and their own jambs/dividers replace the global eight-bay mask; Resources retains a fully glazed `[-10, 10]` northwest wall. Geometry and camera-projection tests plus the native-size Home window crop verify the correction.

## V2 — Framing and scale

Compare projected floor corners, header clearance, furniture size and floor occupancy at the reference's native 1672×941 size. The current scene reads smaller and more distant. Adjust shared orthographic fit/target/padding to bring the office forward while keeping workstations and pins visible. Keep the isometric orientation fixed unless a measured reference mismatch justifies a small shared correction.

Use the same framing rule on both floors; do not scale one floor independently. Check 1920×1080, 1440×900 and 1280×800. Resolve any tension between illustration cropping and the full-floor fit requirement by preserving useful content and documenting the remaining difference. Recheck pin projection and camera-derived vertical travel after camera changes.

After settling the camera, compare native header typography and pin-to-desk proportions: wordmark width/weight, navigation size/spacing/underline and pin size/vertical offset. Tune `office.css` and, only if the SVG shape needs adjustment, `LocationMarker.tsx`. Keep native text, projected anchors, keyboard targets and whole-cluster hover behavior intact. These are finishing checks, not reasons to delay the structural corrections.

Implemented V2: the desktop scene now fills the viewport behind the native header, with shared camera position `[28, 24, 28]` and fit padding `1.015`. At 1672×941 the square's left/right corners project to approximately x=106/1566 (87% of viewport width), with the foreground corner at y=914 and the entire shell visible. The earlier checkpoint occupied roughly 74% of the width. The reference illustrations crop the outer slab; this preview preserves the planned full-floor view rather than clipping desks/pins. The wordmark uses a 42px Times serif and navigation uses 20px Arial with a 3px underline. Pin shape/size remain intact after projection checks; final proportions can be reviewed again after V3 furniture and V5 people. DOM marker remounts now explicitly invalidate paused rendering, fixing hidden pins on instant reduced-motion floor changes.

## V3 — Desk furniture

Use one marked pod as the sample: pale wood surfaces with visible thickness, slimmer leg supports, shaped navy cushions/backrests, chair bases and wheels, realistic monitor stands and clean gray partitions. Aim for the reference's rounded low-poly silhouettes rather than adding many tiny objects. Retain chart screens and restrained desk accessories.

Compare the sample with the reference before propagating shared geometry to all pods and secondary benches. If its envelope changes, update `POD_SIZE`, rugs, projected hover bounds, seat transforms and clearance tests together. Keep exactly three marked clusters per floor and avoid intersecting rugs. Do not leave people seated at old chair coordinates.

Implemented V3: reviewed the Ithaca sample at native size, then retained the shared kit across all six marked pods and secondary benches. Chairs have shaped seat/back/lumbar cushions, five-spoke metal bases, casters and armrests; parts are merged by material into three cached meshes per chair. Tables have batched supports, thicker readable wood tops, larger monitors/stands, keyboards/mice and capped partitions. `DESK` owns the dimensions shared by the furniture and seat anchors. Chair offset is now 0.91m, the rug remains 4.2×4.3m, and the projected hit volume extends to 1.62m to include the monitor tops. Geometry and seat tests verify alignment and containment.

## V4 — Rooms and amenities

Refine conference tables/chairs, thin glass mullions, readable door openings/handles, private-office furniture, sofa cushions, round seating, plants, shelves, printer and coffee counter. Keep glass transparent and avoid stacked coplanar panes. Reuse shared furniture/materials; add detail where it changes the visible silhouette.

Specifically compare vertical pane subdivisions and framed door silhouettes: the current rooms read as sparse glass boxes. Add wood door panels, handles and room-side plants where shown. Broaden the current narrow spiky foliage into fuller faceted leaf clusters and size square planters relative to desks/chairs. Complete Resources' missing lounge bookcase and small rear-office furnishings from V0's inventory; retain its two-armchair seating rather than duplicating it.

Home keeps its flush-left long-table room, lower middle pod and central round table with three armchairs and no bookshelf. Finish the corrected small north office, shelving/art, cabinet accessories, plants and adjacent lounge from V0's inventory. Resources keeps its right-side conference room, foreground workbench/reading nook and open space where the storage enclosure was removed. Reuse existing fixtures where possible and add confirmed reference omissions; do not fill reserved walking aisles with new props.

Implemented V4: glass partitions use separate panes with vertical mullions, door headers/handles and pale wood door panels where shown. Shared corner posts avoid duplicate partition posts; the rear private offices use the existing opaque exterior wall rather than glass laid over it. Conference tables are 4.2m long with six shaped chairs and interior planters. Lounges have fuller cushions/arms, wood legs and round tables; coffee stools have wood supports, and coffee/printer details are clearer. Creased pointed leaf geometry replaces narrow spikes; floor planters reserve a 1×1m canopy envelope. Small fixture offsets preserve clearances and separate adjacent plants in projection. Both layouts and the Home window correction remain intact.

## V5 — People

Compare people against desk height, chair width and the reference's fuller stylized silhouettes. Diagnose scale, pose and mesh proportions separately; enlarging the entire rig is not a reliable fix for a thin silhouette. Start with current licensed assets. If mesh changes are needed, preserve rigs/clips, reproducibility, credits and asset hashes in [ASSETS.md](ASSETS.md) and the existing manifest.

Keep the existing seven seated/two walking workers per floor. Adjust seated anchors/poses alongside furniture so hands meet desktops, feet rest above the floor and bodies avoid chairs/partitions. Preserve independent rigs, clear routes, walk timing, reduced motion, inactive-floor and hidden-tab pause. No new crowd system or animation scope.

Implemented V5: reprocessed the same licensed source GLBs with 18% broader bodies, 12% extra depth, 16% larger heads and a 1.8m base normalization (about 1.84m actual standing height). The authored DeskIdle pose targets each rig's hip joints rather than subtracting a fixed Body height; two-bone posing aligns arms/legs and flattened fingers with the desk while keeping soles above the floor. The runtime takes scales/cache versions from the manifest and requests one redraw after applying the initial pose, so paused first loads show seated geometry correctly. The source Walk/Idle clips, 62-bone rigs, seven seated/two walking workers, speed and lifecycle are retained. Paths now reserve 0.9m across the body and 1.5m along the stride; Resources endpoints were shortened where needed. Asset hash, loop, skin-bound, seat/hand/foot and swept-route tests pass. Credits, hashes and /notices are updated in [ASSETS.md](ASSETS.md).

## V5A — Shell, Home layout and navigation follow-up

Implemented and browser-verified after the V3–V5 checkpoint. Both approved office concepts remain unchanged. The new [deployed navigation crop](references/navigation-deployed.png) is the typography reference for Home, Resources and About only; it does not replace either office concept.

### Shared walls: S2

Current source baseline: `BUILDING.wallThickness = 0.16`, full rear wall height `3.4`, low camera-facing walls `0.4`, structural slab `0.45` metres. The front walls already span the shared width/depth in code. The user confirmed “smaller” means their height/thickness: increase wall thickness and low front-wall height to match the concepts while keeping the shared square. Do not independently stretch either floor or lengthen one wall beyond its corner.

Use shared structural dimensions in `layouts.ts` and `OfficeShell.tsx`. Coordinate wall joins, inner faces, sills, opening frames and room anchoring. The current rear-office centers assume the old inner edge; derive flush room positions from the revised wall dimensions rather than leaving them embedded in thicker walls. Keep the far-left Home meeting room flush and W1's cream backdrop/window correction intact. Check front-wall height against foreground furniture visibility rather than raising every wall blindly.

The previous extra grey-band proposal (S3) is withdrawn: the user confirms the grey base already exists in the website. Retain the existing slab/base; add no band and make no base-thickness change for this item.

Acceptance: matched reference wall thickness/front-edge proportions on both floors; identical outer square/corners; clean wall intersections; no room/window overlap. Preserve the existing grey base, W1, furniture containment, room flushness and pin visibility, with meaningful dimension/bounds checks where needed.

### Home Ithaca spacing: F5

Move the entire left marked cluster slightly screen-right away from the glass meeting room, as confirmed by the user: all desks, chairs, partitions, rug, seated anchors, pin and hover region move together. Select a world-space offset under the fixed camera that produces the smallest useful screen-right move; do not interpret this as an instruction to move only along world-east. Keep Ithaca left, Troy center and Delphi right, with separated rugs and the outer pods above Troy. Resources does not receive this pod change.

Current clearance matters: Ithaca's rug ends at world x=-1.3, while the adjacent reserved aisle begins at -1.1. A world-east move greater than 0.2m would consume that gap. Update the Home aisle, walker route/endpoints and relevant seat/path tests together; do not move the furniture into an unchanged walking envelope. Recheck walker-to-walker separation as well as furniture clearance.

Acceptance: an obvious but modest glass-room gap at native size, correct pin/people placement, no rug contact, and full-stride walking clearance. Exact world-space offset is a visual tuning choice for the confirmed screen-right direction.

### Home northeast bookshelf/countertop: N3

Add a **new bookshelf and a new low countertop** against the wall running along the top-right/northeast of the screen, near its eastern end. The user clarified that these are new pieces. Retain the existing coffee station near the printer and the existing separate east-perimeter bookcase; neither substitutes for the new inventory. This is a low storage/display countertop, not another coffee station.

Use the reference crop to settle the two new pieces' widths, orientation and spacing on that wall, adjacent to the existing rear-right amenities. Reuse the shelf/cabinet kit in `Furniture.tsx`; use distinct fixture identities in `layouts.ts`. Account for the existing printer, two-chair nook, right unmarked desk and planters; adjust their spacing only where needed to fit the new wall furniture. Keep everything inside the revised wall inner faces, the right desk usable and door/aisle paths clear. The central three-armchair nook still has no bookshelf; Resources' deleted storage enclosure stays absent.

Acceptance: the requested shelf/counter are visibly present at the correct rear-right location, with their inventory accounted for and clear furniture/people envelopes. Capture a Home northeast crop in addition to the full-floor comparison.

### Native navigation typography: H1

Replace the current 20px Arial navigation treatment with the attached deployed-site crop's smaller, regular sans-serif appearance for Home, Resources and About. Match font family, rendered size and weight; compare spacing and thin underline proportion against that crop rather than carrying forward the current heavy 3px rule. Keep the current office navigation colors, native HTML, Home/Resources behavior and inert About. The CapitalCanvas wordmark is outside this new typography request and remains unchanged unless the user asks otherwise.

The local deployed-home rules are a starting point: `.field-home .site-navigation a` declares 14px with a 1px underline and inherits the site's system-sans stack; the office currently declares 20px Arial. A raster crop alone does not establish the exact CSS size or installed font because zoom/scaling can differ. Inspect computed existing-home metrics at the review viewport, then compare the preview to the saved crop at native display size; do not enlarge text simply to match screenshot pixel scaling. Scope edits to `office.css`, preserving the production header. Retain comfortable keyboard/pointer targets separately from the smaller visible type.

Acceptance: all three labels have the crop's restrained font/size/weight, current office colors and unchanged behavior; no header crowding at the established desktop sizes. Document the final font metrics in the completion record.

### Additional Home couch: N4

Add a second cream couch component in the gap along the left/northwest window wall between the far-left long-table glass room and the small rear glass office. The user confirmed this gap and a cream couch, small coffee table and rug. Retain the existing sofa lounge to the right of the small office; this is additional furniture, not a relocation. Add no location marker or seated worker.

Reuse the existing sofa/table/rug geometry, with a distinct fixture identity and fitted dimensions in `layouts.ts`. Account for the existing low cabinet, books, window-side plants, glass-room doors and Home Ithaca shift. Reposition a supporting fixture only if needed to keep circulation and the cream/window backdrop clear; do not move the glass rooms or cover W1's corrected opening. Orient the couch along the window wall, facing into the office, and fit the table/rug inside its reserved envelope.

Acceptance: full-floor and left-wall detail comparisons show the additional couch/table/rug between the two rooms, with the original rear-right lounge retained. No furniture overlap, extra pin, blocked room doorway or walker collision. This user addition overrides that empty space in the canonical concept without regenerating it.

### Home far-left meeting-room door: N5

In Home's far-left long-table glass meeting room, remove the tan door at the left of the room as seen on screen. Restore that former doorway as ordinary continuous glazing, without a door handle or doorway frame. At the room's existing glass-door position, replace the glass door leaf with a tan/pale-wood door using the existing wood finish and handle. Keep that doorway's location and width; this leaves one tan entry at the former glass entrance rather than two entries.

Scope this to Home's conference-room layout/renderer in `layouts.ts` and `Furniture.tsx`; use explicit per-room door placement/material data if needed instead of changing all rooms sharing `GlassPartition`. Keep the room flush at the corner, retain its glass enclosure/table/chairs, and preserve the corrected exterior window. Home's smaller private office and both Resources rooms retain their existing doors. No door animation or interaction is requested.

Acceptance: a Home meeting-room detail crop shows plain glass at the old left tan-door position and a single tan door at the former glass-door position, with coherent jambs/handle and clear access. Inspect the other three rooms for unintended changes. This user revision overrides the canonical Home door treatment without changing the saved concept.

### Navigation hover states: H2

Home, Resources and About all change text color on hover. The confirmed treatment uses the current active blue for inactive labels and a distinct lighter blue when hovering the active label. Keep the active underline to identify the current floor, matching H1's thin proportion. About remains noninteractive text with no route, click handler, button/link semantics or misleading pointer cursor. Header links receive a clear keyboard focus treatment; hover color does not replace a focus indicator. Keep the deployed-crop font/size and current resting office palette.

Acceptance: inspect resting/hovered inactive link, active link and About states on both floors; verify the active underline, focus visibility and unchanged inert About. Colors should remain readable against the office backdrop; record final hover tokens during implementation.

Implemented V5A: shared walls are 0.32m thick and front cutaways 0.58m high; the existing 0.45m grey slab is unchanged. Both private rooms derive their corner anchors from the revised inner edge. Home Ithaca is at [-3,4.85], with its adjacent aisle/walker at x=0 and a shortened horizontal route start. Added the northwest couch/table/rug and northeast bookcase/low counter while retaining the original lounge/bookcase/coffee station. Home conference uses explicit side-only wood-door data; its front is plain glass. Home leftmost opening now ends at z=-1.2 to preserve its projected clearance. Navigation is 18px regular system sans with 36px spacing, a 1px underline and blue hover states. Both-floor captures and geometry/path checks are in VISUAL-REVIEW.md.

## V5B — Bounded camera interaction and floor-navigation revision

Implemented and browser-verified. Follow [CAMERA-PLAN.md](CAMERA-PLAN.md) for file ownership, state/input rules, actual tuning and focused acceptance evidence. This stage supersedes the prior prohibition on camera zoom/pan and the requirement that wheel scrolling switches floors. Keep the isometric angle fixed; no rotation.

- Current centered full-floor fit is minimum zoom (1×); wheel-up zooms in toward the cursor, wheel-down zooms out, capped around 2×.
- Left-button dragging can start anywhere in the scene, including desk hit regions and pins, after a small movement threshold. Keep ordinary tool hover/focus disclosure and inert clicks.
- At 1×, legal resting pan is exactly centered. A drag still produces small resisted displacement and springs back on release. At higher zoom, allow inspection across the floor, with the same resisted rebound beyond calculated limits; prevent losing the floor mostly off-screen.
- Keep pins and labels the same on-screen size, projected from the actual moving camera. Suppress hover while dragging; update marker anchors and desk hit regions throughout zoom/pan/rebound, including paused rendering.
- Home/Resources header links retain the vertical slide. Wheel only zooms and never changes floors, even at limits. Reset the view to centered 1× when switching floors; coordinate that reset with the slide. Direct anchors and history remain valid.
- Respect reduced motion with immediate settling rather than an animated spring/slide; retain deliberate user-controlled zoom/pan and keyboard access. Preview-only input handlers must not hijack browser zoom or production pages.

## V5C — Exterior window style, coverage and tall wall height

Implemented and verified October 14, 2026 following the user's V5C implementation request. Resources' canonical image is the exterior-frame style reference; the user-defined Home two-window arrangement overrides the old small separated openings. Canonical references remain unchanged.

### Thick cream exterior frames: W2

Replace the shell's current 0.065m dark posts with visibly thicker structural frames using the **exact existing cream wall material**, not black metal or a new grey tint. Apply the style to Resources' main run and separate office window, Home's two middle windows, and the retained Home private-office openings. Include coherent cream jambs, sill and top header; broad panes start above a low cream sill. Tune post width/depth to the reference's substantial wall-column silhouette, using the existing 0.32m wall depth rather than painting the old thin strips cream.

Keep interior glass-room partitions, thin dark room mullions, tan doors and their hardware unchanged. `OfficeShell.tsx` owns exterior glazing, while `Furniture.tsx` keeps the room partition kit. Define shared exterior frame dimensions alongside layout constants; calculate clear glass widths/heights from actual jamb/sill/header faces. Avoid glass behind opaque frame members, duplicated endpoint posts, floating seams or z-fighting where openings meet infill/room boundaries. This updates the exterior style on both floors without adding structural thickness or another grey floor layer.

### Resources main run and separate private-office window: W3

End the main northwest glazing run before it enters the **small rear glass office at the top of the screen**. This is not the larger right-side conference room. Retain a separately named, broad exterior window centered in the northwest wall behind that small office, with the same thick cream frame style. Cream wall/jamb sections must visibly separate that office window from the open-office window run; do not keep one continuous `[-10,10]` aperture or merely put another divider across it.

The current private office occupies approximately z `[-9.84,-5.44]` along the northwest edge. Derive the main-run endpoint and separate office-window span from its actual bounds, with positive frame/infill margins rather than freezing those baseline coordinates. Use broad panes in the main run; fit their number and rhythm to the exposed wall. The separate office window has one broad pane with no extra internal divider. Resources' exterior coverage is no longer an unbroken full-wall opening: replace the old full-glazing coverage assertion with named-run, separation, office-window containment and complete cream/glass wall-coverage checks. Do not move the office or its furniture to obtain the new gap.

### Home two middle windows: W4 and W1 revalidation

Replace the current small `rear-office-side`/`leftmost` opening arrangement with **exactly two large, roughly equal windows** across the exposed northwest-wall gap between the long-table conference room and rear private office, including behind the additional couch. Use one narrow solid cream section between them; no extra vertical divider inside either opening. Keep sensible cream jamb margins at both room ends and the shared low sill/header profile. Retain Home's exterior openings behind the private office, giving those existing openings the same thick cream frame style; their current split does not count toward the two middle windows.

The exposed gap currently extends approximately from the private-office front edge at z=-5.44 to the conference-backed span beginning at z=3.64. Derive the new two-window bounds from those room edges, leaving a small center pier and clear endpoint jambs. Do not interpret “two large windows” as a continuous run with several cream posts or leave the former large opaque gaps between isolated apertures.

Keep Home's conference-backed exterior wall solid cream and the room flush in its corner. Main middle apertures must not physically extend into either room's backing span; the retained private-office windows remain separate exceptions. The earlier W1 numeric opening end (-1.2) and projected-gap assertion were specific to the old small-window composition. Reconcile those tests with the newly requested wider span rather than preserving an obsolete endpoint or closing the new window solely because an exterior pane appears through a glass-room perspective. Verify actual room/opening bounds and inspect the revised wall/room join in native-size and close-up captures; no window should read as an unintended opening within the conference backdrop. Room positions, couch, Ithaca gap and tan-door revision remain.

### Match tall walls to glass-room tops: S4

Lower the tall northwest/rear perimeter walls on **both** floors from the current 3.4m body height to the existing glass rooms' approximately 2.9m height. The target is aligned **visible top edges including caps/mullions**, not just assigning equal body constants while the exterior 0.12m cap still protrudes. Introduce one shared glass-room/tall-wall top reference in `layouts.ts`; use it in `OfficeShell.tsx`, `GlassPartition`/`OfficeRoom` and shell-fit bounds instead of independent 3.4/2.9 literals. Derive body, header and cap positions without changing the room pane height or its dark frame profile.

Retain the 0.58m low front cutaways, 0.32m structural thickness, square footprint, grey slab and floor spacing. Lower exterior window tops with the tall walls, retaining broad glass above the low sill. Preserve the shared fixed-angle camera and V5B view controls; re-evaluate fit/cinematic travel bounds from actual visible shell tops rather than the old `wall + 0.06` assumption. Minimum zoom remains a centered shared full-floor fit; zoom range, elastic limits, native marker size and header-only floor navigation do not change.

### V5C acceptance and dependencies

- Both floor captures show the reference-like thick cream exterior members and tall wall tops aligned with glass-room tops. Interior dark glass frames and tan doors retain their current treatment.
- Resources shows an open-office window run that ends before the rear office, plus one separate broad office window with cream separation. No main aperture crosses the office boundary.
- Home shows exactly two roughly equal, undivided middle windows separated by a narrow cream wall section, spanning the inter-room wall behind the couch; its separate private-office glazing remains. Conference backdrop, corner flushness, door and furniture clearance are preserved.
- Geometry tests cover actual visible top heights/caps, named opening widths/coverage, jamb/post containment, separate office windows and room-backed spans. Update prior full-wall/old-opening tests deliberately; retain shared square and full-stride path checks.
- After shell changes, inspect native 1672×941 and the established desktop fits; recheck V5B minimum/maximum zoom, pan/rebound, marker projection at DPR 1/2 and floor travel/reset, reduced motion and static fallback. Keep screenshots outside the repo and record any remaining mismatch in VISUAL-REVIEW.md.

Implemented V5C: one shared visible top at 2.9225m aligns perimeter caps with the unchanged 2.9m room panes and 0.045m top mullions. Exterior jambs/posts are 0.32m wide/deep, with a 0.3m sill and 0.24m header including the 0.12m cap, all using the exact wall material. Pane widths end at frame faces. Room-derived Home middle openings are z=[-5.28,-0.96] and [-0.84,3.48], each with one 3.68m clear pane; the combined center pier/jamb section is 0.76m. Private-office glazing retains its split. Resources' undivided office aperture is [-9.68,-5.6], and its four-pane main run is [-5.28,9.84], separated by solid cream infill/jambs. No room, furniture, door or path moves were needed. Camera fit now uses the actual shared top instead of the old wall+0.06 assumption; cinematic travel continues to derive from that fitted camera. Geometry/path/view tests, both-floor native captures and retained V5B browser checks are recorded in VISUAL-REVIEW.md.

V5C is complete for this pass. V6 lights/materials/background and V7 final sign-off remain pending and were not authorized by the V5C implementation request.

## V6 — Final rendering

Tune warm daylight, cool fill, exposure and soft contact shadows after final geometry. Keep cream tile, pale wood and navy upholstery readable without bright white clipping or muddy shadows. Reduce procedural texture contrast if it competes with the low-poly forms. Preserve glass visibility from the fixed camera.

Review floor and rug treatment separately: the references show large cream tile variation and gray-lilac woven rugs with clearer edges. Current procedural maps exist but read flat at the saved framing. Judge their scale/contrast at the final native-size view before adding texture resolution or more geometry.

### Real 3D surroundings: B1

The user explicitly requires **rendered R3F/Three geometry and rendered shadows**, not a static background image. The current nine towers are already instanced 3D boxes, but their uniform standalone arrangement, blue emissive material and lack of cast/receive-shadow flags do not meet the new target. Replace them with white/near-white stepped stacks of actual cubes and rectangular prisms, using varied widths/heights and grouped silhouettes. No building windows/facades, skybox photograph, billboard, CSS cube illustration, painted shadow or pre-rendered background screenshot substitutes for this environment. Existing approved concept images remain references and the WebGL fallback only.

The eight user answers are confirmed: abstract stepped stacks; sharper/larger near forms and smaller/fainter distant forms with subtle haze; shared office camera without decorative parallax; one shared environment with gentle vertical movement during floor slides; real soft shadows on blocks and a pale-blue base; foreground forms may crop at screen edges; asymmetric reference-like clusters with breathing room; no ambient floating/bobbing.

### Placement, depth and composition

Author a deterministic shared layout with near, middle and far groups in world coordinates around/below the office. Physical positions, block dimensions/heights, occlusion and softened distant contrast establish depth. Orthographic projection does not automatically shrink an equal-size object with distance; vary authored dimensions and composition to match the reference rather than switching the office to perspective or faking depth with flat scaled images. Foreground blocks remain crisp with white lit faces and pale-blue shaded sides; far blocks fade gently into the blue atmosphere. Use subtle depth haze, not noticeable depth-of-field blur, and keep office furniture/text/pins sharp.

Match the references' asymmetric edge/corner rhythm with clear blue breathing space. Near stacks may be partially cropped by the viewport; do not enlarge camera-fit or pan bounds just to fit them all. Keep actual block geometry outside the office footprint and away from the slab/furniture. At all allowed pan/zoom states and during travel, background geometry and its base must not obscure the office, pins or header. Avoid random regeneration on render, resize, floor switch or reset.

### Materials, lighting and actual shadows

Use near-white non-glowing materials so white faces and blue shading come from lighting/depth rather than a flat blue tint. Audit the existing `materials.outside` base tint and emissive intensity: white instance colors multiplied by the current blue material still appear blue, and high emissive fill suppresses the intended depth. Reuse cached box geometry/instancing and existing lighting facilities; no downloaded image/environment asset is needed.

Blocks cast and receive real soft shadows on neighboring blocks and a subtle **3D pale-blue base/ground surface below the office**. Reference daylight direction, softness and contrast should agree with the interior. The base is background scenery, not an additional office-floor grey band. Position it below the lowest visible floor presentation envelope throughout the cinematic slide, not merely below the 7m physical floor spacing: the current transition exaggerates floor separation to a viewport, so an opaque ground plane at an arbitrary height could cut through the incoming floor.

Configure shadow coverage for near/far casters and their receiving surfaces. Do not blindly enlarge the existing office shadow frustum until its contact shadows become coarse; assess coverage, resolution and cost together, with a separate scoped background shadow setup only if needed. Inspect self/contact-shadow seams and white-face clipping. Atmospheric treatment must not wash out the office or hide shadows entirely. Start with current Three/drei rendering; add effects only for a demonstrated mismatch and measure their cost.

### Camera, floor transition and lifecycle

Use one shared environment for Home and Resources. It shares the actual orthographic camera for normal zoom/pan; no separate slow-moving backdrop or additional decorative parallax. During header-driven floor travel, apply a gentle shared vertical presentation shift to the environment/base using the existing transition progress source, rather than swapping backgrounds or introducing an independent scroll/tween state. Keep the scenery's relative block arrangement stable and both settled floor views coherent. Tune the shift against the references and office transition; it need not use the office's exaggerated full-viewport travel distance.

There is no idle floating/bobbing or new animation loop. Reduced motion selects the destination environment position immediately; inactive/hidden-page behavior and demand rendering remain. Surroundings/ground remain excluded from camera fitting and legal pan limits; camera reset, native pin size/projection, keyboard access and wheel-only zoom retain V5B behavior.

### V6 file ownership and acceptance

`OfficeSurroundings.tsx` owns instanced stack geometry, deterministic near/mid/far transforms and the shared base; `sceneResources.ts` owns environment materials; `OfficeCanvas.tsx` supplies consistent light/shadow/atmosphere and existing floor progress. `office.css` provides only the surrounding blue atmosphere behind the rendered scene, not cube/prism artwork. Keep `OfficeViewControls.tsx` fit/pan calculations tied to office bounds.

Capture both resting floors at 1672×941, plus zoomed/panned edge views and an intermediate floor slide. Compare stack silhouette, near/far composition, white/blue balance, real receiving shadows and haze against the concepts. Inspect actual scene meshes/materials and shadow flags to establish that this is live 3D geometry, with no raster background request. Verify base/stack clearance at the extreme camera/travel states, stable layout on reload/reset, reduced-motion/hidden pause and no ambient movement. Record environment draw calls/triangles and shadow cost in V7. Do not close B1 from a single static screenshot alone.

## V7 — Verification and stop condition

- Capture settled Home and Resources at 1672×941 using repeatable stationary worker poses, plus representative active-motion frames. Compare each against its canonical PNG at equivalent display size; record differences in the review ledger.
- Check square world-space proportions and shared floor corners, corrected rear-office placement/inventory on both floors, Home window, Resources lounge bookcase and right bench, distinct room layouts, separated rugs, furniture/person proportions, lighting and skyline. Add detail crops for both rear offices, Home window, Resources lounge/right bench, sample pod and seated person.
- Close V5A findings explicitly: wall/front-edge proportions, Home Ithaca-to-meeting-room gap and walking paths, northeast shelf/counter, new couch/table/rug, relocated tan door treatment, navigation type and hover states. No new grey band is required. Verify white block stacks on both floors, zoom extremes and during travel.
- Close V5C findings: thick cream exterior frame profile, Resources main/office-window separation, Home two-window middle run and retained private-office glazing, conference-backdrop joins and aligned tall wall/cap tops. Check interior glass frames/doors remain dark/tan and the low front walls stay low.
- Verify V6 surroundings as real scene geometry: near/mid/far stepped stacks, depth haze, cast/receive shadows on neighboring blocks and the pale-blue base, shared-camera response and gentle progress-driven floor shift. Confirm no raster substitute, decorative parallax, ambient bobbing or office occlusion at camera/travel limits; include intermediate-travel evidence and measured shadow/render cost.
- Recheck three pins, whole-cluster/pin hover, focus/Escape, inert click/Enter/Space, labels after resize/DPR changes and disabled markers during travel.
- Verify V5B wheel zoom, drag/rebound at minimum/maximum zoom, all pan limits, camera-aligned markers, header-only floor slides with centered view reset, history/hash, upper-slab clearance, reduced motion, hidden-tab/inactive-floor pause and WebGL fallback. Old scroll-to-switch-floor checks are historical and must not constrain the new behavior. Confirm existing site/tool/policy routes remain available.
- Run focused geometry/path tests after relevant changes. At the final stage run frontend tests, lint and build. Profile the same desktop/viewport as the prior baseline; record frame times, draw calls and triangles without claiming cross-device performance.
- Keep review screenshots outside source control in the chat visualization directory. Retain the two canonical office concepts plus the single user-supplied navigation crop in `references/`; do not accumulate duplicate generations or interim QA images.

Stop when the square footprint, Home north-area reconstruction and window defect are resolved, the review ledger's required visual items have evidence, runtime checks pass and both floors are presented with any remaining differences stated plainly. Production migration remains a separate task. Update [PROGRESS.md](PROGRESS.md) as each visual stage is actually completed.

Resources' rear-office, lounge and right-bench corrections are also required for completion. A required ledger item cannot be silently deferred or closed just because screenshots/tests were produced. Keep unresolved items open with their remaining work stated; any accepted deviation must be recorded explicitly in the ledger.
