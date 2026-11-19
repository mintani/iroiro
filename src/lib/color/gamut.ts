import { oklchToRgb } from "./convert";
import type { Oklch, Rgb } from "./types";

/** Slack for floating point error when testing channel bounds. */
const TOLERANCE = 1e-4;

/** Number of bisection steps used to search for the largest displayable chroma. */
const SEARCH_STEPS = 24;

/** True when every channel already sits inside 0-255. */
export const isInGamut = (rgb: Rgb): boolean =>
  rgb[0] >= -TOLERANCE &&
  rgb[0] <= 255 + TOLERANCE &&
  rgb[1] >= -TOLERANCE &&
  rgb[1] <= 255 + TOLERANCE &&
  rgb[2] >= -TOLERANCE &&
  rgb[2] <= 255 + TOLERANCE;

/** Rounds each channel to an integer inside 0-255. */
export const clampRgb = (rgb: Rgb): Rgb => [
  Math.min(255, Math.max(0, Math.round(rgb[0]))),
  Math.min(255, Math.max(0, Math.round(rgb[1]))),
  Math.min(255, Math.max(0, Math.round(rgb[2]))),
];

/**
 * Maps an OKLCH color into sRGB by bisecting its chroma down until it is displayable.
 * Lightness and hue are kept, so the result is the most colorful sRGB match for that hue.
 */
export const clampOklchToGamut = (oklch: Oklch): Rgb => {
  const direct = oklchToRgb(oklch);
  if (isInGamut(direct)) return clampRgb(direct);

  let low = 0;
  let high = Math.max(0, oklch.c);
  for (let step = 0; step < SEARCH_STEPS; step++) {
    const middle = (low + high) / 2;
    if (isInGamut(oklchToRgb({ l: oklch.l, c: middle, h: oklch.h }))) low = middle;
    else high = middle;
  }
  return clampRgb(oklchToRgb({ l: oklch.l, c: low, h: oklch.h }));
};
