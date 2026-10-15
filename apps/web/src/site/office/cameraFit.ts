import { OrthographicCamera, Vector3 } from "three";
import { BUILDING, CAMERA, TALL_WALL_TOP } from "./layouts";
import { GROUND_Y, towerPose, type PreviewView } from "./towerStructure";
import type { CameraPose } from "./towerMotion";

// Same isometric basis for every scale. Orthographic distance changes no size.
export const CAMERA_OFFSET = [112, 96, 112] as const;
export function fittedCamera(view: PreviewView, width: number, height: number, overview = false): CameraPose {
  const wide = view === "city" || overview, city = view === "city", pose = towerPose(view);
  const targetY = wide ? (GROUND_Y + pose.top) / 2 : pose.floorY;
  const camera = new OrthographicCamera();
  camera.position.set(CAMERA_OFFSET[0], targetY + CAMERA_OFFSET[1], CAMERA_OFFSET[2]); camera.lookAt(0, targetY, 0); camera.updateMatrixWorld();
  const xs = wide ? city ? [-38, 40] : [-11, 11] : [-TOWER_HALF, TOWER_HALF];
  const zs = wide ? city ? [-18, 40] : [-11, 11] : [-TOWER_HALF, TOWER_HALF];
  const ys = wide ? [GROUND_Y, pose.top] : [pose.floorY - BUILDING.slab, pose.floorY + TALL_WALL_TOP];
  const points = xs.flatMap(x => ys.flatMap(y => zs.map(z => new Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse))));
  const left = Math.min(...points.map(p => p.x)), right = Math.max(...points.map(p => p.x));
  const bottom = Math.min(...points.map(p => p.y)), top = Math.max(...points.map(p => p.y));
  const aspect = width / Math.max(1, height);
  const fittedHeight = wide ? Math.max((top - bottom) * (city ? 1.12 : 1.4), (right - left) / aspect * (city ? 1.5 : 1.2)) : Math.max(top - bottom, (right - left) / aspect) * CAMERA.padding;
  // Reframe the district without moving the tower's physical footprint or
  // changing either office endpoint. Positive camera offsets shift the scene
  // left/down respectively, so lower centerY to raise the city on the page.
  const heightInView = fittedHeight * (city ? 0.9 : 1);
  const towerTop = city ? Math.max(...[-1, 1].flatMap(x => [-1, 1].map(z =>
    new Vector3(x * TOWER_HALF, pose.top, z * TOWER_HALF).applyMatrix4(camera.matrixWorldInverse).y))) : top;
  return { targetY, centerX: (left + right) / 2 - (city ? heightInView * aspect * 0.16 : 0),
    centerY: city ? towerTop - heightInView * 0.44 : (bottom + top) / 2, height: heightInView };
}
const TOWER_HALF = (BUILDING.width + BUILDING.wallThickness) / 2;

export function applyCamera(camera: OrthographicCamera, pose: CameraPose, aspect: number) {
  camera.position.set(CAMERA_OFFSET[0], pose.targetY + CAMERA_OFFSET[1], CAMERA_OFFSET[2]); camera.lookAt(0, pose.targetY, 0);
  camera.left = pose.centerX - pose.height * aspect / 2; camera.right = pose.centerX + pose.height * aspect / 2;
  camera.top = pose.centerY + pose.height / 2; camera.bottom = pose.centerY - pose.height / 2; camera.zoom = 1;
  camera.updateProjectionMatrix(); camera.updateMatrixWorld();
}
export function captureCamera(camera: OrthographicCamera, targetY: number): CameraPose {
  return { targetY, centerX: (camera.left + camera.right) / 2, centerY: (camera.top + camera.bottom) / 2, height: (camera.top - camera.bottom) / camera.zoom };
}
