# CapitalCanvas homepage revamp

Status: Phases 1 and 2 complete. Homepage-scoped tokens, content baselines, and the standalone Field video/poster are ready. Homepage layout and media integration remain in Phases 3–4.

## Outcome

Rebuild the existing scrolling homepage around the selected **Field** concept: clean typography and flat controls over a separate, gently animated surface. Preserve the site's complete content and existing navigation. Resources and About remain sections of `/`.

## Design references and authority

- [Home concepts](../../design/field/home-concepts.png): use the bottom **02 / Field** concept only.
- [Ithaca resources](../../design/field/resources-ithaca.png).
- [Troy resources](../../design/field/resources-troy.png).
- [About and footer](../../design/field/about-footer.png).
- [Content reference](../../design/field/content-reference.txt): includes full disclosure text.
- [Product context](../../PRODUCT.md).

The images guide composition, spacing, colors, and materials. Recreate the interface as HTML/CSS; never use a screenshot as the page or bake text into the animation. Source files in `apps/web/src/site/` own exact copy, URLs, and behavior. Generated images contain abbreviated copy, extra introductions, and inconsistent research layouts; those differences are not new requirements. Live deployment content was not verified during concept generation.

## Decisions and working assumptions

- Selected direction: Field. Navy background, cream serif headings, muted body text, restrained cyan links, and subtle champagne highlights on the surface.
- The animated surface is an independent decorative media layer. Text, links, disclosures, and controls remain above it.
- Working delivery choice: a locally hosted seamless video loop plus a matching poster. The user selected an animated surface; video is the proposed implementation, not a previously confirmed format requirement.
- Use the same surface treatment behind Home and About. Extend the Home background behind all three tool cards, each with a translucent navy background so the surface remains subtly visible. Resources and footer use solid navy. Only visible media plays. Avoid a page-wide fixed video behind long reading content.
- Omit the “Explore the tools” line, link, and accompanying arrow shown in the mockup. The hero leads directly into the tool cards.
- Retain all existing copy, tags, research metadata, implementation notes, contact details, and legal links. Existing decorative SVG previews may be removed from tool cards to match the chosen flat layout; retain the assets until their remaining usage is checked.
- No third-tool implementation, new routes, solver changes, new backend, accounts, CMS, paid media service, or real-time 3D dependency is included.

## Phases

| Phase | Deliverable | Status | Dependency |
| --- | --- | --- | --- |
| [1. Foundation and content](01-foundation.md) | Content baseline and scoped layout foundation | Complete | None |
| [2. Surface animation](02-surface-animation.md) | Standalone loop, poster, and reproducible asset source | Complete | Phase 1 composition |
| [3. Hero and tools](03-home-and-tools.md) | Responsive Field hero, translucent tool cards, media lifecycle | Not started | Phase 1; Phase 2 for final motion |
| [4. Resources and About](04-resources-and-about.md) | Complete lower homepage and footer | Not started | Phase 1; Phase 3 shared styling |
| [5. Verification and delivery](05-verification.md) | Tested local result and concise evidence | Not started | Phases 2–4 |

Phase 3 may start with a plain navy background while the actual asset is produced. Phase 4 can proceed without video. Neither temporary fallback counts as completion of the animated result.

## Plan maintenance

Update phase status and record brief evidence as work completes. Do not copy old release or firewall tasks into this plan. Once the revamp is complete, move durable behavior into `docs/PRODUCT.md` and remove these phase files and the README planning link. Keep useful design assets and their provenance. Deployment status is separate from implementation status; this plan does not assert that anything has been published.
