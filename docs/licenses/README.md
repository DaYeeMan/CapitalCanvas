# Third-party license sources

- Package license texts: exact installed versions in apps/web/package-lock.json.
- Plotly bundled notices: https://cdn.plot.ly/plotly-2.35.3.min.js.LICENSE.txt (retrieved September 8, 2026).
- Standard SIL OFL 1.1: https://raw.githubusercontent.com/google/fonts/main/ofl/notosans/OFL.txt (retrieved September 8, 2026). Only the standard license text is retained; Noto-specific copyright is not used.
- KaTeX font copyright and reserved names: extracted from the installed TTF name tables (IDs 0, 13, 14), covering the accompanying WOFF/WOFF2 versions of those fonts.

Run `python scripts/generate_notices.py` after dependency changes. The former react-katex adapter is no longer imported or distributed; the application renders its own formula strings with KaTeX directly. Plotly's supplied bundled notices are included alongside its package MIT license.

Office preview license sources retrieved October 13, 2026, for packages whose npm archives omit their license file:

- `react-three-fiber-9.8.1.txt`: https://raw.githubusercontent.com/pmndrs/react-three-fiber/v9.8.1/LICENSE
- `maath-0.10.8.txt`: https://raw.githubusercontent.com/pmndrs/maath/main/LICENSE
- `draco3d-1.5.7.txt`: https://raw.githubusercontent.com/google/draco/1.5.7/LICENSE

The generator also reads installed license files for the preview's camera and GLB animation runtime dependency families. Optional FaceControls and StatsGl features are not part of the office preview; inspect their dependency notices if those features are introduced.

## Office character licenses

The preview bundles Quaternius's Business Man (CC0 1.0) and Suit (CC BY 3.0) character assets. Their attribution and modification record is retained in `apps/web/public/office/people/CREDITS.md` and included in generated site notices. `CC0-1.0.txt` and `CC-BY-3.0.txt` retain the Creative Commons legal texts. Asset hashes and binary details are in the adjacent character manifest.

Geist variable font for the After Hours preview was retrieved October 15, 2026 from the official Google Fonts `ofl/geist` directory. The unmodified font and OFL license are bundled in `apps/web/public/office/fonts/`; `generate_notices.py` includes its attribution.
