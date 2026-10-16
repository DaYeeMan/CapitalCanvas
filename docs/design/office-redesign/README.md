# After Hours: office preview redesign

Historical design/preview record. The office was promoted to `/` on October 16, 2026; see [current office documentation](../office-3d/README.md). Earlier preview-only scope below records the original implementation phase.

Status: implemented in the isolated desktop preview, including lighting/atmosphere refinement and final interaction/motion polish.
The tower now sits farther from the camera, with trimmed rear paving to preserve full sidewalk widths. Matching paving fills the rounded plot corners; all floor assemblies share the fixed placement and retain their existing choreography.
Selected by the user on October 15, 2026. Implementation authorized and completed on October 15, 2026.

## Purpose

Capital Canvas is for anyone exploring financial models. The redesign should feel modern, professional, distinctive and welcoming. The existing 3D world fills most of the screen; the interface helps visitors enter, navigate and discover tools.

This document records the implemented After Hours direction. Current source ownership and behavior are described in [office architecture and behavior](../office-3d/DESIGN.md).

## Selected references

- [Reference gallery and review notes](REFERENCES.md)
- [City](concepts/01-city-v2.png)
- [Home](concepts/02-home-v2.png)
- [Resources](concepts/03-resources-v2.png)
- [Whole-tower inspection](concepts/04-tower-inspection-v2.png)
- [Desk interaction](concepts/05-desk-interaction-v2.png)
- [Entry sequence](storyboard/README.md)

These are generated art-direction references, not exact runtime screenshots. Retain the real geometry, furniture, people and desk anchors if the images differ. Details such as final spacing, marker size, navigation placement and motion timing will be refined before implementation.

## Required logo

Use the existing [capital-canvas-logo.png](../../../apps/web/public/capital-canvas-logo.png), served as `/capital-canvas-logo.png`.

Keep this actual white-and-cyan interlocking CC image; do not redraw, recolor or substitute a generated logo. Pair it with a compact Capital Canvas wordmark and preserve its aspect ratio.

The updated references use the supplied white-and-cyan logo as their identity input. Runtime implementation must use the exact PNG asset rather than tracing the generated rendition. Earlier redesign references using the navy preview logo have been replaced and removed.

## Preserve

- Existing city and recognizable tower geometry.
- Home and Resources floor layouts, furniture, people and simulation.
- Tower opening, floor separation, vertical travel and camera journeys.
- Pan, zoom, whole-tower inspection, direct floor links and browser history.
- Keyboard access, reduced-motion handling, static fallback and resource lifecycle.
- The current React, TypeScript, Vite and Three.js stack.
- Preview-only scope at `/preview/office`; production homepage and tool interfaces remain outside this redesign.

Background, palette, materials, lighting, typography, wording, header, navigation, buttons, pins, hover panels and UI animation may change. Improve visual continuity around the existing architectural motion without replacing its mechanics. Mobile is deferred.

## Visual system

### Atmosphere and materials

- Deep graphite base: starting value `#202A2D`, avoiding pure black.
- Subdued blue-grey haze and desaturated glazing.
- Warm ivory text and restrained warm highlights.
- Warm stone floors, pale wood and readable navy furnishings.
- Selected illuminated windows on the main tower and four detailed neighbours, plus visible streetlights, give the city depth. All plain background blocks stay blank in every view, with no window geometry or illumination.
- Interior light comes from modeled desk task lamps and a few floor lamps beside lounge seating. Use soft warm-neutral ivory light against the cooler city outside.
- Keep lamp arms compact and walking routes clear. Preserve the open cutaway: no suspended fixtures or ceiling that obscures the floor.
- Do not use glowing wall/window edges, unexplained light strips or wall-base light spill as light sources. Soft cool ambient fill may retain scene readability.
- Maintain readable office interiors; do not make the scene uniformly dark.
- Let streets and distant buildings recede continuously into atmospheric depth.
- No glass effects are needed. Use opaque, carefully proportioned controls and panels.

