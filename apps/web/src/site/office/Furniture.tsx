import { geometry, furnitureGeometry, materials, glassMaterial, chartGeometry, chartMaterial, type Tone } from "./sceneResources";
import { BUILDING, DESK, POD_SIZE, ROOM_FRAME, type Fixture, type Room } from "./layouts";

type XYZ = [number, number, number];
export function Block({ at, size, tone = "wood", glass = false, rounded = false }: { at: XYZ; size: XYZ; tone?: Tone; glass?: boolean; rounded?: boolean }) {
  if (glass) {
    const side = size[0] < size[2];
    return <mesh position={at} rotation-y={side ? Math.PI / 2 : 0} scale={[side ? size[2] : size[0], size[1], 1]} geometry={geometry.pane} material={glassMaterial} renderOrder={1} />;
  }
  return <mesh position={at} scale={size} geometry={rounded ? geometry.cushion : geometry.box} material={materials[tone]} castShadow receiveShadow />;
}
function Cylinder({ at, size, tone }: { at: XYZ; size: XYZ; tone: Tone }) {
  return <mesh position={at} scale={size} geometry={geometry.cylinder} material={materials[tone]} castShadow receiveShadow />;
}
export function Chair({ at = [0, 0, 0], rotation = 0 }: { at?: XYZ; rotation?: number }) {
  return <group name="desk-chair" position={at} rotation-y={rotation}>
    <mesh geometry={furnitureGeometry.chairCushions} material={materials.navy} castShadow receiveShadow />
    <mesh geometry={furnitureGeometry.chairFrame} material={materials.metal} castShadow receiveShadow />
    <mesh geometry={furnitureGeometry.chairTrim} material={materials.trim} castShadow receiveShadow />
  </group>;
}
function Table({ width = DESK.width, depth = DESK.depth }: { width?: number; depth?: number }) {
  return <group>
    <Block at={[0, DESK.height, 0]} size={[width, DESK.top, depth]} rounded />
    <mesh geometry={furnitureGeometry.tableFrame} material={materials.cream} scale={[width, 1, depth]} castShadow receiveShadow />
  </group>;
}
function Monitor() {
  return <group>
    <Block at={[0, 1.27, -0.24]} size={[0.96, 0.6, 0.065]} tone="frame" rounded />
    <Block at={[0, 1.27, -0.2]} size={[0.87, 0.51, 0.012]} tone="screen" />
    <Block at={[0, 0.97, -0.24]} size={[0.06, 0.2, 0.05]} tone="metal" />
    <Block at={[0, 0.89, -0.24]} size={[0.34, 0.025, 0.22]} tone="metal" rounded />
    <Block at={[0, 0.89, DESK.keyboardZ]} size={[0.56, 0.03, 0.2]} tone="trim" rounded />
    <Block at={[0.48, 0.9, DESK.keyboardZ]} size={[0.1, 0.05, 0.15]} tone="trim" rounded />
    <lineSegments position={[0, 1.24, -0.186]} scale={[1.15, 1.15, 1]} geometry={chartGeometry} material={chartMaterial} />
  </group>;
}
function Workstation({ at, rotation = 0 }: { at: XYZ; rotation?: number }) {
  return <group name="workstation" position={at} rotation-y={rotation}><Table /><Monitor /><Chair at={[0, 0, DESK.chairOffset]} /></group>;
}
export function DeskPod() {
  return <group>
    <Block at={[0, 0.015, 0]} size={[POD_SIZE[0], 0.03, POD_SIZE[1]]} tone="rug" />
    {[-1, 1].flatMap(x => [-1, 1].map(z => <Workstation key={`${x}-${z}`} at={[x * DESK.podX, 0, z * DESK.podZ]} rotation={z < 0 ? Math.PI : 0} />))}
    <Block at={[0, 1.1, 0]} size={[3.8, 0.58, 0.07]} tone="partition" rounded />
    <Block at={[0, 1.1, 0]} size={[0.07, 0.58, 2.3]} tone="partition" rounded />
    <Block at={[0, 1.4, 0]} size={[3.8, 0.025, 0.075]} tone="metal" />
    <Block at={[0, 1.4, 0]} size={[0.075, 0.025, 2.3]} tone="metal" />
    <group position={[0, 1.42, 0]} scale={0.19}><Plant /></group>
  </group>;
}
export function Plant() {
  return <group name="square-planter">
    <Block at={[0, 0.27, 0]} size={[0.62, 0.54, 0.62]} tone="cream" rounded />
    <Block at={[0, 0.535, 0]} size={[0.51, 0.025, 0.51]} tone="soil" />
    <Cylinder at={[0, 0.82, 0]} size={[0.045, 0.6, 0.045]} tone="green" />
    {Array.from({ length: 9 }, (_, i) => <mesh key={i} position={[Math.sin(i * 2.4) * 0.02, 0.62 + (i % 3) * 0.03, Math.cos(i * 2.4) * 0.02]} rotation={[0, i * 2.4, [0.8, 0.5, 0.2][i % 3]]} scale={[0.6, [0.65, 0.8, 1][i % 3], 0.9]} geometry={geometry.leaf} material={materials[i % 2 ? "green" : "leaf"]} castShadow />)}
  </group>;
}
function Sofa() {
  return <group>
    <mesh geometry={furnitureGeometry.tableFrame} material={materials.wood} scale={[3.2, 0.18, 1]} castShadow receiveShadow />
    <Block at={[0, 0.3, 0]} size={[3.2, 0.45, 1.04]} tone="cream" rounded />
    <mesh geometry={furnitureGeometry.sofaCushions} material={materials.cream} castShadow receiveShadow />
    {[-1, 1].map(x => <Block key={x} at={[x * 1.5, 0.65, 0]} size={[0.25, 0.55, 1.1]} tone="cream" rounded />)}
    <group position={[0.9, 0.87, -0.21]} rotation={[0.12, 0.1, -0.1]}><Block at={[0, 0, 0]} size={[0.48, 0.45, 0.2]} tone="navy" rounded /></group>
  </group>;
}

