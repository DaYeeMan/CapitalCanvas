// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OfficeResearchDialog } from "./OfficeResearchDialog";
import { research } from "../research";
import { troyResearch } from "../troyResearch";
import { delphiResearch } from "../delphiResearch";

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, "close", { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe("office research library", () => {
  it.each([
    ["ithaca", "Ithaca", research, 10], ["troy", "Troy", troyResearch, 7], ["delphi", "Delphi", delphiResearch, 6],
  ] as const)("preserves every %s reference and original source", (tool, name, entries, count) => {
    const { container } = render(<OfficeResearchDialog tool={tool} returnFocus={null} onClose={vi.fn()} />);
    expect(screen.getByRole("dialog", { name })).toHaveAttribute("open");
    expect(screen.getByText(`${count} references`)).toBeVisible();
    expect(container.querySelectorAll("details")).toHaveLength(count);
    for (const entry of entries) {
      expect(screen.getByText(entry.title)).toBeInTheDocument();
      const details = screen.getByText(entry.title).closest("details")!;
      expect(within(details).getByText(entry.summary)).toBeInTheDocument();
      expect(within(details).getByText(`${entry.authors} · ${entry.year}`)).toBeInTheDocument();
      expect(details.querySelector("a")).toHaveAttribute("href", entry.source);
      expect(details.querySelector("a")).toHaveAttribute("target", "_blank");
    }
    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(container.querySelectorAll("details[open]")).toHaveLength(1);
    expect(screen.queryByText(/Esc|Original papers|Close library|The ideas behind/)).not.toBeInTheDocument();
  });
  it("preserves both paragraphs of the Asian implementation note and the Troy note", () => {
    const { unmount } = render(<OfficeResearchDialog tool="ithaca" returnFocus={null} onClose={vi.fn()} />);
    expect(screen.getByText(/grid introduces interpolation error/)).toBeInTheDocument();
    expect(screen.getByText(/Ithaca extends a CRR tree/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /underlying CRR/, hidden: true })).toHaveAttribute("href", research[1].source);
    unmount();
    render(<OfficeResearchDialog tool="troy" returnFocus={null} onClose={vi.fn()} />);
    expect(screen.getByText(/Troy separates the simulated market/)).toBeInTheDocument();
  });
  it("dismisses by X or native Escape cancel and restores the desk focus on unmount", () => {
    const close = vi.fn();
    const desk = document.createElement("button"); document.body.append(desk); desk.focus();
    const { unmount } = render(<OfficeResearchDialog tool="ithaca" returnFocus={desk} onClose={close} />);
    fireEvent.click(screen.getByRole("button", { name: "Close research" }));
    expect(close).toHaveBeenCalledOnce();
    fireEvent(screen.getByRole("dialog"), new Event("cancel", { bubbles: false, cancelable: true }));
    expect(close).toHaveBeenCalledTimes(2);
    unmount(); expect(desk).toHaveFocus(); desk.remove();
  });
  it("closes only when both press and click are outside the window", () => {
    const close = vi.fn();
    render(<OfficeResearchDialog tool="ithaca" returnFocus={null} onClose={close} />);
    const dialog = screen.getByRole("dialog");
    vi.spyOn(dialog, "getBoundingClientRect").mockReturnValue({ left: 100, right: 900, top: 100, bottom: 700 } as DOMRect);
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 200, clientY: 200 }));
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(close).not.toHaveBeenCalled();
    fireEvent(dialog, new MouseEvent("pointerdown", { bubbles: true, clientX: 20, clientY: 20 }));
    fireEvent.click(dialog, { clientX: 20, clientY: 20 });
    expect(close).toHaveBeenCalledOnce();
  });
});
