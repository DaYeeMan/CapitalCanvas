// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationMarker } from "./LocationMarker";

afterEach(() => { cleanup(); vi.useRealTimers(); });
function marker(active = true) { return <LocationMarker tool="ithaca" label="Ithaca" active={active} anchorRef={null} hitRef={null} />; }
describe("office tool disclosure", () => {
  it("keeps the label open between cluster and pin, then closes on pointer leave", () => {
    vi.useFakeTimers(); const { container } = render(marker());
    const hit = container.querySelector(".office-desk-hit")!;
    fireEvent.pointerEnter(hit); expect(screen.getByRole("tooltip")).toHaveTextContent("Ithaca");
    fireEvent.pointerLeave(hit); act(() => vi.advanceTimersByTime(60));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "Ithaca" })); act(() => vi.advanceTimersByTime(120));
    expect(screen.getByRole("tooltip")).toBeVisible();
    fireEvent.pointerLeave(container.querySelector(".office-tool")!); act(() => vi.advanceTimersByTime(130));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("reveals on focus, dismisses with Escape and never activates a tool", () => {
    render(marker()); const pin = screen.getByRole("button", { name: "Ithaca" });
    expect(pin).toHaveAttribute("aria-disabled", "true");
    fireEvent.focus(pin); expect(screen.getByRole("tooltip")).toBeVisible();
    const before = window.location.href;
    fireEvent.click(pin); fireEvent.keyDown(pin, { key: "Enter" }); fireEvent.keyDown(pin, { key: " " });
    expect(window.location.href).toBe(before);
    fireEvent.keyDown(pin, { key: "Escape" }); expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("disables tool interactions during floor travel", () => {
    render(marker(false)); expect(screen.getByRole("button", { name: "Ithaca" })).toBeDisabled();
    fireEvent.focus(screen.getByRole("button", { name: "Ithaca" })); expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
  it("suppresses drag hover and refreshes disclosure from the new camera projection", () => {
    const { container } = render(<div className="office-scene" data-view-busy="true">{marker()}</div>);
    const scene = container.querySelector(".office-scene")!;
    fireEvent.pointerEnter(container.querySelector(".office-desk-hit")!);
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: "ithaca", busy: false } })));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Ithaca");
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: "ithaca", busy: true } })));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    act(() => scene.dispatchEvent(new CustomEvent("office-view-hover", { detail: { tool: "troy", busy: false } })));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });
});
