# Office remaining-differences plan

Updated October 14, 2026. Status: planning only; no runtime changes are included in this document.

V0–V7 and V5A–V5C are completed desktop-preview checkpoints. This follow-up addresses the remaining differences and verification limits recorded in the latest [visual review](VISUAL-REVIEW.md#v6v7-desktop-completion--october-14-2026), plus the subsequently requested header/logo, cloud wipe, conference-door corrections, rear-corner upright removal and visible exterior glass. Ten header/logo answers and fifteen transition/door/corner/glass answers are confirmed below. Prior completion evidence remains historical; the new requirements have their own follow-up IDs and acceptance checks. Implementation is a subsequent task.

## Reference and baseline

Compare the approved [Home](concepts/home-approved.png) and [Resources](concepts/resources-approved.png) concepts with the final V7 [Home capture](C:/Users/enson/.codex/visualizations/2026/10/14/01a138da-ecb0-7f21-9b18-13b2a424a038/office-v67-home.png) and [Resources capture](C:/Users/enson/.codex/visualizations/2026/10/14/01a138da-ecb0-7f21-9b18-13b2a424a038/office-v67-resources.png), all at 1672×941. Use reduced motion and the initial authored worker poses for repeatable shape comparisons; inspect moving workers separately.

The user's recorded corrections in [DECISIONS.md](DECISIONS.md) take precedence over the generated concepts. Preserve the shared square, Home couch/two middle windows/current conference entrance side, Resources office-window separation and native camera controls. New follow-up requirements supersede the old vertical floor slide, Home conference door's fixed width, Resources conference glass-door panel and redundant rear-corner upright. Do not regenerate or overwrite either canonical concept to hide a difference.

## Remaining differences

| ID | Current evidence | Follow-up target | Classification |
| --- | --- | --- | --- |
| RD1 | Furniture remains more rectilinear than the illustrated desks, upholstery and supporting fixtures | Softer silhouettes and better cushion/support proportions where native-size crops show a meaningful difference | Optional visual refinement |
| RD2 | Plant leaves and canopies remain more faceted than the illustrated foliage | Fuller, less repetitive canopy silhouettes while retaining the low-poly direction and reserved clearances | Optional visual refinement |
| RD3 | The source character meshes remain more faceted than the generated people | Improve silhouette/shading where possible without losing validated bodies, rigs, seating or motion | Optional visual refinement with an asset compatibility boundary |
| RD4 | Stepped-stack placement and softness are an authored interpretation rather than the exact generated background | Refine cluster rhythm, foreground cropping, distant haze and shadow balance using the actual 3D environment | Optional visual refinement; retain real geometry/shadows |
| RD5 | Static fallback uses the unchanged concepts, so its windows, couch/door details and framing differ from the live scene | Make the difference explicit; assess whether a future fallback should instead show a captured final scene | Intentional fallback choice; replacement is not assumed |
| RD6 | Performance was measured on one local headless Edge host; hidden-tab behavior used simulated visibility events | Measure physical-device/browser performance and actual tab lifecycle before making broader claims | Verification gap, not an observed runtime defect |
| RD7 | The office header has a text-only wordmark and no translucent bar or CC logo | Add the confirmed cream translucent bar and dark-blue/cyan CC logo beside the existing wordmark, preserving camera framing and navigation | New user-requested header/branding work; choices confirmed |
| RD8 | Home/Resources currently use a 700ms vertical slide | Replace it with left/right illustrated clouds that fully cover the scene, hide the floor/view swap, then retreat; keep the top bar visible and usable above them | New user-requested transition; choices confirmed |
| RD9 | Resources' large right conference room has a glass entry door | Replace its panel with the existing pale-wood door kit at the current entrance, retaining dark framing, handle and glass above | Required room correction |
| RD10 | Home's far-left conference wood door leaves a narrow glass strip before the next full pane on its right | Extend the door bay horizontally to that next pane/jamb; remove the intervening glass strip and match the existing wood-door kit | Required geometric correction clarified by the user |
| RD11 | A lone dark vertical upright is visible at the highest rear wall junction on both floors | Remove only the redundant corner upright behind the small private office; retain other dark room framing | Required targeted geometry correction |
| RD12 | Exterior glazing is too faint to read as glass | Give exterior panes a clearly present but subtle cool-blue translucent fill and gentle sheen from existing lights; preserve interior room glass | Required material refinement; scope confirmed |

The historical V7 review did not identify these subsequent door/corner/material requests. RD7–RD12 now define the requested follow-up changes without undoing unrelated completed inventory, layout or camera work. Navigation typography, colors, native keyboard access and bounded camera behavior remain; cloud wipes intentionally replace the vertical transition.

## Confirmed header and logo decisions

The existing homepage header in [SiteLayout.tsx](../../../apps/web/src/site/SiteLayout.tsx) and [site.css](../../../apps/web/src/site/site.css) is the structural reference: full width, 88px desktop height, a 64px interlocking CC icon, logo/text grouping and a thin bottom divider. Its dark background is replaced for the office preview. The current office wordmark and navigation styling remain the typography/color reference.

| Detail | Confirmed direction |
| --- | --- |
| Bar color | Warm cream #FFF8EC |
| Translucency | Approximately 85% background opacity; equivalent CSS `rgb(255 248 236 / 85%)` |
| Scenery beneath the bar | Stays sharp; no backdrop blur |
| Bar shape | Full viewport width, flush with the top edge; no floating rounded panel |
| Desktop height | 88px, matching the real site |
| Scene relationship | Overlay the existing 3D scene; preserve current framing, camera target, fit and padding |
| Top-left brand | CC icon beside the existing “CapitalCanvas” wordmark, without adding a space to the name |
| Logo recolor | Only the white C becomes #081750; retain the cyan C and original interlocking shape |
| Desktop icon size | 64×64 CSS pixels |
| Bottom edge | Subtle thin divider like the real site; no added drop shadow |

These answers authorize this plan update. They do not authorize implementing the header or generating/editing its asset in this documentation task.

## Confirmed cloud, door, corner and glass decisions

| Detail | Confirmed direction |
| --- | --- |
| Cloud appearance | Soft illustrated white clouds with pale-blue shading |
| Entry/coverage | Clouds enter from both left and right and cover the scene; the top bar remains above them and visible |
| Underlying transition | Completely replace the vertical floor slide; swap to the destination only while fully covered |
| Exit | Clouds retreat to their original left/right edges |
| Duration | Approximately 1.2 seconds total, including a brief covered pause |
| Covered midpoint | Fully opaque, hiding the floor swap and centered view reset |
| Header during wipe | Remains usable; the latest floor choice wins |
| Reduced motion | Immediate floor/view selection, without cloud movement |
| Static fallback | Uses the same cloud wipe for floor changes |
| Conference door style | Resources right room and Home far-left long-table room match the existing private-office pale-wood panel, dark frame, handle and glass panel above |
| Resources entry placement | Retain its current conference entrance location |
| Home door defect | Its wood panel does not extend horizontally to the next full glass pane on the right; an extra glass strip remains between them |
| Home correction | Widen the door bay to the next full pane's jamb, removing that strip; retain the entrance side and left jamb/hinge-side anchor |
| Corner line | Remove only the lone upright at the highest rear cream-wall junction behind the small private office on each floor; retain other dark room frames |
| Glass scope | Exterior windows only; interior glass-room partitions keep their current treatment |
| Glass appearance | Very light cool-blue tint, clearly present but subtle translucent fill and gentle sheen |
| Reflections | Subtle highlights from existing scene lighting; no stylized streaks or new realistic-reflection pipeline |

These answers and the Home door-width clarification authorize documentation changes only. Transition artwork, runtime geometry and materials are not changed by this planning task. Exact easing, brief-pause timing, glass opacity/roughness and material highlight strength remain implementation tuning within the confirmed direction.

## Execution sequence and ownership

All implementation paths below are relative to `apps/web/src/site/office/` unless stated otherwise.

| Stage | Work | Primary ownership | Completion evidence |
| --- | --- | --- | --- |
| F0 | Establish a precise follow-up baseline | This plan, `VISUAL-REVIEW.md`; existing scene modules inspected only | Both native floors, paired detail crops and current transition frames; each change tied to RD1–RD12 |
| F1 | Add the translucent header and navy CC variant | `OfficePreview.tsx`, `office.css`, planned `apps/web/public/office/capital-canvas-logo-navy.png`; `ASSETS.md` and focused header checks | Confirmed 88px/85% cream bar, 64px navy/cyan icon, native wordmark/nav and unchanged camera; both floors/fallback inspected |
| F2 | Correct conference doors, rear-corner upright and exterior glass | `layouts.ts`, `Furniture.tsx`, `OfficeShell.tsx`, `sceneResources.ts`, focused geometry/material checks | Resources wood entry; Home width/adjacent-pane correction; clean rear corners; visible exterior panes with unchanged room glazing |
| F3 | Replace floor slides with the cloud wipe | `useOfficeNavigation.ts`, `OfficePreview.tsx`, `OfficeCanvas.tsx`, `OfficeViewControls.tsx`, `office.css`; planned `OfficeCloudWipe.tsx`/focused transition helper and tests | Opaque cover → latest destination/view commit → retreat; header above clouds; no visible vertical slide; normal/reduced motion/history/fallback verified |
| F4 | Refine a furniture sample and foliage | `Furniture.tsx`, `sceneResources.ts`; `layouts.ts`/`peoplePaths.ts` only if bounds genuinely change | One reviewed sample pod/lounge/plant, then reuse; full-floor and clearance checks |
| F5 | Refine character appearance within rig/pose constraints | `OfficePeople.tsx`, existing character-preparation script and assets; `ASSETS.md` if assets change | Paired standing/seated crops, moving samples and preserved asset/seat/path invariants |
| F6 | Tune surroundings composition and softness | `surroundings.ts`, `OfficeSurroundings.tsx`, `sceneResources.ts`, `OfficeCanvas.tsx` | Both floors, zoom/pan edges and cloud cover/reveal states; live shadow reception and clearance proof |
| F7 | Resolve fallback presentation explicitly | `OfficeFallback.tsx`, `ASSETS.md`, `DESIGN.md`; runtime assets only if a new fallback is selected | Recorded artwork retain/replace decision; forced WebGL failure with correct floor, cloud wipe and native header navigation |
| F8 | Validate on actual desktop devices and browsers | Existing scene lifecycle/view modules only if a defect is found; evidence in `VISUAL-REVIEW.md` | Device/browser measurements, cloud transition cost and real background-tab pause/resume observations |
| F9 | Present the resulting comparison and stop | This plan, `VISUAL-REVIEW.md`, `PROGRESS.md` and affected focused tests | All follow-up IDs resolved, explicitly retained or deferred with their reason; both floors presented |

F0 records the pre-change baseline without changing framing. F1 establishes the header above all transition content. F2 settles the requested door/corner/glass corrections; F3 replaces floor motion and verifies opaque swapping before optional detail work. Complete F4/F5 before final F6 surroundings tuning. F7 uses the final visual state if replacement artwork is selected. F8/F9 verify and document the result. A stage may make no code change if retaining the implementation is the justified outcome, but required RD7–RD12 changes cannot be closed by that default alone.

## F0: comparison baseline

Capture both floors and matching furniture, foliage, person and surroundings details at native resolution. Compare matching areas of both images rather than interpreting generated pixels as independent floor dimensions. Keep stationary poses and the existing shared fixed isometric camera, target, fit and padding.

Camera framing refinement is excluded from this follow-up. Preserve centered full-floor 1× fit, cursor-anchored 1–2× zoom, bounded elastic pan, native marker size and floor-switch reset. The reference's slab crop is not a remaining-difference work item.

Acceptance: each proposed change has paired evidence tied to RD1–RD12, with viewport, floor, motion setting and pose recorded. Add Home's door/right-hand strip, Resources' conference entry, both rear apexes and exterior/room-glass comparison crops. Subsequent changes retain the existing settled fit and camera/marker behavior at 1672×941, 1920×1080, 1440×900 and 1280×800.

## F1: translucent header and navy logo variant

Add the bar to the existing native `office-header`, keeping it above the scene and clouds during pan, zoom and floor selection. Use an 85% cream background, not opacity on the entire header: logo, wordmark, links and focus outlines remain fully opaque. Keep the bar full width and 88px tall on desktop, with no backdrop filter, rounded floating treatment or shadow. Use a subtle 1px bottom divider. Retain the existing desktop horizontal gutters; vertical padding must fit the 64px icon inside the 88px bar rather than retaining the current 28px top/bottom padding. The divider's precise low-contrast color is implementation tuning.

Create a separate office logo variant from [the current CC logo](../../../apps/web/public/capital-canvas-logo.png), with the white C recolored to #081750 and the cyan C/interlocking silhouette preserved. Preserve transparency and clean antialiased edges; the logo must not introduce a dark rectangular background on the light bar. The original white/cyan asset remains unchanged for the real site's dark header. The planned office asset path is `apps/web/public/office/capital-canvas-logo-navy.png`; document the derivation in ASSETS.md. No new logo design or replacement of the canonical office concepts is requested.

Place the 64×64px icon before the existing “CapitalCanvas” text in one brand link. Retain the current dark-blue serif wordmark typography and use the real site's approximately 12px icon/text gap as an implementation default. Keep its existing Home selection/view-reset behavior and one keyboard focus target; the icon may have empty alt text because the brand link already has an accessible name. Preserve Home/Resources/About positions, current navigation font/underline/colors/hover states, native keyboard operation and inert About. Apply the same header to both floors and the static fallback.

The bar overlays the existing scene: do not resize the Canvas, refit/retarget the camera or add top fit padding to compensate. F3 replaces floor-travel presentation independently of header sizing. Scene content remains visible through the cream tint with sharp edges. Header links/focus must remain reliable while scene zoom, drag/rebound and marker projection retain their behavior. Keep existing narrow-screen wrapping readable; 88px bar height and 64px icon size are desktop targets, and responsive sizing may adapt without claiming a new mobile/touch design.

Acceptance: inspect both floors at the established desktop sizes, DPR 1/2, zoom extremes and cloud cover/opaque/reveal states. Confirm the selected background color/alpha, measured desktop bar/icon dimensions, fully opaque navy/cyan branding, no blur/shadow and a subtle divider. The settled scene/camera projection is unchanged; labels and focus outlines stay readable without header/marker stacking conflicts. Logo/text/nav fit without clipping, brand selection still resets to Home, and forced WebGL fallback has one coherent native header. Header links and focus remain visible/usable above the wipe. Confirm the real site's original logo/header are unchanged and link matching before/after header captures from the review record.

## F2: conference doors, rear-corner upright and exterior glass

### Resources right conference entry: RD9

Change the existing front entry of Resources' large right conference room from glass to wood using explicit room-door data. Reuse the private-office kit's pale-wood panel/material, dark framing, handle and upper glass panel. Retain the entry's current side/bay, room position, table, seating and surrounding full panes. Leave private-office doors unchanged; no additional entrance or animated/interactive door is requested.

### Home far-left door width: RD10

The user identified the actual defect: an intervening glass strip between the wooden door and the next full glass pane on its right. This is a door-bay coverage problem, not merely a color/texture change. The current `GlassPartition` uses a fixed 1m door width independently of its regular pane cuts; Home's 6.2m side partition has approximately 1.24m bays, leaving a narrow extra segment after the door.

Keep the conference entrance on its existing side and retain its left jamb/hinge-side anchor. Extend the right door jamb and wood panel to the next full pane's boundary, removing the extra glass strip and its obsolete intermediate cut. Derive the door center/width and handle placement from these revised jamb faces rather than stretching the wood across an unchanged glass/frame segment. Match the private-office kit's height, thickness, finish, dark framing, hardware and glass transom; the door width may differ to fill its actual bay. Keep the adjacent full pane intact. Do not reintroduce the previously removed second/front entrance or move the room.

`layouts.ts` owns room-specific door intent; `GlassPartition` owns valid jamb/pane subdivisions. Add explicit width/bounds data only as needed. Cuts must be ordered, contained and non-overlapping, with no zero/negative pane widths, redundant endpoint posts or unwanted glass slivers. Do not globally widen every room's door.

### Rear apex line: RD11

Trace the upright at the highest rear cream-wall junction behind each small private office. `OfficeRoom` currently creates dark posts at all four room corners, including the corner backed by both shared exterior walls. Confirm the responsible mesh with live scene inspection, then omit only that redundant wall-backed upright on both floors. Keep other dark vertical posts/top mullions, cream wall caps, glazing, door frames and the shared visible top unchanged. Do not hide the line with a screenshot, opaque overlay, displaced wall or global frame recolor.

### Visible exterior glass: RD12

Separate exterior glazing appearance from room partitions. `Block` currently assigns one `glassMaterial` to every pane; changing that shared material globally would also change interior walls and glass transoms against the user's scope. Add an explicit exterior-material selection for `OfficeShell`, with the current room material as the unchanged default for `GlassPartition` and other interior panes.

Tune a very light cool-blue translucent fill and gentle sheen until exterior panes read clearly as glass at native framing, while the view through them stays open. Use existing scene lights and material highlight behavior; exact opacity/roughness/color values are implementation tuning. No frosted blur, painted reflection streaks, downloaded reflection image, refraction/SSR pipeline or new effect dependency is requested. Retain the thick cream exterior members, low sills, clear-pane bounds, Home's two undivided middle windows/private split and Resources' main/office separation. Interior glass appearance, dark frames and upper door glass stay as they are.

Acceptance: native/detail captures of both conference entries show coherent wood-door kits; Home's panel reaches the next full pane with no intervening strip, while the full pane and entry access remain. Both rear apexes have clean cream wall junctions without removing other dark framing. Exterior panes show subtle tint/sheen, including at zoom, while interior pane material/appearance is unchanged. Geometry checks cover revised door bounds/positive pane widths/no redundant cuts, targeted corner-post omission, unchanged opening coverage/top heights and retained room/furniture/path clearances. Update the old Resources glass-door and Home fixed-width assumptions deliberately; do not preserve obsolete assertions.

## F3: cloud wipe replacing vertical floor slides

Use a decorative cloud layer outside the Canvas so the same transition works for live 3D and the static fallback. Clouds are soft white illustrations with pale-blue shading. Local, cached artwork or authored vector shapes are implementation choices; this temporary UI layer does not replace the live 3D office/surroundings. Avoid a new rendering dependency or a separate always-running animation loop. Keep the original concept and logo assets intact.

Two cloud banks enter from opposite screen edges, fully cover the office/background/pins/labels/fallback content, then retreat to those same edges. The native top bar, logo, links and focus outlines stay above the clouds and usable throughout. Coverage must be opaque across the whole scene viewport at the commit point, including center seams and upper/lower edges; overlapping puffs alone must not leave holes that expose the swap. Normal duration is approximately 1.2 seconds with a short covered hold. A starting tuning budget is 525ms cover + 150ms covered + 525ms reveal; these precise subdivisions/easing are proposed defaults, not additional user requirements.

Use one cancellable navigation/transition owner with cover, covered-commit and reveal phases. `useOfficeNavigation.ts` owns pending/committed floor, hash/history and transition completion; the planned `OfficeCloudWipe.tsx` renders the decorative phase. A focused pure transition helper may own timing/state rules. Do not retain an independent vertical-slide tween beneath the wipe.

During cover, retain the outgoing floor/view. Once coverage is complete, commit the latest destination and snap the camera to centered 1× under the opaque clouds. Cancel any drag/rebound and apply reset immediately at this point; the existing 0.55s camera reset animation must not remain visible during reveal. Wait for the destination's actual scene/fallback and marker projection to reflect the committed state before uncovering. Reveal the destination at its shared settled fit, with no visible upward/downward floor travel. Preserve physical square/wall/floor-spacing data; only presentation/navigation changes. Any retained floor-dependent surroundings offset changes under full cover, without a visible scenery slide.

The header remains operable and the latest selection wins during any phase. Retarget or close the wipe as needed before committing/revealing a newer destination; do not queue stale destinations, expose intermediate floors, accumulate history entries from animation ticks or leave clouds stuck onscreen. Keep active navigation consistent with the committed/displayed floor. A same-floor selection should preserve the established view-reset behavior without an unnecessary floor-change wipe. Direct initial hashes load their destination without an intro wipe; subsequent Home/Resources, brand-to-Home and history changes use the same navigation owner.

Disable scene gestures and marker activation/focus stops while changing floors; preserve the native header, skip/focus accessibility and inert tool/About behavior. Clouds are decorative, not keyboard targets. Reduced motion bypasses cloud movement and selects/resets immediately. On a hidden page or unmount, cancel animation resources; hidden-page selection settles on the latest destination so restoring the tab cannot show an abandoned half-wipe. Inactive workers stay paused and resume only on the settled destination. Since the scene no longer travels, avoid continuous WebGL redraw solely for cloud movement when workers are paused; invalidate for the covered floor/view commit and otherwise use the existing demand/visibility lifecycle.

Acceptance: capture cover, fully opaque commit and reveal on both directions at native size, zoom/pan extremes and the established desktop fits/DPR 1/2. At opaque commit no scene, pin, label, seam or old floor leaks through; the bar is visible above and accepts a newer choice. Destination/view reset is hidden and reveal shows centered 1× with aligned constant-size markers. Verify rapid/reversed selections at each phase, history, same-floor reset, direct hashes, reduced motion, real/simulated hidden-tab cancellation, unmount cleanup and static fallback. Add meaningful timeline/state regression checks and browser interaction proof. Replace old vertical-travel assertions with cloud-phase/commit evidence; the earlier V7 slide captures remain historical.

## F4: furniture and foliage

Use one marked pod and one lounge as samples. Inspect chair back/seat curvature, cushion depth, armrest/sofa silhouettes, table/monitor support proportions and visible edges. Change only features whose difference is evident at native size. Reuse cached/material-batched geometry across both floors; avoid adding tiny decorations or geometry that cannot be seen at the approved framing.

For foliage, review one square planter and its canopy. Vary leaf orientation and cluster silhouette without abandoning the low-poly style, adding unsupported inventory, or exceeding the existing reserved 1×1m plant envelope. Check room-door visibility and walking routes before reusing the sample.

Acceptance: paired sample crops show the intended improvement; both floor compositions remain coherent. DESK dimensions, seat anchors, rugs and interaction hulls remain aligned. Existing square/containment and full-stride clearance tests pass. Record draw-call/triangle deltas and explain any increase.

## F5: character appearance

Distinguish surface faceting from body proportions: V5 already corrected body/head presence, keyboard hands, chair height and grounded feet. Inspect a standing walker and a seated worker from the actual fixed camera before changing topology or normals. Prefer compatible shading or preparation changes to the existing clothed assets when they improve the visible silhouette.

If the existing topology cannot reach the desired appearance, describe the limit and an asset-replacement option before choosing that route. Replacement must preserve a valid skeleton, animation compatibility, standing scale, authored seated pose, licensed provenance and manifest/binary validation. Do not add workers, gestures, idle animation states or a new crowd system as part of visual refinement.

Acceptance: no desk/chair/body clipping in stationary and moving samples; hands/hips/soles and full-stride envelopes remain validated. Reduced-motion initial poses, active/inactive motion and hidden-page pause remain. Update ASSETS.md and notices only if source assets or licensing actually change.

## F6: surroundings composition and softness

Compare left/right edge clusters, foreground cropping, the space around the rear-office corner and the near/far rhythm in both concepts. Tune deterministic anchors, adjoining prism dimensions and stack silhouettes before altering lighting or haze. Preserve larger/sharper near forms and smaller/fainter distant forms; orthographic distance alone does not supply scale.

Then review white-face clipping, blue shaded sides, contact seams, haze strength and softness of shadows on neighboring blocks and the ground. Retain actual box/prism geometry, the shared camera and separately scoped office/environment lighting. With the vertical slide replaced, any floor-dependent scenery offset changes only while clouds are opaque. Do not add a visible scenery slide, bitmap environment, painted shadows, decorative parallax, ambient bobbing or an additional grey office band. Add a rendering effect only for a demonstrated mismatch that existing lighting/fog cannot resolve.

Acceptance: the ground and every block remain clear of office depth at all allowed views and covered presentation commits. Keep the existing conservative clearance until a scoped change proves equivalent safety; do not move the ground upward just because the slide was removed. Surroundings stay excluded from fit/pan bounds. Verify real cast/receive shadows with controlled reception comparisons, stable layout on reload/reset, no idle/visible transition movement and cached shadows at rest. Record the measured cost of any new shadow/effect setting.

## F7: fallback choice

Current behavior is intentional: the original concept PNGs remain the static fallback and canonical visual references. Their different composition is RD5, not a WebGL failure bug. Retaining them is the default outcome.

If a closer fallback is subsequently requested, use separate captures of the final real 3D scene at settled Home/Resources states; retain the original canonical files unmodified. A fallback capture may be raster artwork only when WebGL is unavailable, never the interactive scene or its surroundings. Keep native header navigation, status text and tool names. Decide responsive framing rather than silently inheriting the concept's existing crop.

The confirmed cloud wipe applies regardless of whether fallback artwork is retained or replaced. Use the same cover/commit/reveal owner, top-bar stacking and reduced-motion bypass; do not implement a separate fallback transition.

Acceptance: forced WebGL failure selects the correct floor under full cloud cover, Home/Resources links remain usable above the wipe, tool names are readable after reveal and there are no misleading projected pins. Document which fallback artwork was selected and any remaining difference.

## F8: broader verification and performance

Use actual supported desktop browsers and physical hardware, including an integrated-GPU device when available. Record OS/browser version, GPU, viewport, DPR, motion setting, worker state and whether the run is headed or headless. Keep this matrix distinct from mobile/touch design approval.

Measure warm steady-state frame-time distributions and cloud cover/commit/reveal frames, color draw calls/triangles, shadow refresh frequency, overlay composition cost and memory/context stability through repeated floor changes and navigation. Test actual tab backgrounding/restoration as well as reduced motion; confirm inactive workers and scenery remain still and cancelled wipes settle correctly. Repeat comparable samples before attributing changes to geometry, clouds or shadows. Use GPU timing only when supported and report its availability.

The V7 native baseline is Home 801 color calls/169,172 triangles and Resources 806/178,096. The environment contributes two color calls/398 triangles; both shadow maps are 2048px, with background shadows cached at rest. Existing [performance samples](C:/Users/enson/.codex/visualizations/2026/10/14/01a138da-ecb0-7f21-9b18-13b2a424a038/office-v67-performance.json) are single-host evidence, not a universal budget. In particular, the noisy shadow-on/off CPU samples do not establish isolated GPU cost.

Acceptance: report per-device results and any reproducible regression with a responsible mechanism and focused fix. Set performance budgets from representative measurements; do not invent a cross-device FPS guarantee or downgrade geometry/shadows before a bottleneck is established.

## Constraints and separate future work

Preserve the shared 20×20 square, existing slab, 0.32m walls, 0.58m front cutaways, aligned 2.9225m visible tops, V5C cream exterior frames/opening coverage and distinct floor inventories. Retain interior glass/dark framing and other wood doors, except the explicitly targeted redundant rear upright and conference-door changes in F2. Preserve three tool identities, native labels/navigation, inert activation/About, clear walking envelopes, settled zoom/pan/reset, reduced motion, hidden/inactive pause, fallback and existing site/tool/policy routes. F1 adds the bar/logo without changing framing, wordmark/nav typography or the real site's original header/logo. F3 intentionally replaces visible vertical slides with the cloud wipe; camera framing remains excluded from refinement.

Production migration, mobile/touch composition, tool launching, resource readers and About behavior remain separate tasks. They are not differences from the approved desktop scene to fix automatically. Mobile work needs its own decisions about framing, touch disclosure/gestures and navigation before implementation.

## F9: evidence and stop condition

For every changed stage, save native full-floor and matching detail captures outside source control in the active chat visualization directory. Link them from the review record with viewport/DPR, floor, motion setting and pose/time. Include active workers, zoomed/panned views, both conference doors and apex corners, exterior/room-glass comparisons and cloud cover/opaque/reveal frames. Keep the canonical concepts and supplied navigation crop intact.

Run focused geometry/asset/path/view checks when their contracts change. Run the frontend suite, lint and production build at the final checkpoint, then present both floors with the remaining differences stated. Passing tests alone do not close a visual item.

Stop when required RD7–RD12 changes have their specified visual/interaction evidence and each optional RD1–RD6 item is improved, explicitly retained, or left open with specific evidence and the next required decision/device access. Do not silently retain the old slide, glass conference door, Home glass strip, apex upright or imperceptible exterior glazing as accepted defaults. Do not claim pixel-identical reference fidelity or broader platform approval from a desktop screenshot. Update this plan's stage status, VISUAL-REVIEW.md and PROGRESS.md without rewriting the earlier V7 completion history.
