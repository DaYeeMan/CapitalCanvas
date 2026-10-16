# Office site

The After Hours office is the homepage at `/` or `/#city`. Direct floor links are `/#home` and `/#resources`; `/#about` shows the editorial note over the same city. `/preview/office` URLs redirect in the browser by replacing their history entry while preserving query parameters and hashes. Ithaca, Troy and Delphi retain their tool routes.

`OfficeSite.tsx` owns the scene/page shell. `OfficeChrome.tsx` shares its header and About footer with the policy and not-found pages, using `officeChrome.css` for the Geist font, colors and responsive chrome. Those reading pages load no 3D scene or charts. Published research anchors open the matching Resources library and selected paper/note; closing a directly linked library replaces its hash with `#resources`.

Start it with `npm run dev:web -- --host 127.0.0.1`; Vite reports its local port. City entry opens compact equal gaps and then zooms into Home in 2.6 seconds. Home/Resources travel closes the layers, traverses the facade and opens the destination in 2.8 seconds. Back to city reverses entry in two stages over 2.6 seconds, with the landing copy finishing alongside the camera. Direct floor hashes and reduced motion use immediate poses. Escape or Skip animation settles travel.

At a settled floor, wheel zooms toward the pointer and drag pans within bounds. Keyboard controls are +/−, arrows and 0 to reset. Hover or focus a diamond marker to reveal its panel: Home opens the tool; Resources opens a centered research library from Read research. All three libraries reuse the main site's references and implementation notes. The modal keeps the route, camera and office layout in place, scrolls internally, contains keyboard focus, and closes by X, Escape or an outside click before returning focus to the desk. Original-source links open a new tab. Static fallback buttons open the same libraries. The whole-tower inspection button and storey-count label have been removed from the interface. About opens from the header, adding the introduction/contact, compact legal footer and a wider reading gradient. Landing/About content fades over 280ms without changing the city camera or parallax. Floor returns reveal the selected city page in the final pullback. Each floor retains its nine people, seating, doors and background simulation; reduced motion freezes people and doors.

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

Desktop browser verification covers city, About, both floors, tool/research links, keyboard/pointer interactions, travel/history/interruption, resize, reduced motion and unavailable WebGL.

## Phone framing and layout

Phone portrait city framing is 35–50% closer, varying smoothly with viewport height. Office floors start at 2× of the responsive base fit (25% closer in portrait, 10% in short landscape). This crops the raised upper tower out of the floor view while keeping all three desk markers reachable. Phones can pinch between 1× and 4× and pan with one finger; desktop keeps its 1× default and 1×–2× range. Floor entry, selecting the current floor, and keyboard 0 restore the default. Phone rotation and browser-height changes retain user zoom. Floor travel and settled controls share the same endpoint, preventing an arrival scale jump.

Phone desk previews dock below the floor in portrait and at the right edge in short landscape, with a close button and outside-touch dismissal. Touch layouts omit the mouse hover connector that could obstruct neighboring markers. The mobile header has a reading shade and 44px navigation targets. About has a wider, internally scrollable reading area with a wrapping footer so headings and legal/contact links stay reachable on short screens.

Edge touch emulation exercises 320×568, 375×667, 390×844, 430×932, 568×320 and 844×390: entry, all three desks on both floors, research dialogs, preview dismissal, About/footer bounds, animated return, resize during travel and desktop framing. The zoom pass additionally checks multitouch input, both zoom limits, one-finger pan, lifting one finger during a pinch, cancellation, default reset, and native research scrolling. Browser plugin unavailable; bundled Playwright is used. Temporary screenshots and scripts remain outside the repository. These are emulated checks, not physical-device or Safari verification. Production integration is complete; physical-device and Safari verification remain separate.

The mobile zoom pass has 243 passing web tests. The production build passes; lint has no errors and retains the existing DelphiSurface dependency warning.