Treat these as starting tokens; confirm actual colors under the renderer's lighting and tone mapping. The logo retains its existing cyan independently of warm environmental light.

### Typography

Use locally hosted Geist variable type with medium and semibold hierarchy. The official font and OFL license are bundled under `/office/fonts/`.

Keep branding compact. Avoid oversized mastheads, dense financial-terminal typography and decorative status widgets.

### City landing

The 3D district remains the main subject, with the tower clearly dominant.

Draft copy:
- Headline: A Different / Perspective, on two lines.
- Supporting text: Visual tools for understanding financial models.
- Entry action: Enter Capital Canvas.

Use Home / Resources / About at the upper right. Keep entry as the clear primary action. Remove the redundant lower-right floor directory.

### Home and Resources

Use Home / Resources / About at the upper right, matching the city. Indicate the current destination with a fine underline. About now opens the [city-backed editorial note](about/README.md), following its later selection and implementation request.

Place Back to city at the bottom left and View whole tower at the bottom right. The bottom middle stays empty. Remove the floating floor selector and the Tools & experiments descriptor.

Resources inherits the same atmosphere, visible lighting fixtures and component system while retaining its own actual floor layout, including the conference room at right.

About remains inert in this redesign. Do not create a destination or new About floor.

### Desk markers and panels

Use small outlined diamonds. The first concept's markers should be reduced in size during refinement so they remain subtle.

On hover or keyboard focus:
- Emphasize the active diamond and reveal a compact opaque charcoal panel.
- Show the tool name, one useful sentence and one clear action.
- Use a short fine leader only where it helps connect the panel to the desk.
- Keep the other markers quiet and unlabeled.
- Place panels within the viewport, flipping sides when necessary and avoiding navigation.

Draft Home panel:
- Ithaca
- Explore option pricing.
- Open tool

Home actions use the existing routes:
- `/tools/ithaca`
- `/tools/troy`
- `/tools/delphi`

Resources uses the same panel layout, tool name and descriptive sentence as Home, with Read research replacing Open tool. Map it to that tool's existing research content during implementation.

## Motion and continuity

### City to Home

The user reports that surrounding buildings disappear suddenly during entry.

Source evidence: `TowerMotionDriver.tsx` uses `district.current.visible = frame.city > 0.005 || overview`. This binary cutoff is a possible contributor; verify the full perceptual cause during a live walkthrough.

Proposed treatment:
1. Give the entry action clear pressed feedback.
2. Let landing text and city-only controls leave gently as travel begins.
3. Preserve the current compact opening, slice lift and camera zoom.
4. Retain neighboring buildings while framing, distance and haze naturally obscure them.
5. Hide scene objects only once the change cannot create a visible pop.
6. Blend atmosphere continuously into the office view.
7. Introduce floor navigation as arrival settles; resume marker interactions afterward.

Apply equivalent continuity to city return and Home / Resources travel. Atmosphere should not rely on the same single value for every visibility, lighting and interface decision.

### Desk reveal

Proposed starting behavior:
- Approximately 180–220ms of opacity and 6–8px translation.
- Slight marker emphasis, with no constant pulsing or horizontal text stretching.
- Panel remains open while moving from the marker to its action.
- Brief exit grace period prevents hover flicker.
- Escape, travel and view manipulation dismiss the panel.
- Keyboard focus reveals the same information and supports entering the action.
- Reduced motion uses immediate states or simple opacity.

These timings are proposals. Stills cannot validate interaction quality; a focused motion prototype must demonstrate it.

## Completed visual reference work

The refreshed set covers city, Home, Resources, whole-tower inspection, a readable desk interaction detail, and two separate entry frames between the city and Home endpoints.

The user confirmed desk task lamps and lounge floor lamps; soft warm-neutral ivory light; top-right Home / Resources / About with About initially inactive; bottom-left Back to city; and identical Resources panel content with Read research replacing Open tool. The later About addition is documented in its [selected plan](about/README.md).

