import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  ensureContrast,
  meetsAA,
  meetsAAA,
  readableOn,
  relativeLuminance,
} from "@/lib/color/contrast";
import { hexToRgb, rgbToOklch } from "@/lib/color/convert";
import { isInGamut } from "@/lib/color/gamut";
import type { Rgb } from "@/lib/color/types";

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];

/** Shortest distance between two hues in degrees. */
const hueGap = (a: number, b: number) => {
  const raw = (((a - b) % 360) + 360) % 360;
  return Math.min(raw, 360 - raw);
};

/** Deterministic PRNG so the random pair sweep is reproducible. */
const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

describe("relativeLuminance", () => {
  it("spans 0 to 1", () => {
    expect(relativeLuminance(BLACK)).toBe(0);
    expect(relativeLuminance(WHITE)).toBeCloseTo(1, 10);
  });

  it("weights green most heavily", () => {
    expect(relativeLuminance([0, 255, 0])).toBeGreaterThan(relativeLuminance([255, 0, 0]));
    expect(relativeLuminance([255, 0, 0])).toBeGreaterThan(relativeLuminance([0, 0, 255]));
  });
});

describe("contrastRatio", () => {
  it("is 21 for black against white", () => {
    expect(contrastRatio(BLACK, WHITE)).toBeCloseTo(21, 10);
    expect(contrastRatio(WHITE, BLACK)).toBeCloseTo(21, 10);
  });

  it("is 1 for a color against itself", () => {
    expect(contrastRatio([31, 145, 222], [31, 145, 222])).toBeCloseTo(1, 10);
  });

  it("matches the known ratio for mid gray on white", () => {
    expect(contrastRatio(hexToRgb("#777777") as Rgb, WHITE)).toBeCloseTo(4.48, 2);
  });

  it("never drops below 1", () => {
    const random = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const a: Rgb = [random() * 255, random() * 255, random() * 255];
      const b: Rgb = [random() * 255, random() * 255, random() * 255];
      expect(contrastRatio(a, b)).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("meetsAA and meetsAAA", () => {
  it("applies the normal and large text thresholds", () => {
    const gray = hexToRgb("#777777") as Rgb;
    expect(meetsAA(gray, WHITE)).toBe(false);
    expect(meetsAA(gray, WHITE, { large: true })).toBe(true);
    expect(meetsAAA(BLACK, WHITE)).toBe(true);
    expect(meetsAAA(gray, WHITE)).toBe(false);
    expect(meetsAAA(gray, WHITE, { large: true })).toBe(false);
  });
});

describe("readableOn", () => {
  it("picks the higher contrast of black and white", () => {
    expect(readableOn(WHITE)).toEqual(BLACK);
    expect(readableOn(BLACK)).toEqual(WHITE);
    expect(readableOn(hexToRgb("#f5f5f5") as Rgb)).toEqual(BLACK);
    expect(readableOn(hexToRgb("#1f2933") as Rgb)).toEqual(WHITE);
  });
});

describe("ensureContrast", () => {
  it("leaves a pair that already passes untouched", () => {
    expect(ensureContrast(BLACK, WHITE)).toEqual(BLACK);
  });

  it("reaches the target for 50 seeded random pairs", () => {
    const random = mulberry32(42);
    for (let i = 0; i < 50; i++) {
      const fg: Rgb = [random() * 255, random() * 255, random() * 255];
      const bg: Rgb = [random() * 255, random() * 255, random() * 255];
      const fixed = ensureContrast(fg, bg);
      expect(isInGamut(fixed)).toBe(true);
      expect(contrastRatio(fixed, bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("honors a stricter target where one is reachable", () => {
    const bg = hexToRgb("#ffffff") as Rgb;
    const fixed = ensureContrast(hexToRgb("#8ab4f8") as Rgb, bg, 7);
    expect(contrastRatio(fixed, bg)).toBeGreaterThanOrEqual(7);
  });

  // Below roughly 0.08 chroma, 8-bit quantization moves the measured hue by several degrees on
  // its own, so the hue of a near-gray result carries no information to preserve.
  it("keeps the hue when the result is still chromatic", () => {
    const random = mulberry32(2024);
    const gaps: number[] = [];
    for (let i = 0; i < 50; i++) {
      const fg: Rgb = [random() * 255, random() * 255, random() * 255];
      const bg: Rgb = [random() * 255, random() * 255, random() * 255];
      const source = rgbToOklch(fg);
      const result = rgbToOklch(ensureContrast(fg, bg));
      if (source.c > 0.08 && result.c > 0.08) gaps.push(hueGap(result.h, source.h));
    }
    expect(gaps.length).toBeGreaterThan(10);
    expect(Math.max(...gaps)).toBeLessThan(2);
  });

  it("falls back to black or white when the target is unreachable", () => {
    const bg = hexToRgb("#767676") as Rgb;
    const fixed = ensureContrast(hexToRgb("#767676") as Rgb, bg, 21);
    expect([BLACK, WHITE]).toContainEqual(fixed);
  });
});
