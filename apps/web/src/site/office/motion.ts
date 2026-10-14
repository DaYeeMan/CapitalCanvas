import { useSyncExternalStore } from "react";

function subscribeMotion(update: () => void) {
  const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  media?.addEventListener("change", update);
  return () => media?.removeEventListener("change", update);
}
function readMotion() { return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false; }
export function useReducedMotion() { return useSyncExternalStore(subscribeMotion, readMotion, () => true); }
function subscribeVisibility(update: () => void) {
  document.addEventListener("visibilitychange", update);
  return () => document.removeEventListener("visibilitychange", update);
}
export function usePageVisible() { return useSyncExternalStore(subscribeVisibility, () => document.visibilityState === "visible", () => false); }
