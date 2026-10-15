# Discovery and clarification round

Date: 2026-10-14, user timezone America/Chicago.

## Confirmed from the user's request

- Plan using Markdown files and ask clarifying questions first.
- Use taste skills to help design.
- Put a city landing before the Home office experience.
- Retain the two supplied opening lines as the requested copy.
- Provide a visible button to enter Home.
- Separate the main tower into three sections, reveal the middle Home floor, and zoom into it.
- Add a lower building portion, currently missing beneath the office scenes.
- Keep the city sparse and match the existing office style, with more material realism than image 1.
- Preview only. Do not modify production pages or plan a production rollout as part of this work.

## Repository evidence

These are source observations, not claims about the deployed website or browser-verified appearance.

| Area | Current implementation | Planning implication |
| --- | --- | --- |
| Production entry | `apps/web/src/App.tsx` renders `HomePage.tsx` at `/`; its Home, Resources, and About are sections of one page | Leave these pages and their navigation untouched |
| Existing opening copy | `apps/web/src/site/HomePage.tsx` already contains both requested lines verbatim | Reuse the actual copy rather than inventing replacement messaging |
| Office route | `/preview/office#home` and `/preview/office#resources` are isolated from production | All new experience stays on this preview route |
| Scene stack | React, React Three Fiber, Drei, and Three.js already render local geometry and characters | Evaluate reuse before adding a rendering or animation dependency |
| Floor dimensions | `layouts.ts` defines a shared 20 x 20 metre footprint, 0.45 metre slab, 2.9225 metre wall height, and 7 metre floor spacing | The tower facade needs a consistent relation to these dimensions; spacing is not an approved physical tower design |
| Floor ordering | Resources has a declared elevation of -7 relative to Home; `OfficeCanvas.tsx` currently renders each floor at the same local origin and toggles visibility | Resources remains below Home, but the new plan requires a much larger physical separation; the -7 value is historical code evidence |
| Existing shell | `OfficeShell.tsx` supplies the office slab, window frames, and cutaway walls | A lower tower and closed exterior facade are new scene work |
| Materials | Cream structure, pale wood, navy furnishings, blue glass/screens, faceted plants; cached resources in `sceneResources.ts` | The existing material language is the strongest continuity reference |
| Backdrop | Office uses a flat `#cfe4ff` CSS background; surrounding scenery has been removed | The city/background needs a deliberate new composition |
| Projection and controls | Orthographic camera at `[28, 24, 28]`; `OfficeViewControls.tsx` fits office bounds on resize and owns pan/zoom | Entrance choreography must coordinate camera ownership and arrival fitting |
| Floor navigation | `useOfficeNavigation.ts` uses 250 ms fade-out and 250 ms fade-in, waiting for a destination frame before revealing it | Replace preview floor fades with vertical travel; retain presentation readiness guarantees |
| Rendering lifecycle | Visible animated office renders continuously; paused scene uses demand rendering; canvas DPR is capped at 1.5 | Transition rendering must continue even while normal office controls are unsettled |
| Interactions | Desk markers disclose names; tool activation and About are inert in the preview | Preserve desk behavior; keep About as an inactive label |
| Fallback | Approved Home/Resources art supports WebGL failure; docs explicitly distinguish art from current scene | A matching city fallback and updated tower fallback may be needed |
| Mobile | Current office controls ignore touch drags; docs defer mobile/touch approval | Mobile cannot be assumed complete just because header CSS is responsive |

Primary existing documentation: [office overview](../office-3d/README.md), [architecture](../office-3d/DESIGN.md), and [assets](../office-3d/ASSETS.md).

## First clarification round: answered

The user's selections below supersede the initial suggestions.

