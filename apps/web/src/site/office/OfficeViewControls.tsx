import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrthographicCamera, Vector3 } from "three";
import { BUILDING, TALL_WALL_TOP } from "./layouts";
import type { FloorId } from "./layouts";
import { TOWER_SITE } from "./towerStructure";
import { applyCamera, CAMERA_OFFSET, captureCamera, fittedCamera, inspectionCamera, inspectionEase } from "./cameraFit";
import type { CameraPose } from "./towerMotion";
import { clampPan, clampZoom, officeZoomRange, panLimits, pinchAt, resistPan, VIEW, wheelPixels, zoomAt, type OfficeView, type ViewMotion, type ViewPoint } from "./officeView";

interface Fit { left: number; right: number; top: number; bottom: number; width: number; height: number }
interface ReturnMotion { from: OfficeView; to: OfficeView; began: number }
interface Drag { id: number; origin: ViewPoint; pan: ViewPoint; started: boolean }

export function OfficeViewControls({ element, motion, reset, instantReset, settled, reducedMotion, pageVisible, elevation = 0, floor, overview }: {
  element: RefObject<HTMLDivElement | null>; motion: RefObject<ViewMotion>; reset: number;
  instantReset: boolean; settled: boolean; reducedMotion: boolean; pageVisible: boolean;
  elevation?: number; floor: FloorId; overview: boolean;
}) {
  const { camera, size, invalidate } = useThree();
  const view = useRef<OfficeView>({ zoom: officeZoomRange(size.width, size.height).defaultZoom, pan: { x: 0, y: 0 } });
  const fit = useRef<Fit>({ left: -1, right: 1, top: 1, bottom: -1, width: 1, height: 1 });
  const returning = useRef<ReturnMotion | null>(null);
  const drag = useRef<Drag | null>(null);
  const touches = useRef(new Map<number, ViewPoint>());
  const pinch = useRef<{ distance: number; midpoint: ViewPoint; view: OfficeView } | null>(null);
  const zoomRange = useRef(officeZoomRange(size.width, size.height));
  const inspection = useRef<{ from: CameraPose; to: CameraPose; fromWide: number; toWide: number; began: number } | null>(null);
  const inspectionFit = useRef<CameraPose | null>(null);
  const lastOverview = useRef(overview);
  const options = useRef({ settled, reducedMotion, pageVisible, overview });
  useLayoutEffect(() => { options.current = { settled, reducedMotion, pageVisible, overview }; }, [settled, reducedMotion, pageVisible, overview]);
  const stopInput = useCallback(() => {
    const node = element.current;
    const ids = new Set(touches.current.keys());
    if (drag.current) ids.add(drag.current.id);
    drag.current = null; touches.current.clear(); pinch.current = null;
    for (const id of ids) if (node?.hasPointerCapture(id)) node.releasePointerCapture(id);
  }, [element]);

  useLayoutEffect(() => {
    // Measure with an independent camera: resizing must not disturb a running
    // inspection before its current pose has been captured.
    const cam = new OrthographicCamera();
    cam.position.set(CAMERA_OFFSET[0], CAMERA_OFFSET[1] + elevation, CAMERA_OFFSET[2]); cam.lookAt(0, elevation, 0); cam.updateMatrixWorld();
    const corners = [-1, 1].flatMap(x => [-BUILDING.slab, TALL_WALL_TOP].flatMap(y => [-1, 1].map(z => new Vector3(TOWER_SITE.x + x * (BUILDING.width + BUILDING.wallThickness) / 2, y + elevation, TOWER_SITE.z + z * (BUILDING.depth + BUILDING.wallThickness) / 2).applyMatrix4(cam.matrixWorldInverse))));
    const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
    const left = Math.min(...xs), right = Math.max(...xs), bottom = Math.min(...ys), top = Math.max(...ys);
    const aspect = size.width / Math.max(size.height, 1);
    // Settled controls must use the same responsive endpoint as floor travel.
    const pose = fittedCamera(floor, size.width, size.height);
    const range = officeZoomRange(size.width, size.height);
    const changedRange = range !== zoomRange.current;
    zoomRange.current = range;
    const height = pose.height * zoomRange.current.defaultZoom, cx = pose.centerX, cy = pose.centerY;
    fit.current = { left: cx - height * aspect / 2, right: cx + height * aspect / 2, top: cy + height / 2, bottom: cy - height / 2, width: (right - left) / (height * aspect) * size.width, height: (top - bottom) / height * size.height };
    // Keep a user's scale when phone browser chrome or orientation changes.
    view.current = { zoom: changedRange ? range.defaultZoom : clampZoom(view.current.zoom, range), pan: { x: 0, y: 0 } };
    returning.current = null;
    stopInput();
    motion.current.busy = false;
    invalidate();
  }, [camera, size.width, size.height, motion, invalidate, elevation, floor, stopInput]);

  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    const limits = (zoom = view.current.zoom) => panLimits(zoom, fit.current.width, fit.current.height, zoomRange.current);
    const point = (event: PointerEvent) => ({ x: event.clientX, y: event.clientY });
    const localPoint = (p: ViewPoint) => {
      const rect = node.getBoundingClientRect();
      return { x: p.x - rect.left - rect.width / 2, y: p.y - rect.top - rect.height / 2 };
    };
    const touchPair = () => {
      const [a, b] = [...touches.current.values()];
      return { distance: Math.max(1, Math.hypot(b.x - a.x, b.y - a.y)), midpoint: localPoint({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }) };
    };
    const beginPinch = () => {
      pinch.current = { ...touchPair(), view: { zoom: view.current.zoom, pan: { ...view.current.pan } } };
      drag.current = null; motion.current.busy = true;
    };
    const returnTo = (to: OfficeView) => {
      const same = Math.abs(to.zoom - view.current.zoom) < 0.001 && Math.hypot(to.pan.x - view.current.pan.x, to.pan.y - view.current.pan.y) < 0.1;
      if (options.current.reducedMotion || !options.current.pageVisible || same) {
        view.current = to; returning.current = null; motion.current.busy = false;
      } else {
        returning.current = { from: { zoom: view.current.zoom, pan: { ...view.current.pan } }, to, began: performance.now() };
        motion.current.busy = true;
      }
      invalidate();
    };
    const down = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(".office-tool-panel") || event.pointerType !== "touch" && target.closest(".office-location")) return;
      if (event.button !== 0 || (!event.isPrimary && event.pointerType !== "touch") || !options.current.settled || !options.current.pageVisible || options.current.overview || motion.current.inspecting) return;
      returning.current = null;
      motion.current.pointer = event.pointerType === "touch" ? null : point(event);
      if (event.pointerType === "touch") {
        touches.current.set(event.pointerId, point(event));
        // Keep single marker taps targeted at the button. Once a gesture starts,
        // capture both fingers on the scene so their release cannot click a desk.
        if (touches.current.size >= 2) {
          for (const id of touches.current.keys()) node.setPointerCapture(id);
          beginPinch(); event.preventDefault(); invalidate(); return;
        }
        if (!target.closest(".office-location")) node.setPointerCapture(event.pointerId);
      }
      drag.current = { id: event.pointerId, origin: point(event), pan: { ...view.current.pan }, started: false };
    };
    const move = (event: PointerEvent) => {
      motion.current.pointer = event.pointerType === "touch" ? null : point(event);
      if (event.pointerType === "touch" && touches.current.has(event.pointerId)) {
        touches.current.set(event.pointerId, point(event));
        if (pinch.current && touches.current.size >= 2) {
          const pair = touchPair(), start = pinch.current;
          const zoom = clampZoom(start.view.zoom * pair.distance / start.distance, zoomRange.current);
          view.current = pinchAt(start.view, zoom, start.midpoint, pair.midpoint, limits(zoom), zoomRange.current);
          motion.current.busy = true; event.preventDefault(); invalidate(); return;
        }
      }
      const active = drag.current;
      if (!active || active.id !== event.pointerId) return;
      const dx = event.clientX - active.origin.x, dy = event.clientY - active.origin.y;
      if (!active.started && Math.hypot(dx, dy) < VIEW.dragThreshold) return;
      if (!active.started) { active.started = true; node.setPointerCapture(event.pointerId); }
      motion.current.busy = true;
      view.current.pan = resistPan({ x: active.pan.x + dx, y: active.pan.y + dy }, limits());
      event.preventDefault(); invalidate();
    };
    const up = (event: PointerEvent) => {
      if (touches.current.delete(event.pointerId)) {
        const manipulated = Boolean(pinch.current || drag.current?.started);
        drag.current = null; pinch.current = null;
        if (node.hasPointerCapture(event.pointerId)) node.releasePointerCapture(event.pointerId);
        if (touches.current.size >= 2) beginPinch();
        else if (touches.current.size === 1) {
          const [id, origin] = [...touches.current][0];
          drag.current = { id, origin, pan: { ...view.current.pan }, started: manipulated };
        } else {
          motion.current.pointer = null;
          returnTo({ zoom: view.current.zoom, pan: clampPan(view.current.pan, limits()) });
        }
        invalidate(); return;
      }
      if (drag.current?.id !== event.pointerId) return;
      const started = drag.current.started;
      stopInput();
      const legal = clampPan(view.current.pan, limits());
      if (started || legal.x !== view.current.pan.x || legal.y !== view.current.pan.y) returnTo({ zoom: view.current.zoom, pan: legal });
      else { motion.current.busy = false; invalidate(); }
    };
    const lost = (event: PointerEvent) => {
      if (event.type === "lostpointercapture" && node.hasPointerCapture(event.pointerId)) return;
      if (!touches.current.has(event.pointerId) && drag.current?.id !== event.pointerId) return;
      stopInput(); motion.current.pointer = null;
      returnTo({ zoom: view.current.zoom, pan: clampPan(view.current.pan, limits()) });
    };
    const wheel = (event: WheelEvent) => {
      if ((event.target as HTMLElement).closest(".office-tool-panel")) return;
      if (event.ctrlKey || event.metaKey || !options.current.settled || !options.current.pageVisible || options.current.overview || motion.current.inspecting) return;
      event.preventDefault(); stopInput(); returning.current = null; motion.current.busy = false;
      motion.current.pointer = { x: event.clientX, y: event.clientY };
      const rect = node.getBoundingClientRect();
      const cursor = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      const zoom = clampZoom(view.current.zoom * Math.exp(-wheelPixels(event.deltaY, event.deltaMode, rect.height) * VIEW.wheelSensitivity), zoomRange.current);
      view.current = zoomAt(view.current, zoom, cursor, limits(zoom), zoomRange.current);
      invalidate();
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== node.parentElement || event.ctrlKey || event.metaKey || event.altKey || !options.current.settled || options.current.overview || motion.current.inspecting) return;
      if (!["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); stopInput(); returning.current = null; motion.current.busy = false;
      if (event.key === "0") returnTo({ zoom: zoomRange.current.defaultZoom, pan: { x: 0, y: 0 } });
      else if (["+", "=", "-"].includes(event.key)) {
        const zoom = clampZoom(view.current.zoom * (event.key === "-" ? 1 / 1.15 : 1.15), zoomRange.current);
        view.current = zoomAt(view.current, zoom, { x: 0, y: 0 }, limits(zoom), zoomRange.current);
      } else {
        const pan = { ...view.current.pan };
        if (event.key === "ArrowLeft") pan.x += 48;
        if (event.key === "ArrowRight") pan.x -= 48;
        if (event.key === "ArrowUp") pan.y += 48;
        if (event.key === "ArrowDown") pan.y -= 48;
        view.current.pan = clampPan(pan, limits());
      }
      invalidate();
    };
    const focus = (event: FocusEvent) => {
      const target = event.target as HTMLElement;
      if (!target.matches(".office-location:focus-visible") || !options.current.settled || options.current.overview || motion.current.inspecting) return;
      const rect = target.getBoundingClientRect(), stage = node.getBoundingClientRect();
      const header = document.querySelector(".office-header")?.getBoundingClientRect();
      const top = Math.max(stage.top + 24, (header?.bottom ?? 0) + 12), bottom = stage.bottom - 64;
      const dx = rect.left < stage.left + 24 ? stage.left + 24 - rect.left : rect.right > stage.right - 150 ? stage.right - 150 - rect.right : 0;
      const dy = rect.top < top ? top - rect.top : rect.bottom > bottom ? bottom - rect.bottom : 0;
      if (dx || dy) { returning.current = null; view.current.pan = clampPan({ x: view.current.pan.x + dx, y: view.current.pan.y + dy }, limits()); invalidate(); }
    };
    node.addEventListener("pointerdown", down, true); node.addEventListener("pointermove", move, true);
    node.addEventListener("pointerup", up, true); node.addEventListener("pointercancel", lost, true);
    node.addEventListener("lostpointercapture", lost); node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("focusin", focus); node.parentElement?.addEventListener("keydown", key);
    return () => {
      stopInput();
      node.removeEventListener("pointerdown", down, true); node.removeEventListener("pointermove", move, true);
      node.removeEventListener("pointerup", up, true); node.removeEventListener("pointercancel", lost, true);
      node.removeEventListener("lostpointercapture", lost); node.removeEventListener("wheel", wheel);
      node.removeEventListener("focusin", focus); node.parentElement?.removeEventListener("keydown", key);
    };
  }, [element, motion, invalidate, stopInput]);

  useLayoutEffect(() => {
    stopInput();
    const to = { zoom: zoomRange.current.defaultZoom, pan: { x: 0, y: 0 } };
    const same = view.current.zoom === to.zoom && view.current.pan.x === 0 && view.current.pan.y === 0;
    if (instantReset || options.current.reducedMotion || !options.current.pageVisible || same) { view.current = to; returning.current = null; motion.current.busy = false; }
    else { returning.current = { from: { zoom: view.current.zoom, pan: { ...view.current.pan } }, to, began: performance.now() }; motion.current.busy = true; }
    invalidate();
  }, [reset, instantReset, motion, invalidate, stopInput]);

  useLayoutEffect(() => {
    if (settled) return;
    stopInput(); returning.current = null; motion.current.busy = false;
    invalidate();
  }, [settled, motion, invalidate, stopInput]);

  useLayoutEffect(() => {
    if (!pageVisible || reducedMotion) {
      stopInput();
      view.current.pan = clampPan(view.current.pan, panLimits(view.current.zoom, fit.current.width, fit.current.height, zoomRange.current));
      returning.current = null; motion.current.busy = false;
    }
    if (pageVisible) invalidate();
  }, [pageVisible, reducedMotion, motion, invalidate, stopInput]);

  useLayoutEffect(() => {
    const cam = camera as OrthographicCamera, toWide = Number(overview);
    const to = fittedCamera(floor, size.width, size.height, overview);
    inspectionFit.current = to;
    const changed = lastOverview.current !== overview;
    lastOverview.current = overview;
    if (changed || inspection.current) {
      const from = captureCamera(cam, motion.current.cameraTargetY ?? elevation);
      const fromWide = motion.current.inspectionWide ?? 0;
      inspection.current = reducedMotion || !pageVisible ? null : { from, to, fromWide, toWide, began: performance.now() };
      stopInput(); returning.current = null; view.current = { zoom: zoomRange.current.defaultZoom, pan: { x: 0, y: 0 } };
      motion.current.inspectionWide = inspection.current ? fromWide : toWide;
      motion.current.inspecting = Boolean(inspection.current);
      motion.current.busy = overview || Boolean(inspection.current);
      if (!inspection.current) { applyCamera(cam, to, size.width / size.height); motion.current.cameraTargetY = to.targetY; }
    } else {
      motion.current.inspectionWide = toWide;
      motion.current.cameraTargetY = elevation;
    }
    element.current?.setAttribute("data-inspecting", String(Boolean(inspection.current)));
    invalidate();
  }, [overview, floor, size.width, size.height, reducedMotion, pageVisible, camera, elevation, element, motion, invalidate, stopInput]);

  useLayoutEffect(() => () => {
    motion.current.inspecting = false; motion.current.busy = false;
    delete motion.current.inspectionWide; delete motion.current.cameraTargetY;
    element.current?.removeAttribute("data-inspecting");
  }, [element, motion]);

  useFrame(() => {
    const node = element.current;
    if (!node) return;
    const cam = camera as OrthographicCamera, inspecting = inspection.current;
    if (inspecting) {
      const progress = Math.min(1, (performance.now() - inspecting.began) / 720);
      const pose = inspectionCamera(inspecting.from, inspecting.to, progress);
      const wide = inspecting.fromWide + (inspecting.toWide - inspecting.fromWide) * inspectionEase(progress);
      applyCamera(cam, pose, size.width / size.height);
      motion.current.inspectionWide = wide; motion.current.cameraTargetY = pose.targetY;
      motion.current.revision++;
      node.dataset.inspectionProgress = String(wide); node.dataset.cameraHeight = String(pose.height);
      if (progress < 1) { invalidate(); return; }
      inspection.current = null; motion.current.inspecting = false; motion.current.busy = overview;
      node.dataset.inspecting = "false";
    }
    if (overview) {
      const pose = inspectionFit.current!;
      applyCamera(cam, pose, size.width / size.height);
      motion.current.inspectionWide = 1; motion.current.cameraTargetY = pose.targetY;
      node.dataset.inspectionProgress = "1"; node.dataset.cameraHeight = String(pose.height);
      return;
    }
    motion.current.inspectionWide = 0; motion.current.cameraTargetY = elevation;
    node.dataset.inspectionProgress = "0";
    if (cam.position.y !== CAMERA_OFFSET[1] + elevation) {
      cam.position.set(CAMERA_OFFSET[0], CAMERA_OFFSET[1] + elevation, CAMERA_OFFSET[2]); cam.lookAt(0, elevation, 0); cam.updateMatrixWorld();
    }
    const bounce = returning.current;
    if (bounce) {
      const t = (performance.now() - bounce.began) / 1000;
      const decay = (1 + 20 * t) * Math.exp(-20 * t);
      view.current = { zoom: bounce.to.zoom + (bounce.from.zoom - bounce.to.zoom) * decay, pan: { x: bounce.to.pan.x + (bounce.from.pan.x - bounce.to.pan.x) * decay, y: bounce.to.pan.y + (bounce.from.pan.y - bounce.to.pan.y) * decay } };
      if (t > 0.55) { view.current = bounce.to; returning.current = null; motion.current.busy = false; }
      else invalidate();
    }
    const base = fit.current, current = view.current;
    const dx = current.pan.x / Math.max(size.width, 1) * (base.right - base.left) / current.zoom;
    const dy = current.pan.y / Math.max(size.height, 1) * (base.top - base.bottom) / current.zoom;
    if (cam.left !== base.left - dx || cam.top !== base.top + dy || cam.zoom !== current.zoom || cam.right !== base.right - dx) {
      cam.left = base.left - dx; cam.right = base.right - dx; cam.top = base.top + dy; cam.bottom = base.bottom + dy; cam.zoom = current.zoom;
      cam.updateProjectionMatrix(); motion.current.revision++;
    }
    const limits = panLimits(current.zoom, base.width, base.height, zoomRange.current);
    node.dataset.zoom = String(current.zoom);
    node.dataset.cameraHeight = String((cam.top - cam.bottom) / cam.zoom);
    node.dataset.panX = String(current.pan.x); node.dataset.panY = String(current.pan.y);
    node.dataset.panLimitX = String(limits.x); node.dataset.panLimitY = String(limits.y);
    node.dataset.dragging = String(Boolean(drag.current?.started)); node.dataset.viewBusy = String(motion.current.busy);
  }, -2);
  return null;
}
