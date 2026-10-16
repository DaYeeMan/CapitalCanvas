# Office preview

The isolated After Hours preview starts at `/preview/office` or `#city`. Direct floor links are `/preview/office#home` and `#resources`; `#about` shows the editorial note over the same city. The production homepage and the Ithaca, Troy and Delphi tools remain separate routes.

Start it with `npm run dev:web -- --host 127.0.0.1`; Vite reports its local port. City entry opens compact equal gaps and then zooms into Home in 2.6 seconds. Home/Resources travel closes the layers, traverses the facade and opens the destination in 2.8 seconds. Back to city reverses entry in two stages over 2.6 seconds, with the landing copy finishing alongside the camera. Direct floor hashes and reduced motion use immediate poses. Escape or Skip animation settles travel.

At a settled floor, wheel zooms toward the pointer and drag pans within bounds. Keyboard controls are +/−, arrows and 0 to reset. Hover or focus a diamond marker to reveal its panel: Home opens the tool, Resources opens its research. The whole-tower inspection button and storey-count label have been removed from the interface. About opens from the header, adding the introduction/contact, compact legal footer and a wider reading gradient. Landing/About content fades over 280ms without changing the city camera or parallax. Floor returns reveal the selected city page in the final pullback. Each floor retains its nine people, seating, doors and background simulation; reduced motion freezes people and doors.

The district stays present throughout travel. Visible task/lounge lamps explain the floor lighting; thirteen street fixtures light the city. A darker copy side and softer blue-grey city atmosphere blend continuously through entry/return. Current fallback JPEGs show the actual renderer, without baked header/copy or markers; static mode retains HTML navigation and tool/research access.

## Maintained documentation

- [Architecture and behavior](DESIGN.md)
- [Motion contract](MOTION.md)
- [Assets, licenses and regeneration](ASSETS.md)
- [After Hours design decisions](../office-redesign/README.md)
- [Current reference gallery](../office-redesign/REFERENCES.md)
- [About plan and verification](../office-redesign/about/README.md)
- [Entry sequence reference](../office-redesign/storyboard/README.md)

## Validation

From the repository root, run `npm run test:web`, `npm run lint:web` and `npm run build:web`. Tests cover layouts, spatial/posed-character clearance, simulation, navigation, motion, wall/light continuity, markers, camera controls and fallback behavior.

Desktop browser verification covers city, About, both floors, inspection, tool/research links, keyboard/pointer interactions, travel/history/interruption, resize, reduced motion and unavailable WebGL. Mobile/touch design and production integration remain separate work.
