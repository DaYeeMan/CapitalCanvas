import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Canvas, invalidate, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Vector3, Object3D, NeutralToneMapping, type Group, type DirectionalLight } from "three";
import { CAMERA, DESK, FLOORS, POD_SIZE, type FloorId, type ToolId } from "./layouts";
import { OfficeFloor } from "./OfficeFloor";
import { OfficeFallback } from "./OfficeFallback";
import { LocationMarker } from "./LocationMarker";
import { OfficePeople } from "./OfficePeople";
import { OfficeViewControls } from "./OfficeViewControls";
import type { ViewMotion } from "./officeView";
import type { NavigationPhase } from "./useOfficeNavigation";
import { PeopleSession } from "./peopleSimulation";
import { towerPose, type PreviewView } from "./towerStructure";
import { TowerAssembly, type TowerGroups } from "./TowerAssembly";
import { CityDistrict } from "./CityDistrict";
import { TowerMotionDriver, type MotionRuntime, type OfficeGroups } from "./TowerMotionDriver";

type MarkerElements = Record<ToolId, HTMLDivElement | null>;
function MarkerProjection({ floor, offices, elements, hits, visible, settled, revision, motion, element }: { floor: FloorId; offices: RefObject<OfficeGroups>; elements: RefObject<MarkerElements>; hits: RefObject<MarkerElements>; visible: boolean; settled: boolean; revision: RefObject<number>; motion: RefObject<ViewMotion>; element: RefObject<HTMLDivElement | null> }) {
  const point = useRef(new Vector3());
  const last = useRef("");
  // Update DOM projection only when progress, floor or viewport changes. The
  // actual fitted camera is the source; CSS pixels are independent of canvas DPR.
  useFrame(({ camera, size }) => {
    const signature = `${floor}-${visible}-${settled}-${size.width}-${size.height}-${revision.current}-${motion.current.revision}-${motion.current.busy}`;
    if (last.current === signature) return;
    last.current = signature;
    const office = offices.current[floor];
    if (!office) return;
    office.updateWorldMatrix(true, false);
    for (const pod of FLOORS[floor].pods) {
      const element = elements.current[pod.tool];
      const hit = hits.current[pod.tool];
      if (!element || !hit) continue;
      element.style.visibility = hit.style.visibility = visible ? "visible" : "hidden";
      point.current.set(pod.at[0], 2.8, pod.at[1]).applyMatrix4(office.matrixWorld).project(camera);
      const x = (point.current.x + 1) * size.width / 2;
      const y = (1 - point.current.y) * size.height / 2;
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      element.dataset.side = x > size.width - 155 ? "left" : "right";
      const vertices = [-1, 1].flatMap(dx => [-1, 1].flatMap(dz => [0, DESK.interactionHeight].map(y => {
        point.current.set(pod.at[0] + dx * POD_SIZE[0] / 2, y, pod.at[1] + dz * POD_SIZE[1] / 2).applyMatrix4(office.matrixWorld).project(camera);
        return [(point.current.x + 1) * size.width / 2, (1 - point.current.y) * size.height / 2];
      })));
      // The convex projection follows the desk volume, rather than a rectangle
      // that would also catch adjacent aisles or secondary furniture.
      vertices.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      const cross = (a: number[], b: number[], c: number[]) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
      const hull: number[][] = [];
      for (const vertex of vertices) { while (hull.length > 1 && cross(hull.at(-2)!, hull.at(-1)!, vertex) <= 0) hull.pop(); hull.push(vertex); }
      const lower = hull.length;
      for (const vertex of vertices.slice(0, -1).reverse()) { while (hull.length > lower && cross(hull.at(-2)!, hull.at(-1)!, vertex) <= 0) hull.pop(); hull.push(vertex); }
      hull.pop();
      hit.style.clipPath = `polygon(${hull.map(v => `${v[0]}px ${v[1]}px`).join(",")})`;
    }
    const pointer = motion.current.pointer;
    const hovered = pointer ? document.elementFromPoint(pointer.x, pointer.y)?.closest<HTMLElement>(".office-tool")?.dataset.tool : undefined;
    element.current?.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: hovered, busy: motion.current.busy || !settled } }));
  });
  return null;
}

