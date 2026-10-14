# Office design and interaction specification

Status: agreed target; the isolated preview implements the surface/detail pass, whole-desk/pin and keyboard disclosure, vertical floor travel and animated workers. Production migration remains separate.

The desktop preview pass is complete: V0–V7 and V5A–V5C are implemented and verified. V5C and V6–V7 completed October 14, 2026. Follow [VISUAL-PLAN.md](VISUAL-PLAN.md), [CAMERA-PLAN.md](CAMERA-PLAN.md) and [VISUAL-REVIEW.md](VISUAL-REVIEW.md) for acceptance evidence, reference differences and performance limits; production migration and mobile/touch approval remain separate.

Confirmed follow-up, planning only: [REMAINING-DIFFERENCES-PLAN.md](REMAINING-DIFFERENCES-PLAN.md) adds the cream translucent bar/navy CC logo, replaces visible vertical floor travel with an opaque left/right cloud wipe beneath the usable header, changes Resources' conference entry to the wood kit, widens Home's conference door to eliminate the glass strip on its right, removes only the redundant rear apex upright on both floors and adds subtle cool-blue tint/sheen to exterior windows only. These requirements supersede the corresponding transition/door/corner/material descriptions below when implemented; settled camera framing and interior glass remain unchanged. Earlier completion statements describe the preceding runtime.

## Building and camera

- Home is the higher floor; Resources is the floor immediately below it in the same building.
- Both floors use exactly the same width, depth, slab thickness, outer corners, tall-wall height and alignment. Shared exterior-frame dimensions apply to both; floor-specific named opening spans/pane counts differ. Home has two middle windows plus retained private-office glazing; Resources separates its main run from one private-office window.
- Both footprints are square: one shared 20 metre side length sets world-space width and depth. The old 22×18 rectangle is superseded; camera projection alone cannot correct geometry mismatches.
- Implemented V5A: shared wall thickness is 0.32m and front cutaway height 0.58m, retaining the shared square and horizontal wall spans. Re-anchor flush rooms/windows against the revised inner faces; avoid protruding joins or hiding foreground furniture.
- Implemented V5C: tall northwest/rear perimeter walls have a shared 2.9225m visible top including caps, matching the unchanged 2.9m glass panes/0.045m top mullions. Room geometry/dark frames and low front-wall height remain; shell fit uses the actual shared top and cinematic travel inherits that fit.
- Preserve the existing grey base. The extra grey-band proposal is withdrawn because the user confirms the layer already exists; add no duplicate.
- Home's conference-backed northwest wall stays cream, and its long-table room stays flush at the far-left corner. V5C replaces the old small middle apertures with two equal large, undivided windows covering the exposed inter-room wall behind the couch, with one narrow cream center section and clear endpoint jambs. Separate private-office glazing retains its split in the new frame style. Room/window joins are revalidated; the old z=-1.2 endpoint is historical.
- Resources glazing: a four-pane main northwest run stops before the small rear office at the top of the screen. The office has one separate broad exterior window centered in its northwest backing, separated from the main run by cream wall/jamb sections. This supersedes an unbroken fully glazed wall; the large right conference room is not the stopping landmark.
- Resources supplies the footprint. No northeast wall protrusion, empty upper wall pocket, right-side exit corridor or projecting hallway is allowed.
- Keep a fixed orthographic isometric angle matching the references, with no orbit/rotation. V5B adds cursor-anchored wheel zoom (up=in, down=out) from the current centered full-floor fit at 1× to about 2×, and bounded mouse drag panning.
- Fit the entire floor at minimum zoom without clipping main workstations/pins. Responsive base fitting is shared by both floors; zoomed views intentionally show a closer crop. At 1× resting pan is zero; dragging gives a small resisted stretch then returns to center. Above 1× pan permits whole-floor inspection, with resistant overshoot and rebound at the limit, preventing the floor from being dragged mostly off-screen.
- Left-button drag can begin anywhere in the scene including desks/pins after a small threshold. Pins and labels keep constant on-screen size; camera projection updates their anchors and hit regions during zoom, pan and rebound. See CAMERA-PLAN.md for gesture, focus, pause and reset coordination.
- Treat the reference images as composition and material targets. They are not CAD drawings; choose exact numeric dimensions once during layout blocking, then reuse them for both floors.

