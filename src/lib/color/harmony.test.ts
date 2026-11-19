import { describe, expect, it } from "vitest";
import { hexToRgb, rgbToOklch } from "@/lib/color/convert";
import { isInGamut } from "@/lib/color/gamut";
import {
  analogous,
  complementary,
  harmonies,
  scale,
  shades,
  splitComplementary,
  tetradic,
  tints,
  tones,
  triadic,
} from "@/lib/color/harmony";
import type { Rgb } from "@/lib/color/types";

const BASE = hexToRgb("#3b82f6") as Rgb;
const BASE_HUE = rgbToOklch(BASE).h;

/** Shortest distance between two hues in degrees. */
const hueGap = (a: number, b: number) => {
  const raw = (((a - b) % 360) + 360) % 360;
  return Math.min(raw, 360 - raw);
};

const hueOf = (rgb: Rgb) => rgbToOklch(rgb).h;
const lightnessOf = (rgb: Rgb) => rgbToOklch(rgb).l;

describe("complementary", () => {
  it("returns one color opposite the base hue", () => {
    const result = complementary(BASE);
    expect(result).toHaveLength(1);
    expect(hueGap(hueOf(result[0]), BASE_HUE + 180)).toBeLessThan(1);
  });
});

describe("analogous", () => {
  it("returns the two neighbours 30 degrees out by default", () => {
    const result = analogous(BASE);
    expect(result).toHaveLength(2);
    expect(hueGap(hueOf(result[0]), BASE_HUE - 30)).toBeLessThan(1);
    expect(hueGap(hueOf(result[1]), BASE_HUE + 30)).toBeLessThan(1);
  });

  it("honors a custom angle", () => {
    const result = analogous(BASE, 15);
    expect(hueGap(hueOf(result[0]), BASE_HUE - 15)).toBeLessThan(1);
    expect(hueGap(hueOf(result[1]), BASE_HUE + 15)).toBeLessThan(1);
  });
});

describe("triadic", () => {
  it("returns two colors 120 degrees apart", () => {
    const result = triadic(BASE);
    expect(result).toHaveLength(2);
    expect(hueGap(hueOf(result[0]), BASE_HUE + 120)).toBeLessThan(1);
    expect(hueGap(hueOf(result[1]), BASE_HUE + 240)).toBeLessThan(1);
  });
});

describe("splitComplementary", () => {
  it("returns the two hues flanking the complement", () => {
    const result = splitComplementary(BASE);
    expect(result).toHaveLength(2);
    expect(hueGap(hueOf(result[0]), BASE_HUE + 150)).toBeLessThan(1);
    expect(hueGap(hueOf(result[1]), BASE_HUE + 210)).toBeLessThan(1);
  });
});

describe("tetradic", () => {
  it("returns three colors at 90, 180 and 270 degrees", () => {
    const result = tetradic(BASE);
    expect(result).toHaveLength(3);
    expect(hueGap(hueOf(result[0]), BASE_HUE + 90)).toBeLessThan(1);
    expect(hueGap(hueOf(result[1]), BASE_HUE + 180)).toBeLessThan(1);
    expect(hueGap(hueOf(result[2]), BASE_HUE + 270)).toBeLessThan(1);
  });
});

describe("tints", () => {
  it("climbs in lightness on every step", () => {
    const result = tints(BASE);
    expect(result).toHaveLength(5);
    let previous = lightnessOf(BASE);
    for (const color of result) {
      const current = lightnessOf(color);
      expect(current).toBeGreaterThan(previous);
      previous = current;
    }
  });

  it("fades chroma out toward the light end", () => {
    const result = tints(BASE);
    expect(rgbToOklch(result[4]).c).toBeLessThan(rgbToOklch(result[0]).c);
    expect(rgbToOklch(result[4]).c).toBeLessThan(0.01);
  });

  it("honors a custom step count", () => {
    expect(tints(BASE, 3)).toHaveLength(3);
  });
});

describe("shades", () => {
  it("falls in lightness on every step", () => {
    const result = shades(BASE);
    expect(result).toHaveLength(5);
    let previous = lightnessOf(BASE);
    for (const color of result) {
      const current = lightnessOf(color);
      expect(current).toBeLessThan(previous);
      previous = current;
    }
  });
});

describe("tones", () => {
  it("drops chroma toward zero while holding lightness", () => {
    const result = tones(BASE);
    expect(result).toHaveLength(5);
    let previous = rgbToOklch(BASE).c;
    for (const color of result) {
      const current = rgbToOklch(color).c;
      expect(current).toBeLessThan(previous);
      previous = current;
    }
    expect(rgbToOklch(result[4]).c).toBeLessThan(0.01);
    expect(Math.abs(lightnessOf(result[4]) - lightnessOf(BASE))).toBeLessThan(0.01);
  });
});

describe("scale", () => {
  it("returns eleven steps with falling lightness", () => {
    const result = scale(BASE);
    expect(result).toHaveLength(11);
    for (let index = 1; index < result.length; index++) {
      expect(lightnessOf(result[index])).toBeLessThan(lightnessOf(result[index - 1]));
    }
  });

  it("starts near white and ends near the dark end", () => {
    const result = scale(BASE);
    expect(lightnessOf(result[0])).toBeGreaterThan(0.9);
    expect(lightnessOf(result[10])).toBeLessThan(0.3);
  });

  it("peaks in chroma at the step closest to the base lightness", () => {
    const result = scale(BASE);
    const chromas = result.map((color) => rgbToOklch(color).c);
    const peak = chromas.indexOf(Math.max(...chromas));
    expect(hueGap(hueOf(result[peak]), BASE_HUE)).toBeLessThan(1);
    expect(Math.abs(lightnessOf(result[peak]) - lightnessOf(BASE))).toBeLessThan(0.01);
  });

  it("stays monotonic for very light and very dark bases", () => {
    for (const hex of ["#fefefe", "#050505", "#fff8e1", "#0b1120"]) {
      const result = scale(hexToRgb(hex) as Rgb);
      expect(result).toHaveLength(11);
      for (let index = 1; index < result.length; index++) {
        expect(lightnessOf(result[index])).toBeLessThanOrEqual(lightnessOf(result[index - 1]));
      }
    }
  });

  it("honors a custom step count", () => {
    expect(scale(BASE, 5)).toHaveLength(5);
    expect(scale(BASE, 1)).toHaveLength(1);
  });
});

describe("harmonies", () => {
  it("bundles every scheme and keeps all output in gamut", () => {
    const result = harmonies(BASE);
    expect(Object.keys(result).sort()).toEqual([
      "analogous",
      "complementary",
      "splitComplementary",
      "tetradic",
      "triadic",
    ]);
    for (const colors of Object.values(result)) {
      for (const color of colors) expect(isInGamut(color)).toBe(true);
    }
  });

  it("keeps every ramp in gamut for a range of bases", () => {
    for (const hex of ["#3b82f6", "#ff0000", "#00ff00", "#123456", "#fafafa", "#101010"]) {
      const base = hexToRgb(hex) as Rgb;
      const all = [
        ...tints(base),
        ...shades(base),
        ...tones(base),
        ...scale(base),
        ...Object.values(harmonies(base)).flat(),
      ];
      for (const color of all) expect(isInGamut(color)).toBe(true);
    }
  });
});
