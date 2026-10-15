# Preview implementation and acceptance plan

Status: structural, motion, preview integration, and verification/finish phases are complete for the agreed desktop preview scope. See [INTEGRATION.md](INTEGRATION.md) for acceptance evidence and test-method limits, [MOTION_PROTOTYPE.md](MOTION_PROTOTYPE.md) for choreography, and [STRUCTURAL_PROTOTYPE.md](STRUCTURAL_PROTOTYPE.md) for geometry. Mobile, cross-device certification and production rollout remain outside this delivery.

## Scope boundary

All new behavior belongs to `/preview/office` and preview-owned assets/styles. Do not modify production homepage content, tools, production navigation, global typography, policy pages, API behavior, or deployment configuration. No production migration phase is included. The existing preview route already exists; prefer leaving `App.tsx` untouched.

Preserve Home/Resources interiors, furniture layouts, people identities and simulations, doors, and desk disclosure behavior. About stays visible and inactive. New work is city composition, exterior tower structure, opening facade panels, preview header/type treatment, motion coordination, camera handoff, and preview navigation states.

## Delivery order

| Phase | Deliverable | Completion condition |
| --- | --- | --- |
| Visual references | Selected Grounded District, supplied preview-floor reference, and the updated storyboard including facade descent and distant Resources reveal | Header/type direction and the same tower's closed/open construction are reviewable together |
| Structural prototype — complete | Sparse city, closed tower, both preserved floors, lower base, and manually selectable exposure poses | City, Home, and Resources share one building; whole-tower inspection exposes their separation |
| Motion prototype — complete | Entrance, vertical travel in both directions, reverse reassembly, camera handoff and parallax | Compact equal-gap opening followed by zoom/upper clearance; joint floor-to-floor closure |
| Preview integration — complete | Chosen typography/header, keyboard actions, history, interruption, reduced motion, loading, and current-scene fallback | Agreed desktop interaction is complete inside preview |
| Verification and finish — complete | Focused tests, browser walkthroughs, frame captures, measured rendering cost, documentation updates | Scoped evidence and limitations recorded in INTEGRATION.md; production files unchanged |

Do not implement the live prototype before the generated concepts and storyboard are reviewed together. This is the user's chosen work sequence. Do not expand the visual-reference stage into a multi-section website or redesign the interiors.

## Proposed module ownership

Names for new files are suggestions; inspect the current code before implementing.

| Module | Responsibility |
| --- | --- |
| `OfficePreview.tsx`, `office.css` | City/floor interface states, preview-only header/type, entry controls, focus, loading/fallback boundaries |
| `OfficeCanvas.tsx` | Persistent scene, camera/render lifecycle, city/tower/floor assemblies, transformed marker projection |
| `CityDistrict.tsx`, `towerStructure.ts` | Four detailed supporting buildings with varied facade rhythms, blank distant context, rounded paving, roads/crossings and planted edges on continuous ground; batched geometry |
| `TowerAssembly.tsx`, `towerStructure.ts`, `towerResources.ts` | Closed facade, Home cap, substantial intermediate tower, distant Resources attachment, lower base and retractable panels; shared facade resources and one elevation system |
| `OfficeFloor.tsx` / `OfficeShell.tsx` | Reuse the existing interior; expose only the narrow attachment options needed to compose external tower structure |
| `useOfficeNavigation.ts` or a focused replacement | City/Home/Resources destinations, history, motion phases, latest intent, readiness acknowledgement |
| `towerMotion.ts`, `TowerMotionDriver.tsx` | Shared waypoints, sampled assembly/camera transforms, retargeting, resize and presentation readiness; no per-frame React state updates |
| `cameraFit.ts`, `OfficeViewControls.tsx` / `officeView.ts` | Shared district/inspection/office fits, captured framing and continuous office camera handoff |
| `CityAtmosphere.ts`, `OfficeCanvas.tsx` | City-only depth-aware peripheral blur/fade and colour-correct output; native sharp rendering for settled offices; resize/disposal of owned render targets |
| `sceneResources.ts` | Shared materials and repeated facade resources; explicit resource lifecycle |
| `OfficeFallback.tsx` | City fallback and accessible destination selection alongside existing floor art |
| `OfficePeople.tsx` / session integration | Retain current simulation behavior and correctly position visible characters during travel |

Retain React Three Fiber/Three.js for scene motion unless a demonstrated need warrants another dependency. Start with a deterministic timeline and transform interpolation, not a second rendering stack. A persistent canvas is the preferred prototype so entrance does not require remounting a different camera or scene at arrival.

## Structural checks before motion