## Visual system

Bright daytime low-poly office with cream tile, pale wood, navy chairs, blue chart screens, faceted green plants and glass partitions. Preserve simple forms, soft contact shadows, an uncluttered silhouette and clear paths for characters. Keep the furniture density of the approved final references, rather than the earlier sparse versions or the supplied stock-office reference.

Phase 4 tokens: navy wordmark `#081750`, navigation `#10213d`, pin gradient `#51a2ff` / `#1461ff` / `#1246e8`, pale blue surroundings `#e6f2ff` / `#cfe4ff` / `#b9d2fa`, cream floor `#f5ede2`, pale wood `#e6bd89`, muted gray partitions `#b5c0cd`, navy upholstery `#154782`. Material colors are rendered under warm daylight and cool fill using neutral tone mapping; rendered pixels differ from these source values.

Use subtle deterministic tile, wood grain and fabric-weave textures; smooth minification with mipmaps. Single transparent planes keep glass rooms readable, with no refraction or remote HDR dependency. Shared rounded geometry softens chairs/sofas/tabletops. Implemented V6 replaces blue towers with 33 actual near-white box instances at deterministic near/middle/far world positions. Larger cropped foreground stacks and smaller/fainter distant forms use subtle 90–165m fog and white/blue lighting, with asymmetric breathing room. They are real meshes, not background images or billboards; there is no depth-of-field blur.

The blocks cast and receive real soft shadows on one another and a pale-blue 150m receiving ground below the complete floor-slide envelope. Zero-emissive materials receive warm/cool daylight. Office and environment use separate 2048px shadow coverage, rendered with two layer passes through the same scene/camera and preserved depth. Environment shadows cache at rest. Ground/stacks remain below the lowest incoming slab and behind office depth for all allowed camera states. No additional grey slab layer is involved. Cached boxes/materials and the simple CSS blue atmosphere remain; neither CSS nor a bitmap replaces geometry/shadows.

Home/Resources share one deterministic environment and the office's actual orthographic camera. Zoom/pan affects all scenery through that camera; no decorative parallax. Only floor switching adds a 1.25m shared vertical shift tied to existing progress; no ambient floating/bobbing or separate animation state. Reduced motion/hidden pause remain, and environment/base stay excluded from office fit/pan bounds. Orthographic distance alone does not shrink objects, so authored sizes/placement/overlap and subtle haze establish near/far depth. V7 verifies these properties with live geometry/shadow checks and settled/zoomed/transition captures.

V3/V4 reuse cached merged geometry for shaped desk chairs, casters/supports, armchairs, sofa cushions and table legs. DESK dimensions own seat offsets and the 1.62m interaction height, while each pod rug stays 4.2×4.3m. Room panels are subdivided with door handles/headers and wood panels; private rear walls use the existing shell. Floor plants have pointed creased leaf clusters inside a reserved 1×1m canopy footprint. No extra pin or central Home bookshelf is added.

V5C's exterior glazing uses the exact cream wall material for visibly thicker posts/jambs, low sills and top headers. Reference-like broad panes replace the thin black exterior strips; Resources main-run pane count follows its available span, its office has one broad pane, and Home's two middle openings have no internal divider. Existing Home private-office openings get the same new frame style. This applies only to OfficeShell exterior windows: dark interior room mullions and tan doors remain.

Use a serif CapitalCanvas wordmark and sans-serif navigation. The existing 42px Times New Roman wordmark with Georgia fallback remains. V5A supersedes V2's 20px Arial navigation/3px underline: match Home, Resources and About font, rendered size and regular weight to the [deployed navigation crop](references/navigation-deployed.png), with restrained spacing and thin underline proportions. Keep current office navigation colors rather than the crop's dark background/cyan palette. The measured native crop matches the implemented 18px regular system sans, 36px gap and 1px underline; the local home's 14px rule was visibly too small. Resting colors remain #10213d/#155cff; active hover is #4677ff. Keep native HTML and comfortable focus/pointer targets. Do not add promotional copy, dashboards or an Enter/Explore office button.

## Floor inventory

