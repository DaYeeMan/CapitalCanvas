# Decisions and open details

Updated October 14, 2026. Human answers below are confirmed direction; proposed implementation details in PLAN.md remain adjustable.

## Confirmed by the user

| Decision | Answer |
| --- | --- |
| Work authorized now | Latest request authorizes V5C implementation, now completed and verified. V6 rendered surroundings/light/materials and V7 remain pending |
| Stack | React Three Fiber and drei |
| Assets | Reusable R3F furniture geometry plus animated GLB people |
| Camera | Fixed isometric angle; latest direction adds bounded zoom/pan, superseding the previous locked view |
| Initial motion | Walking people plus subtle seated activity |
| Tool mapping | Ithaca left, Troy center, Delphi right on both floors |
| Label trigger | Hover the whole marked desk cluster or its pin to expand the tool name |
| Tool activation | Clicking does nothing for now; focus first on the pages |
| Shared dimensions | Exactly identical outer floor dimensions, without Home's northeast wall protrusion |
| Floor shape | Both floors must be square like the references; V0 replaced the old 22×18 blockout with one shared 20m side length |
| Floor order | Home above Resources in the same office building |
| Floor navigation | Header links switch Home/Resources with the vertical slide; wheel only zooms, superseding scroll-to-switch floors |
| About scope | Do not build About yet |
| About header | Keep About as plain noninteractive text to match the concept |
| Integration | Separate preview routes; keep the current site available |
| Visual scope | Bright low-poly offices, additional unmarked desks/furniture/rooms, clear walking paths |
| Marker scope | Only the three main desk clusters on each page have location pins |
| Resources room | Main glass conference room on the right |
| Home room | Main long-table glass conference room flush into the far-left corner; remove the leftover perimeter desk/space |
| Home north area | Reposition the smaller glass private office to match the reference and restore missing surrounding furniture/components; current north layout is not approved |
| Home pod placement | Middle Troy pod lower/foreground; outer Ithaca and Delphi pods slightly higher, with separated rugs |
| Home windows | Close selected northwest window bays with solid cream panels and retain some glazing |
| Home leftmost window correction | Reposition the opening outside the glass meeting room to match the reference; preserve the room's flush corner placement and Resources glazing |
| Home center | Round table and three armchairs; no central bookshelf |
| Resources foreground | Add unmarked two-person workbench and reading nook with low bookcase |
| Resources storage | Remove the low partitioned storage enclosure; keep the standalone printer and coffee counter/stools |
| Reference maintenance | Latest generated Home/Resources images replace the canonical approved PNGs; remove superseded repo variants |
| Removed elements | No lower-left Explore/Enter office button; no right-side exit hallway |
| Shared wall refinement | Match reference wall thickness; make low front walls taller/thicker, preserving square footprint and horizontal spans |
| Grey bottom layer | Extra band withdrawn: existing website already has the grey layer; preserve it and add no duplicate |
| Home Ithaca follow-up | Move the entire left cluster slightly screen-right, judged by the glass-room gap; coordinate rug, people, pin and walking paths |
| Home northeast inventory follow-up | Create a new bookshelf and low countertop against the top-right/northeast wall of the screen near its east end; retain existing bookcase and coffee counter |
| Surroundings target | Match reference white cube/rectangular-prism stacks, with soft blue shaded faces and depth |
| Background representation | Real R3F/Three cube/prism meshes and rendered shadows; no static picture, billboard or painted shadow substitute |
| Background form/density | Abstract stepped stacks without building details; asymmetric reference-like clusters with breathing room |
| Background near/far treatment | Larger/sharper foreground forms, smaller/fainter distant forms with subtle haze/lower contrast; no noticeable distant blur |
| Background camera | Share the office's actual orthographic camera for zoom/pan; no extra decorative parallax |
| Background across floors | One shared environment, with gentle vertical movement driven by the existing Home/Resources slide progress |
| Background shadows/base | Real soft shadows on neighboring blocks and a subtle pale-blue 3D base/ground below the office, lit consistently with the office |
| Background crop/clearance | Foreground stacks may crop off viewport edges, but geometry/base must stay clear of the office, furniture/pins and travel envelope |
| Background idle motion | None; no floating/bobbing. Movement comes only from camera input and floor-transition presentation |
| Navigation typography | Match Home/Resources/About font and sizing to the supplied deployed-home crop, keeping current office colors; wordmark unchanged |
| Additional Home couch | Add another cream couch, small coffee table and rug in the northwest-wall gap between the long-table room and rear private office; retain existing rear-right sofa lounge |
| Home far-left meeting-room doors | Remove the left tan door; make its existing glass door tan at the same position. Former left doorway returns to ordinary glazing; other rooms unchanged |
| Navigation hover | Inactive Home/Resources/About hover to existing active blue; active label hovers to distinct lighter blue; About stays inert |
| Zoom limits and direction | Current centered full-floor view is minimum 1×; wheel-up zooms in toward mouse, wheel-down zooms out, maximum about 2× |
| Pan limits | Zoomed-in pan permits inspection across the floor but cannot leave it mostly off-screen; resting pan at 1× is centered with zero range |
| Pan boundary feedback | Small resisted stretch while dragging outside the limit, then spring back on release, including full zoom-out |
| Drag start | Left-button drag anywhere in the scene, including desks/pins, after a small movement threshold |
| View on floor switch | Reset zoom/pan to centered full-floor 1×; do not remember floor views |
| Marker sizing during zoom | Keep pins and tool labels the same readable screen size; anchors/hit regions follow camera movement |
| Exterior window frames | Exact cream wall material, visibly thicker structural jambs/posts/header and low sill; reference-like broad panes |
| Resources main-window extent | Stop before the small rear glass office at the top of the screen |
| Resources private-office window | Keep one separate broad exterior window centered behind that office, with cream separation from the main run; same new frame style |
| Home middle windows | Two roughly equal large windows between the two glass rooms, including behind the new couch; one narrow cream section between them, no internal vertical dividers |
| Home private-office exterior glazing | Keep the existing openings, but use the same thick cream frames |
| Window-style scope | Exterior glazing only; glass-room partitions retain thin dark frames and current tan doors |
| Tall perimeter wall height | Lower tall northwest/rear walls on both floors to the glass-room visible tops, including caps; low front walls stay 0.58m |
| Pane rhythm/sill | Broad panes with a low cream sill; fit Resources main-run pane count to the reference/span, rather than enforcing equal counts across floors |