function Armchair({ at, rotation = 0 }: { at: XYZ; rotation?: number }) {
  return <group name="padded-armchair" position={at} rotation-y={rotation}>
    <mesh geometry={furnitureGeometry.armchairCushions} material={materials.navy} castShadow receiveShadow />
    <mesh geometry={furnitureGeometry.armchairLegs} material={materials.wood} castShadow receiveShadow />
  </group>;
}

function RoundTable({ diameter = 1.05 }: { diameter?: number }) {
  return <group>
    <Cylinder at={[0, 0.55, 0]} size={[diameter, 0.08, diameter]} tone="wood" />
    <mesh geometry={furnitureGeometry.roundTableLegs} material={materials.wood} scale={[diameter / 1.05, 1, diameter / 1.05]} castShadow receiveShadow />
    <group position={[0, 0.59, 0]} scale={0.24}><Plant /></group>
  </group>;
}

function Bookcase({ width = 1.8 }: { width?: number }) {
  return <group>
    <Block at={[0, 0.63, -0.23]} size={[width, 1.26, 0.06]} />
    {[-1, 1].map(x => <Block key={x} at={[x * (width / 2 - 0.035), 0.63, 0]} size={[0.07, 1.26, 0.5]} />)}
    {[0.06, 0.63, 1.26].map(y => <Block key={y} at={[0, y, 0]} size={[width, 0.06, 0.5]} />)}
    {[0, 1].flatMap(row => Array.from({ length: 6 }, (_, i) => <Block key={`${row}-${i}`} at={[-width / 2 + 0.18 + i * (width - 0.36) / 5, 0.28 + row * 0.58, 0.04]} size={[0.1, 0.35 + (i % 2) * 0.08, 0.31]} tone={i % 3 === 0 ? "cream" : "navy"} />))}
  </group>;
}

function CollaborationNook() {
  return <group name="round-seating-without-bookcase">
    <Block at={[0, 0.01, 0]} size={[3.2, 0.02, 3.2]} tone="rug" />
    <RoundTable />
    {[0, Math.PI * 2 / 3, Math.PI * 4 / 3].map(angle => <Armchair key={angle} at={[Math.sin(angle) * 1.05, 0, Math.cos(angle) * 1.05]} rotation={angle} />)}
  </group>;
}