| Element | Home | Resources |
| --- | --- | --- |
| Main workstation clusters | Three: lower middle pod, with left/right pods slightly higher and separated | Three: left foreground, central midground, right foreground |
| Location pins | Exactly one on each main cluster | Exactly one on each main cluster |
| Glass conference room | Flush into the far-left corner; long table oriented along the northwest wall, six chairs | Right side; long table and six chairs |
| Smaller private glass office | North/rear corner near northwest-wall junction; desk, navy chair, wood door panel, wall art and compact shelving; reference planters/cabinet outside | Existing rear office, fitted inside the same revised square shell |
| Sofa lounge | Existing rear-center/right lounge plus new cream couch, small coffee table and rug in the northwest-wall gap between glass rooms | Back-left window side |
| Secondary workstations | Two unmarked right-perimeter stations; no desk between left meeting room and perimeter | Six unmarked stations across left/right perimeter benches and the new foreground bench |
| Central/foreground seating | Central round table and three navy armchairs; no bookshelf in that component | Foreground reading nook with two armchairs, round table, low bookcase and plant |
| Other areas | Private office, standalone printer, coffee counter, storage and right conversation nook | Private office, standalone printer, coffee counter and existing rear seating; no low enclosed storage box |

Preserve the distinct interior arrangements shown in the approved concepts inside the shared shell. Additional desks, offices and amenities never receive location pins. Keep room partitions shallow enough that all three marked clusters remain visible.

Home's smaller private glass office must be repositioned to the reference north/rear corner rather than left at its current offset along the solid rear wall. Reconstruct the composition around it: low wood cabinet with books/plant in front-left, planters at room/window edges, compact rear shelving and wall art, and sofa/coffee-table/rug to its right. Audit the coffee/printer/right seating sequence for missing or misplaced reference components. These shelves are distinct from the central three-armchair nook, which must remain without a bookshelf. See V0's component inventory in VISUAL-PLAN.md.

New V5A requirement: add a new bookshelf and a separate new low countertop against Home's screen-upper-right/northeast wall near its eastern end. Retain the existing east-perimeter bookcase and coffee station; the new counter is not an additional coffee station. Coordinate the nearby printer, two-chair nook, right unmarked desk and plants so the new furniture fits inside the thicker walls without blocking routes. These additions are Home-only.

Also add a cream couch, small coffee table and rug in Home's left/northwest-wall gap between the flush-left long-table room and the smaller rear glass office. It is additional to the existing sofa lounge on the other side of the small office. Reuse the shared furniture kit and preserve doorways, corrected windows, plants/cabinet and walking clearance; add no pin or worker.

Home's meeting room must touch the inner left and front cutaway boundaries, with no leftover desk, plant or strip of floor at that corner. Its doorway faces into the office. Home's three pod rugs must not touch; the outer pods stay above the lower middle one in screen space. Keep the central three-chair nook open without a bookcase or partition. Resources' deleted enclosure must remain open tile floor while retaining its printer and coffee stools. Keep the new Resources foreground furnishings inside the slab and out of the circulation routes.

V5A door revision: in Home's far-left long-table meeting room, remove the left tan door and restore its former doorway as ordinary glazing. Replace the existing glass door with a tan/pale-wood door at that same entrance location. Retain one entry with the existing doorway width, a coherent frame/handle and clear access. Keep the room's position and all other rooms' doors unchanged; no animated or interactive door is requested. See N5 in VISUAL-PLAN.md.

V5A shifts Home's entire Ithaca cluster slightly **screen-right** to improve its gap from the glass meeting room, as clarified by the user. Move the rug, furniture, seated people, projected marker and hover bounds together; adjust the adjacent reserved aisle and full-stride routes as needed. Preserve pod order and outer-versus-middle height relationships. Resources' Ithaca placement does not change.

## Tool markers

| Screen-space cluster order | Tool | Home label | Resources label |
| --- | --- | --- | --- |
| Left | Ithaca | Ithaca | Ithaca |
| Center | Troy | Troy | Troy |
| Right | Delphi | Delphi | Delphi |

Use the same stable tool identities on both floors, rather than deriving identity from object traversal order. Each pin is a blue upright map teardrop with a white center and pointed base.

Hovering the **whole marked desk cluster or its pin** expands the name out from the pin. A compact blue-pin-and-label treatment should keep the pin anchored while the readable tool name expands beside it; it collapses on pointer leave. Secondary desks do not reveal labels.

