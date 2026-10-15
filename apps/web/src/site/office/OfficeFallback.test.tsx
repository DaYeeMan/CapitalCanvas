// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfficeFallback } from "./OfficeFallback";

afterEach(cleanup);
describe("static preview alternatives", () => {
  it("presents the city reference and acknowledges the selected pose when it loads", () => {
    const presented = vi.fn();
    render(<OfficeFallback floor="home" view="city" viewReset={4} onPresented={presented} />);
    fireEvent.load(screen.getByRole("img", { name: /Grounded District/ }));
    expect(presented).toHaveBeenCalledWith("home", 4);
    expect(screen.getByRole("status")).toHaveTextContent("3D is unavailable");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
  it("retains the existing floor artwork and does not hang readiness on an image error", () => {
    const presented = vi.fn();
    render(<OfficeFallback floor="resources" view="resources" viewReset={5} onPresented={presented} />);
    fireEvent.error(screen.getByRole("img", { name: /Resources office concept/ }));
    expect(presented).toHaveBeenCalledWith("resources", 5);
    expect(screen.getByRole("list", { name: "Tool desks" })).toHaveTextContent("IthacaTroyDelphi");
  });
});
