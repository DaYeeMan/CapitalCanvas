# Visual design and concept brief

Status: Grounded District selected; retain only its landing image. The supplied preview opened-floor image guides the regenerated storyboard. Resources is many storeys below Home.

Selected reference: [Grounded District](concepts/landing-f-grounded-district.png), with high-contrast serif typography, daylit cream/blue architecture, continuous pale ground, and fading streets. Earlier landing alternatives were discarded at the user's request.

## The idea

On this page, **CapitalCanvas's existing financial-model workspaces become the inhabitable floors of a city tower that opens to let the visitor in**.

The single-screen argument is: financial models can be explored visually; the proof is an inviting, inspectable workspace; the action is to enter that workspace. No additional marketing sections are required.

The subject inventory is CapitalCanvas's interlocking CC mark; the name's link to visual exploration; Ithaca, Troy, and Delphi; the existing Home and Resources offices; marked desks; cream framing; blue glass; wood surfaces; navy furniture; wandering office occupants; and the physical movement between work and research floors. Build the visual identity from those existing things.

## Composition

Use selected Grounded District. The district is connected to continuous pale ground and fades into the page, without a floating block or hard island edge. See [selected direction notes](GROUNDED_EXPLORATIONS.md).

Use one spacious scene rather than a diagram surrounded by cards, with the tower clearly taller and more prominent than every neighbor. Compose 4-6 supporting buildings, simple paths or a short street, and restrained planting. Supporting masses can be mostly blank, with detail concentrated on the main tower. Street and landscaping are proposed supporting details, not new interactive features. Do not add vehicles, transit, secondary animated crowds, or a sprawling skyline to the first pass.

Leave a deliberate quiet area for the exact headline, supporting sentence, and a visible primary button. Neither facade nor tower silhouette may cross the text. The district remains understandable at laptop size; keep the main tower fully visible before entry. Streets and low-detail scenery dissolve into the page with no visible island edge.

The landing has no scrolling content. Its desktop composition must work at both 1440 x 900 and a smaller 1280 x 720 viewport. Avoid using header height plus a full viewport-height stage, which would push the CTA offscreen.

## Materials and light

Match the current office's bright daylit world: warm white/cream frames, broad blue windows, restrained navy details, light wood visible through the revealed slice, and faceted planting. Use believable edge thickness, window recesses, contact shading, and material roughness. Realism comes from construction and light, not from many objects.

Keep the main tower's facade rhythm consistent across the closed city view, Home reveal, Resources reveal, and lower base. Supporting buildings use fewer window divisions and simpler roofs so they recede. No orange sunset grade, neon city lighting, heavy bloom, or blue monochrome treatment.

Start scene colors from existing resources. Candidate interface roles are pale blue ground, dark navy text, warm white header surfaces, and one blue action accent. Confirm contrast against the actual render. Generated concepts should preserve material identity; they are not an excuse to repaint the office.

## Header and typography exploration

The taste draw offered `editorial-report`, `borrowed-category`, and `type-only-statement`. Choose `borrowed-category`: present a financial learning environment with the calm and scale of an architectural exhibition model. The report layout competes with the city; the type-only layout excludes the required city from the opening screen.

Full draw: seed `499073413`, display/text face Boska, palette retained, initially “Flush-left shout, seam photograph.” One hero redraw produced “Shouted headline, rising photograph.” Both hero blueprints assume short shouted copy and a photograph, conflicting with the exact long headline and dominant city scene. Adapt those slots to the user's brief rather than repeatedly drawing until a preferred answer appears. The raw sheet's shutter motion, stock photographs, and default section counts do not apply to the requested tower experience.

Typography exploration is complete: retain Grounded District's high-contrast serif character. The table below records the initial comparison, not another round of requested concepts:

| Treatment | Typography and header | Composition |
| --- | --- | --- |
| Architectural editorial | Boska roman for the headline and a compact wordmark; readable sans for supporting copy and controls | City as an exhibition model; headline and CTA in a clear side area with generous spacing |
| Contemporary studio | A restrained sans headline and wordmark, with clear size contrast | City sits lower and across more of the canvas; copy occupies the open sky area |

