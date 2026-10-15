# Tower transition and storyboard

Status: reference choreography implemented as a live motion prototype. The revised tower has six closed intervening storeys, six storeys beneath Resources and 23.8 metre office-origin separation. See [MOTION_PROTOTYPE.md](MOTION_PROTOTYPE.md) for actual waypoint timings, tests, browser evidence and integration limits. The tables below retain the storyboard's approximate timing ranges; code owns the sampled timeline.

## One building, several assemblies

Keep a common footprint, facade grid, isometric orientation, and material system throughout. Internally separate the roof/upper tower, Home floor, Resources floor, remaining base, and removable facade panels. The landing is one closed tower; the Home entrance reads as exactly three major pieces: upper tower, exposed Home slice, lower tower. Resources starts enclosed in that lower tower.

World floor order is upper cap → Home → substantial intermediate tower → Resources → lower base. Use six closed intervening storeys as the initial proportion, not six empty air gaps. A proposed 3.4 metre storey pitch puts the floor origins about 23.8 metres apart (seven storey intervals), with Home at 0 and Resources around -23.8. These are authored tower defaults, not user-specified measurements. The existing preview's -7 metre elevation metadata is historical source evidence, not the new geometry specification. Define destination elevations from one tower descriptor instead of a global adjacent-floor spacing constant.

Author closed, Home-exposed, and Resources-exposed target transforms. Use a modest reveal lift for the selected floor to show a gap above the remaining lower structure. Keep its floor slab, furnishings, people, and markers in one transform hierarchy. Upper sections lift far enough to clear the camera view without leaving an artificial roof shadow across the office. The continuous Grounded District ground and surrounding buildings do not rise during floor travel.

The selected floor's camera-facing exterior panels lift with its upper assembly. Retain the cutaway walls and back windows already belonging to the office interior. Do not fade the office's furniture or glass partitions to manufacture the reveal. For Resources, its removable front panels attach to the bottom of the entire upper assembly: intermediate closed storeys, Home, and the upper cap. Lift that substantial assembly and raise Resources slightly above the remaining lower base, repeating the Home-style local reveal at a different height. The structural tower between destinations is never replaced by empty space.

## Current structure and motion contract

The lower-base revision is authoritative over the older generated facade proportions. The tower has 16 storeys: fixed base levels 0–5, Resources at level 6, six intermediate closed storeys at levels 7–12, Home at level 13, and cap levels 14–15. Ground is at −44.65 m. Resources is 20.85 m above ground when closed and 23.05 m above ground when exposed. Its lower facade must continue past the bottom of the office arrival view at both desktop acceptance sizes.

Read all positions from `TOWER`, `levelY`, `GROUND_Y`, and `towerPose` in `apps/web/src/site/office/towerStructure.ts`. The values below describe the current endpoints, not additional constants to copy into a timeline.

| Endpoint | Office origin | Intermediate/enclosed Home offset | Cap/front panel lift |
| --- | --- | --- | --- |
| Closed city | Home 0 m; Resources −23.8 m, both enclosed | 0 m | 0 m |
| Home arrival | Home +2.2 m | 0 m | +32 m, including Home front panels |
| Resources arrival | Resources −21.6 m | +32 m | +32 m, including Resources front panels |

The four extra lower storeys move the foundation and district down by 13.6 m. They do not change the office-to-office journey: the canonical origins remain 23.8 m apart. The district and six-storey base stay fixed throughout every journey; closing an opening returns its slice to its own canonical elevation, never to ground. Reassembly must recover the current 16-storey city and its ground-derived camera bounds. The proposed travel timings remain starting values because the distance between offices is unchanged; judge city entry/return framing against the taller tower when motion exists.

Implementation constraints for the motion phase:

