// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { OfficeFallback } from "./OfficeFallback";

afterEach(cleanup);
describe("static preview alternatives", () => {
  it("opens each library in place when the scene is unavailable", () => {
    const read = vi.fn();
    render(<OfficeFallback floor="resources" onReadResearch={read} />);
    for (const name of ["Ithaca", "Troy", "Delphi"]) {
      const button = screen.getByRole("button", { name: `${name} — Read research` });
      fireEvent.click(button);
      expect(read).toHaveBeenLastCalledWith(name.toLowerCase(), button);
    }
  });
  it("presents a current district still and reports actual unavailability", () => {
    const presented = vi.fn(), unavailable = vi.fn();
    render(<OfficeFallback floor="home" view="city" viewReset={4} onPresented={presented} onUnavailable={unavailable} />);
    fireEvent.load(screen.getByRole("img", { name: /Grounded District/ }));
    expect(presented).toHaveBeenCalledWith("home", 4);
    expect(unavailable).toHaveBeenCalled();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/office/fallback-city.jpg");
    expect(screen.getByRole("status")).toHaveTextContent("3D is unavailable");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
  it("uses the current floor still and does not hang readiness on an image error", () => {
    const presented = vi.fn();
    render(<OfficeFallback floor="resources" view="resources" viewReset={5} onPresented={presented} />);
    fireEvent.error(screen.getByRole("img", { name: /Resources office above/ }));
    expect(screen.getByRole("img")).toHaveAttribute("src", "/office/fallback-resources.jpg");
    expect(presented).toHaveBeenCalledWith("resources", 5);
    expect(screen.getByRole("link", { name: "Ithaca — Read research" })).toHaveAttribute("href", "/#black-scholes");
    expect(screen.getByRole("link", { name: "Troy — Read research" })).toHaveAttribute("href", "/#troy-market-making");
    expect(screen.getByRole("link", { name: "Delphi — Read research" })).toHaveAttribute("href", "/#delphi-methods");
  });
  it("does not report the dormant HTML alternative inside a working canvas", () => {
    const presented = vi.fn(), unavailable = vi.fn();
    render(<canvas><OfficeFallback floor="home" onPresented={presented} onUnavailable={unavailable} /></canvas>);
    fireEvent.load(screen.getByAltText(/Home office above/));
    expect(presented).not.toHaveBeenCalled();
    expect(unavailable).not.toHaveBeenCalled();
  });
});
