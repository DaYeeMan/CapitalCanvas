import { levelY, TOWER, type PreviewView } from "./towerStructure";

export interface CameraPose { targetY: number; centerX: number; centerY: number; height: number }
export interface TowerFrame {
  homeLift: number; resourcesLift: number; middle: number; cap: number;
  homeFacade: number; resourcesFacade: number; city: number; camera: CameraPose;
}
export interface MotionStep { phase: string; duration: number; to: TowerFrame }
export interface TowerJourney { from: TowerFrame; steps: MotionStep[]; duration: number }
export type CameraFits = Record<PreviewView, CameraPose>;
const keys = ["homeLift", "resourcesLift", "middle", "cap", "homeFacade", "resourcesFacade", "city"] as const;
const cameraKeys = ["targetY", "centerX", "centerY", "height"] as const;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function frameForView(view: PreviewView, camera: CameraPose): TowerFrame {
  return { homeLift: view === "home" ? TOWER.sliceLift : 0, resourcesLift: view === "resources" ? TOWER.sliceLift : 0,
    middle: view === "resources" ? TOWER.upperLift : 0, cap: view !== "city" ? TOWER.upperLift : 0,
    homeFacade: view === "home" ? TOWER.upperLift : 0, resourcesFacade: view === "resources" ? TOWER.upperLift : 0,
    city: view === "city" ? 1 : 0, camera: { ...camera } };
}
export function mixFrame(a: TowerFrame, b: TowerFrame, t: number): TowerFrame {
  const result = { ...a, camera: { ...a.camera } };
  for (const key of keys) result[key] = mix(a[key], b[key], t);
  for (const key of cameraKeys) result.camera[key] = mix(a.camera[key], b.camera[key], t);
  return result;
}

function initialOpening(view: Exclude<PreviewView, "city">, camera: CameraPose): TowerFrame {
  // The first reveal is deliberately compact. The slice finishes its lift here;
  // only the upper assembly continues toward full clearance during the zoom.
  const upper = TOWER.sliceLift * 2;
  return { ...frameForView(view, camera), cap: upper, middle: view === "resources" ? upper : 0,
    homeFacade: view === "home" ? upper : 0, resourcesFacade: view === "resources" ? upper : 0 };
}

// Every retarget begins at the actual sampled pose, including office pan/zoom.
// The fixed base and district have no animated offsets in this model.
export function planJourney(from: TowerFrame, origin: PreviewView, destination: PreviewView, fits: CameraFits): TowerJourney {
  const steps: MotionStep[] = [];
  const add = (phase: string, duration: number, to: TowerFrame) => steps.push({ phase, duration, to });
  const target = frameForView(destination, fits[destination]);
  if (destination === "city") {
    const seated = { ...from, homeLift: 0, resourcesLift: 0, camera: { ...from.camera, height: from.camera.height * 1.18 } };
    add("reseating-floor", 0.3, seated);
    add("reassembling-tower", origin === "resources" || from.middle > 1 ? 1.3 : 0.9, { ...target, city: 0.92, camera: mixFrame(seated, target, 0.94).camera });
    add("returning-city", 0.6, target);
  } else if (from.city > 0.98 && from.cap < 0.01 && from.middle < 0.01) {
    const split = { ...initialOpening(destination, from.camera), city: 1 };
    add(`opening-${destination}`, 1.05, split);
    add(`entering-${destination}`, 1.55, target);
  } else {
    const destinationY = levelY(destination === "home" ? TOWER.homeLevel : TOWER.resourcesLevel);
    const direction = destinationY >= from.camera.targetY ? 1 : -1;
    const departureCamera = { ...from.camera, height: from.camera.height * 1.08 };
    const closed = { ...frameForView("city", departureCamera), city: 0 };
    // Reseat the slice and close its upper assembly together, with a small
    // camera pullback. Vertical travel begins only after closure is complete.
    add("closing-floor", 0.75, closed);
    const facadeCamera = { ...fits[destination], targetY: destinationY, height: fits[destination].height * 1.08 };
    add(direction < 0 ? "descending-facade" : "ascending-facade", 0.9, { ...closed, camera: facadeCamera });
    add(`opening-${destination}`, 0.7, initialOpening(destination, facadeCamera));
    add(`arriving-${destination}`, 0.45, target);
  }
  return { from, steps, duration: steps.reduce((sum, step) => sum + step.duration, 0) };
}

export function sampleJourney(journey: TowerJourney, elapsed: number) {
  let previous = journey.from, time = Math.max(0, elapsed);
  for (const step of journey.steps) {
    if (time < step.duration) return { frame: mixFrame(previous, step.to, ease(time / step.duration)), phase: step.phase, complete: false };
    time -= step.duration; previous = step.to;
  }
  return { frame: previous, phase: "idle", complete: true };
}

// Resize preserves the remaining choreography and time, rather than restarting
// a journey. Camera endpoints adapt to the new viewport; geometry endpoints do not.
export function resizeJourney(journey: TowerJourney, elapsed: number, frame: TowerFrame, oldFits: CameraFits, fits: CameraFits): TowerJourney {
  let consumed = elapsed;
  const steps = journey.steps.flatMap(step => {
    if (consumed >= step.duration) { consumed -= step.duration; return []; }
    const duration = step.duration - Math.max(0, consumed); consumed = 0;
    const ratio = fits.home.height / oldFits.home.height * (1 - step.to.city) + fits.city.height / oldFits.city.height * step.to.city;
    return [{ ...step, duration, to: { ...step.to, camera: { ...step.to.camera, height: step.to.camera.height * ratio, centerX: step.to.camera.centerX * fits.city.centerX / oldFits.city.centerX } } }];
  });
  return { from: frame, steps, duration: steps.reduce((sum, step) => sum + step.duration, 0) };
}