- Do not interpolate the two static `view` branches directly. Close the outgoing opening, traverse the enclosed facade, then reveal the destination. Maintain continuous transforms from the current pose when interrupted.
- The implemented rig uses persistent hollow exterior envelopes and moving assemblies. Reveal/hide the original interior under its occluding exterior; retain this mechanism when changing the choreography.
- Both offices now have independent canonical parent elevations throughout travel. At Resources, enclosed Home and its supporting deck travel with the upper assembly while Resources rises independently from the fixed base.
- Keep the intermediate section, enclosed Home, cap, and Resources front panels rigidly aligned when Resources opens. At Home, move only its cap/front panels and Home slice; the middle tower stays seated.
- Markers now project from the actual office world matrix and pins/hit regions unmount until arrival. Preserve this when adding further transforms.
- The motion driver owns the camera during travel and finishes at the shared office fit; existing office controls mount only after the destination frame is presented. Capture current pan/zoom before takeover. City bounds use the new ground; office fits keep the base cropped.
- Disable both casting and receiving shadows on lifted upper exterior pieces under variance shadow mapping, then restore them on reassembly. Check coverage through the enlarged vertical bounds and during camera travel.

Endpoint, sampled-motion, rigidity, resize and camera-handoff tests protect these dimensions and key choreography. Live desktop walkthroughs cover representative intermediate/reversed/interrupted journeys. Further failure-path/device checks remain in [IMPLEMENTATION.md](IMPLEMENTATION.md); this is not a continuous collision-solver guarantee.

## Entrance storyboard: city to Home

Target total: 2.6 seconds, within the requested 2-3 seconds. Times describe ready assets; loading is handled before the animation starts.

| Time | Building and camera | Interface |
| --- | --- | --- |
| Idle | Closed tower in Grounded District on continuous fading ground; small bounded pointer parallax | Landing wordmark, exact copy, and entry button visible; tower also enters |
| 0.00-0.25 s | Settle parallax toward the canonical view; begin opening gently | Lock duplicate activations; fade landing copy and CTA; keep wordmark stable |
| 0.20-1.00 s | Upper tower and Home front panels lift; Home slice separates above lower tower; Resources remains enclosed below | No office desk hits or pins yet |
| 0.85-2.25 s | Camera target and orthographic scale move continuously toward Home; split continues enough to clear its upper structure; city moves outside the view | Introduce office navigation as composition settles |
| 2.25-2.60 s | End at the authored Home view with lower facade visible | Present the actual destination frame, enable pins and existing controls, transfer keyboard focus |

The split should be legible before most of the city has left the frame. Preserve the angle rather than introducing a swooping perspective camera. Avoid a cut from a rendered tower image to a differently framed WebGL floor.

## Vertical travel: Home to Resources

Proposed duration: 2.6-3.0 seconds, starting at 2.8 seconds. The longer physical journey needs a readable facade traverse before the destination opens; it is no longer the earlier adjacent-floor 1.6 second swap.

| Time | Building and camera | Interface |
| --- | --- | --- |
| 0.00-0.30 s | Settle office pan/zoom continuously; begin leaving Home | Hide pins and disable desk hit regions |
| 0.20-0.65 s | Reseat Home and its cap as the camera leaves; Home becomes enclosed within the upper tower | Keep Home's interior/session intact; do not show two neighboring open office slices |
| 0.45-1.65 s | Slide camera target DOWN the exterior past several complete, closed facade storeys; keep isometric orientation and a readable window grid | Home exits above; Resources stays enclosed until its reveal begins |
| 1.45-2.30 s | At Resources level, lift the ENTIRE upper tower (intermediate storeys + enclosed Home + cap), taking Resources front panels with it; Resources slice rises modestly from the lower base | This is a second local three-part opening, matching the Home entrance mechanism |
| 2.20-2.80 s | Move into the Resources arrival view; remaining lower facade visible below, substantial upper tower outside frame above | Present Resources before enabling its pins, focus, and controls |

The descent must read as travel along a real tower: closed window rows pass through the frame. Do not stretch the air gap between open offices to suggest distance, leave Home hovering immediately above Resources, teleport Resources up to Home's elevation, or replace the trip with a fade. The upper section at Resources is much taller than the cap lifted for Home.

Resources → Home closes the local Resources opening, slides the camera upward along the closed intervening facade, then opens Home by lifting only the cap above Home. Each destination has its own reveal assembly; this is not a single joint moving two adjacent slabs in reverse.

For visual review, use two complementary travel keyframes: a facade descent view and a Resources reveal view. Neither requires both furnished floors to be visible together. At Resources close-up, Home is far above the viewport.

