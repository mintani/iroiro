import { rgbToOklch, srgbToLinear } from "./convert";
import { clampOklchToGamut, clampRgb } from "./gamut";
import type { Rgb } from "./types";

const BLACK: Rgb = [0, 0, 0];
const WHITE: Rgb = [255, 255, 255];

/** Number of bisection steps used when hunting for a readable lightness. */
const SEARCH_STEPS = 20;

/** WCAG 2.x relative luminance of an sRGB color, 0 for black and 1 for white. */
export const relativeLuminance = (rgb: Rgb): number => {
  const channel = (value: number) => srgbToLinear(Math.min(255, Math.max(0, value)) / 255);
  return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
};

/** WCAG 2.x contrast ratio between two colors, from 1 (identical) to 21 (black on white). */
export const contrastRatio = (a: Rgb, b: Rgb): number => {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
};

/** True when the pair clears WCAG AA: 4.5:1, or 3:1 for large text. */
export const meetsAA = (fg: Rgb, bg: Rgb, options?: { large?: boolean }): boolean =>
  contrastRatio(fg, bg) >= (options?.large ? 3 : 4.5);

/** True when the pair clears WCAG AAA: 7:1, or 4.5:1 for large text. */
export const meetsAAA = (fg: Rgb, bg: Rgb, options?: { large?: boolean }): boolean =>
  contrastRatio(fg, bg) >= (options?.large ? 4.5 : 7);

/** Picks black or white, whichever reads better on the given background. */
export const readableOn = (bg: Rgb): Rgb =>
  contrastRatio(WHITE, bg) >= contrastRatio(BLACK, bg) ? WHITE : BLACK;

/**
 * Nudges a foreground's OKLCH lightness until it clears `target` against `bg`, keeping hue and
 * chroma. Tries moving away from the background first, then the other way, then falls back to
 * plain black or white.
 */
export const ensureContrast = (fg: Rgb, bg: Rgb, target = 4.5): Rgb => {
  if (contrastRatio(fg, bg) >= target) return clampRgb(fg);

  const { l: startL, c, h } = rgbToOklch(fg);
  const at = (lightness: number) => clampOklchToGamut({ l: lightness, c, h });

  const search = (endL: number): Rgb | null => {
    if (contrastRatio(at(endL), bg) < target) return null;
    let miss = startL;
    let hit = endL;
    for (let step = 0; step < SEARCH_STEPS; step++) {
      const middle = (miss + hit) / 2;
      if (contrastRatio(at(middle), bg) >= target) hit = middle;
      else miss = middle;
    }
    return at(hit);
  };

  const away = rgbToOklch(bg).l >= 0.5 ? 0 : 1;
  return search(away) ?? search(1 - away) ?? readableOn(bg);
};
