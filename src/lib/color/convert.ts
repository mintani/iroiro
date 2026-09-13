import type { Hsl, Lab, Lch, Oklab, Oklch, Rgb, Xyz } from "./types";

/** CIE standard intent threshold, 216 / 24389. */
const EPSILON = 216 / 24389;
/** CIE standard slope of the linear segment, 24389 / 27. */
const KAPPA = 24389 / 27;

/** D65 white point shared by the CIELAB transfer and the sRGB matrices below. */
const WHITE_X = 0.95047;
const WHITE_Y = 1;
const WHITE_Z = 1.08883;

const clampChannel = (value: number): number => Math.min(255, Math.max(0, Math.round(value)));

/** Wraps a hue in degrees into [0, 360). */
export const normalizeHue = (hue: number): number => ((hue % 360) + 360) % 360;

/** Decodes one gamma-encoded sRGB channel in 0-1 to linear light. Sign preserving. */
export const srgbToLinear = (channel: number): number => {
  const magnitude = Math.abs(channel);
  const linear = magnitude <= 0.04045 ? magnitude / 12.92 : ((magnitude + 0.055) / 1.055) ** 2.4;
  return channel < 0 ? -linear : linear;
};

/** Encodes one linear-light channel in 0-1 back to gamma-encoded sRGB. Sign preserving. */
export const linearToSrgb = (channel: number): number => {
  const magnitude = Math.abs(channel);
  const encoded =
    magnitude <= 0.0031308 ? magnitude * 12.92 : 1.055 * magnitude ** (1 / 2.4) - 0.055;
  return channel < 0 ? -encoded : encoded;
};

/** Parses `#abc`, `#aabbcc`, or either without the `#`, case-insensitive. Returns null if invalid. */
export const hexToRgb = (hex: string): Rgb | null => {
  const body = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-f]+$/i.test(body)) return null;
  if (body.length === 3) {
    return [
      Number.parseInt(body[0] + body[0], 16),
      Number.parseInt(body[1] + body[1], 16),
      Number.parseInt(body[2] + body[2], 16),
    ];
  }
  if (body.length === 6) {
    return [
      Number.parseInt(body.slice(0, 2), 16),
      Number.parseInt(body.slice(2, 4), 16),
      Number.parseInt(body.slice(4, 6), 16),
    ];
  }
  return null;
};

/** Renders an sRGB triple as lowercase `#rrggbb`, rounding and clamping each channel. */
export const rgbToHex = (rgb: Rgb): string => {
  const hex = (value: number) => clampChannel(value).toString(16).padStart(2, "0");
  return `#${hex(rgb[0])}${hex(rgb[1])}${hex(rgb[2])}`;
};

/** Converts sRGB to CIE XYZ under D65. */
export const rgbToXyz = (rgb: Rgb): Xyz => {
  const r = srgbToLinear(rgb[0] / 255);
  const g = srgbToLinear(rgb[1] / 255);
  const b = srgbToLinear(rgb[2] / 255);
  return [
    0.4124564 * r + 0.3575761 * g + 0.1804375 * b,
    0.2126729 * r + 0.7151522 * g + 0.072175 * b,
    0.0193339 * r + 0.119192 * g + 0.9503041 * b,
  ];
};

/** Converts CIE XYZ under D65 to sRGB. Channels leave 0-255 when the color is out of gamut. */
export const xyzToRgb = (xyz: Xyz): Rgb => {
  const [x, y, z] = xyz;
  return [
    linearToSrgb(3.2404542 * x - 1.5371385 * y - 0.4985314 * z) * 255,
    linearToSrgb(-0.969266 * x + 1.8760108 * y + 0.041556 * z) * 255,
    linearToSrgb(0.0556434 * x - 0.2040259 * y + 1.0572252 * z) * 255,
  ];
};

const labTransfer = (ratio: number): number =>
  ratio > EPSILON ? Math.cbrt(ratio) : (KAPPA * ratio + 16) / 116;

