import { describe, expect, it } from "vitest";
import * as color from "@/lib/color";

/** Every runtime symbol the barrel is expected to expose. */
const EXPECTED = [
  "clampOklchToGamut",
  "clampRgb",
  "contrastGrade",
  "contrastRatio",
  "deltaE76",
  "deltaEOk",
  "ensureContrast",
  "extractPalette",
  "formatHex",
  "formatHsl",
  "formatOklch",
  "formatRgb",
  "harmonies",
  "hexToRgb",
  "hslToRgb",
  "isInGamut",
  "labToLch",
  "labToRgb",
  "labToXyz",
  "lchToLab",
  "linearToSrgb",
  "meetsAA",
  "meetsAAA",
  "normalizeHue",
  "oklabToRgb",
  "oklchToRgb",
  "readableOn",
  "relativeLuminance",
  "rgbToHex",
  "rgbToHsl",
  "rgbToLab",
  "rgbToLabInto",
  "rgbToOklab",
  "rgbToOklch",
  "rgbToXyz",
  "samplePixels",
  "scale",
  "shades",
  "splitComplementary",
  "srgbToLinear",
  "suggestTheme",
  "tetradic",
  "tints",
  "toCssVariables",
  "toHexList",
  "toJson",
  "toScss",
  "toTailwindTheme",
  "tones",
  "triadic",
  "analogous",
  "complementary",
  "xyzToLab",
  "xyzToRgb",
];

/** Runtime symbols the barrel exposes that are tables rather than functions. */
const EXPECTED_TABLES = ["SLOTS"];

describe("color barrel", () => {
  it("re-exports every function in the library", () => {
    const missing = EXPECTED.filter((name) => typeof Reflect.get(color, name) !== "function");
    expect(missing).toEqual([]);
  });

  it("exposes nothing beyond the expected surface", () => {
    expect(Object.keys(color).sort()).toEqual([...EXPECTED, ...EXPECTED_TABLES].sort());
  });

  it("works end to end from the barrel alone", () => {
    const pixels = new Uint8ClampedArray(300 * 4);
    for (let i = 0; i < 300; i++) {
      const source = i < 200 ? [37, 99, 235] : [250, 250, 249];
      pixels[i * 4] = source[0];
      pixels[i * 4 + 1] = source[1];
      pixels[i * 4 + 2] = source[2];
      pixels[i * 4 + 3] = 255;
    }
    const palette = color.extractPalette(
      color.samplePixels({ data: pixels, width: 30, height: 10 })
    );
    const theme = color.suggestTheme(palette, "light");
    expect(palette).toHaveLength(2);
    expect(color.meetsAA(theme.foreground, theme.background)).toBe(true);
    expect(color.toCssVariables(theme).split("\n")).toHaveLength(13);
  });
});
