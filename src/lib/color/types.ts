/** Gamma-encoded sRGB, channels in 0-255. Intermediate values may be fractional or out of range. */
export type Rgb = readonly [number, number, number];

/** CIE 1931 XYZ relative to the D65 white point, Y normalized to 1 for white. */
export type Xyz = readonly [number, number, number];

/** CIELAB relative to D65: `l` 0-100, `a`/`b` roughly -128..128. */
export type Lab = { l: number; a: number; b: number };

/** Cylindrical CIELAB: `l` 0-100, `c` >= 0, `h` in degrees 0-360. */
export type Lch = { l: number; c: number; h: number };

/** OKLab: `l` 0-1, `a`/`b` roughly -0.4..0.4. */
export type Oklab = { l: number; a: number; b: number };

/** Cylindrical OKLab: `l` 0-1, `c` >= 0, `h` in degrees 0-360. */
export type Oklch = { l: number; c: number; h: number };

/** HSL: `h` in degrees, `s` and `l` as percentages 0-100. */
export type Hsl = { h: number; s: number; l: number };

/** One extracted palette color and the fraction of sampled pixels it covers. */
export type PaletteEntry = { color: Rgb; share: number };

/** A shadcn-style semantic color set. Every `*Foreground` is readable on its own surface. */
export type Theme = {
  background: Rgb;
  foreground: Rgb;
  primary: Rgb;
  primaryForeground: Rgb;
  secondary: Rgb;
  secondaryForeground: Rgb;
  accent: Rgb;
  accentForeground: Rgb;
  muted: Rgb;
  mutedForeground: Rgb;
  border: Rgb;
};
