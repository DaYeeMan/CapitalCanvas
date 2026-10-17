// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationMarker } from "./LocationMarker";

afterEach(() => { cleanup(); vi.useRealTimers(); });
function marker(active = true) { return <LocationMarker tool="ithaca" label="Ithaca" active={active} anchorRef={null} hitRef={null} />; }
describe("office tool disclosure", () => {
  it("keeps a clicked desk preview open after the pointer leaves and the camera refreshes hover", () => {
    vi.useFakeTimers();
    const { container } = render(<div className="office-scene">{marker()}</div>);
    const scene = container.querySelector(".office-scene")!;
    const hit = container.querySelector(".office-desk-hit")!;
    const pin = screen.getByRole("button", { name: "Ithaca" });
    const before = window.location.href;
    fireEvent.click(hit);
    expect(pin).toHaveFocus();
    fireEvent.pointerLeave(container.querySelector(".office-tool")!);
    act(() => vi.advanceTimersByTime(200));
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { busy: false } })));
    expect(pin).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Open tool" })).toBeVisible();
    expect(window.location.href).toBe(before);
    fireEvent.keyDown(pin, { key: "Escape" });
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("ignores desk selection during camera manipulation or floor travel", () => {
    const { container, rerender } = render(<div className="office-scene" data-view-busy="true">{marker()}</div>);
    fireEvent.click(container.querySelector(".office-desk-hit")!);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Ithaca" })).not.toHaveFocus();
    rerender(<div className="office-scene">{marker(false)}</div>);
    fireEvent.click(container.querySelector(".office-desk-hit")!);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("allows a touch user to dismiss a preview with its close control or an outside tap", () => {
    const { container } = render(marker());
    const pin = screen.getByRole("button", { name: "Ithaca" });
    fireEvent.click(container.querySelector(".office-desk-hit")!);
    fireEvent.click(screen.getByRole("button", { name: "Close Ithaca preview" }));
    expect(container.querySelector(".office-tool-panel")).toHaveAttribute("hidden");
    fireEvent.click(pin);
    const outside = new Event("pointerdown", { bubbles: true });
    Object.defineProperty(outside, "pointerType", { value: "touch" });
    fireEvent(document.body, outside);
    expect(container.querySelector(".office-tool-panel")).toHaveAttribute("hidden");
  });
  it("opens research from the existing preview without changing the route", () => {
    const read = vi.fn();
    render(<LocationMarker tool="ithaca" label="Ithaca" floor="resources" active anchorRef={null} hitRef={null} onReadResearch={read} />);
    const pin = screen.getByRole("button", { name: "Ithaca" });
    const before = window.location.href;
    fireEvent.click(pin);
    expect(read).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Read research" }));
    expect(read).toHaveBeenCalledWith("ithaca", pin);
    expect(window.location.href).toBe(before);
  });
  it("shows only one desk panel when pointer and keyboard select different desks", () => {
    render(<div className="office-scene">{marker()}<LocationMarker tool="troy" label="Troy" active anchorRef={null} hitRef={null} /></div>);
    fireEvent.focus(screen.getByRole("button", { name: "Ithaca" }));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Troy" }));
    expect(screen.getAllByRole("region")).toHaveLength(1);
    expect(screen.getByRole("region", { name: "Troy details" })).toBeVisible();
  });
  it("keeps focus inside the actionable panel and maps Resources to research", () => {
    const { container } = render(<LocationMarker tool="ithaca" label="Ithaca" floor="resources" active anchorRef={null} hitRef={null} />);
    const pin = screen.getByRole("button", { name: "Ithaca" });
    fireEvent.focus(pin);
    const action = screen.getByRole("link", { name: "Read research" });
    expect(action).toHaveAttribute("href", "/#black-scholes");
    fireEvent.blur(pin, { relatedTarget: action });
    fireEvent.focus(action);
    expect(screen.getByRole("region", { name: "Ithaca details" })).toBeVisible();
    fireEvent.keyDown(action, { key: "Escape" });
    expect(pin).toHaveFocus();
    expect(container.querySelector(".office-tool-panel")).toHaveAttribute("hidden");
  });
  it("keeps the label open between cluster and pin, then closes on pointer leave", () => {
    vi.useFakeTimers(); const { container } = render(marker());
    const hit = container.querySelector(".office-desk-hit")!;
    fireEvent.pointerEnter(hit); expect(screen.getByRole("region")).toHaveTextContent("Ithaca");
    fireEvent.pointerLeave(hit); act(() => vi.advanceTimersByTime(60));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Ithaca" })); act(() => vi.advanceTimersByTime(120));
    expect(screen.getByRole("region")).toBeVisible();
    fireEvent.pointerLeave(container.querySelector(".office-tool")!); act(() => vi.advanceTimersByTime(170));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("reveals a keyboard-accessible tool action and dismisses with Escape", () => {
    render(marker()); const pin = screen.getByRole("button", { name: "Ithaca" });
    expect(pin).toHaveAttribute("aria-expanded", "false");
    fireEvent.focus(pin); expect(screen.getByRole("region")).toBeVisible();
    expect(screen.getByRole("link", { name: "Open tool" })).toHaveAttribute("href", "/tools/ithaca");
    const before = window.location.href;
    fireEvent.click(pin); fireEvent.keyDown(pin, { key: "Enter" }); fireEvent.keyDown(pin, { key: " " });
    expect(window.location.href).toBe(before);
    fireEvent.keyDown(pin, { key: "Escape" }); expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("disables tool interactions during floor travel", () => {
    render(marker(false)); expect(screen.getByRole("button", { name: "Ithaca" })).toBeDisabled();
    fireEvent.focus(screen.getByRole("button", { name: "Ithaca" })); expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("suppresses drag hover and refreshes disclosure from the new camera projection", () => {
    const { container } = render(<div className="office-scene" data-view-busy="true">{marker()}</div>);
    const scene = container.querySelector(".office-scene")!;
    fireEvent.pointerEnter(container.querySelector(".office-desk-hit")!);
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: "ithaca", busy: false } })));
    expect(screen.getByRole("region")).toHaveTextContent("Ithaca");
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: "ithaca", busy: true } })));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: "troy", busy: false } })));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("dismisses a focused panel during camera manipulation without restoring stale focus afterward", () => {
    const { container } = render(<div className="office-scene">{marker()}</div>);
    const scene = container.querySelector(".office-scene")!;
    fireEvent.focus(screen.getByRole("button", { name: "Ithaca" }));
    expect(screen.getByRole("region")).toBeVisible();
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { busy: true } })));
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { busy: false } })));
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
    expect(container.querySelector(".office-tool-panel")).toHaveAttribute("inert");
  });
});