The floor drafts received a targeted correction to remove the continuous wall/window glow. Updated Home and Resources now show localized lamp lighting and matte perimeter surfaces. The older redesign image files and obsolete prompt set were removed after checking the new deliverables. Historical office geometry references and runtime fallback stills remain source material.

## Completed lighting and atmosphere refinement

The next phase is implemented: task and lounge lamps retain their physical positions with gentler, wider warm-neutral falloff; the stone floor has quieter tile variation; blue-grey ambient light and softer directional shadows preserve readable furniture. The city stays visible behind both floors through continuous aerial haze and a small depth-aware blur that rejects tower samples. The tower stays sharp, including inspection and travel. Subdued neighbouring masonry, blank background blocks, and graduated ivory window interiors on detailed buildings give the district more depth without changing its building positions or structural animation. All textures are project-authored and shared; no new dependency or remote environment is required.

All three static fallback images were refreshed from the final renderer. The desktop layout, logo, navigation, tool panels and existing routes remain intact.

## Completed interaction and motion polish

Panels now sit toward the nearest outer edge with measured header/footer clearance, a fine leader and a continuous hoverable connector. The marker settles in on arrival, expands subtly on reveal, and the opaque panel enters/exits with restrained opacity and vertical motion. Closed panels become inert immediately, and camera manipulation clears stale keyboard intent.

Whole-tower inspection uses a 720ms eased camera transition from the actual current pan/zoom. Its logarithmic scale interpolation can reverse mid-flight, responds to a new floor destination, and keeps desk interactions hidden until return is complete. Escape returns to the office. Inspection shadow coverage and atmosphere blend with the camera instead of switching abruptly; the existing architectural journey durations and assembly transforms remain authoritative. Reduced motion and hidden-page handling settle inspection immediately.

Entry copy, navigation underlines and footer controls use coordinated transitions; unavailable controls become inert during travel. This phase changes only preview-owned code and design notes. The main website, production routing and tool interfaces are excluded.

## Final lighting calibration against the references

City, Home, Resources and both inspection poses now share a cool dusk environment, neutral stone frames, ivory task light and restrained warm window/street accents. Every visible desk lamp contributes local light, with compact falloff and no wall/window light strips. A third floor lamp lights Home's central seating; its base uses the same rendering/navigation footprint, and seating/crowd clearance checks pass. Resources retains its two lounge/reading lamps.

| View | Reference lighting cues applied |
| --- | --- |
| City | Blue-grey dusk and readable streets; all thirteen street fixtures light nearby surfaces; warm occupied windows stand out against cool glazing. |
| Home | Local light on every desk, soft ivory seating pools, a cooler neutral floor between work areas, and subtle contact shading. |
| Resources | The same exposure and light palette as Home, with light placed at its actual desks, reading nook and window lounge. |
| Whole-tower inspection | The same environment, window emission and occupied-floor lighting at a wider scale, with continuous shadow/haze blending. |

A small project-authored dusk environment supplies rough reflections for glazing/metal. Depth-based contact shading grounds furniture, and high-threshold bloom adds a restrained halo to bright fixtures/windows. These effects run through the existing Three pipeline, resize with it and dispose on unmount; no new dependency or remote asset is required. Static fallback stills were recaptured after calibration.

The lighting follows the approved warm/cool balance; the generated references still differ in furniture detail, background architecture and framing. The actual geometry, tower alignment, floor descriptors and camera journeys remain authoritative. This pass does not claim pixel-for-pixel reproduction of generated illustrations.

## Return-to-city motion revision

Home and Resources return in two stages that reverse entry's structural order: hold the slice while pulling back and bringing the upper assembly to the compact split (1.55s), then close all gaps together during the final pullback (1.05s). The old separate floor reseat, tower reassembly and camera-settle sequence is removed. The final stage includes the remaining 10% of the pullback.

The landing headline, its explanation and the entry button fade and slide in together from that final stage's sampled clock. They reach full opacity and their final position when the camera stops, without a trailing CSS transition. The button remains inert during travel. Early reversed entries close directly if the compact city framing is already present; interrupted returns, resize, history, pan/zoom, Escape and reduced motion retain valid endpoints.