Boska is an exploration candidate, not an installed or approved font. Assess it at real screen size; verify sourcing and licensing before bundling any new font. Avoid changing global font variables or adding font requests to production pages. Use ordinary system fallbacks until a preview font choice is made.

Minimal CapitalCanvas wordmark on the landing; do not add floor links there. Keep the recognizable CC mark as the starting logo asset while exploring its scale and wordmark treatment. Inside the office, show Home, Resources, and a noninteractive About label. Keep one coherent header identity across states, without a large opaque bar blocking the tower reveal.

Exact copy:

> Explore pricing and market dynamics
>
> Visual tools for understanding financial models

Proposed button: **Enter CapitalCanvas**. A whole-building tower hit target is an equivalent second entrance, with an accessible name and keyboard activation. Hover/focus feedback should identify the tower without neon outlines, labels over the headline, or an extra floating panel.

## Arrival composition

Preserve the live Home and Resources interiors, furniture, people, desk placement, and pins. The selected floor is the dominant subject after travel. Keep the lower facade visible beneath it, with its bottom cropped by the viewport as in image 4. The upper assembly is above the view. The surrounding city leaves the camera frame before it can distract from the desks.

The base must be a volume beneath the slab, with aligned cream framing and blue glass on the visible sides. Do not fill the scene with inhabited lower floors: a lightweight exterior shell is sufficient. Home and Resources need different remaining lower structures because Resources is many storeys lower. Keep a substantial closed facade section between their authored elevations. At Resources, the lifted upper assembly includes that facade section and the enclosed Home floor; Home must not appear directly above Resources as a neighboring slice.

## Motion character

Use the tower opening as the signature gesture. Landing parallax is subtle and bounded, provisionally 1-2 degrees of equivalent view shift or a comparably small camera offset; it must not look like free orbit. Keep the visible facade faces consistent. Settle parallax before entry and remove it inside the office, where existing controls resume.

No auto-entry. Do not tie entry to wheel scrolling. Do not add decorative animation simply to meet a generic skill motion count. Reduced-motion and fallback behavior are in [TRANSITION.md](TRANSITION.md).

## Generated concept deliverables

Landing exploration is complete and Grounded District is selected. Retain only the selected landing image. Regenerate/retain these storyboard references before live scene work:

1. The selected Grounded District landing and a matching closed-city frame.
2. The supplied [opened preview floor](references/open-floor-preview.png), used as the Home/interior-style reference.
3. Separate horizontal frames for closed district; Home reveal; Home arrival; descent past closed facade storeys; distant Resources reveal; Resources arrival; return reassembly. The two travel frames must communicate physical distance and a fresh local opening, not adjacent office floors.

Use `taste-skill:imagegen-frontend-web` for the page references and the image generation skill/tool for generation. Inspect the actual current office alongside the approved artwork before preparing generation prompts. Create fresh, readable frames; do not replace them with a tiny collage or a crop of an earlier image. Generated references are illustrative; they do not modify or replace the live scene.

Concepts need to test construction, not just atmosphere: retain the same footprint, window bays, roof, direction of lighting, and floor order. Image 1 informs density; image 2 informs dimensional light and materials; image 3 informs separation; image 4 informs arrival. None is an instruction to reproduce stock text, watermarks, labels, or another artist's entire city.

Before prototype work, review the selected landing and storyboard together: the city tower must plausibly contain the actual 20 x 20 metre office. Do not approve a narrow glass spire that transforms into an unrelated square floor.

## Visual acceptance

- One screen at the two target desktop sizes, with exact copy and CTA visible.
- Headline fits within two deliberate lines at desktop target sizes; maintain readable support text and controls.
- Tower dominates; 4-6 supporting buildings are countable and subordinate.
- Cream frames, blue glass, daylight, and floor proportions remain consistent across views.
- Selected floor has readable desks and pins, a visible lower facade, and no upper assembly blocking it.
- Concept images show the same building before and after the split.
- Taste critique focuses on hierarchy, material continuity, composition, and readability; a raw skill score cannot override these brief-specific requirements.

Mobile composition, touch parallax, new office interiors, functional About content, and production restyling are outside this plan.
