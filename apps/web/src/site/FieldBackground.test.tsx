// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FieldBackground } from "./FieldBackground";
import { useFieldMotionRestricted } from "./useFieldMotionRestricted";

const observers: Observer[] = [];
class Observer {
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(private callback: IntersectionObserverCallback, readonly options?: IntersectionObserverInit) { observers.push(this); }
  emit(visible: boolean) { this.callback([{ isIntersecting: visible } as IntersectionObserverEntry], this as unknown as IntersectionObserver); }
}
let frames: Map<number, FrameRequestCallback>;
let nextFrame: number;
let hidden: boolean;
let reduced: boolean;
let preferences: EventTarget;
let network: EventTarget & { saveData: boolean };
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  observers.length = 0; frames = new Map(); nextFrame = 0; hidden = false; reduced = false;
  preferences = new EventTarget();
  network = Object.assign(new EventTarget(), { saveData: false });
  vi.stubGlobal("IntersectionObserver", Observer);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
  vi.stubGlobal("matchMedia", () => ({ get matches() { return reduced; }, addEventListener: preferences.addEventListener.bind(preferences), removeEventListener: preferences.removeEventListener.bind(preferences) }));
  Object.defineProperty(navigator, "connection", { configurable: true, value: network });
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); Reflect.deleteProperty(navigator, "connection"); });

function paint() {
  act(() => { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)); });
}
function enter() {
  act(() => observers.forEach(observer => observer.emit(true)));
  paint(); paint();
}
function PreferencesExample() {
  const restricted = useFieldMotionRestricted();
  return <><span>{restricted ? "Static" : "Motion"}</span><FieldBackground enabled={!restricted} /></>;
}

describe("Field background lifecycle", () => {
  it("paints the poster before attaching a source and waits for actual visibility to play", async () => {
    const { container } = render(<FieldBackground enabled />);
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("video")).toBeNull();
    act(() => observers[0].emit(true)); paint();
    expect(container.querySelector("video")).toBeNull();
    paint();
    expect(container.querySelector("video")).toHaveAttribute("src", "/media/field/field-loop.mp4");
    expect(play).not.toHaveBeenCalled();
    act(() => observers[1].emit(true));
    await waitFor(() => expect(container.querySelector("video")).toHaveClass("is-ready"));
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("pauses offscreen and while the document is hidden, then resumes", async () => {
    const { container } = render(<FieldBackground enabled />); enter();
    await waitFor(() => expect(play).toHaveBeenCalledTimes(1));
    act(() => observers[1].emit(false));
    expect(pause).toHaveBeenCalled();
    act(() => observers[1].emit(true));
    await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    act(() => { hidden = true; document.dispatchEvent(new Event("visibilitychange")); });
    expect(container.querySelector("video")).toBeNull();
    act(() => { hidden = false; document.dispatchEvent(new Event("visibilitychange")); });
    await waitFor(() => expect(play).toHaveBeenCalledTimes(3));
  });

  it("honors the shared pause flag for multiple surfaces without loading a paused source", async () => {
    const surfaces = (enabled: boolean) => <><FieldBackground enabled={enabled} /><FieldBackground enabled={enabled} /></>;
    const { container, rerender } = render(surfaces(false)); enter();
    expect(container.querySelectorAll("video")).toHaveLength(0);
    rerender(surfaces(true)); await waitFor(() => expect(play).toHaveBeenCalledTimes(2));
    rerender(surfaces(false));
    expect(container.querySelectorAll("video")).toHaveLength(0);
    act(() => observers.forEach(observer => observer.emit(true)));
    expect(container.querySelectorAll("video")).toHaveLength(0);
  });

  it.each(["reduced motion", "data saving"])("never attaches video for %s and responds to preference changes", async preference => {
    if (preference === "reduced motion") reduced = true; else network.saveData = true;
    const { container } = render(<PreferencesExample />); enter();
    expect(screen.getByText("Static")).toBeInTheDocument();
    expect(container.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
    act(() => { reduced = false; network.saveData = false; preferences.dispatchEvent(new Event("change")); network.dispatchEvent(new Event("change")); });
    await waitFor(() => expect(play).toHaveBeenCalled());
    act(() => { reduced = true; preferences.dispatchEvent(new Event("change")); });
    expect(container.querySelector("video")).toBeNull();
  });

  it("keeps the poster when autoplay is rejected and can retry after an explicit resume", async () => {
    play.mockRejectedValueOnce(new DOMException("Autoplay denied", "NotAllowedError"));
    const { container, rerender } = render(<FieldBackground enabled />); enter();
    await act(async () => {});
    expect(container.querySelector("video")).not.toHaveClass("is-ready");
    expect(container.querySelector("img")).toBeInTheDocument();
    rerender(<FieldBackground enabled={false} />); rerender(<FieldBackground enabled />);
    await waitFor(() => expect(container.querySelector("video")).toHaveClass("is-ready"));
  });

  it("falls back to the poster for a failed media file without retrying in a loop", async () => {
    const { container, rerender } = render(<FieldBackground enabled />); enter();
    await waitFor(() => expect(play).toHaveBeenCalled());
    fireEvent.error(container.querySelector("video")!);
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).toBeInTheDocument();
    rerender(<FieldBackground enabled={false} />); rerender(<FieldBackground enabled />);
    expect(container.querySelector("video")).toBeNull();
  });

  it("disconnects observers, cancels scheduled work, and pauses on unmount", async () => {
    const { unmount } = render(<FieldBackground enabled />); enter();
    await waitFor(() => expect(play).toHaveBeenCalled());
    unmount();
    expect(observers.every(observer => observer.disconnect.mock.calls.length > 0)).toBe(true);
    expect(frames.size).toBe(0);
    const calls = play.mock.calls.length;
    act(() => document.dispatchEvent(new Event("visibilitychange")));
    expect(play).toHaveBeenCalledTimes(calls);
    expect(pause).toHaveBeenCalled();
  });
});
