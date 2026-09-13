import { describe, expect, it } from "vitest";
import { oklchToRgb, rgbToOklch } from "@/lib/color/convert";
import { clampOklchToGamut, clampRgb, isInGamut } from "@/lib/color/gamut";

/** Shortest distance between two hues in degrees, so 0 and 359.99 count as adjacent. */
const hueGap = (a: number, b: number) => {
  const raw = (((a - b) % 360) + 360) % 360;
  return Math.min(raw, 360 - raw);
};

describe("isInGamut", () => {
  it("accepts displayable channels", () => {
    expect(isInGamut([0, 0, 0])).toBe(true);
    expect(isInGamut([255, 255, 255])).toBe(true);
    expect(isInGamut([12.5, 200.25, 3])).toBe(true);
  });

  it("rejects channels outside 0-255", () => {
    expect(isInGamut([-1, 0, 0])).toBe(false);
    expect(isInGamut([0, 256, 0])).toBe(false);
    expect(isInGamut([0, 0, 300])).toBe(false);
  });
});

describe("clampRgb", () => {
  it("rounds and clamps every channel", () => {
    expect(clampRgb([-20, 127.5, 300])).toEqual([0, 128, 255]);
    expect(clampRgb([12.4, 12.6, 255.9])).toEqual([12, 13, 255]);
  });
});

describe("clampOklchToGamut", () => {
  it("leaves a displayable color alone apart from rounding", () => {
    const color = rgbToOklch([31, 145, 222]);
    expect(clampOklchToGamut(color)).toEqual([31, 145, 222]);
  });

  it("pulls an out of gamut color back while keeping lightness and hue", () => {
    const target = { l: 0.7, c: 0.4, h: 30 };
    expect(isInGamut(oklchToRgb(target))).toBe(false);

    const mapped = clampOklchToGamut(target);
    expect(isInGamut(mapped)).toBe(true);

    const back = rgbToOklch(mapped);
    expect(Math.abs(back.l - target.l)).toBeLessThan(0.01);
    expect(hueGap(back.h, target.h)).toBeLessThan(1);
    expect(back.c).toBeLessThan(target.c);
    expect(back.c).toBeGreaterThan(0.05);
  });

  it("maps every hue at an impossible chroma into gamut", () => {
    for (let h = 0; h < 360; h += 15) {
      const mapped = clampOklchToGamut({ l: 0.6, c: 0.5, h });
      expect(isInGamut(mapped)).toBe(true);
      const back = rgbToOklch(mapped);
      expect(Math.abs(back.l - 0.6)).toBeLessThan(0.01);
      expect(hueGap(back.h, h)).toBeLessThan(1);
    }
  });

  it("returns black and white at the lightness extremes", () => {
    expect(clampOklchToGamut({ l: 0, c: 0.3, h: 120 })).toEqual([0, 0, 0]);
    expect(clampOklchToGamut({ l: 1, c: 0.3, h: 120 })).toEqual([255, 255, 255]);
  });

  it("handles lightness outside 0-1 without leaving gamut", () => {
    expect(isInGamut(clampOklchToGamut({ l: 1.4, c: 0.2, h: 200 }))).toBe(true);
    expect(isInGamut(clampOklchToGamut({ l: -0.3, c: 0.2, h: 200 }))).toBe(true);
  });
});
