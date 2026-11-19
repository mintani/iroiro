import { normalizeHue, rgbToOklch } from "./convert";
import { clampOklchToGamut } from "./gamut";
import type { Rgb } from "./types";

/** Lightest step a tint or a ramp reaches. */
const LIGHT_END = 0.97;

/** Darkest step a shade reaches. */
const SHADE_END = 0.15;

/** Darkest step a Tailwind-like ramp reaches. */
const RAMP_END = 0.2;

/** How much chroma a ramp loses at the far ends of the base color. */
const RAMP_CHROMA_FALLOFF = 0.65;

/** Rotates a color's OKLCH hue by `degrees`, keeping lightness and chroma, and maps it into sRGB. */
const rotate = (rgb: Rgb, degrees: number): Rgb => {
  const { l, c, h } = rgbToOklch(rgb);
  return clampOklchToGamut({ l, c, h: normalizeHue(h + degrees) });
};

/** The color opposite on the hue circle. */
export const complementary = (rgb: Rgb): Rgb[] => [rotate(rgb, 180)];

/** The two neighbours `angle` degrees to either side. */
export const analogous = (rgb: Rgb, angle = 30): Rgb[] => [rotate(rgb, -angle), rotate(rgb, angle)];

/** The two colors that complete an equilateral triangle on the hue circle. */
export const triadic = (rgb: Rgb): Rgb[] => [rotate(rgb, 120), rotate(rgb, 240)];

/** The two hues flanking the complement by `angle` degrees. */
export const splitComplementary = (rgb: Rgb, angle = 30): Rgb[] => [
  rotate(rgb, 180 - angle),
  rotate(rgb, 180 + angle),
];

/** The three colors that complete a rectangle on the hue circle. */
export const tetradic = (rgb: Rgb): Rgb[] => [rotate(rgb, 90), rotate(rgb, 180), rotate(rgb, 270)];

/** Lighter variants of a color, fading chroma out as lightness climbs toward white. */
export const tints = (rgb: Rgb, steps = 5): Rgb[] => {
  const { l, c, h } = rgbToOklch(rgb);
  return Array.from({ length: steps }, (_unused, index) => {
    const ratio = (index + 1) / steps;
    return clampOklchToGamut({ l: l + (LIGHT_END - l) * ratio, c: c * (1 - ratio), h });
  });
};

/** Darker variants of a color at the same hue and chroma. */
export const shades = (rgb: Rgb, steps = 5): Rgb[] => {
  const { l, c, h } = rgbToOklch(rgb);
  return Array.from({ length: steps }, (_unused, index) => {
    const ratio = (index + 1) / steps;
    return clampOklchToGamut({ l: l + (SHADE_END - l) * ratio, c, h });
  });
};

/** Progressively desaturated variants of a color at the same hue and lightness. */
export const tones = (rgb: Rgb, steps = 5): Rgb[] => {
  const { l, c, h } = rgbToOklch(rgb);
  return Array.from({ length: steps }, (_unused, index) => {
    const ratio = (index + 1) / steps;
    return clampOklchToGamut({ l, c: c * (1 - ratio), h });
  });
};

/**
 * A Tailwind-like 50 to 950 ramp that passes through the base color at whichever step sits
 * closest to its lightness, with chroma peaking there and easing off toward both ends.
 */
export const scale = (rgb: Rgb, steps = 11): Rgb[] => {
  const { l, c, h } = rgbToOklch(rgb);
  if (steps <= 1) return [clampOklchToGamut({ l, c, h })];
  const last = steps - 1;

  let anchor = 0;
  let anchorGap = Number.POSITIVE_INFINITY;
  for (let index = 0; index <= last; index++) {
    const gap = Math.abs(LIGHT_END + (RAMP_END - LIGHT_END) * (index / last) - l);
    if (gap < anchorGap) {
      anchorGap = gap;
      anchor = index;
    }
  }

  return Array.from({ length: steps }, (_unused, index) => {
    if (index === anchor) return clampOklchToGamut({ l, c, h });
    const span = index < anchor ? anchor : last - anchor;
    const distance = Math.abs(index - anchor) / span;
    const lightness =
      index < anchor
        ? LIGHT_END + (l - LIGHT_END) * (index / anchor)
        : l + (RAMP_END - l) * ((index - anchor) / (last - anchor));
    return clampOklchToGamut({ l: lightness, c: c * (1 - RAMP_CHROMA_FALLOFF * distance), h });
  });
};

/** Every hue-rotation harmony for one color, keyed by scheme name. */
export const harmonies = (
  rgb: Rgb
): {
  complementary: Rgb[];
  analogous: Rgb[];
  triadic: Rgb[];
  splitComplementary: Rgb[];
  tetradic: Rgb[];
} => ({
  complementary: complementary(rgb),
  analogous: analogous(rgb),
  triadic: triadic(rgb),
  splitComplementary: splitComplementary(rgb),
  tetradic: tetradic(rgb),
});
