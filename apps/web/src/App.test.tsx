// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

const { loadWorkbench } = vi.hoisted(() => ({ loadWorkbench: vi.fn() }));
vi.mock("./site/office/OfficeSite", () => ({ default: () => <main><h1>Capital Canvas office</h1></main> }));
vi.mock("./IthacaWorkbench", () => {
  loadWorkbench();
  return { default: () => <main><h1>Ithaca test workbench</h1></main> };
});
vi.mock("./troy/TroyWorkbench", () => ({ default: () => <main><h1>Troy test workbench</h1></main> }));
vi.mock("./delphi/DelphiWorkbench", () => ({ default: () => <main><h1>Delphi test workbench</h1></main> }));

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  vi.stubGlobal("fetch", vi.fn());
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("CapitalCanvas route boundaries", () => {
  it("promotes the office to the indexed homepage without loading a workbench or fetching", async () => {
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Capital Canvas office" })).toBeInTheDocument();
    expect(document.title).toBe("CapitalCanvas");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
    expect(loadWorkbench).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(["", "#home", "#resources", "#about", "#crr", "#delphi-methods"])("replaces the retired preview URL while retaining query and destination %s", async hash => {
    window.history.replaceState({ retained: true }, "", `/preview/office/?source=bookmark${hash}`);
    const length = window.history.length;
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Capital Canvas office" })).toBeInTheDocument();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe(`/?source=bookmark${hash}`);
    expect(window.history.state).toEqual({ retained: true });
    expect(window.history.length).toBe(length);
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "index,follow");
  });

  it.each(["/privacy", "/terms", "/disclaimer", "/notices"])("renders %s with the shared office header and About footer", async path => {
    window.history.replaceState(null, "", path);
    const { container } = render(<App />);
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(container.querySelector(".office-theme.information-site")).toBeInTheDocument();
    const header = screen.getByRole("banner");
    expect(within(header).getByRole("link", { name: "Capital Canvas city" })).toHaveAttribute("href", "/");
    expect(within(header).getByRole("link", { name: "Resources" })).toHaveAttribute("href", "/#resources");
    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("Emmanuel Zhang")).toBeInTheDocument();
    expect(within(footer).getByRole("navigation", { name: "Legal" })).toBeInTheDocument();
    expect(within(footer).getByRole("link", { name: "dymteam23@gmail.com" })).toHaveAttribute("href", "mailto:dymteam23@gmail.com");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("keeps unknown paths in the office-styled 404 with working home links", async () => {
    window.history.replaceState(null, "", "/not-a-page");
    render(<App />);
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return home" })).toHaveAttribute("href", "/#home");
    expect(document.title).toBe("Page not found — CapitalCanvas");
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute("content", "noindex,follow");
  });

  it.each(["ithaca", "troy", "delphi"])("preserves the %s workbench route and title", async tool => {
    window.history.replaceState(null, "", `/tools/${tool}`);
    render(<App />);
    const name = tool[0].toUpperCase() + tool.slice(1);
    expect(await screen.findByRole("heading", { name: `${name} test workbench` })).toBeInTheDocument();
    expect(document.title).toBe(`${name} — CapitalCanvas`);
    expect(fetch).not.toHaveBeenCalled();
  });
});
