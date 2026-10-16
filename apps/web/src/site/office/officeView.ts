export interface ViewPoint { x: number; y: number }
export interface OfficeView { zoom: number; pan: ViewPoint }
export const VIEW = Object.freeze({ minZoom: 1, maxZoom: 2, dragThreshold: 5, maxStretch: 48, wheelSensitivity: 0.0015 });
export interface ZoomRange { minZoom: number; maxZoom: number; defaultZoom: number }
const desktopZoom = Object.freeze({ minZoom: 1, maxZoom: 2, defaultZoom: 1 });
const phoneZoom = Object.freeze({ minZoom: 1, maxZoom: 4, defaultZoom: 2 });
export function officeZoomRange(width: number, height: number): ZoomRange {
  return (width <= 700 && height > width) || (width <= 950 && height <= 500 && width > height) ? phoneZoom : desktopZoom;
}
type ZoomLimits = Pick<ZoomRange, "minZoom" | "maxZoom">;
export const clampZoom = (zoom: number, range: ZoomLimits = VIEW) => Math.max(range.minZoom, Math.min(range.maxZoom, zoom));

// Preserve base-fit margins at either extreme. At 1× there is exactly one
// legal resting view, independent of viewport shape.
export function panLimits(zoom: number, projectedWidth: number, projectedHeight: number, range: ZoomLimits = VIEW): ViewPoint {
  const extra = clampZoom(zoom, range) - 1;
  return { x: projectedWidth / 2 * extra, y: projectedHeight / 2 * extra };
}
export function clampPan(pan: ViewPoint, limits: ViewPoint): ViewPoint {
  return { x: Math.max(-limits.x, Math.min(limits.x, pan.x)) || 0, y: Math.max(-limits.y, Math.min(limits.y, pan.y)) || 0 };
}
export function resistPan(pan: ViewPoint, limits: ViewPoint): ViewPoint {
  const clamped = clampPan(pan, limits);
  const resist = (value: number, edge: number) => edge + Math.sign(value - edge) * VIEW.maxStretch * (1 - Math.exp(-Math.abs(value - edge) / (VIEW.maxStretch * 3)));
  return { x: resist(pan.x, clamped.x), y: resist(pan.y, clamped.y) };
}
export function zoomAt(view: OfficeView, zoom: number, cursor: ViewPoint, limits: ViewPoint, range: ZoomLimits = VIEW): OfficeView {
  return pinchAt(view, zoom, cursor, cursor, limits, range);
}
export function pinchAt(view: OfficeView, zoom: number, from: ViewPoint, to: ViewPoint, limits: ViewPoint, range: ZoomLimits = VIEW): OfficeView {
  const next = clampZoom(zoom, range), ratio = next / view.zoom;
  return { zoom: next, pan: clampPan({ x: to.x - (from.x - view.pan.x) * ratio, y: to.y - (from.y - view.pan.y) * ratio }, limits) };
}
export function wheelPixels(delta: number, mode: number, viewportHeight: number) {
  return delta * (mode === 1 ? 16 : mode === 2 ? viewportHeight : 1);
}
export interface ViewMotion {
  revision: number; busy: boolean; pointer: ViewPoint | null;
  inspecting?: boolean; inspectionWide?: number; cameraTargetY?: number;
}
