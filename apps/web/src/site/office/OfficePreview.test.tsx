// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OfficePreview from "./OfficePreview";
import { useEffect } from "react";

const sceneState = vi.hoisted(() => ({ failed: false }));
vi.mock("./OfficeCanvas", () => ({ default: function MockOfficeCanvas({ floor, viewReset, onPresented }: { floor: "home" | "resources"; viewReset: number; onPresented: (floor: "home" | "resources", reset: number) => void }) {
  useEffect(() => { onPresented(floor, viewReset); }, [floor, viewReset, onPresented]);
  if (sceneState.failed) throw new Error("Intentional scene failure");
  return <div data-testid="office-scene">{floor}</div>;
} }));
beforeEach(() => { sceneState.failed = false; window.history.replaceState(null, "", "/preview/office#home"); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("isolated office shell", () => {
  it("selects a directly linked lower floor and offers About without activating tools", async () => {
    window.history.replaceState(null, "", "/preview/office#resources"); render(<OfficePreview />);
    expect(await screen.findByTestId("office-scene")).toHaveTextContent("resources");
    expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("href", "#about");
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("link", { name: /Ithaca|Troy|Delphi/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Skip to office" }));
    expect(window.location.hash).toBe("#resources");
    expect(document.activeElement).toBe(document.getElementById("office-main"));
  });
  it("follows anchor state changes without tool activation", async () => {
    render(<OfficePreview />); await screen.findByTestId("office-scene");
    act(() => { window.history.pushState(null, "", "#resources"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    await waitFor(() => expect(document.querySelector(".office-preview")).toHaveAttribute("data-traveling", "false"), { timeout: 2500 });
    expect(screen.getByTestId("office-scene")).toHaveTextContent("resources");
    act(() => { window.history.replaceState(null, "", "#home"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    await waitFor(() => expect(document.querySelector(".office-preview")).toHaveAttribute("data-traveling", "false"), { timeout: 2500 });
    expect(screen.getByTestId("office-scene")).toHaveTextContent("home");
  });
  it("ignores scrolling and wheel for floor selection, but changes pose from header links", async () => {
    render(<OfficePreview />); await screen.findByTestId("office-scene");
    const main = document.getElementById("office-main")!;
    fireEvent.wheel(main, { deltaY: 2000 }); main.scrollTop = 800; fireEvent.scroll(main);
    expect(window.location.hash).toBe("#home");
    expect(screen.getByTestId("office-scene")).toHaveTextContent("home");
    fireEvent.click(screen.getByRole("link", { name: "Resources" }));
    await waitFor(() => expect(document.querySelector(".office-preview")).toHaveAttribute("data-traveling", "false"), { timeout: 2500 });
    expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute("aria-current", "page");
    expect(window.location.hash).toBe("#resources");
    expect(document.querySelector(".office-preview")).toHaveAttribute("data-traveling", "false");
    fireEvent.click(screen.getByText("About"));
    expect(window.location.hash).toBe("#about");
  });
  it("starts at the city, enters both floors without inspection controls and returns by the logo", async () => {
    window.history.replaceState(null, "", "/preview/office");
    render(<OfficePreview />); await screen.findByTestId("office-scene");
    expect(screen.getByRole("heading", { name: "A Different Perspective" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Office floors" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Enter Capital Canvas" }));
    expect(window.location.hash).toBe("#home");
    expect(screen.queryByRole("button", { name: "View whole tower" })).not.toBeInTheDocument();
    expect(screen.queryByText("6 closed storeys between Home and Resources")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Resources" }));
    expect(screen.queryByRole("button", { name: "View whole tower" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "CapitalCanvas preview city" }));
    expect(window.location.hash).toBe("#city");
    expect(screen.getByRole("button", { name: "Enter Capital Canvas" })).toBeInTheDocument();
  });
  it("keeps all destinations usable after a scene failure without advertising 3D controls", async () => {
    sceneState.failed = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState(null, "", "/preview/office#city");
    render(<OfficePreview />);
    fireEvent.load(await screen.findByRole("img", { name: /Grounded District/ }));
    expect(document.querySelector(".office-preview")).toHaveAttribute("data-renderer", "static");
    fireEvent.click(screen.getByRole("button", { name: "Enter Capital Canvas" }));
    fireEvent.load(screen.getByRole("img", { name: /Home office above/ }));
    expect(screen.getByRole("main")).toHaveAttribute("aria-busy", "false");
    expect(screen.queryByRole("button", { name: "View whole tower" })).not.toBeInTheDocument();
    expect(document.getElementById("office-instructions")).not.toHaveTextContent("zoom");
    fireEvent.click(screen.getByRole("link", { name: "Resources" }));
    fireEvent.load(screen.getByRole("img", { name: /Resources office above/ }));
    expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute("aria-current", "page");
    expect(document.activeElement).toBe(screen.getByRole("main"));
    fireEvent.click(screen.getByRole("link", { name: "CapitalCanvas preview city" }));
    fireEvent.load(screen.getByRole("img", { name: /Grounded District/ }));
    expect(window.location.hash).toBe("#city");
    expect(screen.getByRole("navigation", { name: "Office floors" })).toBeVisible();
  });
  it("shows the city-backed About note with one heading, contact and legal destinations", async () => {
    window.history.replaceState(null, "", "/preview/office#about");
    render(<OfficePreview />); await screen.findByTestId("office-scene");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "About Capital Canvas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "About" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "dymteam23@gmail.com" })).toHaveAttribute("href", "mailto:dymteam23@gmail.com");
    expect(screen.getByRole("link", { name: "Attributions" })).toHaveAttribute("href", "/notices");
    expect(screen.queryByRole("button", { name: "Enter Capital Canvas" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "View whole tower" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "CapitalCanvas preview city" }));
    expect(window.location.hash).toBe("#city");
    expect(screen.getByRole("heading", { name: "A Different Perspective" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Legal" })).not.toBeInTheDocument();
  });
  it("keeps About over the district still when WebGL fails", async () => {
    sceneState.failed = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState(null, "", "/preview/office#about");
    render(<OfficePreview />);
    fireEvent.load(await screen.findByRole("img", { name: /Grounded District/ }));
    expect(document.querySelector(".office-preview")).toHaveAttribute("data-renderer", "static");
    expect(screen.getByRole("heading", { name: "About Capital Canvas" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    fireEvent.load(screen.getByRole("img", { name: /Home office above/ }));
    expect(screen.queryByRole("navigation", { name: "Legal" })).not.toBeInTheDocument();
  });
});

