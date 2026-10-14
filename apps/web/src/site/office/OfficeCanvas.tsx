import { useRef, type RefObject } from "react";
import { Canvas, invalidate, useFrame } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import { Vector3, NeutralToneMapping, type Group, type OrthographicCamera as Camera } from "three";
import { CAMERA, DESK, FLOORS, POD_SIZE, type FloorId, type ToolId } from "./layouts";
import { OfficeFloor } from "./OfficeFloor";
import { OfficeFallback } from "./OfficeFallback";
import { OfficeSurroundings } from "./OfficeSurroundings";
import { LocationMarker } from "./LocationMarker";
import { OfficePeople } from "./OfficePeople";
import { OfficeViewControls } from "./OfficeViewControls";
import type { ViewMotion } from "./officeView";
import { floorTravelDistance, SURROUNDINGS } from "./surroundings";

type MarkerElements = Record<ToolId, HTMLDivElement | null>;
function MarkerProjection({ floor, elements, hits, progress, settled, revision, motion, element }: { floor: FloorId; elements: RefObject<MarkerElements>; hits: RefObject<MarkerElements>; progress: RefObject<number>; settled: boolean; revision: RefObject<number>; motion: RefObject<ViewMotion>; element: RefObject<HTMLDivElement | null> }) {
  const point = useRef(new Vector3());
  const last = useRef("");
  // Update DOM projection only when progress, floor or viewport changes. The
  // actual fitted camera is the source; CSS pixels are independent of canvas DPR.
  useFrame(({ camera, size }) => {
    const signature = `${floor}-${settled}-${progress.current}-${size.width}-${size.height}-${revision.current}-${motion.current.revision}-${motion.current.busy}`;
    if (last.current === signature) return;
    last.current = signature;
    for (const pod of FLOORS[floor].pods) {
      const element = elements.current[pod.tool];
      const hit = hits.current[pod.tool];
      if (!element || !hit) continue;
      element.style.visibility = hit.style.visibility = settled ? "visible" : "hidden";
      if (!settled) continue;
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

function FloorTravel({ progress, floor, settled, animate }: { progress: RefObject<number>; floor: FloorId; settled: boolean; animate: boolean }) {
  const home = useRef<Group>(null), resources = useRef<Group>(null);
  useFrame(({ camera }) => {
    const cam = camera as Camera;
    // Exaggerate the cinematic gap to one viewport. Physical floorSpacing stays
    // shared; this presentation offset keeps the upper slab off the lower floor.
    const travel = floorTravelDistance(cam.top - cam.bottom);
    home.current!.position.y = progress.current * travel;
    resources.current!.position.y = (progress.current - 1) * travel;
    home.current!.visible = progress.current < 0.999;
    resources.current!.visible = progress.current > 0.001;
  }, -1);
  return <><group ref={home} dispose={null}><OfficeFloor layout={FLOORS.home} /><OfficePeople floor="home" active={settled && floor === "home"} animate={animate} /></group><group ref={resources} dispose={null}><OfficeFloor layout={FLOORS.resources} /><OfficePeople floor="resources" active={settled && floor === "resources"} animate={animate} /></group></>;
}

function OfficeRender() {
  // Three filters lights by camera layers, not mesh layers. Two passes through
  // the SAME camera isolate scenery lighting/shadows from office contact detail.
  // Preserve depth between passes: real background geometry stays behind floors.
  useFrame(({ gl, scene, camera }) => {
    const layers = camera.layers.mask, autoClear = gl.autoClear;
    camera.layers.set(1);
    gl.render(scene, camera);
    const calls = gl.info.render.calls, triangles = gl.info.render.triangles;
    camera.layers.set(0);
    gl.autoClear = false;
    gl.render(scene, camera);
    gl.info.render.calls += calls;
    gl.info.render.triangles += triangles;
    camera.layers.mask = layers;
    gl.autoClear = autoClear;
  }, 1);
  return null;
}

export default function OfficeCanvas({ floor, progress, settled, animate, pageVisible, reducedMotion, viewReset }: { floor: FloorId; progress: RefObject<number>; settled: boolean; animate: boolean; pageVisible: boolean; reducedMotion: boolean; viewReset: number }) {
  const element = useRef<HTMLDivElement>(null);
  const motion = useRef<ViewMotion>({ revision: 0, busy: false, pointer: null });
  const markers = useRef<MarkerElements>({ ithaca: null, troy: null, delphi: null });
  const hits = useRef<MarkerElements>({ ithaca: null, troy: null, delphi: null });
  // DOM pins remount independently of the Canvas root. A paused scene may have
  // already projected the prior nodes, so new refs must request another frame.
  const projectionRevision = useRef(0);
  return <div ref={element} className="office-scene"><Canvas orthographic frameloop={pageVisible && (animate || !settled) ? "always" : "demand"} dpr={[1, 1.5]} shadows="variance" camera={{ position: [...CAMERA.position], near: 0.1, far: 150 }} gl={{ antialias: true, alpha: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.1 }} fallback={<OfficeFallback floor={floor} />} aria-label={`${FLOORS[floor].title}: isometric 3D floor with three marked tool desks`}>
    <OrthographicCamera makeDefault manual position={[...CAMERA.position]} near={0.1} far={800} layers-mask={3} />
    <OfficeViewControls element={element} motion={motion} reset={viewReset} settled={settled} reducedMotion={reducedMotion} pageVisible={pageVisible} />
    <fog attach="fog" args={["#cfe2f8", SURROUNDINGS.fogNear, SURROUNDINGS.fogFar]} />
    <ambientLight intensity={0.5} layers-mask={3} />
    <hemisphereLight args={["#eef4ff", "#b5c9e3", 1.25]} layers-mask={3} />
    <directionalLight name="office-daylight" position={[-9, 18, 7]} color="#fff3de" intensity={2.6} castShadow shadow-mapSize={[2048, 2048]} shadow-radius={5} shadow-blurSamples={8} shadow-camera-near={1} shadow-camera-far={60} shadow-camera-left={-18} shadow-camera-right={18} shadow-camera-top={18} shadow-camera-bottom={-18} shadow-normalBias={0.02} shadow-bias={-0.00015} />
    <directionalLight position={[10, 9, -12]} color="#d9e7ff" intensity={0.85} layers-mask={3} />
    <OfficeSurroundings progress={progress} />
    <FloorTravel progress={progress} floor={floor} settled={settled} animate={animate} />
    <MarkerProjection floor={floor} elements={markers} hits={hits} progress={progress} settled={settled} revision={projectionRevision} motion={motion} element={element} />
    <OfficeRender />
  </Canvas>
    {FLOORS[floor].pods.map(pod => <LocationMarker key={`${floor}-${pod.tool}`} tool={pod.tool} label={pod.label} active={settled} anchorRef={element => { markers.current[pod.tool] = element; if (element) { projectionRevision.current++; invalidate(); } }} hitRef={element => { hits.current[pod.tool] = element; if (element) { projectionRevision.current++; invalidate(); } }} />)}
  </div>;
}
