# Field background assets

The tool screens use project-authored procedural WebGL surfaces rendered offline into text-free video loops. Application content remains separate HTML. Keep the editable renderers and their verification tools; the website does not need WebGL to play the videos.

## Runtime media

`apps/web/public/media/field/` contains three active H.264/yuv420p muted 10-second, 1920x1080 loops and their WebP fallback posters: `ithaca`, `troy`, and `delphi`. The old homepage `field` loop and poster were removed when the office became the homepage on October 16, 2026. The original homepage renderer and reproduction instructions below are retained as design history; running them can regenerate retired files that are not used by the app. The original field loop uses 240 frames at 24fps. Current rendering and encoding settings are defined by the scripts below.

`FieldBackground.tsx` and `ToolBackground.tsx` consume the media, defer video loading, pause it while unseen, and show posters for restricted motion or playback failure. Text contrast and framing belong to the application's CSS.

## Editable sources and regeneration

- `render-surface.html` defines the homepage surface, with native WebGL geometry, lighting, and periodic deformation.
- `render-surface.cjs` captures deterministic frames and pipes them to FFmpeg.
- `render-tool-surfaces.html` defines the tool variants.
- `render-tool-surfaces.cjs` renders the three tool loops, posters, and preview frames.

From the repository root, set `FIELD_PLAYWRIGHT` to an installed Playwright package and `FIELD_FFMPEG` to an FFmpeg executable with libx264. `FIELD_BROWSER_CHANNEL` defaults to `msedge`.

```powershell
node docs/design/field/render-surface.cjs --preview
node docs/design/field/render-surface.cjs
node docs/design/field/render-tool-surfaces.cjs
```

Tool rendering accepts `ithaca`, `troy`, or `delphi` to select one surface, and `--poster-only` to skip loop encoding. Preview PNGs go to the ignored `.tools/field-render/previews/` directory; only the active encoded loops and WebP posters go into public media. The renderer outputs use project-authored code, not third-party media inputs.

To regenerate the homepage poster after rendering a preview, use Python with Pillow:

```powershell
python -c "from PIL import Image; Image.open('.tools/field-render/previews/field-frame.png').save('apps/web/public/media/field/field-poster.webp', quality=88, method=6)"
```

## Verification

`preview.html` is a standalone crop/contrast test fixture, not the homepage. `verify-surface.cjs` uses it and the editable render surface to check browser decoding, looping, deformation, and desktop/mobile crops. Serve the repository with `python -m http.server 5180 --bind 127.0.0.1`, then run:

```powershell
node docs/design/field/verify-surface.cjs
python docs/design/field/verify-encoding.py
```

The encoding check requires NumPy, Pillow, and `FIELD_FFMPEG`. Reports and screenshots go to `.tools/field-render/asset-checks/`, which is ignored. Recheck the actual tools after regenerating active media. Offline browser and encoder dependencies are development tools rather than bundled frontend dependencies.
