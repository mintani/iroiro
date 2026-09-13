"use client";

import { copyWithToast } from "@/components/palette-studio/copy";
import { formatShare } from "@/components/palette-studio/format";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatHex,
  formatHsl,
  formatOklch,
  formatRgb,
  type PaletteEntry,
  readableOn,
} from "@/lib/color";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

type PaletteViewProps = {
  palette: PaletteEntry[];
  baseIndex: number;
  onSelect: (index: number) => void;
};

export const PaletteView = ({ palette, baseIndex, onSelect }: PaletteViewProps) => (
  <div>
    {/* The bar repeats what the cards below say, so it is decorative to a screen reader. */}
    <div
      aria-hidden="true"
      className="flex h-12 w-full overflow-hidden rounded-md ring-1 ring-foreground/10 ring-inset"
    >
      {palette.map((entry, index) => (
        <div
          key={`bar-${formatHex(entry.color)}-${index}`}
          style={{ flex: `${entry.share} 1 0%`, backgroundColor: formatHex(entry.color) }}
        />
      ))}
    </div>

    <p className="mt-3 text-xs text-muted-foreground">
      Click a color to copy its hex and make it the base for the suggestions below.
    </p>

    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {palette.map((entry, index) => {
        const hex = formatHex(entry.color);
        const selected = index === baseIndex;

        return (
          <Tooltip key={`card-${hex}-${index}`}>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-pressed={selected}
                aria-label={`${hex}, ${formatShare(entry.share)} of the image. Copy it and use it as the base color.`}
                onClick={() => {
                  onSelect(index);
                  void copyWithToast(hex);
                }}
                className={cn(
                  "overflow-hidden rounded-md border text-left transition-colors",
                  selected ? "border-ring ring-2 ring-ring" : "hover:border-foreground/25"
                )}
              >
                <span
                  className="flex h-16 w-full items-center justify-center"
                  style={{ backgroundColor: hex }}
                >
                  {selected ? (
                    <Check
                      className="size-4"
                      style={{ color: formatHex(readableOn(entry.color)) }}
                      aria-hidden="true"
                    />
                  ) : null}
                </span>
                <span className="flex items-baseline justify-between gap-2 px-2.5 py-2">
                  <span className="font-mono text-xs">{hex}</span>
                  <span className="label-mono text-muted-foreground tabular-nums">
                    {formatShare(entry.share)}
                  </span>
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="font-mono text-[11px] leading-relaxed">
              <span className="block">{formatRgb(entry.color)}</span>
              <span className="block">{formatHsl(entry.color)}</span>
              <span className="block">{formatOklch(entry.color)}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  </div>
);
