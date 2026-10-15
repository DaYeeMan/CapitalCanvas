# Office assets and provenance

The preview uses local assets and project-authored geometry. Runtime resources stay separate from approved reference artwork and offline generators. [DESIGN.md](DESIGN.md) describes ownership and behavior.

## Dependencies

| Package | Version | Role |
| --- | --- | --- |
| three | 0.182.0 | Geometry, animation, materials, camera, and WebGL renderer |
| @types/three | 0.182.0 | Development types |
| @react-three/fiber | 9.8.1 | React scene renderer and frame lifecycle |
| @react-three/drei | 10.7.9 | Orthographic camera and local GLTF loading |

These dependencies are isolated in the lazy office scene. No remote HDR, texture, model, decoder, or physics/navigation service is required.

## Character sources

| Bundled model | Original source | License |
| --- | --- | --- |
| office-man.glb | [Business Man by Quaternius](https://poly.pizza/m/JFrLIKqvCH), [publisher pack](https://quaternius.com/packs/ultimatemodularcharacters.html) | CC0 1.0 |
| office-woman.glb | [Suit by Quaternius](https://poly.pizza/m/sOUciDsoVV), [publisher pack](https://quaternius.com/packs/ultimatemodularwomen.html) | CC BY 3.0, as listed by the selected distribution |

The local models live in `apps/web/public/office/people/`. `manifest.json` records source and shipped SHA-256 hashes, sizes, scales, triangle/bone counts, clips, and preparation parameters. Both rigs have 62 bones and retain local Idle, Walk, and DeskIdle clips. The project preparation applies office colors and documented proportions, and authors DeskIdle. Measured standing heights are about 1.84m.

`CREDITS.md` contains attribution and modifications. Full license texts remain in [docs/licenses](../../licenses/README.md), and `scripts/generate_notices.py` includes character and dependency notices in the application's attribution page.

After obtaining the two linked source GLBs, reproduce the bundled files from the repository root:

```powershell
node scripts/prepare_office_characters.mjs <source-man.glb> <source-woman.glb>
python scripts/generate_notices.py
```

Source downloads stay outside the repository. Runtime refinements do not alter the shipped binaries or manifest hashes.

## Runtime poses and geometry

`characterAppearance.ts` caches prepared normals without changing geometry positions or skin attributes. `characterPoses.ts` derives shared DeskRest, DeskTyping, ConferenceRest, ArmchairRest, SofaRest, and StoolRest clips once per source rig. Workers clone skeletons and mixers while sharing clips, geometry, and materials. Keyboard typing uses periodic small forearm oscillation; conference hands rest at table height without typing, and lounge/stool hands rest near the thighs.

SofaRest uses level thighs, vertical calves, and feet above the floor. Hips are raised 5cm from the previous floor-reaching pose. Anchors sit 8.2cm (male) and 6cm (female) ahead of the cushion centre, about 30cm farther back than before, with a clearance buffer. Limb lengths, model scales, and sofa dimensions stay intact. Tests check the actual posed vertices, triangle interiors, and edges against cushions, base, armrests, and pillow at every sofa seat, including an additional 1cm backward clearance check.

Walking uses a measured 1.96m cycle distance, scaled to 0.95m/s for each clip's duration. Navigation uses a 0.37m circular body margin and 0.73m full longitudinal stride reach. Shortened gait and seated-foot envelopes are independently checked.

Furniture, foliage, screen charts, deterministic tile/wood/fabric finishes, glass, and CSS floor fades are project-authored resources. Their editable sources are `Furniture.tsx`, `sceneResources.ts`, and `office.css` under `apps/web/src/site/office/`. The current backdrop is a flat light-blue CSS color; background boxes, their ground plane, fog, materials, and scenery lights/shadows have been removed for a future rework.

## Logos and approved references

`apps/web/public/office/capital-canvas-logo-navy.png` is the office-only generated navy/cyan recolor of the site's original white/cyan logo. Its background and interior holes remain transparent. The original site's logo, favicon, and social thumbnail remain active assets.

[home-approved.png](concepts/home-approved.png) and [resources-approved.png](concepts/resources-approved.png) are unchanged ImageGen references. They are also intentional static WebGL fallback artwork. The fallback explains differences from the live scene; the images are not scene geometry or current screenshots.

## Verification

`characterAssets.test.ts` checks model hashes, rig/clip integrity, normals preparation, seated heights and hands, typing, gait pace and bounds, and sofa penetration. Layout, navigation, simulation, scene-resource, view-control, marker, and preview tests cover the corresponding runtime contracts. No remote or paid asset is needed for these checks.