function ReadingNook() {
  return <group>
    <Block at={[0, 0.01, 0]} size={[3.7, 0.02, 3.5]} tone="rug" />
    <group position={[0, 0, 0.4]}><RoundTable /></group>
    <Armchair at={[-1, 0, 0.6]} rotation={-Math.PI / 2} />
    <Armchair at={[1, 0, 0.6]} rotation={Math.PI / 2} />
    <group position={[0, 0, -1.2]}><Bookcase /></group>
    <group position={[1.35, 0, -0.8]}><Plant /></group>
  </group>;
}

function CoffeeCounter() {
  return <group>
    <Block at={[0, 0.49, -0.5]} size={[3, 0.98, 0.65]} tone="cream" />
    <Block at={[0, 1.02, -0.5]} size={[3.1, 0.09, 0.75]} />
    {[-0.5, 0.5].map(x => <Block key={x} at={[x, 0.48, -0.17]} size={[0.018, 0.78, 0.02]} tone="wood" />)}
    <Block at={[-0.9, 1.28, -0.5]} size={[0.38, 0.43, 0.34]} tone="frame" rounded />
    <Block at={[-0.9, 1.29, -0.32]} size={[0.24, 0.19, 0.02]} tone="screen" />
    <Block at={[-0.9, 1.16, -0.25]} size={[0.27, 0.035, 0.22]} tone="metal" />
    <Block at={[-0.9, 1.28, -0.27]} size={[0.06, 0.14, 0.09]} tone="trim" />
    <Cylinder at={[0.6, 1.27, -0.5]} size={[0.25, 0.4, 0.25]} tone="frame" />
    <Cylinder at={[0.6, 1.48, -0.5]} size={[0.28, 0.04, 0.28]} tone="frame" />
    {[-0.25, 0, 0.25].map(x => <Cylinder key={x} at={[x, 1.15, -0.4]} size={[0.14, 0.17, 0.14]} tone="cream" />)}
    <group position={[1.2, 1.07, -0.5]} scale={0.22}><Plant /></group>
    {[-0.7, 0.7].map(x => <group key={x}>
      <Cylinder at={[x, 0.71, 0.55]} size={[0.5, 0.1, 0.5]} tone="navy" />
      <mesh position={[x, 0, 0.55]} scale={[0.44, 0.85, 0.44]} geometry={furnitureGeometry.tableFrame} material={materials.wood} castShadow receiveShadow />
    </group>)}
  </group>;
}

function Copier() {
  return <group>
    <Block at={[0, 0.55, 0]} size={[0.75, 1.1, 0.7]} tone="cream" rounded />
    <Block at={[0, 1.12, 0]} size={[0.65, 0.09, 0.55]} tone="frame" rounded />
    <Block at={[0, 1.18, 0.01]} size={[0.48, 0.06, 0.4]} tone="cream" />
    {[0.22, 0.48, 0.74].map(y => <Block key={y} at={[0, y, 0.353]} size={[0.53, 0.025, 0.018]} tone="partition" />)}
    <Block at={[0, 0.9, 0.355]} size={[0.5, 0.1, 0.018]} tone="frame" />
    <Block at={[0.2, 1.03, 0.356]} size={[0.12, 0.07, 0.02]} tone="screen" />
    <Block at={[-0.1, 0.86, 0.44]} size={[0.5, 0.04, 0.2]} tone="white" />
  </group>;
}

