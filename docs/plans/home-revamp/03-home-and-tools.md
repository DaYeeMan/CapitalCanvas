# Phase 3 — Hero, navigation, and tool strip

Status: not started. Phase 2 media is ready; use [asset details](../../design/field/ASSET.md) for filenames, crop guidance, and the measured text-overlay requirement.

## Deliverable

A responsive Field hero with real HTML content, an independently controlled background, and three translucent tool cards preserving existing product information.

## Work

- [ ] Update `apps/web/src/site/HomePage.tsx` and scoped site styles. Keep `id="home"`, the existing headline/subtitle, and semantic headings.
- [ ] Restyle the existing header with the wordmark left and navigation right on desktop; let the existing links wrap or use the current stacked arrangement on phones. Preserve active-section indication, repeated anchor clicks, focus, reduced-motion scrolling, and Back/Forward.
- [ ] Build the generous centered hero from the Field reference, with media positioned behind content and an overlay controlling contrast. Do not force the tool strip above the fold at the expense of readable text.
- [ ] Replace large illustration cards with three compact, flat cards using translucent navy backgrounds, subtle borders, and text launch links. Continue the hero surface behind all three cards, including Coming soon. Apply transparency only to card backgrounds, never to the text or entire card. Retain both full descriptions and all six feature tags. Stack cards on phones; leave Coming soon non-interactive.
- [ ] Omit the “Explore the tools” line, link, and accompanying arrow. Do not substitute another central call to action between the hero copy and tool cards.
- [ ] Tune card tint for readable text over the brightest animation frames. A light backdrop blur is optional; contrast must remain sufficient without blur support. In poster mode, keep the same translucent treatment over the still surface.
- [ ] Create a small `FieldBackground.tsx` under `apps/web/src/site/` to own media behavior. Share it with About; avoid adding a general animation framework or provider layer.

## Media lifecycle

- Treat media as decorative: hide it from assistive technology and disable pointer interaction on the media layer. Keep an accessible pause/resume button outside that hidden layer.
- Use muted inline looping playback, handle rejected playback gracefully, and retain the poster when loading or playback fails. Text and navigation must never wait for video readiness.
- Respect reduced motion on initial load and when the preference changes. Do not attach video sources or start a download for reduced-motion mode; show the poster. Apply the same conservative behavior when supported data-saving preferences request it.
- Provide a visible, keyboard-accessible motion toggle with a clear label and state. A single homepage toggle controls Home and About backgrounds and preserves the user's choice during that visit without introducing storage.
- Play only when the region is visible and the document is visible. Pause offscreen and in background tabs; resume only if user choice and motion preferences allow it. Clean up observers/listeners on unmount.
- Defer video source attachment until after initial content can render and the region approaches visibility. Do not rely on `preload` alone to control autoplay downloads.
- Reuse the same media URLs for Home and About. Do not introduce animated backgrounds on policy or tool routes.

## Completion checks

- [ ] Header, hero, and tool strip match the selected concept at desktop and phone widths with full copy intact.
- [ ] No “Explore the tools” line or replacement central call to action appears. All three cards have visibly translucent backgrounds with fully opaque, readable content.
- [ ] Both launch links open the existing tool routes; Coming soon creates no dead keyboard stop.
- [ ] Pause/resume, reduced motion, offscreen pause, hidden-tab pause, autoplay rejection, and a failed media request leave a usable page.
- [ ] With video blocked, the layout is stable and the poster/plain navy fallback looks intentional.
- [ ] Home does not import either workbench, Plotly, or KaTeX and does not request a solver computation.

Keep the static layout runnable before the loop is ready. Final completion requires the Phase 2 asset, not a screenshot placeholder.
