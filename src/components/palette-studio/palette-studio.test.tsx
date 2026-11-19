import { PaletteStudio } from "@/components/palette-studio/palette-studio";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("PaletteStudio", () => {
  it("opens on the drop zone", () => {
    render(<PaletteStudio />);

    expect(screen.getByText("Drop an image, click to choose, or paste")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Try a sample" })).toBeTruthy();
  });

  it("explains the three steps before an image arrives", () => {
    render(<PaletteStudio />);

    const steps = screen.getAllByRole("listitem");
    expect(steps).toHaveLength(3);
    expect(steps.map((step) => step.textContent)).toEqual([
      expect.stringContaining("Drop"),
      expect.stringContaining("Extract"),
      expect.stringContaining("Export"),
    ]);
  });

  it("holds back the palette and export sections until there is an image", () => {
    render(<PaletteStudio />);

    expect(screen.queryByRole("heading", { name: "Palette" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "Export" })).toBeNull();
  });
});