| Question | Confirmed answer |
| --- | --- |
| Scope | Work in preview; do not touch production pages |
| Content and branding | Single screen; explore header and typography using taste skills; flexible and independent of production styling |
| City | Sparse floating city block with 4-6 supporting buildings |
| Visual character | Match the current office closely; main tower dominates |
| Tower | Upper section, Home slice, lower tower; Resources separates from the lower tower while Home moves up |
| Entrance | Button-triggered, 2-3 second cinematic transition |
| Repeat visits | Logo returns to city; entering from city replays every time; separate vertical transition between floors |
| Devices | Desktop first; mobile behavior deferred |
| Process | Generated concepts and storyboard, then live prototype |

## Second clarification round: answered

| Question | Confirmed answer |
| --- | --- |
| Home to Resources | Descend to Resources while Home and the upper tower rise out of view; reverse for Resources to Home |
| Front facade | Selected floor's facade panels lift with the upper section |
| Logo return | Short reverse animation zooms out and reassembles the tower |
| City interaction | Subtle pointer parallax; button and tower both enter |
| Header | Minimal landing wordmark; Home/Resources/About inside; About need not function |
| Interior and tower framing | Preserve live interiors; visible lower facade below either floor; upper section offscreen |

## Proposed defaults, distinct from user decisions

Use “Enter CapitalCanvas” as the primary action label. Keep a fixed isometric angle during travel; capture the current parallax framing continuously on entry. Use explicit preview hashes for city, Home, and Resources; direct floor hashes open the selected floor without an entrance. Disable cinematic travel for reduced motion. Use current-scene stills for static city/floor alternatives. These are implementation defaults, not answers attributed to the user. Detailed behavior is in [TRANSITION.md](TRANSITION.md).

No further clarification blocks the written plan. Exact tower proportions, facade mechanics, typography, header dimensions, and animation timings will be judged in generated concepts and the storyboard before the live prototype.

## Technical direction to validate in the prototype

Test a continuous scene with a shared main tower and office footprint. Separate the upper facade, Home slice, Resources slice, and remaining tower base so the closed landing reads as one building and each floor can be revealed independently. Use simpler surrounding buildings and repeated facade resources. The landing still has three visible sections on entry; more internal scene groups are needed to expose Resources later.

The key prototype should prove three things: the closed tower reads as the same building as the office; the split visibly exposes the actual Home floor; and the entrance camera hands off to office controls without a framing jump. Determine actual scene complexity and performance from measurements, rather than assuming that a low building count guarantees low rendering cost.

## Boundaries for this stage

The visual-reference phase produced planning documents, generated concept/storyboard references, and the saved user reference. The user subsequently authorized the structural prototype. Preview-owned runtime code now implements static city/Home/Resources poses, the shared tower, and distant floor elevations. Live interior layouts, dependencies, production routes, and deployment configuration remain unchanged. See [STRUCTURAL_PROTOTYPE.md](STRUCTURAL_PROTOTYPE.md) for the current phase and verification.

## Latest confirmed decisions

- Grounded District is selected; only its landing concept image is retained. The district rests on continuous fading ground, superseding the early floating-block choice.
- The supplied opened preview floor is saved at [references/open-floor-preview.png](references/open-floor-preview.png) and guides the Home layout and opened-floor rendering style.
- Resources is much farther down the tower than Home. The camera slides down past closed storeys, the entire tower above Resources lifts, and Resources rises from the lower base in a local reveal similar to Home.
- The old adjacent-floor travel image is superseded. Six closed intervening storeys and a 2.8 second journey are proposed implementation defaults, not exact values supplied by the user.
- Structural, motion, integration and verification phases are implemented in preview only; production pages remain unchanged. See [integration evidence and limits](INTEGRATION.md).
- Latest October 15 motion clarification supersedes the earlier full-separation-before-zoom interpretation: first open equal gaps around the floor while the upper section stays visible (+2.2 m slice, +4.4 m upper assembly). During zoom, keep the slice fixed and continue raising the upper assembly to clearance. Home ↔ Resources closes the outgoing pieces together with a slight pullback, then traverses the closed facade and repeats the compact opening/zoom at the destination. All three clarifications were explicitly confirmed before implementation.