export function Furnishing({ fixture }: { fixture: Fixture }) {
  const { kind, at, rotation = 0 } = fixture;
  return <group name={fixture.id} position={[at[0], 0, at[1]]} rotation-y={rotation}>
    {kind === "bench" ? <><Block at={[0, 0.01, 0]} size={[3.9, 0.02, 2.3]} tone="rug" /><Workstation at={[-0.95, 0, -0.22]} /><Workstation at={[0.95, 0, -0.22]} /></> : null}
    {kind === "lounge" ? <><Block at={[0, 0.01, 0]} size={[4, 0.02, 3.8]} tone="rug" /><group position={[0, 0, -0.4]}><Sofa /></group><group position={[0, -0.3, 1.3]}><Table width={1.6} depth={0.8} /></group><group position={[0, 0.58, 1.3]} scale={0.2}><Plant /></group></> : null}
    {kind === "plant" ? <Plant /> : null}
    {kind === "storage" ? <>
      <Block at={[0, 0.63, 0]} size={[2, 1.26, 0.55]} /><Block at={[0, 0.64, 0.29]} size={[1.85, 1.05, 0.04]} tone="cream" />
      {[-0.65, -0.47, -0.29, -0.11].map((x, i) => <Block key={x} at={[x, 1.48, 0]} size={[0.12, 0.44 - (i % 2) * 0.06, 0.3]} tone={i % 2 ? "cream" : "navy"} />)}
      <group position={[0.65, 1.28, 0]} scale={0.27}><Plant /></group>
    </> : null}
    {kind === "coffee" ? <CoffeeCounter /> : null}
    {kind === "countertop" ? <>
      <Block at={[0, 0.43, 0]} size={[fixture.size[0] - 0.1, 0.86, fixture.size[1] - 0.12]} tone="cream" />
      <Block at={[0, 0.9, 0]} size={[fixture.size[0], 0.08, fixture.size[1]]} />
      <Block at={[0, 0.44, fixture.size[1] / 2 - 0.05]} size={[0.025, 0.72, 0.02]} tone="wood" />
      <group position={[0.52, 0.95, 0]} scale={0.24}><Plant /></group>
      {[0, 1].map(i => <Block key={i} at={[-0.42, 0.96 + i * 0.07, 0]} size={[0.46, 0.06, 0.3]} tone={i ? "cream" : "navy"} />)}
    </> : null}
    {kind === "copier" ? <Copier /> : null}
    {kind === "conversation" ? <><Armchair at={[-0.7, 0, 0]} rotation={-Math.PI / 2} /><Armchair at={[0.7, 0, 0]} rotation={Math.PI / 2} /><RoundTable diameter={0.7} /></> : null}
    {kind === "collaboration" ? <CollaborationNook /> : null}
    {kind === "reading" ? <ReadingNook /> : null}
    {kind === "bookcase" ? <Bookcase width={Math.abs(Math.sin(rotation)) > 0.5 ? fixture.size[1] : fixture.size[0]} /> : null}
  </group>;
}
function GlassPartition({ at, length, rotation = 0, door, woodDoor = false }: { at: XYZ; length: number; rotation?: number; door?: number; woodDoor?: boolean }) {
  const h = ROOM_FRAME.paneHeight, doorWidth = 1;
  const posts = [-length / 2, length / 2];
  const bays = Math.ceil(length / 1.3);
  for (let i = 1; i < bays; i++) {
    const x = -length / 2 + i * length / bays;
    if (door === undefined || Math.abs(x - door) > doorWidth / 2 + 0.1) posts.push(x);
  }
  if (door !== undefined) posts.push(door - doorWidth / 2, door + doorWidth / 2);
  const cuts = [...new Set(posts)].sort((a, b) => a - b);
  return <group name="glass-partition" position={at} rotation-y={rotation}>
    {cuts.slice(1).map((right, i) => {
      const left = cuts[i], x = (left + right) / 2, isDoor = door !== undefined && Math.abs(x - door) < 0.01;
      return <group key={left}>
        {isDoor ? <>
          <Block at={[x, 1.275, 0]} size={[right - left - 0.045, 2.55, 0.065]} glass={!woodDoor} tone="wood" />
          <Block at={[x, 2.725, 0]} size={[right - left - 0.045, 0.35, 0.06]} glass />
          <Block at={[x, 2.55, 0]} size={[right - left, 0.045, 0.045]} tone="frame" />
          <Block at={[x + 0.35, 1.25, 0.07]} size={[0.035, 0.27, 0.055]} tone="frame" />
        </> : <Block at={[x, h / 2, 0]} size={[right - left - 0.045, h, 0.06]} glass />}
      </group>;
    })}
    {cuts.slice(1, -1).map(x => <Block key={x} at={[x, h / 2, 0]} size={[0.045, h, 0.045]} tone="frame" />)}
    <Block at={[0, h, 0]} size={[length, ROOM_FRAME.width, ROOM_FRAME.width]} tone="frame" />
    <Block at={[0, 0.035, 0]} size={[length, 0.045, 0.045]} tone="frame" />
  </group>;
}

