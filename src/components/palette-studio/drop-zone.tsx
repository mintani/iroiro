"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CircleAlert, ImagePlus } from "lucide-react";
import { type DragEvent, useState } from "react";

type DropZoneProps = {
  /** Opens the file picker. */
  onPick: () => void;
  onFile: (file: File) => void;
  onSample: () => void;
  error: string | null;
  busy: boolean;
};

export const DropZone = ({ onPick, onFile, onSample, error, busy }: DropZoneProps) => {
  const [dragging, setDragging] = useState(false);

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files.item(0);
    if (dropped) onFile(dropped);
  };

  return (
    <div>
      <button
        type="button"
        onClick={onPick}
        onDragOver={onDragOver}
        onDragEnter={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          "flex w-full flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center transition-colors sm:py-16",
          dragging
            ? "border-ring bg-accent"
            : "bg-card hover:border-foreground/25 hover:bg-accent/40"
        )}
      >
        <ImagePlus className="size-6 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium sm:text-base">
          Drop an image, click to choose, or paste
        </span>
        <span className="label-mono text-muted-foreground">
          PNG · JPEG · WebP · GIF · AVIF — up to 20 MiB
        </span>
      </button>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center">
        <span className="text-xs text-muted-foreground">No image to hand?</span>
        <Button variant="outline" size="sm" onClick={onSample} disabled={busy}>
          Try a sample
        </Button>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 flex items-start justify-center gap-2 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
};
