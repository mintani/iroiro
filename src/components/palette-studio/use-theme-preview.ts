"use client";

import { formatHex, type Theme } from "@/lib/color";
import { useEffect } from "react";

/** Theme slot to CSS custom property, in the order the exporters write them. */
const SLOTS: [keyof Theme, string][] = [
  ["background", "--background"],
  ["foreground", "--foreground"],
  ["primary", "--primary"],
  ["primaryForeground", "--primary-foreground"],
  ["secondary", "--secondary"],
  ["secondaryForeground", "--secondary-foreground"],
  ["accent", "--accent"],
  ["accentForeground", "--accent-foreground"],
  ["muted", "--muted"],
  ["mutedForeground", "--muted-foreground"],
  ["border", "--border"],
  // Surfaces the theme has no slot for, kept in step so cards and toasts do not fall out of it.
  ["background", "--card"],
  ["foreground", "--card-foreground"],
  ["background", "--popover"],
  ["foreground", "--popover-foreground"],
  ["border", "--input"],
  ["primary", "--ring"],
];

/**
 * Paints a suggested theme onto the document root as inline custom properties, so the whole page
 * previews it. Removes them again when switched off or unmounted.
 */
export const useThemePreview = (theme: Theme | null, enabled: boolean): void => {
  useEffect(() => {
    if (!enabled || !theme) return;

    const root = document.documentElement;
    for (const [slot, property] of SLOTS) root.style.setProperty(property, formatHex(theme[slot]));

    return () => {
      for (const [, property] of SLOTS) root.style.removeProperty(property);
    };
  }, [theme, enabled]);
};
