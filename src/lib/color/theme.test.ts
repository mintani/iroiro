import { describe, expect, it } from "vitest";
import { contrastRatio, meetsAA } from "@/lib/color/contrast";
import { rgbToOklch } from "@/lib/color/convert";
import { isInGamut } from "@/lib/color/gamut";
import { suggestTheme } from "@/lib/color/theme";
import type { PaletteEntry, Rgb, Theme } from "@/lib/color/types";

/** Deterministic PRNG so the palette sweep below is reproducible. */
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

/** Builds a palette of `size` random colors whose shares sum to 1. */
const randomPalette = (random: () => number, size: number): PaletteEntry[] => {
  const weights = Array.from({ length: size }, () => random() + 0.05);
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return weights.map((weight) => ({
    color: [random() * 255, random() * 255, random() * 255] as Rgb,
    share: weight / total,
  }));
};

/** The five foreground and surface pairs a theme must keep readable. */
const pairs = (theme: Theme): [string, Rgb, Rgb][] => [
  ["foreground", theme.foreground, theme.background],
  ["primaryForeground", theme.primaryForeground, theme.primary],
  ["secondaryForeground", theme.secondaryForeground, theme.secondary],
  ["accentForeground", theme.accentForeground, theme.accent],
  ["mutedForeground", theme.mutedForeground, theme.muted],
];

const MODES = ["light", "dark"] as const;

describe("suggestTheme", () => {
  it("fills every slot with an in gamut color", () => {
    const palette: PaletteEntry[] = [
      { color: [59, 130, 246], share: 0.5 },
      { color: [244, 244, 245], share: 0.3 },
      { color: [24, 24, 27], share: 0.2 },
    ];
    for (const mode of MODES) {
      const theme = suggestTheme(palette, mode);
      expect(Object.keys(theme)).toHaveLength(11);
      for (const color of Object.values(theme)) {
        expect(isInGamut(color)).toBe(true);
        expect(color.every((channel) => Number.isInteger(channel))).toBe(true);
      }
    }
  });

  it("keeps every foreground readable for 20 seeded random palettes in both modes", () => {
    const random = mulberry32(31337);
    const failures: string[] = [];
    for (let i = 0; i < 20; i++) {
      const palette = randomPalette(random, 3 + (i % 5));
      for (const mode of MODES) {
        const theme = suggestTheme(palette, mode);
        for (const [name, fg, bg] of pairs(theme)) {
          if (!meetsAA(fg, bg)) {
            failures.push(`${mode} ${name} ${contrastRatio(fg, bg).toFixed(2)}`);
          }
        }
      }
    }
    expect(failures).toEqual([]);
  });

  it("puts the background at the light or dark extreme", () => {
    const random = mulberry32(4242);
    for (let i = 0; i < 20; i++) {
      const palette = randomPalette(random, 4);
      expect(rgbToOklch(suggestTheme(palette, "light").background).l).toBeGreaterThanOrEqual(0.9);
      expect(rgbToOklch(suggestTheme(palette, "dark").background).l).toBeLessThanOrEqual(0.25);
    }
  });

  it("keeps the background nearly neutral and separates the border from it", () => {
    const palette: PaletteEntry[] = [
      { color: [220, 38, 38], share: 0.6 },
      { color: [250, 250, 249], share: 0.4 },
    ];
    for (const mode of MODES) {
      const theme = suggestTheme(palette, mode);
      expect(rgbToOklch(theme.background).c).toBeLessThanOrEqual(0.021);
      const gap = Math.abs(rgbToOklch(theme.border).l - rgbToOklch(theme.background).l);
      expect(gap).toBeGreaterThan(0.05);
      expect(gap).toBeLessThan(0.12);
    }
  });

  it("picks the saturated palette color as the primary", () => {
    const palette: PaletteEntry[] = [
      { color: [240, 240, 240], share: 0.7 },
      { color: [16, 185, 129], share: 0.3 },
    ];
    const primary = rgbToOklch(suggestTheme(palette, "light").primary);
    const source = rgbToOklch([16, 185, 129]);
    expect(Math.abs(primary.h - source.h)).toBeLessThan(2);
    expect(primary.l).toBeGreaterThanOrEqual(0.35);
    expect(primary.l).toBeLessThanOrEqual(0.8);
  });

  it("keeps the primary lightness inside the surface window", () => {
    const random = mulberry32(808);
    for (let i = 0; i < 20; i++) {
      const theme = suggestTheme(randomPalette(random, 4), "light");
      const primary = rgbToOklch(theme.primary);
      expect(primary.l).toBeGreaterThanOrEqual(0.34);
      expect(primary.l).toBeLessThanOrEqual(0.81);
    }
  });

  it("gives the secondary a different color from the primary", () => {
    const palette: PaletteEntry[] = [
      { color: [59, 130, 246], share: 0.5 },
      { color: [234, 88, 12], share: 0.5 },
    ];
    const theme = suggestTheme(palette, "light");
    expect(theme.secondary).not.toEqual(theme.primary);
  });

  it("survives a grayscale palette", () => {
    const palette: PaletteEntry[] = [
      { color: [17, 17, 17], share: 0.4 },
      { color: [128, 128, 128], share: 0.3 },
      { color: [238, 238, 238], share: 0.3 },
    ];
    for (const mode of MODES) {
      const theme = suggestTheme(palette, mode);
      for (const [, fg, bg] of pairs(theme)) expect(meetsAA(fg, bg)).toBe(true);
    }
  });

  it("survives an empty palette", () => {
    for (const mode of MODES) {
      const theme = suggestTheme([], mode);
      for (const [, fg, bg] of pairs(theme)) expect(meetsAA(fg, bg)).toBe(true);
    }
  });

  it("is deterministic", () => {
    const palette: PaletteEntry[] = [
      { color: [59, 130, 246], share: 0.6 },
      { color: [250, 204, 21], share: 0.4 },
    ];
    expect(suggestTheme(palette, "dark")).toEqual(suggestTheme(palette, "dark"));
  });
});
