# Field surface animation

An original procedural 3D surface rendered offline into a text-free video. The render follows the selected Field concept's navy sheet, fixed camera, blue grazing light, and warm highlights. It is not a frame-for-frame recreation of the AI image. All website content remains separate HTML.

## Runtime files

| File | Properties |
| --- | --- |
| [field-loop.mp4](../../../apps/web/public/media/field/field-loop.mp4) | 1920 × 1080, 10 seconds, 240 frames, 24 fps; H.264 High, yuv420p, no audio; fast-start metadata; 416,138 bytes (406.4 KiB) |
| [field-poster.webp](../../../apps/web/public/media/field/field-poster.webp) | 1920 × 1080, 26,162 bytes (25.5 KiB); generated from the first clean render |

Use the poster for reduced-motion/data-saving settings and blocked playback. Recheck browser playback and file sizes when regenerating the media.

## Editable source and provenance

- [render-surface.html](render-surface.html) defines a 240 × 240 cell mesh, periodic vertex displacement, normal-based lighting, material highlights, and navy blending. It uses native WebGL only, with no downloaded scene, texture, or image input. Changing time deforms the mesh; it does not pan a static picture.
- [render-surface.cjs](render-surface.cjs) captures deterministic frames with Playwright and pipes them to FFmpeg. Only this offline tool needs WebGL; the production website does not.
- [field-frame.png](field-frame.png) is the original first frame. Intermediate/proof imagery stays in this design directory, outside public media.
- Original project-authored code and generated output; no third-party media attribution is introduced. Playwright, Edge, and FFmpeg are production tools, not bundled into the frontend. The locally downloaded imageio-ffmpeg encoder is excluded through `.gitignore`.

The original render used Edge through Playwright and FFmpeg 7.1 supplied by imageio-ffmpeg 0.6.0.

## Reproduction

From the repository root, set `FIELD_PLAYWRIGHT` to an installed Playwright package and `FIELD_FFMPEG` to an FFmpeg executable with libx264 support. `FIELD_BROWSER_CHANNEL` defaults to `msedge`. Run:

```powershell
node docs/design/field/render-surface.cjs --preview
node docs/design/field/render-surface.cjs
```

The encoder uses `libx264`, slow preset, CRF 24, yuv420p, no audio, and `+faststart`. Generate the poster using Python with Pillow installed:

```powershell
python -c "from PIL import Image; Image.open('docs/design/field/field-frame.png').save('apps/web/public/media/field/field-poster.webp', quality=88, method=6)"
```

Use a Python environment with Pillow and NumPy for the verification script. This machine's bundled Python provides both. Installed tool paths are environment-specific; they are not runtime app configuration.

## Preview and verification

[preview.html](preview.html) is an asset crop demonstration, not the current homepage. Serve the repository with `python -m http.server 5180 --bind 127.0.0.1`, open `/docs/design/field/preview.html`, and select **Play preview**.

Run `node docs/design/field/verify-surface.cjs` against that server and `python docs/design/field/verify-encoding.py` with the tool environment configured. After regenerating the media, verify loop continuity, poster matching, browser decoding, and text contrast in the actual homepage. Historical screenshots and JSON results describe the versions tested when they were recorded.

## Homepage integration

The homepage uses one viewport-fixed video with `object-fit: cover`. The hero, tool cards, and About content scroll above the same surface; About no longer has a separate mirrored video. The poster remains fixed when motion is restricted or playback fails. Resources and the footer use solid navy across the full viewport width, including their gutters.

Dark overlays scroll with the hero and About sections, preserving text contrast and the transitions into the reading area. Current colors, opacity, and framing are owned by `apps/web/src/site/site.css`; recheck contrast across the entire animation when changing them.

`FieldBackground.tsx` handles deferred video loading, offscreen and document-visibility pausing, and poster fallback. `useFieldMotionRestricted.ts` honors reduced-motion and data-saving preferences. There is no on-page motion toggle. The surface source remains editable independently of page content.
