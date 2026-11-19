import { describe, expect, it } from "vitest";
import {
  deltaE76,
  deltaEOk,
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  hexToRgb,
  hslToRgb,
  labToLch,
  labToRgb,
  labToXyz,
  lchToLab,
  linearToSrgb,
  normalizeHue,
  oklabToRgb,
  oklchToRgb,
  rgbToHex,
  rgbToHsl,
  rgbToLab,
  rgbToLabInto,
  rgbToOklab,
  rgbToOklch,
  rgbToXyz,
  srgbToLinear,
  xyzToLab,
  xyzToRgb,
} from "@/lib/color/convert";
import type { Rgb } from "@/lib/color/types";

const RED: Rgb = [255, 0, 0];
const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

describe("hexToRgb", () => {
  it("parses six digit hex with and without the hash", () => {
    expect(hexToRgb("#ff8800")).toEqual([255, 136, 0]);
    expect(hexToRgb("ff8800")).toEqual([255, 136, 0]);
  });

  it("expands three digit shorthand", () => {
    expect(hexToRgb("#abc")).toEqual([170, 187, 204]);
    expect(hexToRgb("abc")).toEqual([170, 187, 204]);
  });

  it("is case insensitive and ignores surrounding space", () => {
    expect(hexToRgb("  #FfAaBB ")).toEqual([255, 170, 187]);
  });

  it("returns null for invalid input", () => {
    expect(hexToRgb("")).toBeNull();
    expect(hexToRgb("#")).toBeNull();
    expect(hexToRgb("#ff")).toBeNull();
    expect(hexToRgb("#ffff")).toBeNull();
    expect(hexToRgb("#fffffff")).toBeNull();
    expect(hexToRgb("#gghhii")).toBeNull();
    expect(hexToRgb("rgb(1 2 3)")).toBeNull();
  });
});

describe("rgbToHex", () => {
  it("emits lowercase six digit hex", () => {
    expect(rgbToHex([255, 136, 0])).toBe("#ff8800");
  });

  it("rounds and clamps out of range channels", () => {
    expect(rgbToHex([-20, 127.5, 300])).toBe("#0080ff");
  });

  it("round trips a grid of colors", () => {
    for (let r = 0; r <= 255; r += 17) {
      for (let g = 0; g <= 255; g += 51) {
        for (let b = 0; b <= 255; b += 85) {
          const hex = rgbToHex([r, g, b]);
          expect(hexToRgb(hex)).toEqual([r, g, b]);
        }
      }
    }
  });
});

describe("srgbToLinear and linearToSrgb", () => {
  it("are inverses over 0-1", () => {
    for (let i = 0; i <= 20; i++) {
      const value = i / 20;
      expect(linearToSrgb(srgbToLinear(value))).toBeCloseTo(value, 10);
    }
  });

  it("keeps the endpoints and preserves sign", () => {
    expect(srgbToLinear(0)).toBe(0);
    expect(srgbToLinear(1)).toBeCloseTo(1, 10);
    expect(srgbToLinear(-0.5)).toBeCloseTo(-srgbToLinear(0.5), 12);
    expect(linearToSrgb(-0.5)).toBeCloseTo(-linearToSrgb(0.5), 12);
  });
});

