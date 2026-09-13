"use client";

import { copyWithToast } from "@/components/palette-studio/copy";
import { formatRatio } from "@/components/palette-studio/format";
import {
  contrastRatio,
  ensureContrast,
  formatHex,
  type PaletteEntry,
  readableOn,
} from "@/lib/color";

/** The readable text color for every palette color, with the ratio it reaches. */
export const TextOnColor = ({ palette }: { palette: PaletteEntry[] }) => (
  <ul className="mt-4 flex flex-wrap gap-2">
    {palette.map((entry, index) => {
      const readable = ensureContrast(readableOn(entry.color), entry.color, 7);
      const background = formatHex(entry.color);
      const text = formatHex(readable);
      const ratio = formatRatio(contrastRatio(readable, entry.color));

      return (
        <li key={`${background}-${index}`}>
          <button
            type="button"
            aria-label={`Copy ${text}, readable text on ${background}, contrast ${ratio}`}
            title={`${text} on ${background}`}
            onClick={() => void copyWithToast(text, `${text} — text on ${background}`)}
            style={{ backgroundColor: background, color: text }}
            className="flex items-center gap-2 rounded-md px-3 py-2 ring-1 ring-foreground/10 ring-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <span className="text-sm font-medium">Aa</span>
            <span className="label-mono tabular-nums">{ratio}</span>
          </button>
        </li>
      );
    })}
  </ul>
);