- Home and Resources share the existing 20 x 20 metre footprint. Exterior frames align in all authored states.
- Resources is many storeys below Home, initially six closed intervening storeys (about 23.8 metres origin separation at a proposed 3.4 metre pitch). Use one authored tower descriptor; do not reuse the old -7 metre metadata as a requirement. Confirm count and proportions in the prototype.
- Both local openings read as three dominant pieces. Home lifts its cap; Resources lifts the much taller assembly containing the intermediate facade, enclosed Home, and cap. Keep the occupied interiors unchanged.
- Intermediate storeys need a lightweight exterior only, with shared facade resources; do not add new inhabited floors, people simulations, or detailed window interiors.
- Front exterior panels can retract without intersecting back walls, room partitions, furniture, or people.
- The base remains grounded in city view and visible beneath either selected floor. It needs exterior detail only.
- The revised tower has six fixed storeys below Resources, six closed intervening storeys, Home, and a two-storey cap (16 storeys total, including Resources). Use the current [motion contract](TRANSITION.md#current-structure-and-motion-contract), not older generated facade counts. Resources arrival must crop the lower facade past the viewport bottom.
- Home/Resources marker and desk hit projections follow floor transforms.
- Upper assembly clears the active view and does not cast an implausible dark ceiling shadow onto the floor after arrival.

## Motion implementation gate for the taller base

The motion prototype now gives both offices independent canonical parent transforms, retains facade panels/assemblies throughout motion, projects pins through their actual world matrices, and establishes one continuous camera owner. It replaces selected-floor placement and branch-based facade swaps with persistent groups. Keep the following checks when changing the motion rig; endpoint interpolation alone is insufficient.

Motion checks and ongoing integration gates:

- City → Home → Resources → Home → city, plus Resources → city, ends at the same descriptor-derived transforms as a direct visit. Intermediate frames keep the six-storey base and district fixed.
- Resources travel passes the six closed intervening storeys, lifts the whole upper stack as one assembly, and returns its slice to −23.8 m on closure rather than to the foundation.
- Sample reveal/closure and interrupted/reversed journeys for facade/office popping, rigid-section separation, and intersection with the selected interior. A passing endpoint test alone does not satisfy this gate.
- At 1280 × 720 and 1440 × 900, the Home/Resources handoff preserves the interior fit, the remaining facade extends offscreen below, and the upper assembly is clear. Reassembled city fit includes the extended foundation without a framing jump.
- Repeat resize, latest-destination interruption, reduced motion and hidden-tab return with the revised ground. The final presented frame, markers and existing office controls must agree before input is enabled.

## Performance approach

Few buildings can still be expensive if every window adds a material or draw call. Reuse or instance repeated facade elements, share geometries/materials, and use simple opaque/tinted window treatment on background buildings. Keep true office glass where it already contributes to the interior.

Avoid detailed interiors in supporting buildings, moving traffic, extra character crowds, reflection probes per building, multiple full-resolution shadow maps, or keeping offscreen city detail active unnecessarily. Preserve existing shared-resource lifecycle guarantees.

Start from the existing canvas DPR cap of 1.5. Evaluate shadow coverage for city and floor views separately: the current office light's shadow bounds do not automatically cover a new city. Ensure the camera's far plane contains separated tower groups. Any adaptive quality rules should be based on measured needs.

Proposed target: smooth 60 fps travel on the development desktop at 1440 x 900. Record the actual GPU/browser, frame-time distribution, draw calls, triangles, resource use, and added asset bytes; no performance guarantee is implied before measurement. Compare idle city, entrance, Home idle, floor travel, Resources idle, and repeated round trips. Inspect resource counts for growth across journeys. If performance falls short, simplify supporting buildings and exterior materials before degrading office readability.

Mobile/touch design and phone performance acceptance are deferred; do not represent a scaled-down desktop screenshot as a completed mobile experience.

## Acceptance matrix

| Area | Required evidence |
| --- | --- |
| Production isolation | Final diff affects preview-owned modules/assets and design docs only; production routes, copy, links, and global styles are unchanged |
| Landing | One screen at 1440 x 900 and 1280 x 720; exact copy, minimal wordmark, visible CTA, dominant tower, 4-6 supporting buildings |
| Parallax | Small bounded motion; no free orbit; continuous camera handoff on entry; no motion under reduced-motion preference |
| Equivalent entrances | Keyboard/button and tower activation reach the same Home transition; repeated click starts only one journey |
| Home entrance | Upper assembly/panels +4.4 m and slice +2.2 m open together in 1.05 s; zoom for 1.55 s while upper section continues to +32 m and slice stays put; total 2.6 s |
| Floor travel | Outgoing slice and upper section close together with slight camera pullback; camera then passes closed facade storeys; equal gaps open at the destination before zoom/upper clearance, in both directions |
| Building continuity | Selected front panels lift with upper assembly; lower facade remains visible below both active floors; closed return has no seams or stranded pieces |
| Logo return | Works from either floor and mid-travel; zooms out/reassembles; a new city entry replays the full entrance |
| Controls | Existing office pan/zoom, reset, keyboard commands, and desk disclosures work after arrival; no motion owner fights the camera |
| Pins and focus | No pins or desk hit regions on moving/hidden floors; correct world projection after travel; focus moves to destination |
| History and interruption | Direct hashes, Back/Forward, rapid navigation, resize, hidden-tab return, and changing motion preference settle consistently |
| People and doors | Existing interior behavior is preserved; returning floors retain session state; people never detach from moving slabs |
| Failure paths | Early entry retains its destination until ready; failed scene module or no WebGL permits static Home/Resources; optional character failures leave the live floor usable; reduced motion works independently |
| Header | Home/Resources are working floor controls; About is visibly noninteractive; logo reaches city |
| Performance | Measured frame behavior and resource counts across repeated journeys, with limitations documented |

## Verification workflow

Before runtime edits, capture the current live Home and Resources views and record their controls and test baseline. For implementation, add focused tests for destination/history parsing, transition endpoints/retargeting, assembly clearance, camera handoff, world-space marker projection, and lifecycle cleanup. Reuse existing floor/simulation tests; do not duplicate low-value render snapshots or rewrite unaffected finance-tool tests.

Run the appropriate preview test set while iterating, then the existing web test, lint, and build gates:

```powershell
npm run test:web
npm run lint:web
npm run build:web
```

Perform a real-browser desktop walkthrough of every acceptance journey. Inspect stills at closed city, peak Home split, Home arrival, facade descent, Resources reveal, Resources arrival, and reassembled city. Test with reduced motion and WebGL disabled, then repeat with resize and rapid navigation. Use taste critique on the landing/header without letting generic image-count or decorative-motion rules enlarge the agreed brief.

Update the office documentation to describe the new preview entry and transitions once implemented. Do not change production documentation to imply a rollout. Stop when this preview acceptance matrix passes; further city detail, functional About, tool activation, interior redesign, mobile work, and deployment need separate scope.
