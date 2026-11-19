"use client";

import { SwatchButton } from "@/components/palette-studio/swatch-button";
import { harmonies, type Rgb } from "@/lib/color";

type HarmonySet = ReturnType<typeof harmonies>;

const ROWS: [keyof HarmonySet, string][] = [
  ["complementary", "Complementary"],
  ["analogous", "Analogous"],
  ["triadic", "Triadic"],
  ["splitComplementary", "Split-complementary"],
  ["tetradic", "Tetradic"],
];

/** Hue rotations of the base color. The base leads every row, so the relationship is readable. */
export const HarmonyRows = ({ base }: { base: Rgb }) => {
  const sets = harmonies(base);

  return (
    <ul className="mt-4 grid gap-3">
      {ROWS.map(([key, label]) => (
        <li key={key} className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <span className="w-full text-xs text-muted-foreground sm:w-40 sm:shrink-0">{label}</span>
          <span className="flex flex-wrap gap-1.5">
            <SwatchButton color={base} name="base color" className="h-9 w-14" />
            {sets[key].map((color, index) => (
              <SwatchButton
                key={`${key}-${index}`}
                color={color}
                name={label.toLowerCase()}
                className="h-9 w-14"
              />
            ))}
          </span>
        </li>
      ))}
    </ul>
  );
};
