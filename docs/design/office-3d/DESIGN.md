# Office architecture and behavior

The current implementation is an isolated React/Three preview at `/preview/office`. It does not replace the production homepage, launch tools, or activate About. The two approved references remain in `concepts/`; current behavior and layout are defined by code and the notes below.

## Scene and layout

Both floors share a 20x20 metre square shell, 0.32m walls, 0.58m front cutaway walls, and 2.9225m tall caps. `layouts.ts` owns dimensions, fixtures, rooms, and seating anchors. `OfficeShell.tsx`, `OfficeFloor.tsx`, and `Furniture.tsx` render those descriptors. `officeSpatial.ts` defines the corresponding solid footprints, seat positions, doorway crossings, and approach/departure points; rugs and room interiors are traversable.

The visual system uses cream tile and walls, pale wood, navy upholstery, blue screens, faceted plants, and single-plane glass. Interior and exterior glass use separate materials. Cream exterior frames surround broad windows, with floor-specific opening spans. Furniture geometry, materials, textures, charts, and foliage are cached in `sceneResources.ts`.

Office close-ups retain the light-blue (`#cfe4ff`) background and original orthographic framing, now with a lower tower facade. The city and whole-tower inspection add continuous pale ground, four supporting buildings, simple roads and trees, distance fog, and wider daylight shadow coverage. `towerStructure.ts` places Resources 23.8 metres below Home with six closed intervening storeys; `TowerAssembly.tsx` owns the persistent exterior assemblies. `cameraFit.ts` supplies the city/inspection and office fits while the motion driver and settled office controls share camera ownership. One render pass draws the persistent scene.

## Navigation and interaction

`OfficePreview.tsx` owns the native header, accessible stage, lazy canvas boundary, and WebGL fallback. `useOfficeNavigation.ts` owns loading/moving/idle destinations, latest intent, history and skip/preference handling. `towerMotion.ts` defines deterministic staged journeys; `TowerMotionDriver.tsx` applies persistent assembly/office transforms and owns the camera until the actual destination frame is presented. Camera fits are shared in `cameraFit.ts`; office controls resume after arrival. Stale acknowledgements are ignored. See [motion structure and verification](../city-landing/MOTION_PROTOTYPE.md).

`OfficeViewControls.tsx` and `officeView.ts` provide cursor-anchored wheel zoom from 1x to 2x, bounded mouse drag, elastic overshoot, keyboard controls, and reset on floor selection. The isometric angle stays fixed. Pins remain constant in CSS-pixel size while their world anchors and desk hit regions follow projection. `LocationMarker.tsx` supports whole-desk/pin hover, keyboard focus, and Escape dismissal. Activation is inert, and transitions temporarily disable disclosure.

## People, seating, and doors

Each floor has nine permanent identities and an independent random seed. Refresh creates new assignments; no identity, assignment, or behavior history is persisted. Every person has a unique home desk but can borrow any available seat. Roughly one third of eligible sitting trips prefer home. All desks, conference chairs, armchairs, sofa places, and coffee stools participate; rooms use the same random rules.

`peoplePaths.ts` builds a cached sampled navigation graph with exact seat and doorway anchors. A* routes are checked against actual obstacles and animated body/stride envelopes. People wait, yield, or reroute around occupied paths. `peopleSimulation.ts` runs fixed 100ms decisions and collision checks, reserves seats on approach, and releases them on departure or cancellation. People sit for 10-20 seconds, walk at 0.95m/s, and occasionally stand for 1-3 seconds. Sitting/walking balance is a soft preference, not a quota.

Doors pause approaching walkers while opening, admit followers traveling in the same direction, yield opposing traffic, and close after clearance. Only the leaf and handle rotate; frames and transoms stay fixed. Collision checks include the moving leaf.

`OfficePeople.tsx` renders cloned rigs with shared geometry and clips. Animations sample continuous session time each display frame; position, turns, and stride blending interpolate between simulation steps. Walk playback matches the measured 1.96m cycle distance of each rig. Periodic keyboard typing is a small forearm oscillation. Non-keyboard seats use resting poses, and sit/stand transitions switch directly between poses.

Sofa poses use level thighs, vertical calves, and raised feet. Hip height is 5cm above the preceding floor-reaching pose, allowing the models to sit about 30cm farther back. Rig-specific anchors retain a measured buffer from the sofa base. The collision envelope includes the raised feet. Person and sofa dimensions remain unchanged.

## Lifecycle and resource ownership

`PeopleSession` owns both logical floor simulations. Hidden pages perform cheap periodic behavior work without WebGL or mixers. Returning frames catch up elapsed time in bounded batches before presentation. Only the visible floor applies mixers. Reduced motion pauses session time and freezes poses and doors.

The canvas renders continuously for visible office motion and on demand when paused or in the city. Camera projection avoids unnecessary DOM updates and includes the selected floor's tower elevation. Shared scene resources persist across floor switches; per-person mixers, skeleton resources, and facade instance buffers are disposed on unmount. History/visibility listeners and input handlers clean up. `OfficeFallback.tsx` imports both approved floor PNGs and the Grounded District storyboard reference and shares preview navigation when WebGL fails.

## Verification and scope

Tests protect shell/furniture bounds, all seat routes, reservation exclusivity, repeated collision-free behavior, crowd/door recovery, catch-up equivalence, model hashes and dimensions, gait timing, typing, sofa mesh/edge clearance, labels, view controls, and navigation lifecycle. Browser checks verify the resulting poses and interactions. See [ASSETS.md](ASSETS.md) for source and license details. Production migration and mobile/touch approval are outside the current preview's scope.

