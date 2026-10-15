# Office preview

The isolated preview starts at the Grounded District city in `/preview/office` or `#city`. Direct office links remain `/preview/office#home` and `/preview/office#resources`. The production homepage and the Ithaca, Troy, and Delphi tools remain separate routes.

Start it with `npm run dev:web -- --host 127.0.0.1`; Vite normally uses port 5173 and reports another port when occupied. Button/tower entry opens Home in 2.6 seconds; Home/Resources links use separate 2.8 second facade journeys; the logo reassembles the city in 1.8–2.2 seconds. Escape or Skip animation settles the selected destination. Direct floor hashes and reduced motion use immediate poses. “View whole tower” remains available at either settled floor. Home is seven storey intervals above Resources, with six closed intervening storeys and another six storeys beneath Resources. See [motion prototype notes](../city-landing/MOTION_PROTOTYPE.md).

In either office, wheel zooms toward the pointer from 1x to 2x; drag pans within bounded limits. With the office focused, use +/- to zoom, arrows to pan, and 0 to reset. Hover or focus a marked desk to reveal its tool name. Tool activation and About are intentionally inert.

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

From `apps/web`, run `npm run test`, `npm run lint`, and `npm run build`. The office tests cover layout and spatial bounds, tower separation and clearances, navigation, simulation, posed character clearance, markers, view controls, fallback, and lifecycle behavior. The current structural browser checks cover both desktop sizes, all three poses, inspection, history, and retained office controls. Motion-preference browser emulation and WebGL-disabled browser checks remain for integration. Mobile/touch design and production migration remain separate work.

