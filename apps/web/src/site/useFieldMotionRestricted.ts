import { useSyncExternalStore } from "react";

type Connection = EventTarget & { saveData?: boolean };
const connection = () => (navigator as Navigator & { connection?: Connection }).connection;
const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribeToPreferences(update: () => void) {
  const query = window.matchMedia(motionQuery);
  const network = connection();
  query.addEventListener?.("change", update);
  network?.addEventListener("change", update);
  return () => {
    query.removeEventListener?.("change", update);
    network?.removeEventListener("change", update);
  };
}

export function useFieldMotionRestricted() {
  return useSyncExternalStore(subscribeToPreferences,
    () => window.matchMedia(motionQuery).matches || Boolean(connection()?.saveData),
    () => true);
}

