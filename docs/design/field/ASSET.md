# Field surface animation

Phase 2 deliverable: an original procedural 3D surface rendered offline into a text-free video. The render follows the selected Field concept's navy sheet, fixed camera, blue grazing light, and warm highlights. It is not a frame-for-frame recreation of the AI image. All website content remains separate HTML.

## Runtime files

| File | Properties |
| --- | --- |
| [field-loop.mp4](../../../apps/web/public/media/field/field-loop.mp4) | 1920 × 1080, 10 seconds, 240 frames, 24 fps; H.264 High, yuv420p, no audio; fast-start metadata; 416,138 bytes (406.4 KiB) |
| [field-poster.webp](../../../apps/web/public/media/field/field-poster.webp) | 1920 × 1080, 26,162 bytes (25.5 KiB); generated from the first clean render |

Both files are below the planned 3 MB / 200 KB limits. No WebM or mobile rendition is necessary at this size. Use the poster for reduced-motion/data-saving settings and blocked playback. Browser/device performance still needs validation after integration.

## Editable source and provenance

- [render-surface.html](render-surface.html) defines a 240 × 240 cell mesh, periodic vertex displacement, normal-based lighting, material highlights, and navy blending. It uses native WebGL only, with no downloaded scene, texture, or image input. Changing time deforms the mesh; it does not pan a static picture.
- [render-surface.cjs](render-surface.cjs) captures deterministic frames with Playwright and pipes them to FFmpeg. Only this offline tool needs WebGL; the production website will not.
- [field-frame.png](field-frame.png) is the original first frame. Intermediate/proof imagery stays in this design directory, outside public media.
- Original project-authored code and generated output; no third-party media attribution is introduced. Playwright, Edge, and FFmpeg are production tools, not bundled into the frontend. The locally downloaded imageio-ffmpeg encoder is excluded through `.gitignore`.

Blender was unavailable locally. The render used installed Edge through bundled Playwright, plus FFmpeg 7.1 supplied by imageio-ffmpeg 0.6.0. No application dependency or package lockfile changed.

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

## Verification and crop preview

[preview.html](preview.html) is a standalone asset crop demonstration, not the homepage implementation. Serve the repository locally with `python -m http.server 5180 --bind 127.0.0.1`, then open `/docs/design/field/preview.html`. Select **Play preview** to view motion behind sample HTML. The preview intentionally omits navigation and complete tool details because its purpose is crop/contrast inspection; The homepage preserves the actual site's full content.

Run `node docs/design/field/verify-surface.cjs` against that server and `python docs/design/field/verify-encoding.py` with the tool environment configured.

- [Browser results](asset-checks/verification.json): actual 1920 × 1080 dimensions and 10-second duration; Edge playback crossed two loop boundaries without a media error. The original render at 0 and 10 seconds is byte-identical, while the midpoint differs.
- [Decoded-frame results](asset-checks/encoding-verification.json): all 240 frames decoded independently with FFmpeg. Average RGB difference at the compressed loop seam is 0.476/255, versus a maximum ordinary adjacent-frame difference of 0.348/255. Midpoint difference is 4.649/255, confirming deformation rather than a static encode. Tiny compression differences remain despite identical source endpoints.
- Poster versus decoded first frame differs by 1.593/255 mean RGB at the verification sampling size. First-frame/poster appearance was inspected visually.
- Browser canvas sampling returned zero-value samples in this environment; it was not accepted as motion evidence. Independent decoded-frame comparison, rendered crops, and real playback provided the checks instead.
- Desktop 1440 px and phone 390 px hero/About crops were visually inspected alongside the concept. [Hero desktop](asset-checks/hero-1440.png), [hero mobile](asset-checks/hero-390.png), [About desktop](asset-checks/about-1440.png), [About mobile](asset-checks/about-390.png).

## Homepage integration

Use `object-fit: cover`; the preview uses centered desktop hero framing and approximately `65% center` for phone/About crops. Keep text above the media and retain the existing full content. Extend the surface behind all three translucent navy cards, without adding an “Explore the tools” line.

Bright highlights need a contrast overlay behind body copy. The crop preview uses 68% navy behind text, fading down toward the card region; cards use their 72% navy fill. Sampling all decoded frames at 320 × 180 found minimum contrast near 5:1 for muted `#a8b4bd` text with the 68% overlay. A 40% overlay failed this conservative test. These samples inform integration; they do not replace full-resolution text-region contrast checks on the final layout.

The surface is smoother and more restrained than the granular AI reference, keeping compression small and avoiding distracting texture motion. The concept's color and material direction is retained; lighting and geometry remain editable. The homepage implements a shared motion toggle, visibility pausing, deferred video downloads, and reduced-motion handling. See [final validation](VALIDATION.md) for full-resolution contrast, browser integration, and coverage limitations. No deployment is implied by these local checks.
