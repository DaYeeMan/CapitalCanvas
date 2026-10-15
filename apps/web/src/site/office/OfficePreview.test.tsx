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
  it("selects a directly linked lower floor and keeps About noninteractive", async () => {
    window.history.replaceState(null, "", "/preview/office#resources"); render(<OfficePreview />);
    expect(await screen.findByTestId("office-scene")).toHaveTextContent("resources");
    expect(screen.getByRole("link", { name: "Resources" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("About").tagName).toBe("SPAN");
    expect(screen.queryByRole("link", { name: "About" })).not.toBeInTheDocument();
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
    expect(window.location.hash).toBe("#resources");
  });
  it("starts at the city, enters Home, inspects the tower and returns by the logo", async () => {
    window.history.replaceState(null, "", "/preview/office");
    render(<OfficePreview />); await screen.findByTestId("office-scene");
    expect(screen.getByRole("heading", { name: "Explore pricing and market dynamics" })).toBeInTheDocument();
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Enter CapitalCanvas" }));
    expect(window.location.hash).toBe("#home");
    fireEvent.click(screen.getByRole("button", { name: "View whole tower" }));
    expect(screen.getByText("6 closed storeys between Home and Resources")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Resources" }));
    expect(screen.getByRole("button", { name: "View whole tower" })).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(screen.getByRole("link", { name: "CapitalCanvas preview city" }));
    expect(window.location.hash).toBe("#city");
    expect(screen.getByRole("button", { name: "Enter CapitalCanvas" })).toBeInTheDocument();
  });
  it("keeps all destinations usable after a scene failure without advertising 3D controls", async () => {
    sceneState.failed = true;
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState(null, "", "/preview/office#city");
    render(<OfficePreview />);
    fireEvent.load(await screen.findByRole("img", { name: /Grounded District/ }));
    expect(document.querySelector(".office-preview")).toHaveAttribute("data-renderer", "static");
    fireEvent.click(screen.getByRole("button", { name: "Enter CapitalCanvas" }));
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
    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });
});