During a pan gesture, suppress transient hover labels without losing keyboard focus. After release/settling, refresh hover against the updated camera projection. Pins and labels stay constant in CSS-pixel size at all zooms; the desk hit hull follows the moving scene. Dragging over a pin must not activate it.

Make the pin's native HTML element keyboard focusable and show the same name on focus. Keep hover continuity between the desk hit region, the pin and its expanded label so moving across them does not cause flicker. Prefer a short opacity/width transition, with immediate changes when reduced motion is requested.

Clicking a marked cluster or pin does nothing: no navigation, modal, launch, selection, calculation or URL change. Keyboard activation is also inert. This is an explicit temporary requirement; do not attach future tool URLs yet or give the marker link semantics. The native focusable target is labelled and announces activation as unavailable with aria-disabled, while still allowing keyboard focus to disclose its name. During travel it is also natively disabled.

## Header and floor navigation

- Keep `CapitalCanvas` at upper left and `Home`, `Resources`, `About` at upper right.
- Home and Resources navigate between the two office floors; the visible floor's label is blue with an underline.
- All three labels change color on hover: inactive labels use the current active blue, while the active label uses a distinct lighter blue. Retain the active underline and clear native keyboard focus. About's hover color adds no click behavior or link/button semantics.
- About remains visible as **plain noninteractive text**. No About page, route, floor or modal is part of this build.
- Home/Resources header links switch floors using the vertical slide; wheel scrolling now zooms and never switches floors, even at zoom limits. This supersedes the earlier scroll-driven floor-navigation requirement.
- Use one header/hash-controlled floor-transition progress source. Remove the native two-floor scroll/snap coupling so wheel zoom and floor navigation cannot compete. Keep direct preview anchors and browser history; zoom/pan do not change the URL.
- The floors occupy distinct vertical world positions under the same camera orientation. Home slides upward out of view as Resources enters from below. At rest, only the intended floor and its three pins are visible. The exact transition path/duration will be tuned in the preview.
- Update the active nav at the settled floor; suppress inactive-floor marker interactions and keyboard stops, including during transitions. Keep browser history and direct preview anchors coherent.
- On switching floors, cancel gestures/rebound and reset zoom/pan to centered 1×, coordinated with the slide. No per-floor view memory. Ignore scene gestures during travel.
- Reduced motion uses immediate floor selection/reset and immediate release clamping, without animated travel or bounce; deliberate wheel zoom and drag remain usable. Scope scene controls to the preview and preserve browser zoom, header keyboard operation and production-page scrolling. Proposed focused-scene shortcuts are +/− zoom, arrows pan and 0 reset.

## People and motion

Use animated GLB people matching the simplified character proportions. Include walking people plus subtle seated activity. Furniture is authored as reusable R3F geometry; do not turn the scene into a flat background image.

Give walkers explicit waypoint paths on clear aisles, with motion speed synchronized to the walk clip. Reserve separate paths or timings to avoid obvious intersections. No physics engine or general crowd simulation is needed for this slice. Seated animation stays within the desk/chair envelope. The current preview uses seven seated workers and two walkers on each floor, with the validated assets recorded in ASSETS.md.

V5 uses the same licensed GLBs/rigs with fuller body/head proportions and about 1.84m measured standing height. Authored hip joints target 0.65m above the floor before the runtime's 3cm ground offset, placing them above the cushion; hands rest at desk height and soles stay above the floor. The initial pose requests a redraw even in reduced motion. Walking clearance includes a 0.9m transverse and 1.5m longitudinal envelope; reserved aisles and route endpoints account for the full stride, not just the torso center.

Pause inactive-floor and hidden-tab animation. Reduced motion stops locomotion and seated motion in stable poses. Respect the existing data-saving preference where practical. Name labels remain fully usable with motion disabled.

## Desktop and fallback behavior

Desktop fidelity is the first target, as requested. Proposed validation viewports are 1920x1080, 1440x900 and 1280x800. Check the source PNG dimensions at implementation time for a matching screenshot comparison.

Provide a native HTML header and a usable static office view when WebGL is unavailable. Any fallback labels must remain native HTML and identify the same three tools; the saved concept's baked header is not a replacement for real navigation. Mobile-specific composition and touch disclosure behavior need a later design decision; do not claim full mobile sign-off from the desktop concepts.
