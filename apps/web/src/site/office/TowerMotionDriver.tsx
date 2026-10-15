import { useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Color, type DirectionalLight, type Group, type Mesh, type Object3D, type OrthographicCamera } from "three";
import { applyCamera, captureCamera, fittedCamera } from "./cameraFit";
import { frameForView, planJourney, sampleJourney, resizeJourney, type CameraFits, type TowerFrame, type TowerJourney } from "./towerMotion";
import { levelY, TOWER, type PreviewView } from "./towerStructure";
import type { TowerGroups } from "./TowerAssembly";
import type { ViewMotion } from "./officeView";
import type { NavigationPhase } from "./useOfficeNavigation";
import type { PeopleSession } from "./peopleSimulation";

export interface MotionRuntime { frame: TowerFrame | null; complete: boolean }
export type OfficeGroups = Record<"home" | "resources", Group | null>;
const sky = new Color("#cfe4ff"), cream = new Color("#f5f4f0");

export function TowerMotionDriver({ view, origin, phase, reset, overview, reducedMotion, pageVisible, runtime, towers, offices, district, light, fill, lightTarget, element, motion, session }: {
  view: PreviewView; origin: PreviewView; phase: NavigationPhase; reset: number; overview: boolean; reducedMotion: boolean; pageVisible: boolean;
  runtime: RefObject<MotionRuntime>; towers: RefObject<TowerGroups>; offices: RefObject<OfficeGroups>; district: RefObject<Group | null>;
  light: RefObject<DirectionalLight | null>; fill: RefObject<DirectionalLight | null>; lightTarget: Object3D; element: RefObject<HTMLDivElement | null>; motion: RefObject<ViewMotion>; session: PeopleSession;
}) {
  const { camera, size, invalidate, scene } = useThree();
  const journey = useRef<TowerJourney | null>(null), began = useRef<number | null>(null);
  const command = useRef(-1), lastPhase = useRef<NavigationPhase | null>(null), previousFits = useRef<CameraFits | null>(null);
  const pointer = useRef({ x: 0, y: 0 }), parallax = useRef({ x: 0, y: 0 });
  const shadowState = useRef(new WeakMap<Group, boolean>());
  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    const move = (event: PointerEvent) => {
      const rect = node.getBoundingClientRect();
      pointer.current = { x: (event.clientX - rect.left) / rect.width - 0.5, y: (event.clientY - rect.top) / rect.height - 0.5 }; invalidate();
    };
    const leave = () => { pointer.current = { x: 0, y: 0 }; invalidate(); };
    node.addEventListener("pointermove", move); node.addEventListener("pointerleave", leave);
    return () => { node.removeEventListener("pointermove", move); node.removeEventListener("pointerleave", leave); };
  }, [element, invalidate]);

  useLayoutEffect(() => {
    const fits: CameraFits = { city: fittedCamera("city", size.width, size.height), home: fittedCamera("home", size.width, size.height), resources: fittedCamera("resources", size.width, size.height) };
    const cam = camera as OrthographicCamera;
    if (!runtime.current.frame) {
      runtime.current.frame = frameForView(origin, fits[origin]); applyCamera(cam, fits[origin], size.width / size.height);
    }
    if (phase === "moving") {
      const frame = { ...runtime.current.frame, camera: captureCamera(cam, runtime.current.frame.camera.targetY) };
      pointer.current = { x: 0, y: 0 }; parallax.current = { x: 0, y: 0 };
      if (command.current === reset && lastPhase.current === "moving" && journey.current && previousFits.current) {
        journey.current = resizeJourney(journey.current, began.current === null ? 0 : (performance.now() - began.current) / 1000, frame, previousFits.current, fits);
      } else journey.current = planJourney(frame, origin, view, fits);
      began.current = null; runtime.current.complete = false;
    } else {
      journey.current = null; began.current = null;
      const fit = overview ? fittedCamera(view, size.width, size.height, true) : fits[view];
      runtime.current.frame = frameForView(view, fit); runtime.current.complete = true;
      if (phase !== "idle" || view === "city" || overview) applyCamera(cam, fit, size.width / size.height);
    }
    command.current = reset; lastPhase.current = phase; previousFits.current = fits;
    invalidate();
  }, [view, origin, phase, reset, overview, camera, size.width, size.height, runtime, invalidate]);

  useFrame(() => {
    let frame = runtime.current.frame;
    if (!frame) return;
    let label: string = phase;
    if (phase === "moving" && journey.current && pageVisible && session.ready) {
      began.current ??= performance.now();
      const sampled = sampleJourney(journey.current, (performance.now() - began.current) / 1000);
      frame = sampled.frame; label = sampled.phase;
      runtime.current.frame = frame; runtime.current.complete = sampled.complete;
      applyCamera(camera as OrthographicCamera, frame.camera, size.width / size.height);
      invalidate();
    } else if (phase === "idle" && view === "city" && pageVisible) {
      const target = reducedMotion ? { x: 0, y: 0 } : pointer.current;
      if (reducedMotion) parallax.current = target;
      else { parallax.current.x += (target.x - parallax.current.x) * 0.12; parallax.current.y += (target.y - parallax.current.y) * 0.12; }
      const fit = previousFits.current!.city;
      frame = { ...frame, camera: { ...fit, centerX: fit.centerX - parallax.current.x * 1.5, centerY: fit.centerY + parallax.current.y * 0.8 } };
      runtime.current.frame = frame; applyCamera(camera as OrthographicCamera, frame.camera, size.width / size.height);
      if (Math.abs(target.x - parallax.current.x) + Math.abs(target.y - parallax.current.y) > 0.001) invalidate();
    }
    const yHome = levelY(TOWER.homeLevel), yResources = levelY(TOWER.resourcesLevel);
    const positions = { middle: levelY(TOWER.resourcesLevel + 1) + frame.middle, cap: levelY(TOWER.homeLevel + 1) + frame.cap,
      homeFacade: yHome + frame.middle + frame.homeFacade, resourcesFacade: yResources + frame.resourcesFacade };
    for (const key of ["middle", "cap", "homeFacade", "resourcesFacade"] as const) {
      const group = towers.current[key];
      if (!group) continue;
      group.position.y = positions[key];
      const offset = key === "homeFacade" ? frame.middle + frame.homeFacade : key === "resourcesFacade" ? frame.resourcesFacade : frame[key];
      const shadows = offset < 0.01;
      if (shadowState.current.get(group) !== shadows) {
        group.traverse(object => { const mesh = object as Mesh; if (mesh.isMesh) { mesh.castShadow = shadows; mesh.receiveShadow = shadows; } });
        shadowState.current.set(group, shadows);
      }
    }
    if (offices.current.home) { offices.current.home.position.y = yHome + frame.middle + frame.homeLift; offices.current.home.visible = frame.homeFacade > 0.01; }
    if (offices.current.resources) { offices.current.resources.position.y = yResources + frame.resourcesLift; offices.current.resources.visible = frame.resourcesFacade > 0.01; }
    if (district.current) district.current.visible = frame.city > 0.005 || overview;
    (scene.background as Color).copy(sky).lerp(cream, frame.city);
    if (scene.fog) scene.fog.color.copy(scene.background as Color);
    if (light.current) {
      const wide = overview ? 1 : frame.city, elevation = frame.camera.targetY;
      lightTarget.position.y = elevation;
      fill.current?.position.set(10, elevation + 9, -12);
      light.current.position.set(-9 - 51 * wide, elevation + 18 + 67 * wide, 7 + 33 * wide);
      const coverage = 18 + 52 * wide, shadow = light.current.shadow.camera;
      shadow.left = shadow.bottom = -coverage; shadow.right = shadow.top = coverage; shadow.far = 60 + 160 * wide;
      shadow.updateProjectionMatrix();
    }
    const node = element.current, root = node?.closest<HTMLElement>(".office-preview");
    if (root) {
      if (root.style.getPropertyValue("--city-presence") !== String(frame.city)) root.style.setProperty("--city-presence", String(frame.city));
      root.dataset.motionPhase = label;
      const navigation = root.querySelector<HTMLElement>(".office-header nav"), hidden = frame.city > 0.9;
      if (navigation && navigation.inert !== hidden) { navigation.inert = hidden; navigation.setAttribute("aria-hidden", String(hidden)); }
    }
    if (node) {
      node.dataset.cameraY = frame.camera.targetY.toFixed(3); node.dataset.homeLift = frame.homeLift.toFixed(3); node.dataset.resourcesLift = frame.resourcesLift.toFixed(3); node.dataset.upperLift = frame.cap.toFixed(3);
      node.dataset.middleLift = frame.middle.toFixed(3); node.dataset.homeY = (yHome + frame.middle + frame.homeLift).toFixed(3); node.dataset.resourcesY = (yResources + frame.resourcesLift).toFixed(3);
    }
    if (phase !== "idle" || view === "city" || overview) motion.current.revision++;
  }, -3);
  return null;
}