function OfficeBehavior({ session, reducedMotion, pageVisible, floor }: { session: PeopleSession; reducedMotion: boolean; pageVisible: boolean; floor: FloorId }) {
  useEffect(() => {
    session.setPaused(reducedMotion, performance.now()); invalidate();
    if (pageVisible || reducedMotion) return;
    // Cheap behavior work, without mixers or WebGL. Throttled/suspended timers
    // remain safe because the returning frame also catches up elapsed time.
    const timer = window.setInterval(() => session.advance(performance.now()), 1000);
    return () => window.clearInterval(timer);
  }, [session, reducedMotion, pageVisible, floor]);
  useFrame(() => { if (!session.advance(performance.now()) && pageVisible) invalidate(); }, -2);
  return null;
}
function Floors({ floor, session, groups, moving, pageVisible }: { floor: FloorId; session: PeopleSession; groups: RefObject<OfficeGroups>; moving: boolean; pageVisible: boolean }) {
  return <>{(["home", "resources"] as const).map(id => <group key={id} ref={node => { groups.current[id] = node; }} visible={false} dispose={null}><OfficeFloor layout={FLOORS[id]} doors={session.floors[id].doors} /><OfficePeople simulation={session.floors[id]} session={session} visible={pageVisible && (moving || floor === id)} /></group>)}</>;
}

function Daylight({ light, fill, target }: { light: RefObject<DirectionalLight | null>; fill: RefObject<DirectionalLight | null>; target: Object3D }) {
  return <>
    <primitive object={target} />
    <ambientLight intensity={0.5} />
    <hemisphereLight args={["#eef4ff", "#b5c9e3", 1.25]} />
    <directionalLight ref={light} name="office-daylight" target={target} position={[-9, 18, 7]} color="#fff3de" intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={5} shadow-blurSamples={8} shadow-camera-near={1} shadow-camera-far={220} shadow-camera-left={-70} shadow-camera-right={70} shadow-camera-top={70} shadow-camera-bottom={-70} shadow-normalBias={0.02} shadow-bias={-0.00015} />
    <directionalLight ref={fill} position={[10, 9, -12]} target={target} color="#d9e7ff" intensity={0.85} />
  </>;
}

function OfficeRender({ floor, phase, viewReset, onPresented, session, runtime, element }: { floor: FloorId; phase: NavigationPhase; viewReset: number; onPresented: (floor: FloorId, reset: number) => void; session: PeopleSession; runtime: RefObject<MotionRuntime>; element: RefObject<HTMLDivElement | null> }) {
  const drawn = useRef("");
  const samples = useRef<number[]>([]), lastFrame = useRef<number | null>(null);
  useLayoutEffect(() => { samples.current = []; lastFrame.current = null; invalidate(); }, [floor, phase, viewReset]);
  // Present the office only after the logical simulation has caught up.
  useFrame(({ gl, scene, camera }) => {
    if (!session.ready) return;
    gl.render(scene, camera);
    const node = element.current, now = performance.now();
    if (phase === "moving") {
      if (lastFrame.current !== null) samples.current.push(now - lastFrame.current);
      lastFrame.current = now;
    }
    const signature = `${floor}-${phase}-${viewReset}`;
    if (runtime.current.complete && drawn.current !== signature) {
      if (node) {
        node.dataset.drawCalls = String(gl.info.render.calls); node.dataset.triangles = String(gl.info.render.triangles);
        node.dataset.geometries = String(gl.info.memory.geometries); node.dataset.textures = String(gl.info.memory.textures);
        if (samples.current.length) {
          const sorted = [...samples.current].sort((a, b) => a - b);
          node.dataset.motionFrames = JSON.stringify({ count: sorted.length, p50: sorted[Math.floor(sorted.length * 0.5)], p95: sorted[Math.floor(sorted.length * 0.95)], max: sorted.at(-1) });
        }
      }
      drawn.current = signature; onPresented(floor, viewReset);
    }
  }, 1);
  return null;
}

