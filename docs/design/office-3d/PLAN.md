# React Three Fiber implementation plan

Stages 1–8 below describe the implemented functional desktop preview; see [PROGRESS.md](PROGRESS.md). They do not constitute final visual-fidelity approval. V0–V5 and V5A–V5C are implemented and verified. V5C revised exterior glazing and tall wall height on October 14, 2026; V6–V7 remain pending in [VISUAL-PLAN.md](VISUAL-PLAN.md). It supersedes prior full Resources glazing/small Home middle-opening targets without changing the square, low fronts or interior room doors/frames. [CAMERA-PLAN.md](CAMERA-PLAN.md) supersedes the locked view and wheel-driven navigation instructions below; those describe historical implementation. Outstanding differences are in [VISUAL-REVIEW.md](VISUAL-REVIEW.md). The character gate is resolved in [ASSETS.md](ASSETS.md). Production migration remains separate.

The visual plan supersedes the rectangular blockout and its north-area transforms: both floors now share a 20×20 square, rear offices and supporting fixtures are reblocked, Home glazing is corrected and camera framing is closer. V3–V5 refine shared furniture, room/amenity/plant detail and people. The phases below remain a record of the earlier functional build; final lighting/material/background and review work is still pending.

## Scope and stop condition

Build an isolated desktop preview of matching office floors with shared dimensions, fixed isometric angle, bounded zoom/pan, header-controlled Home/Resources slides, animated people and hover/focus tool names. Current full-floor fit is minimum zoom, wheel only zooms, and dragging beyond pan limits resists/rebounds. Tool clicks remain inert; About is plain text with hover color feedback. Stop after the preview is faithful and reviewable. Production replacement, tool launching, resource readers and an About redesign are later work.

Latest V6 planning clarification: reference background cubes/prisms, their near/far depth and shadows must be rendered in 3D. Share the office camera/environment, with gentle progress-driven vertical movement during floor switches; no raster substitute, decorative parallax or idle bobbing. Use actual soft-shadow receiving blocks/pale-blue ground and keep scenery out of office fit/pan bounds and its travel envelope. The detailed scope is in VISUAL-PLAN.md; V6/V7 implementation remains pending after completed V5C.

## 1. Confirm dependencies and asset plan

- Work inside the existing React/TypeScript/Vite app; do not scaffold a second app or change frameworks.
- Before installing, verify compatible stable versions and peer requirements for `three`, `@types/three`, `@react-three/fiber` and `@react-three/drei`. The current official documentation pairs Fiber 9 with React 19 and identifies Fiber 10 as alpha. Prefer the compatible stable line; recheck at build time.
- Select low-poly animated GLB people with suitable walk, idle and seated clips. Record source, license, attribution, scale, orientation, polycount and animation availability. Completed selections and binary validation are recorded in ASSETS.md; no paid acquisition was used.
- Author reusable furniture from R3F geometry. Define material and geometry reuse up front. Avoid extra state, physics, animation or postprocessing dependencies unless a demonstrated requirement justifies them.
- Produce a small asset inventory before coding characters. Check model silhouette and proportions against the references; a realistic human model is not an acceptable substitute.

## 2. Add the isolated preview boundary

Implemented URL: `/preview/office#home`, with `/preview/office#resources` for the lower floor.

Lazy-load the preview from `apps/web/src/App.tsx`; keep existing `/`, tool and policy route behavior. Do not fetch solver data or import workbench bundles for the office. Scope CSS to the preview, and keep preview indexing disabled using the current route metadata pattern.

Build a native HTML shell for the header, two scroll anchors, accessible labels, loading and WebGL fallback. Reuse current typography and accessibility patterns without altering the existing scrolling homepage.

Current ownership boundaries, with later-phase modules identified explicitly:

