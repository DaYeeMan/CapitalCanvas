// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOfficeNavigation, FADE } from "./useOfficeNavigation";

beforeEach(() => {
  window.history.replaceState(null, "", "/preview/office#home");
  vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

describe("office fade navigation", () => {
  it("retains outgoing view until faded out and waits for a destination render before fading in", () => {
    const { result } = renderHook(() => useOfficeNavigation(false));
    act(() => result.current.navigate("resources"));
    expect(result.current).toMatchObject({ floor: "home", phase: "fade-out", viewReset: 0, settled: false });
    advance(FADE.out - 1); expect(result.current.floor).toBe("home");
    advance(1);
    expect(result.current).toMatchObject({ floor: "resources", phase: "hidden", instantReset: true, viewReset: 1 });
    advance(2000); expect(result.current.phase).toBe("hidden");
    act(() => result.current.presented("resources", 1)); advance(0);
    expect(result.current.phase).toBe("fade-in");
    advance(FADE.in); expect(result.current.settled).toBe(true);
  });
  it("fades a ready destination in immediately and completes in half a second", () => {
    const { result } = renderHook(() => useOfficeNavigation(false));
    act(() => result.current.navigate("resources")); advance(FADE.out);
    act(() => result.current.presented("resources", 1));
    act(() => result.current.navigate("resources"));
    expect(result.current.viewReset).toBe(1);
    advance(0);
    expect(result.current.phase).toBe("fade-in");
    act(() => result.current.navigate("resources")); expect(result.current.phase).toBe("fade-in");
    advance(FADE.in - 1);
    expect(result.current.phase).toBe("fade-in");
    advance(1); expect(result.current.phase).toBe("idle");
  });
  it("uses the latest fade-out/hidden choice and rejects stale render acknowledgements", () => {
    const { result } = renderHook(() => useOfficeNavigation(false));
    act(() => result.current.navigate("resources")); advance(100);
    act(() => result.current.navigate("home")); advance(FADE.out - 100);
    expect(result.current).toMatchObject({ floor: "home", phase: "hidden", viewReset: 1 });
    act(() => result.current.navigate("resources"));
    act(() => result.current.presented("home", 1)); advance(2000);
    expect(result.current).toMatchObject({ floor: "resources", phase: "hidden", viewReset: 2 });
    act(() => result.current.presented("resources", 2)); advance(0); advance(FADE.in);
    expect(result.current.floor).toBe("resources"); expect(result.current.settled).toBe(true);
  });
  it("reverses a fade-in and commits the next floor only after fading out again", () => {
    const { result } = renderHook(() => useOfficeNavigation(false));
    act(() => result.current.navigate("resources")); advance(FADE.out);
    act(() => result.current.presented("resources", 1)); advance(0);
    advance(100); act(() => result.current.navigate("home"));
    expect(result.current).toMatchObject({ floor: "resources", phase: "fade-out" });
    advance(FADE.out); expect(result.current).toMatchObject({ floor: "home", phase: "hidden" });
    act(() => result.current.presented("resources", 1)); advance(2000);
    expect(result.current.phase).toBe("hidden");
  });
  it("resets a same-floor view without a fade or extra history entry", () => {
    const push = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() => useOfficeNavigation(false));
    act(() => result.current.navigate("home"));
    expect(result.current).toMatchObject({ phase: "idle", viewReset: 1, instantReset: false });
    expect(push).not.toHaveBeenCalled();
  });
  it("loads direct hashes immediately and deduplicates history events", () => {
    window.history.replaceState(null, "", "#resources");
    const { result } = renderHook(() => useOfficeNavigation(false));
    expect(result.current).toMatchObject({ floor: "resources", phase: "idle", viewReset: 0 });
    act(() => { window.history.replaceState(null, "", "#home"); window.dispatchEvent(new PopStateEvent("popstate")); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    advance(FADE.out);
    expect(result.current).toMatchObject({ floor: "home", phase: "hidden", viewReset: 1 });
  });
  it("settles hidden pages/reduced motion and cancels timers on unmount", () => {
    const { result, rerender, unmount } = renderHook(({ reduced }) => useOfficeNavigation(reduced), { initialProps: { reduced: false } });
    act(() => result.current.navigate("resources")); advance(200);
    act(() => { vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden"); document.dispatchEvent(new Event("visibilitychange")); });
    expect(result.current).toMatchObject({ floor: "resources", phase: "idle", instantReset: true });
    expect(vi.getTimerCount()).toBe(0);
    act(() => result.current.navigate("home")); expect(result.current.floor).toBe("home");
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    act(() => result.current.navigate("resources")); rerender({ reduced: true });
    expect(result.current).toMatchObject({ floor: "resources", phase: "idle" });
    rerender({ reduced: false }); act(() => result.current.navigate("home"));
    unmount(); expect(vi.getTimerCount()).toBe(0);
  });
});

