// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useOfficeNavigation } from "./useOfficeNavigation";

beforeEach(() => window.history.replaceState(null, "", "/preview/office"));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("motion preview navigation", () => {
  it("loads About over the city and changes city pages without issuing scene commands", () => {
    window.history.replaceState(null, "", "#about");
    const { result } = renderHook(() => useOfficeNavigation());
    expect(result.current).toMatchObject({ page: "about", view: "city", phase: "loading", viewReset: 0 });
    act(() => result.current.presented("home", 0));
    act(() => result.current.navigate("city"));
    expect(result.current).toMatchObject({ page: "city", view: "city", origin: "city", phase: "idle", viewReset: 0 });
    act(() => { window.history.replaceState(null, "", "#about"); window.dispatchEvent(new PopStateEvent("popstate")); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(result.current).toMatchObject({ page: "about", view: "city", phase: "idle", viewReset: 0 });
    expect(window.location.hash).toBe("#about");
  });
  it("returns from a floor to About and can change the city page without restarting that return", () => {
    window.history.replaceState(null, "", "#resources");
    const { result } = renderHook(() => useOfficeNavigation());
    act(() => result.current.presented("resources", 0));
    act(() => result.current.navigate("about"));
    expect(result.current).toMatchObject({ page: "about", view: "city", origin: "resources", phase: "moving", viewReset: 1 });
    act(() => result.current.navigate("city"));
    act(() => result.current.navigate("about"));
    act(() => result.current.presented("resources", 0));
    expect(result.current).toMatchObject({ page: "about", phase: "moving", viewReset: 1 });
    act(() => result.current.presented("home", 1));
    expect(result.current).toMatchObject({ page: "about", view: "city", origin: "city", phase: "idle", viewReset: 1 });
    act(() => result.current.navigate("home"));
    expect(result.current).toMatchObject({ page: "home", view: "home", origin: "city", phase: "moving", viewReset: 2 });
  });
  it("starts at the closed city and waits for the rendered pose", () => {
    const { result } = renderHook(() => useOfficeNavigation());
    expect(result.current).toMatchObject({ view: "city", phase: "loading", settled: false });
    act(() => result.current.presented("home", 0));
    expect(result.current.settled).toBe(true);
    act(() => result.current.navigate("home"));
    expect(result.current).toMatchObject({ view: "home", origin: "city", phase: "moving", viewReset: 1 });
    expect(window.location.hash).toBe("#home");
    act(() => result.current.presented("home", 1));
    expect(result.current.settled).toBe(true);
  });
  it("takes the latest choice and rejects stale acknowledgements, including city/Home sharing a floor", () => {
    const { result } = renderHook(() => useOfficeNavigation());
    act(() => result.current.navigate("home"));
    act(() => result.current.navigate("resources"));
    act(() => result.current.navigate("city"));
    act(() => result.current.presented("home", 1));
    act(() => result.current.presented("resources", 2));
    expect(result.current).toMatchObject({ view: "city", settled: false, viewReset: 3 });
    act(() => result.current.presented("home", 3));
    expect(result.current.settled).toBe(true);
  });
  it("loads direct floor hashes and deduplicates paired history events", () => {
    window.history.replaceState(null, "", "#resources");
    const { result } = renderHook(() => useOfficeNavigation());
    expect(result.current).toMatchObject({ view: "resources", floor: "resources", viewReset: 0 });
    act(() => { window.history.replaceState(null, "", "#home"); window.dispatchEvent(new PopStateEvent("popstate")); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(result.current).toMatchObject({ view: "home", viewReset: 1 });
    act(() => { window.history.replaceState(null, "", "#city"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(result.current.view).toBe("city");
  });
  it("resets an existing floor without duplicating its history entry", () => {
    window.history.replaceState(null, "", "#home");
    const push = vi.spyOn(window.history, "pushState");
    const { result } = renderHook(() => useOfficeNavigation());
    act(() => result.current.presented("home", 0));
    act(() => result.current.navigate("home"));
    expect(result.current).toMatchObject({ view: "home", viewReset: 1, instantReset: true });
    expect(push).not.toHaveBeenCalled();
  });
  it("removes history subscriptions on unmount", () => {
    const remove = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useOfficeNavigation());
    unmount();
    expect(remove).toHaveBeenCalledWith("hashchange", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("popstate", expect.any(Function));
    expect(remove).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
  it("deduplicates entry requests and skips the current journey without adding history", () => {
    const { result } = renderHook(() => useOfficeNavigation());
    act(() => result.current.navigate("home"));
    act(() => result.current.navigate("home"));
    expect(result.current.viewReset).toBe(1);
    act(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    expect(result.current).toMatchObject({ view: "home", phase: "loading", viewReset: 1 });
    act(() => result.current.presented("home", 1));
    expect(result.current).toMatchObject({ phase: "idle", origin: "home" });
  });
  it("settles reduced-motion and hidden-tab choices immediately", () => {
    const { result, rerender } = renderHook(({ reduced, visible }) => useOfficeNavigation(reduced, visible), { initialProps: { reduced: false, visible: true } });
    act(() => result.current.navigate("home"));
    rerender({ reduced: true, visible: true });
    expect(result.current.phase).toBe("loading");
    act(() => result.current.presented("home", 1));
    act(() => result.current.navigate("resources"));
    expect(result.current.phase).toBe("loading");
    rerender({ reduced: false, visible: false });
    act(() => result.current.navigate("city"));
    expect(result.current.phase).toBe("loading");
  });
  it("normalizes unknown hashes to city without another history entry", () => {
    window.history.replaceState(null, "", "#unknown");
    const { result } = renderHook(() => useOfficeNavigation());
    expect(result.current.view).toBe("city");
    expect(window.location.hash).toBe("#city");
  });
});