describe("rgbToLab", () => {
  it("matches the reference CIELAB value for red", () => {
    const lab = rgbToLab(RED);
    expect(lab.l).toBeCloseTo(53.24, 1);
    expect(lab.a).toBeCloseTo(80.09, 1);
    expect(lab.b).toBeCloseTo(67.2, 1);
  });

  it("puts white at l 100 and black at l 0 with no chroma", () => {
    const white = rgbToLab(WHITE);
    expect(white.l).toBeCloseTo(100, 4);
    expect(Math.hypot(white.a, white.b)).toBeLessThan(0.01);
    expect(rgbToLab(BLACK).l).toBeCloseTo(0, 10);
  });

  it("round trips through labToRgb", () => {
    for (const color of [RED, WHITE, BLACK, [18, 52, 86], [200, 130, 60]] as Rgb[]) {
      const back = labToRgb(rgbToLab(color));
      expect(back[0]).toBeCloseTo(color[0], 3);
      expect(back[1]).toBeCloseTo(color[1], 3);
      expect(back[2]).toBeCloseTo(color[2], 3);
    }
  });

  it("agrees with rgbToLabInto", () => {
    const out = new Float64Array(3);
    rgbToLabInto(200, 130, 60, out, 0);
    const lab = rgbToLab([200, 130, 60]);
    expect(out[0]).toBeCloseTo(lab.l, 10);
    expect(out[1]).toBeCloseTo(lab.a, 10);
    expect(out[2]).toBeCloseTo(lab.b, 10);
  });
});

describe("xyz conversions", () => {
  it("round trip rgb to xyz and back", () => {
    const back = xyzToRgb(rgbToXyz([31, 145, 222]));
    expect(back[0]).toBeCloseTo(31, 3);
    expect(back[1]).toBeCloseTo(145, 3);
    expect(back[2]).toBeCloseTo(222, 3);
  });

  it("round trip xyz to lab and back", () => {
    const xyz = rgbToXyz([31, 145, 222]);
    const back = labToXyz(xyzToLab(xyz));
    expect(back[0]).toBeCloseTo(xyz[0], 10);
    expect(back[1]).toBeCloseTo(xyz[1], 10);
    expect(back[2]).toBeCloseTo(xyz[2], 10);
  });

  it("puts white at the D65 reference point", () => {
    const [x, y, z] = rgbToXyz(WHITE);
    expect(x).toBeCloseTo(0.9505, 3);
    expect(y).toBeCloseTo(1, 6);
    expect(z).toBeCloseTo(1.089, 3);
  });
});

describe("labToLch and lchToLab", () => {
  it("round trips and reports hue in degrees", () => {
    const lab = rgbToLab(RED);
    const lch = labToLch(lab);
    expect(lch.l).toBeCloseTo(lab.l, 10);
    expect(lch.c).toBeCloseTo(Math.hypot(lab.a, lab.b), 10);
    expect(lch.h).toBeCloseTo(39.99, 1);
    const back = lchToLab(lch);
    expect(back.a).toBeCloseTo(lab.a, 8);
    expect(back.b).toBeCloseTo(lab.b, 8);
  });

  it("reports hue 0 for achromatic colors", () => {
    expect(labToLch({ l: 50, a: 0, b: 0 }).h).toBe(0);
  });
});

describe("rgbToOklch", () => {
  it("matches the reference OKLCH value for red", () => {
    const { l, c, h } = rgbToOklch(RED);
    expect(l).toBeCloseTo(0.628, 2);
    expect(Math.abs(l - 0.628)).toBeLessThan(0.005);
    expect(Math.abs(c - 0.258)).toBeLessThan(0.005);
    expect(Math.abs(h - 29.2)).toBeLessThan(0.5);
  });

  it("puts white at lightness 1 with no chroma and hue 0", () => {
    const { l, c, h } = rgbToOklch(WHITE);
    expect(l).toBeCloseTo(1, 6);
    expect(c).toBeLessThan(1e-6);
    expect(h).toBe(0);
  });

  it("puts black at lightness 0", () => {
    expect(rgbToOklch(BLACK).l).toBeCloseTo(0, 10);
  });

  it("round trips through oklchToRgb", () => {
    for (const color of [RED, WHITE, BLACK, [18, 52, 86], [200, 130, 60]] as Rgb[]) {
      const back = oklchToRgb(rgbToOklch(color));
      expect(back[0]).toBeCloseTo(color[0], 3);
      expect(back[1]).toBeCloseTo(color[1], 3);
      expect(back[2]).toBeCloseTo(color[2], 3);
    }
  });

  it("round trips through oklabToRgb", () => {
    const back = oklabToRgb(rgbToOklab([18, 52, 86]));
    expect(back[0]).toBeCloseTo(18, 3);
    expect(back[1]).toBeCloseTo(52, 3);
    expect(back[2]).toBeCloseTo(86, 3);
  });
});