/** Converts CIE XYZ to CIELAB under D65. */
export const xyzToLab = (xyz: Xyz): Lab => {
  const fx = labTransfer(xyz[0] / WHITE_X);
  const fy = labTransfer(xyz[1] / WHITE_Y);
  const fz = labTransfer(xyz[2] / WHITE_Z);
  return { l: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
};

/** Converts CIELAB back to CIE XYZ under D65. */
export const labToXyz = (lab: Lab): Xyz => {
  const fy = (lab.l + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;
  const fx3 = fx ** 3;
  const fz3 = fz ** 3;
  const xr = fx3 > EPSILON ? fx3 : (116 * fx - 16) / KAPPA;
  const yr = lab.l > KAPPA * EPSILON ? fy ** 3 : lab.l / KAPPA;
  const zr = fz3 > EPSILON ? fz3 : (116 * fz - 16) / KAPPA;
  return [xr * WHITE_X, yr * WHITE_Y, zr * WHITE_Z];
};

/** Converts sRGB to CIELAB under D65. */
export const rgbToLab = (rgb: Rgb): Lab => xyzToLab(rgbToXyz(rgb));

/** Converts CIELAB under D65 to sRGB, which may be out of gamut. */
export const labToRgb = (lab: Lab): Rgb => xyzToRgb(labToXyz(lab));

/**
 * Writes the CIELAB coordinates of one sRGB triple into `out` at `offset`.
 * Allocation-free twin of `rgbToLab`, for converting a whole image at once.
 */
export const rgbToLabInto = (
  r: number,
  g: number,
  b: number,
  out: Float32Array | Float64Array,
  offset: number
): void => {
  const rl = srgbToLinear(r / 255);
  const gl = srgbToLinear(g / 255);
  const bl = srgbToLinear(b / 255);
  const fx = labTransfer((0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / WHITE_X);
  const fy = labTransfer((0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl) / WHITE_Y);
  const fz = labTransfer((0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) / WHITE_Z);
  out[offset] = 116 * fy - 16;
  out[offset + 1] = 500 * (fx - fy);
  out[offset + 2] = 200 * (fy - fz);
};

/** Converts CIELAB to cylindrical CIELCH. Achromatic colors get hue 0. */
export const labToLch = (lab: Lab): Lch => {
  const c = Math.hypot(lab.a, lab.b);
  return {
    l: lab.l,
    c,
    h: c < 1e-6 ? 0 : normalizeHue((Math.atan2(lab.b, lab.a) * 180) / Math.PI),
  };
};

/** Converts cylindrical CIELCH back to CIELAB. */
export const lchToLab = (lch: Lch): Lab => {
  const radians = (lch.h * Math.PI) / 180;
  return { l: lch.l, a: lch.c * Math.cos(radians), b: lch.c * Math.sin(radians) };
};

/** Converts sRGB to OKLab using Bjoern Ottosson's matrices. */
export const rgbToOklab = (rgb: Rgb): Oklab => {
  const r = srgbToLinear(rgb[0] / 255);
  const g = srgbToLinear(rgb[1] / 255);
  const b = srgbToLinear(rgb[2] / 255);
  const lRoot = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const mRoot = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const sRoot = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * lRoot + 0.793617785 * mRoot - 0.0040720468 * sRoot,
    a: 1.9779984951 * lRoot - 2.428592205 * mRoot + 0.4505937099 * sRoot,
    b: 0.0259040371 * lRoot + 0.7827717662 * mRoot - 0.808675766 * sRoot,
  };
};

/** Converts OKLab back to sRGB, which may be out of gamut. */
export const oklabToRgb = (oklab: Oklab): Rgb => {
  const lRoot = oklab.l + 0.3963377774 * oklab.a + 0.2158037573 * oklab.b;
  const mRoot = oklab.l - 0.1055613458 * oklab.a - 0.0638541728 * oklab.b;
  const sRoot = oklab.l - 0.0894841775 * oklab.a - 1.291485548 * oklab.b;
  const l = lRoot ** 3;
  const m = mRoot ** 3;
  const s = sRoot ** 3;
  return [
    linearToSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255,
    linearToSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255,
    linearToSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s) * 255,
  ];
};

/** Converts sRGB to OKLCH with hue in [0, 360). Achromatic colors get hue 0. */
export const rgbToOklch = (rgb: Rgb): Oklch => {
  const { l, a, b } = rgbToOklab(rgb);
  const c = Math.hypot(a, b);
  return { l, c, h: c < 1e-6 ? 0 : normalizeHue((Math.atan2(b, a) * 180) / Math.PI) };
};

/** Converts OKLCH back to sRGB, which may be out of gamut. */
export const oklchToRgb = (oklch: Oklch): Rgb => {
  const radians = (oklch.h * Math.PI) / 180;
  return oklabToRgb({
    l: oklch.l,
    a: oklch.c * Math.cos(radians),
    b: oklch.c * Math.sin(radians),
  });
};

/** Converts sRGB to HSL with hue in [0, 360) and saturation and lightness as 0-100. */
export const rgbToHsl = (rgb: Rgb): Hsl => {
  const r = Math.min(255, Math.max(0, rgb[0])) / 255;
  const g = Math.min(255, Math.max(0, rgb[1])) / 255;
  const b = Math.min(255, Math.max(0, rgb[2])) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  const delta = max - min;
  if (delta < 1e-12) return { h: 0, s: 0, l: lightness * 100 };
  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  let hue: number;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  return { h: normalizeHue(hue), s: saturation * 100, l: lightness * 100 };
};

/** Converts HSL to sRGB. The hue is wrapped into [0, 360) first, so -30 and 330 agree. */
export const hslToRgb = (hsl: Hsl): Rgb => {
  const hue = normalizeHue(hsl.h);
  const saturation = Math.min(100, Math.max(0, hsl.s)) / 100;
  const lightness = Math.min(100, Math.max(0, hsl.l)) / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const second = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const base = lightness - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (hue < 60) {
    r = chroma;
    g = second;
  } else if (hue < 120) {
    r = second;
    g = chroma;
  } else if (hue < 180) {
    g = chroma;
    b = second;
  } else if (hue < 240) {
    g = second;
    b = chroma;
  } else if (hue < 300) {
    r = second;
    b = chroma;
  } else {
    r = chroma;
    b = second;
  }
  return [
    clampChannel((r + base) * 255),
    clampChannel((g + base) * 255),
    clampChannel((b + base) * 255),
  ];
};

/** CIE76 color difference: Euclidean distance in CIELAB. */
export const deltaE76 = (lab1: Lab, lab2: Lab): number =>
  Math.sqrt((lab1.l - lab2.l) ** 2 + (lab1.a - lab2.a) ** 2 + (lab1.b - lab2.b) ** 2);

/** Perceptual difference between two sRGB colors: Euclidean distance in OKLab. */
export const deltaEOk = (rgb1: Rgb, rgb2: Rgb): number => {
  const first = rgbToOklab(rgb1);
  const second = rgbToOklab(rgb2);
  return Math.sqrt(
    (first.l - second.l) ** 2 + (first.a - second.a) ** 2 + (first.b - second.b) ** 2
  );
};

/** CSS `#rrggbb`. */
export const formatHex = (rgb: Rgb): string => rgbToHex(rgb);

/** CSS `rgb(r g b)` with integer channels. */
export const formatRgb = (rgb: Rgb): string =>
  `rgb(${clampChannel(rgb[0])} ${clampChannel(rgb[1])} ${clampChannel(rgb[2])})`;

/** CSS `hsl(h s% l%)` with every component rounded to an integer. */
export const formatHsl = (rgb: Rgb): string => {
  const { h, s, l } = rgbToHsl(rgb);
  return `hsl(${Math.round(h)} ${Math.round(s)}% ${Math.round(l)}%)`;
};

/** CSS `oklch(l% c h)` with lightness as a percentage, chroma to 3 decimals and hue to 1. */
export const formatOklch = (rgb: Rgb): string => {
  const { l, c, h } = rgbToOklch(rgb);
  return `oklch(${(l * 100).toFixed(1)}% ${c.toFixed(3)} ${h.toFixed(1)})`;
};