| Module | Responsibility |
| --- | --- |
| `site/office/OfficePreview.tsx` | Native header, scroll container, preview anchors, motion/visibility preferences and active floor |
| `site/office/useOfficeNavigation.ts` | Single native scroll-progress source, header navigation, direct hashes, history, resize and reduced-motion travel |
| `site/office/motion.ts` | Reduced-motion and page-visibility subscriptions |
| `site/office/OfficeCanvas.tsx` | Lazy Canvas, fixed camera, lighting and scene lifecycle |
| `site/office/OfficeShell.tsx` | One shared slab, dimensions, outer walls and bay grid; floor-specific solid/window infill |
| `site/office/layouts.ts` | Home/Resources furniture transforms, room partitions and paths |
| `site/office/OfficeFloor.tsx` | Compose the shared shell with one floor's layout |
| `site/office/Furniture.tsx` | Reusable pods, chairs, sofas, rooms, round seating, bookcases and amenities |
| `site/office/sceneResources.ts` | Shared geometry, deterministic wood/rug/tile finishes, materials and chart lines |
| `site/office/OfficeSurroundings.tsx` | Instanced pale blue neighboring buildings outside the office footprint |
| `site/office/LocationMarker.tsx` | Native SVG pin, whole-cluster hover, focus disclosure, Escape dismissal and inert activation |
| `site/office/OfficePeople.tsx` | Independent GLB skeletons/mixers, clip transitions, seated poses, pause and cleanup |
| `site/office/peoplePaths.ts` | Bounded aisle routes, walking/idle cycle and desk-seat transforms |
| `site/office/office.css` | Scoped header, labels, layout, focus and transition styles |

Keep this structure proportional to the code. These are ownership suggestions, not a requirement to create empty layers.

## 3. Block both floors before detail work

Define one floor width/depth, slab thickness, floor-to-floor spacing, material set, orthographic projection and framing rule. Instantiate that same shell for both floors. Avoid separate Home/Resources floor-dimension constants.

Match the perimeter to Resources, then fit the Home interior inside it. Validate straight northeast wall alignment and identical corners using overlay screenshots or projected-corner measurements. Include a focused geometry invariant check once geometry exists.

Place the three main desk pods with explicit tool IDs: Ithaca left, Troy center, Delphi right. Each floor has its own pod positions and room/furniture layout. Home's middle pod is lower than its outer pods; all three rugs remain separated. Home's conference room is flush into the far-left corner, its central seating is a round table with three armchairs and no bookshelf, and selected northwest bays are opaque. Resources retains its right-side conference room, new foreground workbench and reading nook, and standalone printer; the old storage enclosure must not return. Verify walking clearances and marker visibility before adding decorative detail or animation.

## 4. Materials, lighting and native overlays

Implemented: matte material families, subtle procedural wood/weave/tile maps, softened furniture edges and amenities, blue chart lines, single-pane glass, warm daylight/cool fill, built-in variance shadows and instanced blue background towers. Native SVG pins are projected from the actual fitted camera in CSS pixels, independent of renderer DPR. No new package, texture download or environment asset is required. See PROGRESS.md for reference comparison and browser checks.

Tune simple matte surfaces, pale wood, faceted plants, navy chairs and soft directional daylight against both PNGs. Share repeated meshes/materials and instance static objects where beneficial. Check glass transparency and render order from the fixed camera.

Use drei's orthographic camera support. The implementation uses native DOM siblings for pins, projected by the actual fitted scene camera; `Html` was considered but was not retained after browser compatibility checks. The filled location-pin SVG is reused by the label interaction. DOM overlay/header text remains sharp and selectable/accessible at changing device pixel ratios.

Do not ship concept PNGs as the interactive office. They are references and possible loading/fallback media only; normal rendering is real scene geometry.

## 5. Tool-name disclosure

Implemented in LocationMarker and OfficeCanvas. The projected convex hull of each desk volume provides the hit region. A 120 ms close delay bridges pointer movement to the pin, focus reveals the same label, Escape dismisses it, and all activation remains inert. There are three keyboard targets per active floor; travel disables them.

Connect one hit region to each marked desk cluster, excluding adjacent aisles and secondary desks. Whole-cluster hover, pin hover and keyboard focus reveal the same associated name. Handle pointer transitions between mesh and HTML without hover flicker; prevent pointer bubbling from activating nearby clusters.

Ensure exactly three markers per active page. Clicking or keyboard activation must not open tools or change state/URL. Tool routes remain independently available elsewhere in the current site.

## 6. Vertical floor transition

Implemented with a native two-viewport scroll track and sticky Canvas. The scrollTop/clientHeight ratio is the sole progress source. Header links and history scroll to the same endpoints; resize preserves progress. Both layouts move vertically during travel, with a viewport-sized cinematic separation derived from the fixed camera so an upper slab cannot cover the settled lower floor. Physical shared dimensions/elevations remain in layouts.ts; presentation separation is intentionally exaggerated. Only the settled active floor owns markers and worker activity. Reduced motion jumps to an endpoint.

