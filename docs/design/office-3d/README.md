# Office preview

The isolated office preview lives at `/preview/office#home` and `/preview/office#resources`. The production homepage and the Ithaca, Troy, and Delphi tools remain separate routes.

Start it with `npm run dev:web -- --host 127.0.0.1`; Vite normally uses port 5173 and reports another port when occupied. Home/Resources header links select the floor through a 250ms fade-out and 250ms fade-in. Wheel zooms toward the pointer from 1x to 2x; drag pans within bounded limits. With the office focused, use +/- to zoom, arrows to pan, and 0 to reset. Hover or focus a marked desk to reveal its tool name. Tool activation and About are intentionally inert.

Both floors have nine permanent people who wander, use all seating, return occasionally to their home desks, and open/share room doors. Their behavior progresses while unseen; reduced motion freezes people and doors.

## Current references

- [Architecture and behavior](DESIGN.md)
- [Dependencies, assets, provenance, and regeneration](ASSETS.md)
- [Home approved reference](concepts/home-approved.png)
- [Resources approved reference](concepts/resources-approved.png)

The approved images are retained unchanged and are also imported by `OfficeFallback.tsx` when WebGL is unavailable. They are historical artwork rather than screenshots of the current scene; the fallback explains the visual differences.

| Reference | SHA-256 |
| --- | --- |
| home-approved.png | 9A95B35CD6080B61797E375BEDC223B78907D54869F6EC14137802972AFD48D2 |
| resources-approved.png | 3D34F87BBF266C75D80FD51B6A18C75E10CA51BF3F39F1B12873097E5B587AFC |

## Validation

From `apps/web`, run `npm run test`, `npm run lint`, and `npm run build`. The office tests cover layout and spatial bounds, navigation, simulation, posed character clearance, markers, view controls, fade navigation, fallback, and lifecycle behavior. Browser verification covers both floors, motion preferences, and the rendered poses. Mobile/touch design and production migration remain separate work.

