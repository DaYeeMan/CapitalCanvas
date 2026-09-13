# Phase 2 — Separate surface animation

Status: complete. See [asset details and verification](../../design/field/ASSET.md). The standalone video and poster are ready; homepage integration is Phase 3.

## Deliverable

A standalone, text-free surface animation and matching still poster that can sit behind ordinary page content.

## Asset direction

Use a softly undulating sheet with a fixed camera, dark petrol-blue material, cyan grazing light, and faint champagne highlights. Keep the upper/central hero text region quiet and the surface concentrated toward the lower and right edges. Blend all edges into the actual page navy. The surface is abstract decoration, not a numerical chart.

Target a slow 8–12 second seamless loop at 24–30 fps. These are starting production targets, not measured results. No camera travel, visible cuts, sudden flashes, audio, baked-in typography, or website controls. Test the extended hero crop behind the three translucent tool cards as well as the About crop before final export.

## Production path

- [x] Inspect available local rendering/encoding capabilities before choosing the asset tool. Prefer a reproducible offline mesh render, for example Blender if available, with periodic displacement that returns exactly to its starting state.
- [x] Use the Field mockup only as a style reference. Do not animate an entire homepage screenshot or describe a panning still image as a deforming 3D surface.
- [x] If local rendering is unavailable, document the specific missing capability and continue independent layout work. An external video-generation service or paid asset requires an available tool and appropriate authorization; do not imply it already exists.
- [x] Keep editable generation source or render instructions under `docs/design/field/`. Record production method, source/license, dimensions, duration, encoding, and actual file sizes in a concise asset note.
- [x] Export a browser-compatible MP4; add WebM only if it provides a useful size/quality benefit. Create a matching optimized poster directly from the clean render.
- [x] Place final runtime media under `apps/web/public/media/field/`. Keep large editable scene files and intermediate frames outside the public asset folder.
- [x] Start with a 1600–1920 px desktop source, target no more than 3 MB for the selected video, and no more than 200 KB for the poster. Optimize based on actual output; do not sacrifice readability or loop quality just to claim a target passed.
- [x] Default mobile to the poster if the clip is too expensive. Add another rendition only if measurements justify it.

## Completion checks

- [x] Video opens and loops across several cycles without a visible jump or brightness pulse.
- [x] The sheet actually moves; the asset is independent from every text and control layer.
- [x] Hero and About crops match the Field direction and preserve text contrast at desktop and phone widths.
- [x] Poster matches the loop sufficiently to avoid a distracting switch when playback starts.
- [x] Playback, dimensions, duration, and file sizes have been checked rather than inferred from filenames.

Completed with a local WebGL mesh render and FFmpeg encoding. Blender was unavailable, so the unavailable-rendering branch did not apply. MP4: 416,138 bytes; poster: 26,162 bytes. No mobile rendition or WebM was needed.
