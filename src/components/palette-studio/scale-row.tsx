"use client";

import { SwatchButton } from "@/components/palette-studio/swatch-button";
import { type Rgb, scale } from "@/lib/color";

/** Step labels of the generated ramp, in the order `scale` returns them. */
const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

/** The Tailwind-shaped ramp of the base color, 50 through 950. */
export const ScaleRow = ({ base }: { base: Rgb }) => (
  <ol className="mt-4 grid grid-cols-6 gap-1.5 sm:grid-cols-11">
    {scale(base, STEPS.length).map((color, index) => (
      <li key={STEPS[index]}>
        <SwatchButton color={color} name={`step ${STEPS[index]}`} className="h-12 w-full" />
        <span className="mt-1 block text-center label-mono text-muted-foreground tabular-nums">
          {STEPS[index]}
        </span>
      </li>
    ))}
  </ol>
);
