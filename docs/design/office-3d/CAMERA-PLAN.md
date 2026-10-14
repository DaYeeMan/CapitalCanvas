# Office zoom, pan and floor navigation plan

Status: V5B implemented and browser-verified October 13, 2026, following V5A, and reverified after V5C and V6–V7 completion October 14. User answers and final tuning are in [DECISIONS.md](DECISIONS.md); completion evidence is in [VISUAL-REVIEW.md](VISUAL-REVIEW.md).

Confirmed follow-up, planning only: [REMAINING-DIFFERENCES-PLAN.md](REMAINING-DIFFERENCES-PLAN.md#f3-cloud-wipe-replacing-vertical-floor-slides) supersedes the vertical-slide choreography below with a roughly 1.2-second left/right cloud cover → opaque floor/view commit → retreat. The header stays above the clouds and usable; latest selection wins. Reset to centered 1× happens immediately under opaque cover, with no visible floor/scenery slide or camera reset animation. Reduced motion switches immediately; fallback shares the wipe. Preserve settled camera fit, angle, zoom/pan bounds and marker sizing. The slide descriptions below document the preceding implemented checkpoint until this follow-up is built.

V5C completed October 14, 2026: lowered tall wall/cap tops and revised exterior frames/openings before V6/V7. Fit now uses the actual shared 2.9225m cap/mullion top. Both-floor fits, pan bounds/rebound, projection at DPR 1/2 and header travel/reset are reverified. Minimum zoom remains centered 1×, maximum 2×, with existing elastic pan/header navigation. See [VISUAL-PLAN.md](VISUAL-PLAN.md) and [VISUAL-REVIEW.md](VISUAL-REVIEW.md).

V6 background dependency: real stepped stacks/base share this camera for zoom/pan, with no decorative parallax or changes to legal view bounds. One shared environment shifts gently using existing floor progress during the slide. Keep it excluded from office fitting/pan calculations and clear of the entire cinematic travel envelope; no static backdrop or second navigation controller. Reduced motion selects its destination immediately, with no ambient movement. This is a planning addition, not an implemented camera change.

## Confirmed interaction

- Keep the orthographic isometric angle; never orbit or rotate.
- The current centered full-floor composition is the most zoomed-out view. Normalize the responsive fitted camera to 1×; allow wheel zoom to about 2×. Wheel-up moves in, wheel-down moves out, focusing on the point beneath the mouse.
- Left-button drag starts anywhere in the scene, including furniture hit regions and location pins, once a small movement threshold is crossed. The floor follows the drag in screen space.
- Legal resting pan at 1× is centered with zero range. Dragging still gives a small resisted stretch, then returns to center on release. At greater zoom, pan lets the visitor inspect the whole floor without dragging it mostly off-screen. Beyond any boundary, use the same resisted stretch and return to the nearest legal position. No free inertial fling is requested.
- Pins and tool labels retain their existing CSS-pixel size while their anchors/hit regions follow the camera. Tool activation remains inert.
- Only Home/Resources header links switch floors; keep their vertical slide. Wheel input never switches floors at either zoom limit. Switching floors resets zoom/pan to centered 1× rather than remembering a prior view.

Implemented tuning: zoom 1–2×, wheel exponential sensitivity 0.0015 per normalized CSS pixel, 5px drag threshold, resistance capped at 48px and a critically damped 0.55s release/reset. Pan limits per axis are half the base projected span multiplied by (zoom−1), retaining baseline edge margins at the extremes. Header transitions use one 700ms eased progress source. Reduced motion settles immediately. Resize preserves zoom/recenters pan; hidden-page cancellation clamps transient stretch and retains settled zoom. Keyboard shortcuts listed below are implemented. Browser evidence and remaining V6/V7 limits are in VISUAL-REVIEW.md.

## File ownership

All runtime paths below are relative to `apps/web/src/site/office/`; the new control/math/test modules below are now implemented.

| File | Responsibility |
| --- | --- |
| `OfficeCanvas.tsx` | Separate responsive base fit from interactive zoom/pan; integrate controls with actual orthographic camera; projection updates on every view change; view-aware floor-travel clearance; demand redraw while interacting/rebounding |
| `OfficeViewControls.tsx` (new) | One camera/input controller mounted inside the existing Canvas, receiving the shared scene-wrapper element; wheel/pointer capture, drag lifecycle, resistant bounds and settling; cleanup, visibility/reduced-motion handling and floor-reset coordination |
| `officeView.ts` (new) | Small pure helpers for zoom clamping, projected floor/viewport pan limits and resisted overshoot; shared typed view configuration. No physics package or general camera framework |
| `OfficePreview.tsx` | Header-only floor navigation, accessible scene instructions, shared input wrapper/focus, view-reset coordination; remove old wheel-driven scrolling affordance |
| `useOfficeNavigation.ts` | Preserve one floor-transition progress source, direct hashes/history and active/settled state; remove native wheel/scroll-snap ownership of floor changes rather than running competing navigation systems |
| `LocationMarker.tsx` | Allow drag initiation through pin/hit overlays, suppress transient hover during dragging, keep keyboard disclosure/inert activation and restore stationary hover after release |
| `office.css` | Scene overflow/gesture scope and grab/grabbing states, fixed header/marker sizing; no two-floor native scroll track controlling the scene after replacement |
| `officeView.test.ts` (new), `OfficePreview.test.tsx`, `LocationMarker.test.tsx` | Meaningful boundary/zoom/navigation/overlay regressions; browser tests own actual geometry projection and drag feel |

Existing drei and R3F are sufficient. Do not enable default unrestricted OrbitControls: rotation is forbidden and the required elastic boundaries/reset behavior needs a single deliberate owner. Reuse existing helpers if they satisfy this contract; the module split above is a narrow proposed ownership boundary, not a requirement to add redundant abstractions.

## Fit and state

Keep base fit, interaction and floor travel distinct. Base fit derives from the shared shell and viewport, with the same centered minimum composition on both floors. Interactive zoom is a multiplier of that fit, not an independently hardcoded camera size. Recalculate on resize and clamp/recenter; do not shrink the scene further at wheel-out. The existing grey base remains part of shell bounds; no extra layer is added.

Use one view state containing zoom, legal pan, displayed drag overshoot and gesture/settling status. Keep continuous updates in refs/Three state, not React state every frame. Publish only discrete UI transitions where needed. Bounds come from projected office extents and the usable viewport/header clearance, not neighboring background stacks. At zoom 1, override all bounds to zero. Above it, derive bounded travel per axis so edge desks can be brought into view while enough floor stays visible; a diamond floor naturally has empty background near its corners, so do not require every viewport pixel to contain floor.

Cursor-anchored zoom should hold the corresponding floor-plane point under the cursor until a limit requires clamping. When zooming out, reduce the legal pan range and settle toward its nearest valid position, reaching centered zero pan at 1×. An ongoing drag, resize or new wheel input cancels/rebases any previous return animation instead of adding another controller.

## Input and marker coordination

Bind scene input on the common wrapper containing Canvas and projected HTML markers. The HTML desk/pin overlays must not swallow drag initiation. Use pointer capture after a small threshold; releasing outside the scene, pointer cancellation and lost capture all finish safely. Only primary-button scene gestures pan. Native header links, text selection outside the scene and other pages retain normal behavior.

Use proportional resistance outside legal bounds; do not allow unrestricted blank-space dragging. On release, settle to the nearest boundary with a short non-repeating spring. Keep numerical maximum stretch, spring timing and wheel sensitivity as tunable implementation parameters. Disable spring interpolation in reduced motion and clamp immediately on release. Do not add momentum after an in-bounds release.

Once dragging starts, close transient hover labels and suppress hover hit testing until the gesture ends; preserve keyboard focus and disclosure when appropriate. A pointer down/up below threshold keeps current inert click behavior. After settling, recalculate hover from the stationary pointer's new projected target rather than leaving a stale label. Pin and whole-pod hit projections must update whenever the camera changes: the current projection cache signature omits camera zoom/pan and must be revised. Keep labels/pins constant in screen size and edge-aware; clipped/offscreen desk targets must not create stray hover areas over the header.

Normalize wheel deltas for mouse/trackpad input and clamp at both ends. Wheel handling is scene-scoped; do not intercept Ctrl/Cmd browser zoom. Keyboard alternatives should work only when the scene has focus: propose +/− to zoom, arrow keys to pan and 0 to reset, preserving Tab/Escape, header link activation and browser shortcuts. These keyboard mappings are implementation defaults, not additional user-confirmed product choices. Touch/mobile interaction remains a separate design decision; no mobile sign-off is implied.

## Floor transitions, pause and fallback

Replace wheel-driven native scrolling with one header/hash-controlled transition progress source. Remove scroll-snap/two-page scroll coupling rather than hiding a still-active scroller. Preserve direct `#home`/`#resources`, browser back/forward, active underline and the CapitalCanvas Home link. Zoom/pan must not change the hash or history. Ignore scene gestures during floor travel and disable inactive/traveling markers as today.

On floor change, cancel active gestures/return animations and coordinate a reset to centered 1× before/during the vertical slide so the incoming floor arrives at the minimum view. Avoid a camera discontinuity between zoom reset and travel; review the choreography in-browser. Reduced motion selects the destination and resets immediately. Repeated clicks/history changes must leave exactly one settled active floor and three markers.

Demand-mode rendering must invalidate throughout deliberate camera movement and rebound even when workers are frozen; stop once settled. Hidden-page handling cancels gestures and pauses animation without leaving stretched pan or a stuck pointer capture when returning. Existing worker active/inactive lifecycle remains independent of camera gestures.

WebGL fallback remains a static concept view with native header navigation and inert About. Do not apply camera controls or false drag feedback to the fallback image. Update its instructions and verify floor selection after the navigation revision. Production routes and the original site's scrolling are unchanged.

## Acceptance evidence

- At the established desktop sizes, both floors start centered at 1× with the shared fit. Wheel-out never zooms farther out or changes floors; wheel-in stops around 2×.
- Verify cursor anchoring, wheel delta modes, repeated/rapid input, resize at nonzero pan and zoom-out while panned. Confirm legal bounds and no accumulated drift at 1×.
- Drag from empty scene, each marked desk and a pin. At 1× all directions show resisted temporary travel then return to center; at higher zoom every edge/corner rebounds to the nearest limit. Check below-threshold clicks, off-canvas release/cancel, new drag during rebound and no inertial fling.
- Inspect actual camera-to-DOM marker/hit alignment at minimum/maximum zoom, nonzero pan, stretch and rebound, at DPR 1/2 and reduced motion. Pins/labels stay constant in CSS size; whole-cluster labels, focus/Escape and inert activation survive.
- Home/Resources header and history transitions slide correctly, reset view and leave only the intended floor active. Wheel never switches floors; native header hover/About behavior remains correct.
- Reduced-motion camera gestures remain usable with immediate release/reset. Verify paused/hidden rendering, visible-state return, fallback, keyboard operation and unchanged production-site scrolling/browser zoom.
- Capture baseline and zoomed/panned views on both floors outside the repo. Unit tests prove deterministic clamp/boundary math; browser evidence proves projection, gesture routing and visual feel. V7 retains the final build/lint/test/performance review.
