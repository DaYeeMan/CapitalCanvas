# Office dependency and asset inventory

Updated October 13, 2026. Two validated, local clothed character GLBs are bundled and rendered.

## Installed and tested dependencies

| Package | Pinned version | Role |
| --- | --- | --- |
| `three` | 0.182.0 | Scene geometry, materials, camera projection and renderer |
| `@types/three` | 0.182.0 | Development types |
| `@react-three/fiber` | 9.8.1 | React 19 scene renderer; continuous motion and demand-rendered paused states |
| `@react-three/drei` | 10.7.9 | OrthographicCamera, useGLTF and useAnimations |

The npm registry reports Fiber's React peer range as `>=19 <19.4`, and drei's Fiber peer range as `^9.0.0`. The existing app resolves React and React DOM 19.2.8. Dependency resolution, TypeScript and the production build pass.

The initial test of Three.js 0.186.1 surfaced an upstream Fiber Clock deprecation and a removed soft-shadow mode. The tested milestone pins r182. Phase 4 uses built-in variance shadow mapping with an eight-sample blur; no shader chunk injection or source patch is retained. See the [official shadow configuration](https://threejs.org/docs/pages/LightShadow.html) and [migration guide](https://github.com/mrdoob/three.js/wiki/Migration-Guide). No console filtering is used.

## Reusable scene assets implemented

Furniture is project-authored R3F geometry: four-person desk pods, two-person benches, six-seat conference tables, desk chairs, padded armchairs, sofas, three-chair round-table seating, two-chair reading nooks, low bookcases, standalone printers, storage, coffee counters and planters. The obsolete low enclosed support/storage room is removed. Both floors now use the same 20×20 square shell with named northwest openings and opaque infill between them; Resources stays fully glazed. Geometry and material instances are cached at module scope and reused across both layouts. The scene renders continuously for visible animation/travel, on demand when paused, and caps DPR at 1.5.

Phase 4 adds project-authored deterministic DataTexture finishes for tile, pale wood and fabric, with mipmaps and shared material instances. RoundedBoxGeometry from Three's bundled addons is reused for cushions/tabletops. Shared line geometry draws decorative blue monitor/whiteboard charts; these are illustration, not live market data. Single double-sided glass planes avoid overlapping transparent box faces. Warm directional light, cool fill, neutral tone mapping and blurred variance shadows form the daylight setup. Nine background towers use one instanced mesh outside the shared footprint.

Exactly three native SVG location pins are projected from the active fitted camera. Whole-desk and pin hover, keyboard focus and Escape dismissal are implemented; activation remains inert. No new npm package was needed for the remaining phases.

V3/V4 add material-batched furniture assemblies using Three's existing BufferGeometryUtils: desk-chair seat/back/lumbar cushions, five-spoke frames and casters, table supports, armchairs, sofa cushions and round-table legs. Desk chairs use three draw calls each rather than separate calls per spoke/caster. Pointed creased leaves are project-authored geometry. Subdivided glass partitions contain one pane per region and explicit door framing/handles; no remote asset or extra dependency is introduced. The shared DESK constants keep chairs, seated workers and the projected interaction volume aligned.

Implemented V5A's additional Home couch/table/rug and northeast shelf/low counter reuse this furniture kit; no new image, GLB, person or grey base layer was added. V5B's bounded camera controls use the installed Three/R3F/drei stack without another controls/physics dependency; pins/labels remain native HTML/SVG at constant screen size. See [CAMERA-PLAN.md](CAMERA-PLAN.md). Existing licensed character assets and dependencies are unchanged; shared furniture geometry is reused for the new fixtures.

Implemented V5C reuses cached box/pane geometry and the exact cream wall material for thicker exterior members. Shared visible tops/named spans now give Home two middle windows and Resources a separate rear-office aperture; dark room frames/tan doors remain. No bitmap, model, material download or dependency was added.

Implemented V6 is project-authored live 3D geometry: 33 cached box instances in 11 stepped near/middle/far groups, non-emissive near-white materials, subtle depth fog and actual cast/receive shadows on blocks and a pale-blue ground plane. The old blue towers are replaced. One scene/camera uses scoped office/environment lighting and shadow passes, with cached background shadows and complete floor-slide clearance. V7 records actual geometry, reception controls, camera/lifecycle checks and measured render/shadow cost in VISUAL-REVIEW.md. No image-generation asset, skybox/billboard, painted shadow texture, remote model or dependency was added; canonical PNGs remain native fallback/reference assets only.

## Bundled characters — binary validation complete

The free Universal Base Characters and Universal Animation Library archives were successfully downloaded and inspected. The Standard base archive includes only superhero male/female meshes; regular proportions were absent. They were rejected for this office. The animation archive contains 43 clips, including sitting and walking, but was not bundled because the selected clothed characters use a different rig and already supply suitable Walk/Idle clips.

| Bundled file / source | License | Validated binary details |
| --- | --- | --- |
| `office-man.glb`: [Business Man by Quaternius](https://poly.pizza/m/JFrLIKqvCH), [publisher pack](https://quaternius.com/packs/ultimatemodularcharacters.html) | CC0 1.0 | 1,051,488 bytes; 6,634 triangles; four source body components exported as ten skinned primitives; 62 bones; about 1.842 m measured standing height |
| `office-woman.glb`: [Suit by Quaternius](https://poly.pizza/m/sOUciDsoVV), [publisher pack](https://quaternius.com/packs/ultimatemodularwomen.html) | CC BY 3.0, as listed on the selected distribution | 999,384 bytes; 6,482 triangles; four source body components exported as ten skinned primitives; 62 bones; about 1.840 m measured standing height |

The publisher-linked Drive files were quota-limited, so the selected binaries were fetched from the artist's Poly Pizza listings. V5 reuses those same source files/hashes and mesh topology/rigs. The pipeline applies the office palette, keeps supplied Walk and Idle_Neutral (renamed Idle), removes unrelated clips and authors DeskIdle. Bodies are 18% broader and 12% deeper, heads 16% larger, with a 1.8m base normalization; the head adjustment yields the measured heights above. Male Idle/Walk durations remain 1.667/1.333 seconds; female durations remain 2.083/1.667 seconds; both DeskIdle clips loop over four seconds. All retained track endpoints match.

The seated pose is fitted per rig: authored hip joints target 0.65m, wrists about 0.88m, and fingers extend flat above the keyboard. Two-bone leg/arm posing accounts for source limb lengths; independent foot controls keep soles clear of the floor after the runtime's 3cm ground offset. Subtle head/forearm activity remains. This replaces a fixed Body-height subtraction that seated the two rigs differently. Actual shipped skins are tested across DeskIdle for hips, hands and floor clearance.

Both GLBs are self-contained, without external images or buffers; no texture or decoder CDN is requested. Models face +Z and retain their source armature transforms with the documented proportion changes. Wrapper scales 0.9734565625 and 0.9791902588 come from the manifest, which also supplies cache-version hashes for their URLs. Walkers follow separate 0.65 m/s ping-pong aisle routes with 0.8-second endpoint pauses and eased turns. Seven seated workers and two walkers populate each floor. Shared source geometry/materials stay cached; all 18 people have independent cloned rigs and mixers. Only the active settled floor animates, hidden tabs pause, reduced motion freezes workers, and per-person bone textures are disposed on unmount. One invalidation after initial posing ensures demand-rendered first loads show the seated geometry.

Measured walk skins stay within a 0.9m transverse / 1.5m longitudinal route envelope. Reserved aisles and Resources endpoints were updated for the whole stride; tests verify envelope containment, furniture clearance and separation between the two walkers. There is no new physics/crowd system or additional character family.

`apps/web/public/office/people/manifest.json` records source and shipped SHA-256 hashes, file sizes, scale, triangles, bones and clips. Source downloads remain outside the repo. To reproduce the shipped assets after downloading the two linked source GLBs, run:

```powershell
node scripts/prepare_office_characters.mjs <source-man.glb> <source-woman.glb>
python scripts/generate_notices.py
```

The loop and seated pose were inspected numerically and in the browser. `characterAssets.test.ts` checks shipped hashes, 62-bone rigs, seamless clips, seated hand/hip/sole alignment and actual walk-skin bounds. Floor-path tests sample repeated cycles for oriented stride containment, furniture/perimeter clearance and walker separation. Browser checks verify active worker/seated motion, independent rigs, inactive-floor pause, visibility-event pause and frozen reduced-motion screenshots. No paid asset or new acquisition was used for V5.

## License provenance

Character attribution and modifications are in `apps/web/public/office/people/CREDITS.md`; full CC0/CC BY 3.0 legal texts are retained in `docs/licenses/`. The generator includes them as the “Office characters by Quaternius” entry on `/notices`. Package notices include the camera/GLB animation runtime families. There are 31 notice entries. Optional FaceControls/StatsGl dependencies are unused.

Upstream license texts missing from the npm archives are retained under `docs/licenses/` for Fiber, maath and Draco. These are license sources, not disposable design plans. See [license sources](../../licenses/README.md).