## Logo return to city

From Home, start with a proposed 1.6-1.9 second return. From distant Resources, allow about 2.0-2.4 seconds if needed for the larger assembly. Hide pins, reseat the active slice, lower its matching upper assembly and close its facade while the camera pulls back into Grounded District. From Resources, Home is already enclosed high inside the returning upper tower; do not bring the two furnished floors together or create two adjacent exposed bands. Finish at the same city camera and tower geometry as a fresh landing; resume parallax only afterward.

On the city itself, logo activation leaves the city settled. Every button/tower activation from the settled city plays the full entrance; no first-visit persistence or cookie is needed.

## State and camera ownership

One navigation controller owns destination and transition phase. Suggested phases: city idle, entering Home, Home idle, leaving Home, descending facade, revealing Resources, Resources idle, closing Resources, ascending facade, revealing Home, returning city. Keep the traverse/reveal phases explicit enough to prevent an adjacent-floor swap from reappearing. Loading and fallback are presentation conditions, not additional destinations.

During a transition, one motion owner updates assembly transforms, camera target, and orthographic scale. `OfficeViewControls` must not overwrite its camera on resize or every frame. Once the destination's actual rendered camera and transformed markers are ready, hand control to office pan/zoom using that exact pose. Keep a stable fit based on the active interior, with deliberate lower-facade crop; do not fit the entire tower and shrink the desks.

Markers project through their floor's current world transform, not through hard-coded coordinates at the scene origin. Hide all pins and desk hit regions while moving. Both floor simulations may retain session state, but apply expensive character animation only where actually visible during travel. Do not reset people or doors just because the floor is revisited.

The renderer must request frames throughout travel even though the office is not settled. Keep the existing demand-render mode for stationary reduced-motion scenes and stop visual rendering when the tab is hidden.

## Preview navigation defaults

These are proposed engineering defaults; they do not alter production URL behavior.

| URL or action | Behavior |
| --- | --- |
| `/preview/office` or `#city` | Show city landing |
| `/preview/office#home` | Open settled Home directly, without entrance |
| `/preview/office#resources` | Open settled Resources directly |
| Entry button/tower | Push Home destination and play entrance |
| Home/Resources navigation | Push destination and play vertical travel; selecting current floor keeps existing reset behavior |
| Logo from a floor | Push city destination and reassemble |
| Browser Back/Forward | Resolve preview destination; animate from current pose where motion is allowed; do not push a new entry |
| Unknown preview hash | Normalize to city with replacement history |

Direct floor links continue to support inspection without forcing city replay. This does not contradict replay on entry from city. Tool links, production `/#home` anchors, and workbench return links stay unchanged.

## Interruption, loading, and alternatives

- Repeated entry activations do not stack transitions. For navigation during travel, retain the latest requested destination and retarget continuously from the current pose; do not snap to the start of another animation. If that complicates the first prototype, disable floor selection briefly and document the temporary limitation before completion.
- Logo can return to city mid-travel using the current pose. Escape completes travel to its requested destination; a discreet keyboard-accessible skip action provides the same outcome during the cinematic entrance.
- Resize recomputes destination framing and continues from the current visual pose. Do not restart the entire 2.6 second sequence.
- Hidden tabs stop visual work. On return, settle the requested destination and present it before exposing controls, rather than replaying stale partial motion.
- Reduced motion uses the same destinations immediately, without parallax, splitting, vertical travel, or zoom. If the preference changes mid-transition, settle the current requested destination.
- Keep copy and a real entry control available while scene assets load. An early activation records one destination and shows a loading state; start motion only when its target can render. If loading or WebGL fails, proceed through the static fallback rather than waiting indefinitely.
- No-WebGL mode uses a matching city image and the existing Home/Resources art initially, with the existing explanation that floor artwork differs from the live scene. Static floor switching remains functional. A faithful fallback scene capture is preferable once the prototype exists.
- About remains a plain inactive label, never a broken link or button.

Accessibility does not require designing the deferred mobile experience. Keep the entry button and equivalent tower control reachable by keyboard, give floor navigation an active state, transfer focus to the destination heading/stage after travel, and keep hidden controls out of the focus order.
