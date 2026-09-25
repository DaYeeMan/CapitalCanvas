# Ithaca, Troy, and Delphi background loops

These are muted 10-second, 1920×1080 WebGL surface loops made for the three
tool screens. Their navy base, soft blue reflections, and restrained warm
highlights follow the CapitalCanvas home surface. Ithaca has orbital contours,
Troy has broad diagonal currents, and Delphi has concentric basin ripples. Each
scene returns to its initial state at 10 seconds, so the encoded `[0,10)` frames
form a continuous loop.

The render scene is `../render-tool-surfaces.html`. Rebuild the posters and
loops from the repository root with:

```powershell
$env:FIELD_PLAYWRIGHT = 'C:\Users\enson\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules\playwright'
$env:FIELD_FFMPEG = 'C:\path\to\ffmpeg.exe'
node docs/design/field/render-tool-surfaces.cjs
```

To refresh only posters and preview PNGs, add `--poster-only`. To render just
one tool, pass `ithaca`, `troy`, or `delphi` after the script path. Encoded
videos and WebP posters are written to `apps/web/public/media/field/`.
