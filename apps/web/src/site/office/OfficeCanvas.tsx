import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import { Canvas, invalidate, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Vector3, NeutralToneMapping } from "three";
import { CAMERA, DESK, FLOORS, POD_SIZE, type FloorId, type ToolId } from "./layouts";
import { OfficeFloor } from "./OfficeFloor";
import { OfficeFallback } from "./OfficeFallback";
import { LocationMarker } from "./LocationMarker";
import { OfficePeople } from "./OfficePeople";
import { OfficeViewControls } from "./OfficeViewControls";
import type { ViewMotion } from "./officeView";
import type { NavigationPhase } from "./useOfficeNavigation";
import { PeopleSession } from "./peopleSimulation";

type MarkerElements = Record<ToolId, HTMLDivElement | null>;
function MarkerProjection({ floor, elements, hits, visible, settled, revision, motion, element }: { floor: FloorId; elements: RefObject<MarkerElements>; hits: RefObject<MarkerElements>; visible: boolean; settled: boolean; revision: RefObject<number>; motion: RefObject<ViewMotion>; element: RefObject<HTMLDivElement | null> }) {
  const point = useRef(new Vector3());
  const last = useRef("");
  // Update DOM projection only when progress, floor or viewport changes. The
  // actual fitted camera is the source; CSS pixels are independent of canvas DPR.
  useFrame(({ camera, size }) => {
    const signature = `${floor}-${visible}-${settled}-${size.width}-${size.height}-${revision.current}-${motion.current.revision}-${motion.current.busy}`;
    if (last.current === signature) return;
    last.current = signature;
    for (const pod of FLOORS[floor].pods) {
      const element = elements.current[pod.tool];
      const hit = hits.current[pod.tool];
      if (!element || !hit) continue;
      element.style.visibility = hit.style.visibility = visible ? "visible" : "hidden";
      point.current.set(pod.at[0], 2.8, pod.at[1]).project(camera);
      const x = (point.current.x + 1) * size.width / 2;
      const y = (1 - point.current.y) * size.height / 2;
      element.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      element.dataset.side = x > size.width - 155 ? "left" : "right";
      const vertices = [-1, 1].flatMap(dx => [-1, 1].flatMap(dz => [0, DESK.interactionHeight].map(y => {
        point.current.set(pod.at[0] + dx * POD_SIZE[0] / 2, y, pod.at[1] + dz * POD_SIZE[1] / 2).project(camera);
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
function Floors({ floor, session }: { floor: FloorId; session: PeopleSession }) {
  return <>{(["home", "resources"] as const).map(id => <group key={id} visible={floor === id} dispose={null}><OfficeFloor layout={FLOORS[id]} doors={session.floors[id].doors} /><OfficePeople simulation={session.floors[id]} session={session} visible={floor === id} /></group>)}</>;
}

function OfficeRender({ floor, phase, viewReset, onPresented, session }: { floor: FloorId; phase: NavigationPhase; viewReset: number; onPresented: (floor: FloorId, reset: number) => void; session: PeopleSession }) {
  const drawn = useRef("");
  useLayoutEffect(() => { invalidate(); }, [floor, phase, viewReset]);
  // Present the office only after the logical simulation has caught up.
  useFrame(({ gl, scene, camera }) => {
    if (!session.ready) return;
    gl.render(scene, camera);
    const signature = `${floor}-${phase}-${viewReset}`;
    if (drawn.current !== signature) { drawn.current = signature; onPresented(floor, viewReset); }
  }, 1);
  return null;
}

export default function OfficeCanvas({ floor, phase, settled, animate, pageVisible, reducedMotion, viewReset, instantReset, onPresented }: { floor: FloorId; phase: NavigationPhase; settled: boolean; animate: boolean; pageVisible: boolean; reducedMotion: boolean; viewReset: number; instantReset: boolean; onPresented: (floor: FloorId, reset: number) => void }) {
  const [session] = useState(() => new PeopleSession(crypto.getRandomValues(new Uint32Array(1))[0], performance.now(), reducedMotion));
  const element = useRef<HTMLDivElement>(null);
  const motion = useRef<ViewMotion>({ revision: 0, busy: false, pointer: null });
  const markers = useRef<MarkerElements>({ ithaca: null, troy: null, delphi: null });
  const hits = useRef<MarkerElements>({ ithaca: null, troy: null, delphi: null });
  // DOM pins remount independently of the Canvas root. A paused scene may have
  // already projected the prior nodes, so new refs must request another frame.
  const projectionRevision = useRef(0);
  return <div ref={element} className="office-scene"><Canvas orthographic frameloop={pageVisible && animate && settled ? "always" : "demand"} dpr={[1, 1.5]} shadows="variance" camera={{ position: [...CAMERA.position], near: 0.1, far: 150 }} gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.1 }} fallback={<OfficeFallback floor={floor} />} aria-label={`${FLOORS[floor].title}: isometric 3D floor with three marked tool desks`}>
    <OrthographicCamera makeDefault manual position={[...CAMERA.position]} near={0.1} far={150} />
    <OfficeBehavior session={session} reducedMotion={reducedMotion} pageVisible={pageVisible} floor={floor} />
    <OfficeViewControls element={element} motion={motion} reset={viewReset} instantReset={instantReset} settled={settled} reducedMotion={reducedMotion} pageVisible={pageVisible} />
    <ambientLight intensity={0.5} />
    <hemisphereLight args={["#eef4ff", "#b5c9e3", 1.25]} />
    <directionalLight name="office-daylight" position={[-9, 18, 7]} color="#fff3de" intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={5} shadow-blurSamples={8} shadow-camera-near={1} shadow-camera-far={60} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={0.02} shadow-bias={-0.00015} />
    <directionalLight position={[10, 9, -12]} color="#d9e7ff" intensity={0.85} />
    <Floors floor={floor} session={session} />
    <MarkerProjection floor={floor} elements={markers} hits={hits} visible={phase !== "hidden"} settled={settled} revision={projectionRevision} motion={motion} element={element} />
    <OfficeRender floor={floor} phase={phase} viewReset={viewReset} onPresented={onPresented} session={session} />
  </Canvas>
    {FLOORS[floor].pods.map(pod => <LocationMarker key={`${floor}-${pod.tool}`} tool={pod.tool} label={pod.label} active={settled} anchorRef={element => { markers.current[pod.tool] = element; if (element) { projectionRevision.current++; invalidate(); } }} hitRef={element => { hits.current[pod.tool] = element; if (element) { projectionRevision.current++; invalidate(); } }} />)}
  </div>;
}

