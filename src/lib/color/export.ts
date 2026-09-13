import { formatOklch, rgbToHex } from "./convert";
import type { PaletteEntry, Rgb, Theme } from "./types";

/** How a theme color is written into a stylesheet. */
export type ColorFormat = "hex" | "oklch";

/** Options for `toCssVariables`. */
export type CssVariablesOptions = { selector?: string; format?: ColorFormat };

/** The theme slots in the order every exporter emits them, paired with their CSS variable name. */
const SLOTS: [keyof Theme, string][] = [
  ["background", "background"],
  ["foreground", "foreground"],
  ["primary", "primary"],
  ["primaryForeground", "primary-foreground"],
  ["secondary", "secondary"],
  ["secondaryForeground", "secondary-foreground"],
  ["accent", "accent"],
  ["accentForeground", "accent-foreground"],
  ["muted", "muted"],
  ["mutedForeground", "muted-foreground"],
  ["border", "border"],
];

const render = (color: Rgb, format: ColorFormat): string =>
  format === "oklch" ? formatOklch(color) : rgbToHex(color);

/** Wraps declaration lines in a block, one declaration per line and two space indentation. */
const block = (head: string, declarations: string[]): string =>
  `${head} {\n${declarations.map((line) => `  ${line}`).join("\n")}\n}`;

/** A CSS custom property block, `:root` by default, with one variable per theme slot. */
export const toCssVariables = (theme: Theme, options?: CssVariablesOptions): string =>
  block(
    options?.selector ?? ":root",
    SLOTS.map(([slot, name]) => `--${name}: ${render(theme[slot], options?.format ?? "hex")};`)
  );

/** The `:root` block plus the Tailwind v4 `@theme inline` block that maps it to color utilities. */
export const toTailwindTheme = (theme: Theme): string =>
  `${toCssVariables(theme)}\n\n${block(
    "@theme inline",
    SLOTS.map(([, name]) => `--color-${name}: var(--${name});`)
  )}`;

/** One SCSS variable per theme slot. */
export const toScss = (theme: Theme): string =>
  SLOTS.map(([slot, name]) => `$${name}: ${rgbToHex(theme[slot])};`).join("\n");

/** Pretty printed JSON of the theme as hex, with the palette alongside it when one is given. */
export const toJson = (theme: Theme, palette?: PaletteEntry[]): string => {
  const colors: Record<string, string> = {};
  for (const [slot] of SLOTS) colors[slot] = rgbToHex(theme[slot]);
  const payload = palette
    ? {
        theme: colors,
        palette: palette.map((entry) => ({ hex: rgbToHex(entry.color), share: entry.share })),
      }
    : { theme: colors };
  return JSON.stringify(payload, null, 2);
};

/** One hex color per line, in palette order. */
export const toHexList = (palette: PaletteEntry[]): string =>
  palette.map((entry) => rgbToHex(entry.color)).join("\n");
