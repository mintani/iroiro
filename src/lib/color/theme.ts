import { contrastRatio, ensureContrast, readableOn } from "./contrast";
import { deltaEOk, rgbToOklch } from "./convert";
import { clampOklchToGamut } from "./gamut";
import { analogous, splitComplementary } from "./harmony";
import type { Oklch, PaletteEntry, Rgb, Theme } from "./types";

/** Lightness window that keeps a brand color usable as a filled surface. */
const SURFACE_MIN_L = 0.35;
const SURFACE_MAX_L = 0.8;

/** Chroma a palette color may carry and still pass as a neutral candidate for the background. */
const NEUTRAL_MAX_C = 0.08;

/** Chroma the background, muted and border surfaces are allowed to keep. */
const TINT_C = 0.02;

/** Lightness of the generated background in each mode. */
const LIGHT_BACKGROUND_L = 0.96;
const DARK_BACKGROUND_L = 0.16;

/** Chroma above which a palette color is distinct enough to act as a secondary. */
const SECONDARY_MIN_C = 0.03;

/** Perceptual gap a candidate must open up against the primary to be worth using. */
const SECONDARY_MIN_GAP = 0.02;

/** Used when the palette has nothing to work with. */
const FALLBACK: Rgb = [110, 110, 110];

const clamp = (value: number, low: number, high: number) => Math.min(high, Math.max(low, value));

/** Pulls a lightness into the range that still reads as a filled surface. */
const toSurface = (oklch: Oklch): Rgb =>
  clampOklchToGamut({ ...oklch, l: clamp(oklch.l, SURFACE_MIN_L, SURFACE_MAX_L) });

/** Builds a foreground for a filled surface: black or white, tinted with the surface's own hue. */
const onSurface = (surface: Rgb): Rgb => {
  const { h } = rgbToOklch(surface);
  const wantsDarkInk = readableOn(surface)[0] < 128;
  const tinted = clampOklchToGamut({ l: wantsDarkInk ? 0.12 : 0.98, c: TINT_C, h });
  return ensureContrast(tinted, surface, 4.5);
};

/**
 * Derives a full semantic theme from an extracted palette. Picks the most present chromatic color
 * as the primary, then builds the neutrals around it so every foreground clears WCAG AA.
 */
export const suggestTheme = (palette: PaletteEntry[], mode: "light" | "dark"): Theme => {
  const entries: PaletteEntry[] = palette.length > 0 ? palette : [{ color: FALLBACK, share: 1 }];
  const colors = entries.map((entry) => ({ ...rgbToOklch(entry.color), share: entry.share }));

  // Prefer saturated colors, but let a color that covers much of the image win over a rare one.
  let brandIndex = 0;
  let brandScore = -1;
  for (let index = 0; index < colors.length; index++) {
    const score = colors[index].c * (0.3 + colors[index].share);
    if (score > brandScore) {
      brandScore = score;
      brandIndex = index;
    }
  }
  const primary = toSurface(colors[brandIndex]);
  const primaryHue = rgbToOklch(primary).h;

  const neutrals = colors.filter((color) => color.c <= NEUTRAL_MAX_C);
  const backdropSource = (neutrals.length > 0 ? neutrals : colors).reduce((lightest, color) =>
    color.l > lightest.l ? color : lightest
  );
  const background = clampOklchToGamut({
    l: mode === "light" ? Math.max(LIGHT_BACKGROUND_L, backdropSource.l) : DARK_BACKGROUND_L,
    c: Math.min(backdropSource.c, TINT_C),
    h: backdropSource.h,
  });
  const backgroundL = rgbToOklch(background).l;

  const darkest = colors.reduce((lowest, color) => (color.l < lowest.l ? color : lowest));
  const foreground = ensureContrast(
    clampOklchToGamut({ l: darkest.l, c: Math.min(darkest.c, 0.04), h: darkest.h }),
    background,
    7
  );

  const muted = clampOklchToGamut({
    l: backgroundL + (mode === "light" ? -0.04 : 0.04),
    c: 0.01,
    h: primaryHue,
  });
  const mutedForeground = ensureContrast(
    clampOklchToGamut({ l: mode === "light" ? 0.45 : 0.7, c: TINT_C, h: primaryHue }),
    muted,
    4.5
  );

  // The secondary is the remaining palette color that reads least like the primary. A palette with
  // nothing else chromatic to offer falls back to a neighbouring hue instead.
  let secondarySource: Oklch | null = null;
  let secondaryGap = SECONDARY_MIN_GAP;
  for (let index = 0; index < colors.length; index++) {
    if (index === brandIndex || colors[index].c <= SECONDARY_MIN_C) continue;
    const gap = deltaEOk(clampOklchToGamut(colors[index]), primary);
    if (gap > secondaryGap) {
      secondaryGap = gap;
      secondarySource = colors[index];
    }
  }
  const secondary = secondarySource
    ? toSurface(secondarySource)
    : toSurface(rgbToOklch(analogous(primary)[1]));

  const [firstSplit, secondSplit] = splitComplementary(primary);
  const accent = toSurface(
    rgbToOklch(
      contrastRatio(firstSplit, background) >= contrastRatio(secondSplit, background)
        ? firstSplit
        : secondSplit
    )
  );

  const border = clampOklchToGamut({
    l: backgroundL + (mode === "light" ? -0.08 : 0.08),
    c: Math.min(backdropSource.c, TINT_C),
    h: backdropSource.h,
  });

  return {
    background,
    foreground,
    primary,
    primaryForeground: onSurface(primary),
    secondary,
    secondaryForeground: onSurface(secondary),
    accent,
    accentForeground: onSurface(accent),
    muted,
    mutedForeground,
    border,
  };
};