Use one scroll-progress source for wheel/trackpad scrolling, keyboard/page scrolling, header links and direct anchors. A native two-section scroll wrapper is the starting recommendation. Do not add a second navigation state machine controlled by wheel events.

Drive the camera target or common building transform from that progress while retaining the fixed isometric orientation. Render both floors during travel if needed, but avoid an upper slab obscuring the lower office at rest. Keep the DOM header stationary. Make transition labels and interaction ownership follow the active/settled floor. Reverse the same movement when returning to Home.

Animate to anchor positions for header clicks; handle resize, refresh and Back/Forward without losing the selected floor. Reduced motion bypasses travel. Scroll snap, duration and easing are preview tuning details, not settled numerical requirements.

## 7. Character animation and lifecycle

Implemented with two local clothed Quaternius GLBs: Business Man and Suit. Nine workers per floor comprise seven seated workers and two aisle walkers. The supplied Walk/Idle clips and project-authored DeskIdle clip are driven by useAnimations. SkeletonUtils clones each rig independently; cached geometry/materials are retained. Inactive-floor and hidden-tab mixers pause; reduced motion freezes motion, and hidden/reduced stationary scenes render on demand. Paths, dimensions, clip coverage and asset licensing are validated in ASSETS.md and tests.

Load selected GLBs with `useGLTF` and control supplied clips with `useAnimations`. Each skinned character needs an appropriate independent clone/mixer; do not reuse one mutable rig across all people. Retain cached geometry/material resources appropriately.

Use frame delta for movement and update object transforms/animation outside React state per frame. Start with a few walkers and seated workers, add staggered loops and subtle seated activity, then inspect collisions and visual density. Pause inactive floors and hidden tabs; clean up listeners/mixers on unmount.

## 8. Verification and review

Completed for this functional checkpoint: 97 frontend tests, lint (one existing Delphi warning), production build, Edge browser interactions, baseline reference-size inspection, responsive fitting, DPR 1/2 alignment, reduced motion, visibility pause, asset validation, fallback and current-site compatibility. Home window placement and further visual matching remain open in VISUAL-REVIEW.md. A host Edge sample at 1672x941 measured a 16.7 ms median frame interval and 16.8 ms p95; this does not establish a cross-device performance guarantee. See PROGRESS.md for scope and evidence. Review the refined preview before authorizing production migration.

- Compare each rendered floor against its saved approved concept at equivalent camera framing and desktop viewport sizes.
- Inspect shell corners and northeast wall alignment; floor geometry dimensions must be identical by construction.
- Verify exactly three pins per floor, correct left/center/right labels, clean hover transitions, visible keyboard focus and no-op clicks/activation.
- Verify scroll down/up and Home/Resources clicks use the same floor transition; direct anchors, refresh and history select the right floor.
- Verify About remains noninteractive and no About implementation is present.
- Check character paths, animation loop seams, seated movement, reduced motion, hidden-tab pause, inactive-floor pause, WebGL failure and loading.
- Profile on a representative desktop: aim for smooth 60fps on the agreed machine, cap DPR, and budget shadows/draw calls before adding effects. No measured performance claim until tested; choose a reference device during implementation.
- Run the existing frontend tests, lint and build after code changes. Add focused tests for shell/marker invariants, preview navigation and inert tool activation; use real-browser checks for WebGL, motion and visual fidelity.
- Confirm current home anchors, paper deep links, all three tool routes and policy pages still work. No solver tests are necessary unless solver code changes, which is outside scope.
- Record visual differences and fixes. Present the preview for review before any production migration.

## Official technical references

Reviewed October 13, 2026; recheck dependency compatibility when implementation starts.

- [React Three Fiber introduction and React compatibility](https://r3f.docs.pmnd.rs/getting-started/introduction)
- [Canvas configuration and fallback](https://r3f.docs.pmnd.rs/api/canvas)
- [Scaling performance](https://r3f.docs.pmnd.rs/advanced/scaling-performance)
- [drei OrthographicCamera](https://drei.docs.pmnd.rs/cameras/orthographic-camera)
- [drei Html](https://drei.docs.pmnd.rs/misc/html)
- [drei useGLTF](https://drei.docs.pmnd.rs/loaders/gltf-use-gltf)
- [drei useAnimations](https://drei.docs.pmnd.rs/abstractions/use-animations)