The revision passed 27 focused motion/navigation/shell tests and the production build. Frame-by-frame Edge checks at 1440 × 900 and 1280 × 720 verified both two-stage returns and the exact final copy opacity/transform, plus interruption, resize, history, skip and reduced motion. This remains preview-only.

## Floor-light continuity correction

Office lamps now light the interiors without warming the moving tower exterior. Exterior materials retain dusk, environment and street illumination; their point-light shader excludes the office-light family using the empty world-height band between street fixtures and Resources. The camera-to-world conversion updates every render, including inspection. Exterior wall finishes are separate from the interior wall material.

Task and lounge light strength follows the actual clearance between facade and slice: zero through 5cm, smoothly reaching the authored strength at 1.2m. Lights fade out before the interior visibility boundary, and interrupted/reversed journeys sample the same clearance. Fixture geometry and settled lamp strengths remain unchanged. Moving assemblies preserve their authored shadow flags; the key light's shadow camera stays beyond the raised cap rather than switching shadow participation when a piece starts moving. Camera choreography and timings are unchanged.

Verification: 30 focused lighting, motion, navigation and shell tests passed; build passed and lint has no errors (one existing Delphi warning). An actual WebGL pixel probe in Edge confirmed that office lamps leave exterior materials unchanged at both floor heights and a raised pose, while interior and street lighting still work with rotated cameras. Preview checks at 1440 × 900 and 1280 × 720 covered both openings/returns, both inspections, floor switching, an interrupted return and reduced motion, with no shader/console errors. Static fallback stills were refreshed. Browser plugin unavailable; checks used bundled Playwright with installed Edge. The fix remains isolated to the preview.

## Cutaway wall closure correction

The front cutaway walls keep their original 0.58m height and placement when open. During the last 1.2m of facade-to-slice clearance, they smoothly retract to 0.08m and move 1cm behind the exterior skin. Their closed height derives from the same band dimensions used by the facade, leaving them concealed before the interior visibility cutoff. Opening reverses the same physical-gap adjustment, including interrupted journeys. Camera paths, timings, floor layouts and settled appearance remain unchanged; existing fallback stills therefore remain current.

Both floors passed frozen-frame visibility comparisons in Edge: hiding the closed interior produced no visible front-wall change (Resources was pixel-identical; Home had only three pixels with a maximum five-level channel difference). Thirty-two focused wall, lighting, motion, navigation and shell tests passed. Build passed; lint had no errors and the existing Delphi warning. Desktop browser checks also cover reopening, city returns, early reversal, inspection and reduced motion. This remains preview-only.

## Window and neighboring facade refinement

All lit windows now use a smooth ivory gradient without the two brown lower-corner silhouettes. The four detailed smaller buildings share the office exterior's cream wall material, replacing the darker blue-grey masonry; their individual glazing, roofs, entrances and geometry remain as before. Undetailed background blocks remain blank, with a slightly lighter slate-blue finish (#596b7c) guided by the city concept in REFERENCES.md. City, Home, Resources and both inspection views passed desktop Edge checks with no console/shader errors; the production build passed and the three fallback stills were refreshed. This is a preview-only material/texture change.

## Annotated street additions

Five streetlights now continue the existing fixture rhythm at the annotated context-block edges. Two matching street trees occupy the two requested planting locations; three lamps join existing trees. The fixtures use the same warm bulbs, actual point lights and soft ground pools as the existing eight, bringing the total to thirteen. Existing building positions, blank context blocks, tree silhouettes and floor behavior remain unchanged. The two new tree planters sit directly on the ground without extra paving platforms; the original sidewalks continue unchanged. Annotation coordinates were mapped from the displayed fallback still onto the ground plane and adjusted onto the sidewalk edges.