export function OfficeRoom({ room }: { room: Room }) {
  const [w, d] = room.size;
  const h = ROOM_FRAME.paneHeight;
  const meetsLeftWall = Math.abs(room.at[0] - w / 2 + BUILDING.width / 2 - BUILDING.wallThickness / 2) < 0.001;
  const privateOffice = room.kind === "private";
  const sideEntry = meetsLeftWall && !privateOffice;
  const doors = room.doors ?? { side: sideEntry ? "glass" : undefined, front: privateOffice || sideEntry ? "wood" : "glass" };
  const meetsBackWall = Math.abs(room.at[1] - d / 2 + BUILDING.depth / 2 - BUILDING.wallThickness / 2) < 0.001;
  return <group name={room.id} position={[room.at[0], 0, room.at[1]]}>
    <Block at={[0, 0.015, 0]} size={[w, 0.03, d]} tone="rug" />
    {!meetsLeftWall ? <GlassPartition at={[-w / 2, 0, 0]} length={d} rotation={Math.PI / 2} /> : null}
    <GlassPartition at={[w / 2, 0, 0]} length={d} rotation={Math.PI / 2} door={doors.side ? -d / 2 + 0.55 : undefined} woodDoor={doors.side === "wood"} />
    <GlassPartition at={[0, 0, d / 2]} length={w} door={doors.front ? privateOffice || sideEntry ? -w / 2 + 0.55 : w / 2 - 0.55 : undefined} woodDoor={doors.front === "wood"} />
    {!meetsBackWall ? <GlassPartition at={[0, 0, -d / 2]} length={w} /> : null}
    {[-1, 1].flatMap(x => [-1, 1].map(z => <Block key={`${x}-${z}`} at={[x * w / 2, h / 2, z * d / 2]} size={[0.055, h, 0.055]} tone="frame" />))}
    {room.kind === "conference" ? <>
      <group rotation-y={room.tableRotation ?? 0}><Table width={4.2} depth={1.4} />{[-1.4, 0, 1.4].flatMap(x => [-1, 1].map(z => <Chair key={`${x}-${z}`} at={[x, 0, z * 1.2]} rotation={z < 0 ? Math.PI : 0} />))}</group>
      <group position={meetsLeftWall ? [-w / 2 + 0.12, 1.95, 0] : [0, 1.95, -d / 2 + 0.12]} rotation-y={meetsLeftWall ? Math.PI / 2 : 0}>
        <Block at={[0, 0, 0]} size={[2.1, 1, 0.08]} tone="white" />
        <lineSegments position={[0, -0.05, 0.045]} scale={[2.6, 2.1, 1]} geometry={chartGeometry} material={chartMaterial} />
      </group>
      <group position={[-w / 2 + 0.55, 0, -d / 2 + 0.55]}><Plant /></group>
      <group position={[w / 2 - 0.55, 0, -d / 2 + 0.55]}><Plant /></group>
    </> : null}
    {privateOffice ? <>
      <Workstation at={[0, 0, -0.4]} />
      <group name="private-office-shelving" position={[-w / 2 + 1, 0, -d / 2 + 0.4]}><Bookcase width={1.5} /><group position={[0.4, 1.29, 0]} scale={0.22}><Plant /></group></group>
      <group name="private-office-art" position={[0.75, 1.95, -d / 2 + 0.12]}>
        <Block at={[0, 0, 0]} size={[1.3, 0.9, 0.06]} tone="white" />
        <lineSegments position={[0, -0.05, 0.04]} scale={[1.6, 1.7, 1]} geometry={chartGeometry} material={chartMaterial} />
      </group>
      <group position={[w / 2 - 0.55, 0, d / 2 - 0.65]}><Plant /></group>
    </> : null}
  </group>;
}
