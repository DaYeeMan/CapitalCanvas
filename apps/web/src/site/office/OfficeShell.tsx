import { BUILDING, EXTERIOR_FRAME, solidWallSpans, windowSections, type WallOpening } from "./layouts";
import { Block } from "./Furniture";

export function OfficeShell({ openings }: { openings: readonly WallOpening[] }) {
  const { width: w, depth: d, wall: h, slab, wallThickness: t, frontWall } = BUILDING;
  const { sill, header, cap, depth } = EXTERIOR_FRAME;
  const body = h - cap;
  const glassTop = h - header;
  return <group name="shared-office-shell">
    <Block at={[0, -slab / 2, 0]} size={[w, slab, d]} tone="slab" />
    <Block at={[0, 0, 0]} size={[w, 0.025, d]} tone="floor" />
    <Block at={[0, body / 2, -d / 2]} size={[w, body, t]} tone="wall" />
    <Block at={[0, h - cap / 2, -d / 2]} size={[w, cap, t]} tone="wall" />
    <Block at={[-w / 2, h - cap / 2, 0]} size={[t, cap, d]} tone="wall" />
    {solidWallSpans(openings).map(span => <Block key={`wall-${span.start}`} at={[-w / 2, body / 2, (span.start + span.end) / 2]} size={[t, body, span.end - span.start]} tone="wall" />)}
    {openings.map(opening => <group key={opening.id} name={`window-${opening.id}`}>
      <Block at={[-w / 2, sill / 2, (opening.start + opening.end) / 2]} size={[depth, sill, opening.end - opening.start]} tone="wall" />
      <Block at={[-w / 2, (glassTop + body) / 2, (opening.start + opening.end) / 2]} size={[depth, body - glassTop, opening.end - opening.start]} tone="wall" />
      {windowSections(opening).map(section => <Block key={`${section.glass ? "pane" : "post"}-${section.start}`} at={[-w / 2, (sill + glassTop) / 2, (section.start + section.end) / 2]} size={[depth, glassTop - sill, section.end - section.start]} tone="wall" glass={section.glass} exterior={section.glass} />)}
    </group>)}
    <group name="cutaway-front-walls">
      <group name="cutaway-east-wall"><Block at={[w / 2, frontWall / 2, 0]} size={[t, frontWall, d]} tone="cream" /></group>
      <group name="cutaway-south-wall"><Block at={[0, frontWall / 2, d / 2]} size={[w, frontWall, t]} tone="cream" /></group>
    </group>
  </group>;
}