describe("normalizeHue", () => {
  it("wraps into [0, 360)", () => {
    expect(normalizeHue(-30)).toBe(330);
    expect(normalizeHue(390)).toBe(30);
    expect(normalizeHue(360)).toBe(0);
    expect(normalizeHue(0)).toBe(0);
  });
});

describe("hslToRgb", () => {
  it("handles a negative hue by wrapping it first", () => {
    expect(hslToRgb({ h: -30, s: 100, l: 50 })).toEqual([255, 0, 128]);
  });

  it("treats a hue above 360 like its wrapped value", () => {
    expect(hslToRgb({ h: 390, s: 100, l: 50 })).toEqual(hslToRgb({ h: 30, s: 100, l: 50 }));
    expect(hslToRgb({ h: -330, s: 64, l: 42 })).toEqual(hslToRgb({ h: 30, s: 64, l: 42 }));
  });

  it("converts the primary hues", () => {
    expect(hslToRgb({ h: 0, s: 100, l: 50 })).toEqual([255, 0, 0]);
    expect(hslToRgb({ h: 120, s: 100, l: 50 })).toEqual([0, 255, 0]);
    expect(hslToRgb({ h: 240, s: 100, l: 50 })).toEqual([0, 0, 255]);
    expect(hslToRgb({ h: 0, s: 0, l: 100 })).toEqual([255, 255, 255]);
  });

  it("round trips with rgbToHsl", () => {
    for (const color of [
      [255, 0, 0],
      [18, 52, 86],
      [200, 130, 60],
      [128, 128, 128],
    ] as Rgb[]) {
      expect(hslToRgb(rgbToHsl(color))).toEqual(color);
    }
  });
});

describe("rgbToHsl", () => {
  it("reports hue 0 and saturation 0 for gray", () => {
    expect(rgbToHsl([128, 128, 128])).toEqual({ h: 0, s: 0, l: (128 / 255) * 100 });
  });

  it("keeps hue in [0, 360) for every channel ordering", () => {
    for (const color of [
      [255, 0, 0],
      [255, 255, 0],
      [0, 255, 0],
      [0, 255, 255],
      [0, 0, 255],
      [255, 0, 255],
    ] as Rgb[]) {
      const { h } = rgbToHsl(color);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });
});

describe("deltaE76 and deltaEOk", () => {
  it("are zero for identical colors", () => {
    expect(deltaE76(rgbToLab(RED), rgbToLab(RED))).toBe(0);
    expect(deltaEOk(RED, RED)).toBe(0);
  });

  it("grow with perceptual distance", () => {
    const near = deltaEOk([100, 100, 100], [104, 100, 100]);
    const far = deltaEOk([100, 100, 100], [200, 30, 10]);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
    expect(deltaE76(rgbToLab(WHITE), rgbToLab(BLACK))).toBeCloseTo(100, 3);
  });
});

describe("css formatters", () => {
  it("formats hex and rgb", () => {
    expect(formatHex([255, 136, 0])).toBe("#ff8800");
    expect(formatRgb([255.4, 136.6, -3])).toBe("rgb(255 137 0)");
  });

  it("formats hsl with rounded components", () => {
    expect(formatHsl(RED)).toBe("hsl(0 100% 50%)");
    expect(formatHsl(WHITE)).toBe("hsl(0 0% 100%)");
  });

  it("formats oklch with percent lightness and fixed precision", () => {
    expect(formatOklch(RED)).toBe("oklch(62.8% 0.258 29.2)");
    expect(formatOklch(WHITE)).toBe("oklch(100.0% 0.000 0.0)");
  });
});