export default function OfficeCanvas({ view, origin, overview, floor, phase, settled, animate, pageVisible, reducedMotion, viewReset, instantReset, onPresented, onEnter }: { view: PreviewView; origin: PreviewView; overview: boolean; floor: FloorId; phase: NavigationPhase; settled: boolean; animate: boolean; pageVisible: boolean; reducedMotion: boolean; viewReset: number; instantReset: boolean; onPresented: (floor: FloorId, reset: number) => void; onEnter: () => void }) {
  const [session] = useState(() => new PeopleSession(crypto.getRandomValues(new Uint32Array(1))[0], performance.now(), reducedMotion));
  const element = useRef<HTMLDivElement>(null);
  const motion = useRef<ViewMotion>({ revision: 0, busy: false, pointer: null });
  const markers = useRef<MarkerElements>({ ithaca: null, troy: null, delphi: null });
  const hits = useRef<MarkerElements>({ ithaca: null, troy: null, delphi: null });
  // DOM pins remount independently of the Canvas root. A paused scene may have
  // already projected the prior nodes, so new refs must request another frame.
  const projectionRevision = useRef(0);
  const towers = useRef<TowerGroups>({ middle: null, cap: null, homeFacade: null, resourcesFacade: null });
  const offices = useRef<OfficeGroups>({ home: null, resources: null });
  const district = useRef<Group>(null), light = useRef<DirectionalLight>(null), fill = useRef<DirectionalLight>(null);
  const [lightTarget] = useState(() => new Object3D());
  const runtime = useRef<MotionRuntime>({ frame: null, complete: false });
  const pins = view !== "city" && !overview && settled;
  return <div ref={element} className="office-scene" data-framing={view === "city" || overview ? "tower" : "office"}><Canvas orthographic frameloop={pageVisible && (phase === "moving" || animate && settled) ? "always" : "demand"} dpr={[1, 1.5]} shadows="variance" camera={{ position: [...CAMERA.position], near: 0.1, far: 500 }} gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.1 }} fallback={<OfficeFallback floor={floor} view={view} viewReset={viewReset} onPresented={onPresented} />} aria-label={view === "city" ? "Grounded District: main tower and four supporting buildings" : overview ? `${FLOORS[floor].title}: opened floor in the whole tower` : `${FLOORS[floor].title}: isometric 3D floor with three marked tool desks`}>
    <OrthographicCamera makeDefault manual position={[...CAMERA.position]} near={0.1} far={500} />
    <OfficeBehavior session={session} reducedMotion={reducedMotion} pageVisible={pageVisible} floor={floor} />
    {pins && <OfficeViewControls element={element} motion={motion} reset={viewReset} instantReset={instantReset} settled={settled} reducedMotion={reducedMotion} pageVisible={pageVisible} elevation={towerPose(view).floorY} />}
    <color attach="background" args={["#f5f4f0"]} /><fog attach="fog" args={["#f5f4f0", 220, 330]} />
    <group ref={district}><CityDistrict /></group>
    <Daylight light={light} fill={fill} target={lightTarget} />
    <TowerAssembly groups={towers} canEnter={view === "city" && settled} onEnter={onEnter} />
    <Floors floor={floor} session={session} groups={offices} moving={phase === "moving"} pageVisible={pageVisible} />
    <TowerMotionDriver view={view} origin={origin} phase={phase} reset={viewReset} overview={overview} reducedMotion={reducedMotion} pageVisible={pageVisible} runtime={runtime} towers={towers} offices={offices} district={district} light={light} fill={fill} lightTarget={lightTarget} element={element} motion={motion} session={session} />
    <MarkerProjection floor={floor} offices={offices} elements={markers} hits={hits} visible={pins} settled={settled} revision={projectionRevision} motion={motion} element={element} />
    <OfficeRender floor={floor} phase={phase} viewReset={viewReset} onPresented={onPresented} session={session} runtime={runtime} element={element} />
  </Canvas>
    {pins && FLOORS[floor].pods.map(pod => <LocationMarker key={`${floor}-${pod.tool}`} tool={pod.tool} label={pod.label} active={settled} anchorRef={element => { markers.current[pod.tool] = element; if (element) { projectionRevision.current++; invalidate(); } }} hitRef={element => { hits.current[pod.tool] = element; if (element) { projectionRevision.current++; invalidate(); } }} />)}
  </div>;
}

