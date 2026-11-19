"use client";

import { formatHex, SLOTS, type Theme } from "@/lib/color";
import { useEffect } from "react";

/** Surfaces the theme has no slot for, kept in step so cards and toasts do not fall out of it. */
const ALIASES: [keyof Theme, string][] = [
  ["background", "card"],
  ["foreground", "card-foreground"],
  ["background", "popover"],
  ["foreground", "popover-foreground"],
  ["border", "input"],
  ["primary", "ring"],
];

/** Every property the preview writes, paired with the theme slot it takes its color from. */
const PROPERTIES: [keyof Theme, string][] = [...SLOTS, ...ALIASES].map(
  ([slot, name]): [keyof Theme, string] => [slot, `--${name}`]
);

/**
 * Paints a suggested theme onto the document root as inline custom properties, so the whole page
 * previews it. Removes them again when switched off or unmounted.
 */
export const useThemePreview = (theme: Theme | null, enabled: boolean): void => {
  useEffect(() => {
    if (!enabled || !theme) return;

    const root = document.documentElement;
    for (const [slot, property] of PROPERTIES) {
      root.style.setProperty(property, formatHex(theme[slot]));
    }

    return () => {
      for (const [, property] of PROPERTIES) root.style.removeProperty(property);
    };
  }, [theme, enabled]);
};
