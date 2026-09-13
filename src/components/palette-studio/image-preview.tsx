"use client";

import { MAX_COLORS, MIN_COLORS } from "@/components/palette-studio/use-palette";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RefreshCw, X } from "lucide-react";

type ImagePreviewProps = {
  url: string;
  fileName: string | null;
  colorCount: number;
  paletteSize: number;
  extracting: boolean;
  onColorCount: (count: number) => void;
  onReplace: () => void;
  onClear: () => void;
};

export const ImagePreview = ({
  url,
  fileName,
  colorCount,
  paletteSize,
  extracting,
  onColorCount,
  onReplace,
  onClear,
}: ImagePreviewProps) => (
  <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-start sm:gap-6">
    <figure className="flex items-center justify-center rounded-lg border bg-muted p-2">
      {/* A user's own file, held as an object URL: nothing for the image optimizer to do. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={fileName ? `Preview of ${fileName}` : "Preview of the image you dropped"}
        className="max-h-64 w-auto rounded-sm object-contain"
      />
    </figure>

    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-2">
        <p className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
          {fileName ?? "pasted image"}
        </p>
        <Button variant="outline" size="sm" onClick={onReplace}>
          <RefreshCw className="size-3.5" aria-hidden="true" />
          Replace
        </Button>
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X className="size-3.5" aria-hidden="true" />
          Clear
        </Button>
      </div>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="color-count" className="text-sm font-medium">
            Colors
          </label>
          <span className="font-mono text-xs text-muted-foreground tabular-nums">{colorCount}</span>
        </div>
        <Slider
          id="color-count"
          aria-label="Number of colors to extract"
          className="mt-3"
          min={MIN_COLORS}
          max={MAX_COLORS}
          step={1}
          value={[colorCount]}
          onValueChange={(next) => onColorCount(next[0] ?? colorCount)}
        />
        <p aria-live="polite" className="mt-3 label-mono text-muted-foreground tabular-nums">
          {extracting ? "Extracting…" : `${paletteSize} colors found`}
        </p>
      </div>
    </div>
  </div>
);
