# Grounded District and tower storyboard

Status: Grounded District selected; the updated [seven-frame gallery](storyboard/README.md) is ready for review. The old floating-city storyboard and adjacent-floor travel illustration were removed or replaced. Replacement frames use [Grounded District](concepts/landing-f-grounded-district.png) and the user's [opened preview floor](references/open-floor-preview.png).

## Retained references

- [Selected landing](concepts/landing-f-grounded-district.png)
- [Opened preview floor supplied by the user](references/open-floor-preview.png)

Home and Resources retain their preview interiors. The supplied image is the authority for the opened-floor style and Home composition; the existing Resources artwork and layout descriptors inform Resources room placement.

## Storyboard sequence

| Frame | Purpose |
| --- | --- |
| [Closed district](storyboard/01-grounded-city.png) | Same tower on continuous fading ground; no floating city platform |
| [Home reveal](storyboard/02-home-reveal.png) | Cap rises, Home slice separates, lower tower remains grounded |
| [Home arrival](storyboard/03-home-arrival.png) | Supplied preview composition, three desk pins, lower facade visible |
| [Facade descent](storyboard/04a-facade-descent.png) | Slide down past several closed storeys; Home far above |
| [Distant Resources reveal](storyboard/04-travel-to-resources.png) | Tall upper assembly lifts; Resources rises from remaining base |
| [Resources arrival](storyboard/05-resources-arrival.png) | Right conference room; same opened-floor style; Home outside frame far above |
| [Return reassembly](storyboard/06-return-reassembly.png) | Reseat Resources and lower the tall upper tower as camera returns to Grounded District |

The two travel views replace the adjacent-floor illustration. A large empty air gap is not a substitute for the closed tower between destinations.

The subsequent structural revision adds four storeys beneath Resources, giving it a six-storey base. The generated images retain their choreography role; the current [16-storey motion contract](TRANSITION.md#current-structure-and-motion-contract) overrides older facade counts and near-ground Resources proportions. Home-to-Resources separation remains 23.8 m.

## Review limits

The Home reveal received a footprint/alignment refinement. Synthesis still requires exact geometry and clearance checks in the prototype. Home arrival follows the user attachment closely; Resources is a generated interpretation of its own existing layout, not a claim that runtime code was changed. Stable arrival frames show pins and header; structural motion frames omit pins and simplify UI for readability.

The floor distance, timing and assembly ownership are defined in [TRANSITION.md](TRANSITION.md), with implementation acceptance in [IMPLEMENTATION.md](IMPLEMENTATION.md). No runtime, browser-performance or motion-feasibility claim follows from these raster images.

Generated through the built-in image generation tool using the `imagegen` and `taste-skill:imagegen-frontend-web` workflows. Exact prompts, reference inputs, and retained-frame order are in [generation-prompts.json](storyboard/generation-prompts.json). The distant Resources reveal received a targeted correction to restore the supplied preview's thin slab and remove motion-state pins. Only selected/final project images are retained; discarded attempts were not copied into the project.
