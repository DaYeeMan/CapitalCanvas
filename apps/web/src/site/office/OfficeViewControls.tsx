import { useLayoutEffect, useRef, type RefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, type OrthographicCamera } from "three";
import { BUILDING, CAMERA, TALL_WALL_TOP } from "./layouts";
import { clampPan, clampZoom, panLimits, resistPan, VIEW, wheelPixels, zoomAt, type OfficeView, type ViewMotion, type ViewPoint } from "./officeView";

interface Fit { left: number; right: number; top: number; bottom: number; width: number; height: number }
interface ReturnMotion { from: OfficeView; to: OfficeView; began: number }
interface Drag { id: number; origin: ViewPoint; pan: ViewPoint; started: boolean }

export function OfficeViewControls({ element, motion, reset, instantReset, settled, reducedMotion, pageVisible, elevation = 0 }: {
  element: RefObject<HTMLDivElement | null>; motion: RefObject<ViewMotion>; reset: number;
  instantReset: boolean; settled: boolean; reducedMotion: boolean; pageVisible: boolean;
  elevation?: number;
}) {
  const { camera, size, invalidate } = useThree();
  const view = useRef<OfficeView>({ zoom: 1, pan: { x: 0, y: 0 } });
  const fit = useRef<Fit>({ left: -1, right: 1, top: 1, bottom: -1, width: 1, height: 1 });
  const returning = useRef<ReturnMotion | null>(null);
  const drag = useRef<Drag | null>(null);
  const options = useRef({ settled, reducedMotion, pageVisible });
  useLayoutEffect(() => { options.current = { settled, reducedMotion, pageVisible }; }, [settled, reducedMotion, pageVisible]);

  useLayoutEffect(() => {
    const cam = camera as OrthographicCamera;
    cam.position.set(CAMERA.position[0], CAMERA.position[1] + elevation, CAMERA.position[2]); cam.lookAt(0, elevation, 0); cam.updateMatrixWorld();
    const corners = [-1, 1].flatMap(x => [-BUILDING.slab, TALL_WALL_TOP].flatMap(y => [-1, 1].map(z => new Vector3(x * (BUILDING.width + BUILDING.wallThickness) / 2, y + elevation, z * (BUILDING.depth + BUILDING.wallThickness) / 2).applyMatrix4(cam.matrixWorldInverse))));
    const xs = corners.map(p => p.x), ys = corners.map(p => p.y);
    const left = Math.min(...xs), right = Math.max(...xs), bottom = Math.min(...ys), top = Math.max(...ys);
    const aspect = size.width / Math.max(size.height, 1);
    const height = Math.max(top - bottom, (right - left) / aspect) * CAMERA.padding;
    const cx = (left + right) / 2, cy = (bottom + top) / 2;
    fit.current = { left: cx - height * aspect / 2, right: cx + height * aspect / 2, top: cy + height / 2, bottom: cy - height / 2, width: (right - left) / (height * aspect) * size.width, height: (top - bottom) / height * size.height };
    view.current.pan = { x: 0, y: 0 };
    returning.current = null;
    const node = element.current, id = drag.current?.id;
    drag.current = null;
    if (node && id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
    motion.current.busy = false;
    invalidate();
  }, [camera, size.width, size.height, element, motion, invalidate, elevation]);

  useLayoutEffect(() => {
    const node = element.current;
    if (!node) return;
    const limits = () => panLimits(view.current.zoom, fit.current.width, fit.current.height);
    const point = (event: PointerEvent) => ({ x: event.clientX, y: event.clientY });
    const releaseCapture = () => {
      const id = drag.current?.id;
      drag.current = null;
      if (id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
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
      if (event.button !== 0 || !event.isPrimary || !options.current.settled || !options.current.pageVisible || event.pointerType === "touch") return;
      returning.current = null;
      motion.current.pointer = point(event);
      drag.current = { id: event.pointerId, origin: point(event), pan: { ...view.current.pan }, started: false };
    };
    const move = (event: PointerEvent) => {
      motion.current.pointer = point(event);
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
      if (drag.current?.id !== event.pointerId) return;
      const started = drag.current.started;
      releaseCapture();
      const legal = clampPan(view.current.pan, limits());
      if (started || legal.x !== view.current.pan.x || legal.y !== view.current.pan.y) returnTo({ zoom: view.current.zoom, pan: legal });
      else { motion.current.busy = false; invalidate(); }
    };
    const lost = () => {
      if (!drag.current) return;
      drag.current = null;
      returnTo({ zoom: view.current.zoom, pan: clampPan(view.current.pan, limits()) });
    };
    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey || !options.current.settled || !options.current.pageVisible) return;
      event.preventDefault(); releaseCapture(); returning.current = null; motion.current.busy = false;
      motion.current.pointer = { x: event.clientX, y: event.clientY };
      const rect = node.getBoundingClientRect();
      const cursor = { x: event.clientX - rect.left - rect.width / 2, y: event.clientY - rect.top - rect.height / 2 };
      const zoom = clampZoom(view.current.zoom * Math.exp(-wheelPixels(event.deltaY, event.deltaMode, rect.height) * VIEW.wheelSensitivity));
      view.current = zoomAt(view.current, zoom, cursor, panLimits(zoom, fit.current.width, fit.current.height));
      invalidate();
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== node.parentElement || event.ctrlKey || event.metaKey || event.altKey || !options.current.settled) return;
      if (!["+", "=", "-", "0", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
      event.preventDefault(); releaseCapture(); returning.current = null; motion.current.busy = false;
      if (event.key === "0") returnTo({ zoom: 1, pan: { x: 0, y: 0 } });
      else if (["+", "=", "-"].includes(event.key)) {
        const zoom = clampZoom(view.current.zoom * (event.key === "-" ? 1 / 1.15 : 1.15));
        view.current = zoomAt(view.current, zoom, { x: 0, y: 0 }, panLimits(zoom, fit.current.width, fit.current.height));
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
      if (!target.matches(".office-location:focus-visible") || !options.current.settled) return;
      const rect = target.getBoundingClientRect(), stage = node.getBoundingClientRect();
      const header = document.querySelector(".office-header")?.getBoundingClientRect();
      const top = Math.max(stage.top + 24, (header?.bottom ?? 0) + 12), bottom = stage.bottom - 64;
      const dx = rect.left < stage.left + 24 ? stage.left + 24 - rect.left : rect.right > stage.right - 150 ? stage.right - 150 - rect.right : 0;
      const dy = rect.top < top ? top - rect.top : rect.bottom > bottom ? bottom - rect.bottom : 0;
      if (dx || dy) { returning.current = null; view.current.pan = clampPan({ x: view.current.pan.x + dx, y: view.current.pan.y + dy }, limits()); invalidate(); }
    };
    node.addEventListener("pointerdown", down, true); node.addEventListener("pointermove", move, true);
    node.addEventListener("pointerup", up, true); node.addEventListener("pointercancel", up, true);
    node.addEventListener("lostpointercapture", lost); node.addEventListener("wheel", wheel, { passive: false });
    node.addEventListener("focusin", focus); node.parentElement?.addEventListener("keydown", key);
    return () => {
      releaseCapture();
      node.removeEventListener("pointerdown", down, true); node.removeEventListener("pointermove", move, true);
      node.removeEventListener("pointerup", up, true); node.removeEventListener("pointercancel", up, true);
      node.removeEventListener("lostpointercapture", lost); node.removeEventListener("wheel", wheel);
      node.removeEventListener("focusin", focus); node.parentElement?.removeEventListener("keydown", key);
    };
  }, [element, motion, invalidate]);

  useLayoutEffect(() => {
    const node = element.current, id = drag.current?.id;
    drag.current = null;
    if (node && id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
    const to = { zoom: 1, pan: { x: 0, y: 0 } };
    const same = view.current.zoom === 1 && view.current.pan.x === 0 && view.current.pan.y === 0;
    if (instantReset || options.current.reducedMotion || !options.current.pageVisible || same) { view.current = to; returning.current = null; motion.current.busy = false; }
    else { returning.current = { from: { zoom: view.current.zoom, pan: { ...view.current.pan } }, to, began: performance.now() }; motion.current.busy = true; }
    invalidate();
  }, [reset, instantReset, element, motion, invalidate]);

  useLayoutEffect(() => {
    if (settled) return;
    const node = element.current, id = drag.current?.id;
    drag.current = null; returning.current = null; motion.current.busy = false;
    if (node && id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
    invalidate();
  }, [settled, element, motion, invalidate]);

  useLayoutEffect(() => {
    if (!pageVisible || reducedMotion) {
      const node = element.current, id = drag.current?.id;
      drag.current = null;
      if (node && id !== undefined && node.hasPointerCapture(id)) node.releasePointerCapture(id);
      view.current.pan = clampPan(view.current.pan, panLimits(view.current.zoom, fit.current.width, fit.current.height));
      returning.current = null; motion.current.busy = false;
    }
    if (pageVisible) invalidate();
  }, [pageVisible, reducedMotion, element, motion, invalidate]);

  useFrame(() => {
    const node = element.current;
    if (!node) return;
    const bounce = returning.current;
    if (bounce) {
      const t = (performance.now() - bounce.began) / 1000;
      const decay = (1 + 20 * t) * Math.exp(-20 * t);
      view.current = { zoom: bounce.to.zoom + (bounce.from.zoom - bounce.to.zoom) * decay, pan: { x: bounce.to.pan.x + (bounce.from.pan.x - bounce.to.pan.x) * decay, y: bounce.to.pan.y + (bounce.from.pan.y - bounce.to.pan.y) * decay } };
      if (t > 0.55) { view.current = bounce.to; returning.current = null; motion.current.busy = false; }
      else invalidate();
    }
    const cam = camera as OrthographicCamera, base = fit.current, current = view.current;
    const dx = current.pan.x / Math.max(size.width, 1) * (base.right - base.left) / current.zoom;
    const dy = current.pan.y / Math.max(size.height, 1) * (base.top - base.bottom) / current.zoom;
    if (cam.left !== base.left - dx || cam.top !== base.top + dy || cam.zoom !== current.zoom || cam.right !== base.right - dx) {
      cam.left = base.left - dx; cam.right = base.right - dx; cam.top = base.top + dy; cam.bottom = base.bottom + dy; cam.zoom = current.zoom;
      cam.updateProjectionMatrix(); motion.current.revision++;
    }
    const limits = panLimits(current.zoom, base.width, base.height);
    node.dataset.zoom = String(current.zoom);
    node.dataset.panX = String(current.pan.x); node.dataset.panY = String(current.pan.y);
    node.dataset.panLimitX = String(limits.x); node.dataset.panLimitY = String(limits.y);
    node.dataset.dragging = String(Boolean(drag.current?.started)); node.dataset.viewBusy = String(motion.current.busy);
  }, -2);
  return null;
}