City, both floors and both inspection views passed Edge checks at 1440 × 900, with an additional city check at the annotation's 1242 × 764 size. All thirteen fixtures have active local light sources; no console/shader errors were reported. Five existing road/sidewalk tests and the production build passed. Lint has no errors and one existing Delphi warning. All fallback stills were refreshed. Changes remain isolated to the preview.

## Landing atmosphere reference match

The landing now uses a dark navy copy side (#101c26) and a broad, softer blue-grey field around the city (core #3a4a57). The shared field supplies both the empty background and the target colour for distant geometry, so the city fades into the same atmosphere. A restrained local midtone lift and desaturation make roads and building surfaces more readable while retaining deep glazing and bright warm emission. This is colour grading in the existing output pass, with no new dependency, light source or geometry.

The adjustment follows the sampled city-presence value throughout entry/return and reaches zero on Home, Resources and floor inspection. Office lighting, exposure and camera choreography remain unchanged. Edge checks covered city, both floors, both inspections, both animated returns, history, pan/zoom, Escape, interrupted/early reversed travel, resize and reduced motion. Build passed; lint has no errors and its existing Delphi warning. Fallback stills were refreshed. The implementation remains preview-only and follows the reference's overall dark-left/illuminated-city balance rather than claiming an exact match to generated artwork.

## Next step

Review the implemented `/preview/office` prototype. The existing tower geometry and transforms remain authoritative, so the reference image’s misaligned cap is not reproduced. No production homepage or tool-interface migration is included.

The storyboard is an atmospheric and framing guide. Generated storey counts, cap heights, floor gaps, furniture details, lamp scale and marker anchors remain approximate; use the actual tower structure and floor descriptors for implementation. The exact CC PNG and the written navigation/lighting requirements take precedence over generated variations.

## Implementation sequence after design review

1. Establish preview-scoped color, type, spacing, control and motion tokens.
2. Apply the required logo, wordmark, navigation, copy and entry control.
3. Add compact desk lamps and lounge floor lamps, then update scene lighting, materials and atmosphere without changing floor layout or blocking walking routes. Check the existing crowd clearance around each fixture.
4. Remove visible disappearance during city entry and return while preserving structural choreography.
5. Add refined anchored panels and deliberately mapped actions.
6. Update static fallback stills after the rendered appearance settles.
7. Verify the complete desktop experience and run the relevant existing checks.

## Acceptance checks

- City, Home, Resources and inspection form one coherent After Hours world.
- The 3D scene remains dominant at 1280 × 720 and 1440 × 900.
- Required logo is the original `/capital-canvas-logo.png`.
- Entry, navigation and tool access are clear without excessive UI.
- Desk panels support hover and keyboard use without clipping or flicker.
- Neighboring buildings do not visibly pop away during travel.
- Existing geometry, simulation, floor travel, pan/zoom, history and interruption behavior remain intact.
- Reduced motion, static fallback and failure states retain legible navigation and content.
- Existing relevant tests, lint and build pass after implementation.

The desktop preview implementation is complete. Existing geometry, floor motion and crowd behavior are preserved; lighting fixtures, scene finishes, UI, action panels and fallback stills now follow this plan. About is implemented as the selected editorial note over the city, with consistent Geist typography and its own reading-gradient blend. Mobile is deferred.

## Verification

190 tests passed across 24 files. The production build passed; lint has no errors and one pre-existing warning in DelphiSurface.tsx. The Browser plugin is unavailable in this session, so browser verification used installed Edge through bundled Playwright. Earlier in-app browser attempts timed out on localhost. Checks covered 1440 × 900 and 1280 × 720, both floors, inspection, anchored hover/focus actions, a deliberately slow crossing of the panel connector, safe panel bounds at both desktop sizes, camera controls, zoomed inspection, mid-flight reversal, floor selection during inspection, city return/history, reduced motion and unavailable WebGL. Tool/research destinations were verified in the preceding phase; this phase checks the preview links without modifying or navigating the main website. Renderer stills were refreshed from the live scene. Shader setup is preloaded into the same linear render-target pipeline used by the live scene; first-run timing remains hardware dependent.

