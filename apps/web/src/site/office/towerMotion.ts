import { levelY, TOWER, type PreviewView } from "./towerStructure";

export interface CameraPose { targetY: number; centerX: number; centerY: number; height: number }
export interface TowerFrame {
  homeLift: number; resourcesLift: number; middle: number; cap: number;
  homeFacade: number; resourcesFacade: number; city: number; cityCopy: number; camera: CameraPose;
}
export interface MotionStep { phase: string; duration: number; to: TowerFrame }
export interface TowerJourney { from: TowerFrame; steps: MotionStep[]; duration: number }
export type CameraFits = Record<PreviewView, CameraPose>;
const keys = ["homeLift", "resourcesLift", "middle", "cap", "homeFacade", "resourcesFacade", "city", "cityCopy"] as const;
const OPENING_DURATION = 1.05, APPROACH_DURATION = 1.55;
const cameraKeys = ["targetY", "centerX", "centerY", "height"] as const;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function frameForView(view: PreviewView, camera: CameraPose): TowerFrame {
  return { homeLift: view === "home" ? TOWER.sliceLift : 0, resourcesLift: view === "resources" ? TOWER.sliceLift : 0,
    middle: view === "resources" ? TOWER.upperLift : 0, cap: view !== "city" ? TOWER.upperLift : 0,
    homeFacade: view === "home" ? TOWER.upperLift : 0, resourcesFacade: view === "resources" ? TOWER.upperLift : 0,
    city: view === "city" ? 1 : 0, cityCopy: view === "city" ? 1 : 0, camera: { ...camera } };
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
export function planJourney(from: TowerFrame, _origin: PreviewView, destination: PreviewView, fits: CameraFits): TowerJourney {
  const steps: MotionStep[] = [];
  const add = (phase: string, duration: number, to: TowerFrame) => steps.push({ phase, duration, to });
  const target = frameForView(destination, fits[destination]);
  if (destination === "city") {
    // Reverse entry's structural order: hold the exposed slice while its upper
    // assembly returns to the compact split, then close every gap together.
    // Clamp to the actual pose so an interrupted opening never reopens a slice.
    const upper = Math.min(from.cap, TOWER.sliceLift * 2);
    const compactHeight = Math.min(target.camera.height, Math.max(from.camera.height, target.camera.height * 0.9));
    const compact = { ...from, cap: upper, middle: Math.min(from.middle, upper),
      homeFacade: Math.min(from.homeFacade, upper), resourcesFacade: Math.min(from.resourcesFacade, upper),
      city: 0.9, cityCopy: 0, camera: { ...target.camera, height: compactHeight } };
    // An entry reversed before its zoom already has the compact city framing.
    // Close it directly instead of adding an inward zoom or a motionless wait.
    if (from.cap > upper + 0.0001 || from.middle > upper + 0.0001 || from.camera.height < compactHeight - 0.0001) {
      add("withdrawing-office", APPROACH_DURATION, compact);
    }
    // The last 10% of the pullback closes the slices and reveals the landing
    // copy on the same sampled clock, with no extra settle or CSS delay.
    add("returning-city", OPENING_DURATION, target);
  } else if (from.city > 0.98 && from.cap < 0.01 && from.middle < 0.01) {
    const split = { ...initialOpening(destination, from.camera), city: 1 };
    add(`opening-${destination}`, OPENING_DURATION, split);
    add(`entering-${destination}`, APPROACH_DURATION, target);
  } else {
    const destinationY = levelY(destination === "home" ? TOWER.homeLevel : TOWER.resourcesLevel);
    const direction = destinationY >= from.camera.targetY ? 1 : -1;
    const departureCamera = { ...from.camera, height: from.camera.height * 1.08 };
    const closed = { ...frameForView("city", departureCamera), city: 0, cityCopy: 0 };
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