## Proposed defaults, not separate user requirements

- Preview path `/preview/office` with `#home` and `#resources` anchors; preserve existing site routes and research anchors.
- One shared Canvas/shell with floor-specific layout data and one header/hash-driven floor-transition progress source, separate from bounded camera state. Native scroll-driven floor switching is superseded.
- Fixed native HTML header. Tool labels expand beside the anchored pin and also appear on keyboard focus.
- A desktop-first build with existing motion preferences respected; no physics engine or crowd simulation.
- Existing tool/resource content stays available on the current site; the office preview does not migrate it or open it from desks yet.

## Details to settle during planning or the authorized build

The latest eight V6 background questions are resolved: abstract stepped stacks; subtle distance haze; shared camera without decorative parallax; one environment with gentle floor-slide shift; real soft shadows on blocks/pale-blue base; cropped foreground allowed; asymmetric breathing space; no ambient movement. Exact stack dimensions/world positions, haze range, slide-shift amount and shadow settings remain implementation tuning choices. These answers authorize a plan revision only, not V6 implementation.

The earlier nine window/height questions are resolved and implemented in V5C: exact cream frames; Resources main run stops before the rear office with a separate broad office window; two equal undivided Home middle windows/narrow center section plus retained private-office split; lower tall walls only; keep interior dark frames/tan doors/low fronts; broad panes and low sills. Tuning: 0.32m jamb/post width/depth, 0.3m sill, 0.24m header including 0.12m cap, 0.16m room margins and 0.76m combined Home center pier/jamb section. Actual cap/mullion tops align at 2.9225m.

The earlier eleven camera/couch/hover answers remain valid and are implemented in V5A/V5B. The grey-band addition remains withdrawn. See [CAMERA-PLAN.md](CAMERA-PLAN.md).

V5A–V5C are authorized, implemented and verified. Current tuning: walls 0.32m thick/front 0.58m high; Home Ithaca [-3,4.85]; navigation 18px system sans, 36px gap, 1px underline, hover #155cff / active hover #4677ff; camera zoom 1–2×, drag threshold 5px, stretch cap 48px, critically damped 0.55s settling and 700ms floor slide. V5C supersedes the old 3.4m wall target and exterior window coverage/style only. Thickness, furniture, door, header and control decisions remain. Next stages are V6 and V7; production migration remains separate.

1. Character files are verified and bundled: clothed Business Man (CC0) and Suit (CC BY 3.0), supplied Walk/Idle and authored DeskIdle. Sources, modifications and hashes are in ASSETS.md and the character manifest. No purchase was made.
2. V0 replaced the old 22×18 rectangle with one shared 20 metre side length. Current structural dimensions: existing 0.45m slab, 2.9225m tall visible tops including caps, 0.32m wall thickness/0.58m front height and 7m physical floor spacing. Both private offices and Home conference retain flush corners using revised inner-edge anchors; the extra band is absent. V5C derives Home's equal broad middle windows from room edges, ending before the solid conference backing, and separates Resources' main and office glazing.
3. Current label sizing is 16px with edge-aware expansion, 150ms disclosure animation and 120ms close grace. Labels/pins remain constant screen size during zoom. V5B has removed native scroll/snap travel and uses header/hash-driven transitions with centered view reset and immediate reduced-motion selection. Gesture/rebound labels suppress transient hover and restore from updated camera projection.
4. Current density is nine workers per floor: six at marked pods, one in the private office, and two on separate aisle routes. V5 retains that count and the same licensed topology/rigs, with broader bodies, larger heads and per-rig desk poses. Shared DESK constants align furniture and seats; asset tests and oriented full-stride route tests protect clearances.
5. Five viewports including 1280x800 and the concepts' 1672x941 size were checked. The available Edge host measured approximately 60 fps; representative cross-device performance and production mobile presentation remain review decisions.
6. Design mobile/touch behavior and determine production migration/deep-link treatment later. Neither is required to start the desktop preview after build authorization.
7. Proposed keyboard alternatives while the scene is focused: +/− zoom, arrow keys pan, 0 resets; preserve browser shortcuts and native header Tab/Enter. These mappings, immediate reduced-motion release settling, static fallback without camera gestures and no in-bounds inertial fling are implementation defaults consistent with the confirmed mouse behavior.

The earlier request, “Continue with the remaining phases,” authorized functional phases 5–8, followed by V0–V5 and V5A/V5B. The October 14 request authorizes V5C implementation; all these stages are implemented and verified. V6 rendered background/depth/shadows and V7 remain pending. [VISUAL-PLAN.md](VISUAL-PLAN.md), [CAMERA-PLAN.md](CAMERA-PLAN.md) and [VISUAL-REVIEW.md](VISUAL-REVIEW.md) record scope and evidence. Tool launching, About, resource readers and production migration remain separate work.
