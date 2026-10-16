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

Furniture, foliage, screen charts, deterministic tile/wood/fabric finishes, glass and preview styling are project-authored resources. Their editable sources are `Furniture.tsx`, `sceneResources.ts`, and `office.css` under `apps/web/src/site/office/`. The city adds the shared tower exterior, grounded district and depth-aware atmosphere. After Hours uses cool dusk fill and a project-authored 128 × 64 equirectangular environment (`eveningEnvironment.ts`) for rough glazing/metal reflections. Every visible task lamp emits local ivory light, all thirteen street fixtures illuminate their surroundings, and Home's central seating joins the lounge/reading floor lamps. Restrained high-threshold bloom and depth-based contact shading run in `CityAtmosphere.ts` using the existing Three dependency. These are runtime-generated resources, with no new downloaded artwork or license requirement. Geometry and authored floor layouts remain unchanged apart from these lighting fixtures.

## Static preview alternatives

`apps/web/public/office/fallback-city.jpg`, `fallback-home.jpg` and `fallback-resources.jpg` are screenshots refreshed from the actual preview on October 15, 2026. The landing still includes the darker navy copy side, softly illuminated blue-grey city atmosphere and lifted city midtones. The final lighting-calibrated After Hours stills show local light at every desk, ivory seating pools, a cooler dusk environment, quiet stone tiles, warm window emission, fixture glow and the continuously hazed/softened district. The shared 64 × 64 window texture is a project-authored runtime resource used by the main tower and four detailed neighbours; its ivory gradient has no brown lower-corner silhouettes. The detailed neighbours share the office exterior cream wall finish. All undetailed background blocks remain blank, without window geometry or emission. No downloaded images are required. They preserve the current geometry, materials and floor layouts. The existing temporary loopback capture fixture hid header/copy, desk markers and inspection controls; accessible controls remain live HTML in fallback mode. These are local renderer stills, not new generated concepts. Character positions are illustrative snapshots of the existing random session.

| File | Dimensions | Bytes |
| --- | --- | ---: |
| fallback-city.jpg | 1440 × 900 | 132,770 |
| fallback-home.jpg | 1440 × 900 | 156,807 |
| fallback-resources.jpg | 1440 × 900 | 175,749 |

Total public fallback artwork is 465,326 bytes. The refreshed stills include the farther tower setback, trimmed rear plot and filled sidewalk corners, including the connection to the left neighbour. The stills load only when their fallback image is mounted; working-canvas HTML alternatives may be fetched by browser fallback handling, so this is not a guaranteed zero-byte cost in every browser. The runtime no longer imports the much larger concept PNGs or storyboard image. Original approved artwork and its provenance remain unchanged in the design documents.

## Logos and approved references

The preview uses the original white/cyan `/capital-canvas-logo.png`. The site's favicon and social thumbnail remain active assets.

The maintained [After Hours reference gallery](../office-redesign/REFERENCES.md) and [entry sequence](../office-redesign/storyboard/README.md) contain the current ImageGen artwork. These are documentation references; the runtime fallback uses the renderer stills above.

The [selected About reference](../office-redesign/about/README.md) is also documentation only. About reuses the city JPEG in fallback mode with a CSS reading shade and live HTML text/contact/footer. Its working canvas extends the same shade in the existing compositor. No additional font, image download, runtime screenshot or other asset is needed.

## Verification

`characterAssets.test.ts` checks model hashes, rig/clip integrity, normals preparation, seated heights and hands, typing, gait pace and bounds, and sofa penetration. Layout, navigation, simulation, scene-resource, view-control, marker, and preview tests cover the corresponding runtime contracts. No remote or paid asset is needed for these checks.

## After Hours font

The preview locally hosts `apps/web/public/office/fonts/geist-latin.ttf`, the official Geist variable font from the Google Fonts repository (`ofl/geist/Geist[wght].ttf`), retrieved October 15, 2026. Its accompanying `OFL.txt` is shipped beside it. The notice generator includes this license in the attribution page. No third-party font request is made at runtime.

