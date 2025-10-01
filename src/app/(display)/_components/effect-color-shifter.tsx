"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import NextImage from "next/image";
import React from "react";
import { ImageModal } from "./image-modal";

type Props = {
  inId: string;
  outId: string;
};

export const EffectColorShifter: React.FC<Props> = ({ inId, outId }) => {
  const bus = useImageBus();
  const rec = bus.get(inId);
  const outRec = bus.get(outId);
  const [hue, setHue] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openIn, setOpenIn] = React.useState(false);
  const [openOut, setOpenOut] = React.useState(false);

  // Track previous dataUrl to detect removal
  const prevDataUrlRef = React.useRef<string | undefined>(undefined);

  // Reset output when input is removed
  React.useEffect(() => {
    const currentRec = bus.get(inId);
    const currentDataUrl = currentRec?.dataUrl;

    // Only act when dataUrl changes from existing to non-existing
    if (prevDataUrlRef.current && !currentDataUrl) {
      const outputRec = bus.get(outId);
      if (outputRec) {
        bus.remove(outId);
      }
      setError(null);
      setHue(0);
    }

    prevDataUrlRef.current = currentDataUrl;
  });

  const apply = async () => {
    if (!rec?.dataUrl) {
      setError("No input image.");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      await new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const w = img.naturalWidth || img.width;
            const h = img.naturalHeight || img.height;
            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (!ctx) throw new Error("Canvas not available");
            ctx.filter = `hue-rotate(${hue}deg)`;
            ctx.drawImage(img, 0, 0, w, h);
            const url = canvas.toDataURL();
            bus.setImage(outId, url);
            resolve();
          } catch (e) {
            reject(e);
          }
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = rec.dataUrl;
      });
    } catch {
      setError("Processing failed.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2 text-xs text-muted-foreground">
        <div className="flex min-h-0 flex-col">
          <div className="mb-1">IN</div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            {rec?.dataUrl ? (
              <NextImage
                src={rec.dataUrl}
                alt="in"
                fill
                unoptimized
                className="cursor-zoom-in object-contain"
                onClick={() => setOpenIn(true)}
              />
            ) : (
              <div className="text-xs">No image</div>
            )}
          </div>
        </div>
        <div className="flex min-h-0 flex-col">
          <div className="mb-1">OUT</div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            {outRec?.dataUrl ? (
              <NextImage
                src={outRec.dataUrl}
                alt="out"
                fill
                unoptimized
                className="cursor-zoom-in object-contain"
                onClick={() => setOpenOut(true)}
              />
            ) : (
              <div className="text-xs">No image</div>
            )}
          </div>
        </div>
      </div>
      <div className="flex w-full items-center gap-2">
        <div className="flex flex-1 items-center gap-2 text-xs text-muted-foreground">
          <span className="w-8">Hue</span>
          <input
            type="range"
            min={-180}
            max={180}
            value={hue}
            onChange={(e) => setHue(parseInt(e.target.value, 10))}
            className="slider flex-1"
          />
          <span className="w-10 text-right">{hue}°</span>
          <input
            type="number"
            className="number-input h-7 w-14"
            value={hue}
            min={-180}
            max={180}
            onChange={(e) => setHue(parseInt(e.target.value || "0", 10))}
          />
        </div>
        <div className="flex w-auto flex-0 gap-2">
          <Button size="sm" variant="outline" className="pill" onClick={() => setHue(0)}>
            Reset
          </Button>
          <Button
            size="sm"
            onClick={apply}
            disabled={running || !rec?.dataUrl}
            className="glass pill px-4 text-foreground"
          >
            {running ? "Shifting..." : "Apply"}
          </Button>
        </div>
      </div>
      {error && <div className="text-xs text-destructive">{error}</div>}
      {rec?.dataUrl && (
        <ImageModal src={rec.dataUrl} open={openIn} onOpenChange={setOpenIn} title="IN" />
      )}
      {outRec?.dataUrl && (
        <ImageModal src={outRec.dataUrl} open={openOut} onOpenChange={setOpenOut} title="OUT" />
      )}
    </div>
  );
};
