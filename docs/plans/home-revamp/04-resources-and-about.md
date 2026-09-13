# Phase 4 — Resources, About, and footer

Status: not started.

## Deliverable

Extend the Field design through the rest of the existing homepage with every research entry and all current About/footer content preserved.

## Resources

- [ ] Keep `id="resources"` and the exact heading “Research and methods.” Use solid navy behind the reading area.
- [ ] Reuse current `research.ts`, `troyResearch.ts`, `ResearchContent`, and `AsianLatticeContent`. Do not duplicate the research catalog into a new runtime JSON file or transcribe it from generated images.
- [ ] Preserve native project and Implementation disclosures. Keep the current collapsed default; the generated images show expanded examples for design review, not a requirement to open everything on load.
- [ ] Use a consistent two-column row pattern for both groups: narrow number/method column and flexible citation body. On mobile, place metadata above the citation. Keep access labels and Implementation controls in the citation body to avoid a cramped third column.
- [ ] Retain all 10 Ithaca entries and 7 Troy entries, complete titles and metadata, summaries, source URLs, and full implementation text. Do not add the generated images' extra introductory marketing sentences.
- [ ] Preserve direct research anchors, automatic containing-group expansion, sticky-header offsets, and focus. Check Ithaca's shared method-reference disclosure after any shared component changes.

## About and footer

- [ ] Keep `id="about"`, “About CapitalCanvas,” the entire existing paragraph, Emmanuel Zhang, and the email/mailto destination.
- [ ] Follow the About mockup's wide spacing and restrained left-aligned text. Place the shared Field surface behind the lower/right region; reuse Phase 3 playback policy so hidden About media does not play or download early.
- [ ] Keep text width comfortable. Do not impose a full-screen minimum height on small devices if it creates large empty gaps.
- [ ] Keep the footer on solid navy with its wordmark, “For education and research.”, all four legal links, and the existing dynamic year/ownership sentence.
- [ ] Check policy pages that share `SiteLayout.tsx`; they should retain readable content and functional home anchors without inheriting the decorative video.

## Completion checks

- [ ] Every baseline entry and full disclosure text remains accessible. No paper is removed, shortened, or replaced by its title alone.
- [ ] Research URLs and anchor IDs are unchanged; both Ithaca and Troy direct-paper links reveal the appropriate group.
- [ ] Keyboard users can open and close all disclosures and reach contact and legal links.
- [ ] Full content fits at 390, 768, 1280, and 1440 CSS pixels and at 200% zoom without horizontal page scrolling.
- [ ] About's media never obscures copy or controls and pauses when hidden.

This phase changes presentation, not research claims, legal wording, or the tool interfaces.
