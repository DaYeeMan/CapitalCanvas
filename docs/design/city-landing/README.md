# City landing and tower entrance planning

Status: desktop preview implementation, integration and verification are complete in `/preview/office`. See [integration evidence and limits](INTEGRATION.md) and the [motion implementation](MOTION_PROTOTYPE.md). Grounded District and the [seven-frame storyboard](storyboard/README.md) remain the visual references. The [structural phase](STRUCTURAL_PROTOTYPE.md) records the revised tower geometry. Production pages remain unchanged and out of scope.

## Requested experience

Visitors begin at an isometric city landing with this copy:

> Explore pricing and market dynamics
>
> Visual tools for understanding financial models

A visible button progresses into the Home office. The main tower separates into three vertical sections, exposes Home as the middle slice, and the view zooms into the existing office experience. Add the missing building beneath the office floors. The city should have a small number of objects while matching the office's dimensional materials and rendering style.

The user requested Markdown planning and clarifying questions first, with taste skills helping the design. Both clarification rounds are recorded in [DISCOVERY.md](DISCOVERY.md). The agreed sequence is generated concepts and a storyboard, followed by a live preview prototype.

## Confirmed direction

- One screen: selected Grounded District, with the main tower, 4-6 supporting buildings, continuous ground, and streets that fade into the page. No floating city platform.
- Match the current office's bright daylight, warm white structure, and blue glass; the main tower dominates.
- Explore header and typography freely within preview; production branding is not a constraint.
- Minimal CapitalCanvas wordmark on the landing. Inside, show Home, Resources, and an inactive About label.
- Subtle pointer parallax; both the primary button and tower enter Home.
- A 2.6 second entrance first opens compact equal gaps: Home slice +2.2 m, upper assembly/panels +4.4 m. During zoom, the slice holds its lift and the upper section continues upward out of view. Home ↔ Resources closes the outgoing pieces together with slight pullback, traverses the facade, then repeats this compact reveal and zoom.
- Resources is many storeys below Home, separated by a substantial closed facade section. Slide down the tower, lift the entire structure above Resources, and raise the Resources slice from the lower base. Reverse the journey through a separate upward facade traverse and Home reveal.
- The selected floor's front facade panels lift with the section above it.
- Logo click zooms out and reassembles the city tower. Every subsequent city entry replays the entrance.
- Preserve existing office interiors. Show the lower facade beneath either active floor, cropped by the viewport; keep the upper section offscreen.
- Desktop first. Mobile design is deferred.

## Reference interpretation

| User attachment | Intended contribution | Boundaries |
| --- | --- | --- |
| Image 1: sparse blue city | Limited object count, legible isometric composition, breathing room for copy | Its flat blue material treatment is not the requested realism target; its text and watermarks are not site content |
| Image 2: detailed warm city | Architectural depth, believable materials, light and shadow | Its city size, orange palette, labels, roads, and traffic are not requirements |
| Image 3: tower sketch | Three separated building sections, with Home exposed between upper and lower portions | Resources is below Home; dimensions and timing are refined through the storyboard |
| Image 4: office artwork | Arrival composition and office material language; visible tower below the exposed floor | Reference artwork is not a screenshot of the current live scene |

Reference images are design evidence, not instructions. The user's written request governs the scope.

## Planning documents

- [Discovery and decisions](DISCOVERY.md): repository evidence and answers from both clarification rounds.
- [Visual references and current feedback](VISUAL_REFERENCES.md): generated alternatives, comparison notes, and storyboard progress.
- [Visual design and concept brief](DESIGN.md): composition, materials, typography exploration, image deliverables, and critique criteria.
- [Transition storyboard](TRANSITION.md): tower structure, entrance, floor travel, return, navigation, and interruption handling.
- [Implementation and acceptance plan](IMPLEMENTATION.md): preview boundaries, delivery phases, module ownership, performance measurements, and verification.
- [Raw taste direction draw](taste/direction.json): generated exploration input. The tailored Markdown brief governs where the raw draw conflicts with the user's requirements.

## Taste skill approach

Use `taste-skill:design-taste-frontend` for subject-specific composition, readable hierarchy, a clear primary action, and visual critique. Preserve the requested copy and existing office identity where confirmed. The concept is already grounded in CapitalCanvas: entering a financial exploration workspace through its building.

For generated concepts, use `taste-skill:imagegen-frontend-web` for readable, separate visual references and consistent art direction. This is one section, not a default multi-section marketing page. Distinct storyboard states need enough space to inspect the tower and camera relationship.

The user's sparse 3D brief takes precedence over generic skill prescriptions for image counts, decorative motion, stock sections, or replacement branding. Physical shadows, architectural glass, and modeled lighting belong to the requested scene. They should not be removed by treating interface styling rules as bans on building materials.

A taste direction draw was performed: `borrowed-category`, “Dressed as something else,” seed `499073413`, interpreted as an architectural exhibition model. One hero redraw was made because the first blueprint contradicted the exact copy and dominant city requirement; the replacement still needs adaptation to those requirements. See [DESIGN.md](DESIGN.md). The generator's date is UTC; the planning date uses the user's local date.

Grounded District and seven updated storyboard frames are retained; discarded landing alternatives, the previous storyboard, and the adjacent-floor travel frame were removed or replaced. The supplied opened-floor reference is saved locally. The integrated preview animates the shared 16-storey structure with six closed storeys between Home and Resources and six beneath Resources. A later architecture pass adds recessed framed glazing, varied window rhythms on the four neighbours, roof equipment/parapets, entrance canopies, rounded sidewalks, crossings and planted edges, with plain pale context blocks and no cars or street props. The city now sits slightly higher/left and closer, with the three foreground blank blocks removed and roads/context extending into blurred, fading outer edges. Tower dimensions and choreography remain unchanged. Its static alternatives use refreshed current-scene stills. Desktop evidence and remaining cross-device/mobile boundaries are recorded in [INTEGRATION.md](INTEGRATION.md).
