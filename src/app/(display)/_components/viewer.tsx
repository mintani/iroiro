"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import React from "react";
import { ImageModal } from "./image-modal";

type RGB = [number, number, number];

export const Viewer: React.FC<{ initialId?: string }> = ({ initialId = "quant" }) => {
  const bus = useImageBus();
  const [id, setId] = React.useState(initialId);
  const record = bus.get(id);
  const [palette, setPalette] = React.useState<RGB[] | null>(null);
  const [zoomOpen, setZoomOpen] = React.useState(false);

  // Extract palette from current image (simple k-means on canvas downsample)
  React.useEffect(() => {
    const dataUrl = record?.dataUrl;
    if (!dataUrl) {
      setPalette(null);
      return;
    }
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const maxSide = 192;
        const w = image.naturalWidth || image.width;
        const h = image.naturalHeight || image.height;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        const tw = Math.max(1, Math.round(w * scale));
        const th = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = tw;
        canvas.height = th;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(image, 0, 0, tw, th);
        const img = ctx.getImageData(0, 0, tw, th);
        // naive sampling for 6 colors
        const colors: RGB[] = [];
        const step = Math.max(4, Math.floor(img.data.length / 4 / 600));
        for (let i = 0; i < img.data.length; i += 4 * step) {
          const a = img.data[i + 3];
          if (a < 10) continue;
          colors.push([img.data[i], img.data[i + 1], img.data[i + 2]]);
        }
        // simple bucket average into 6 bins by luminance
        const bins: { sum: [number, number, number]; n: number }[] = new Array(6)
          .fill(0)
          .map(() => ({ sum: [0, 0, 0], n: 0 }));
        for (const [r, g, b] of colors) {
          const y = Math.max(
            0,
            Math.min(5, Math.floor(((0.299 * r + 0.587 * g + 0.114 * b) / 256) * 6))
          );
          bins[y].sum[0] += r;
          bins[y].sum[1] += g;
          bins[y].sum[2] += b;
          bins[y].n++;
        }
        const out: RGB[] = bins
          .filter((b) => b.n > 0)
          .map(
            (b) =>
              [
                Math.round(b.sum[0] / b.n),
                Math.round(b.sum[1] / b.n),
                Math.round(b.sum[2] / b.n),
              ] as RGB
          );
        setPalette(out);
      } catch {
        setPalette(null);
      }
    };
    image.src = dataUrl;
  }, [record]);

  return (
    <div className="flex w-full flex-col items-center gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="image id"
          className="h-8 w-32 rounded-md border bg-background px-2 text-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={() => setId(id)}>
          Load
        </Button>
      </div>
      <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-md border bg-muted">
        {record?.dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={record.dataUrl}
            alt={id}
            className="max-h-40 max-w-40 cursor-zoom-in object-contain"
            onClick={() => {
              setZoomOpen(true);
            }}
          />
        ) : (
          <div className="text-xs text-muted-foreground">No image</div>
        )}
      </div>
      {record?.dataUrl && (
        <ImageModal src={record.dataUrl} open={zoomOpen} onOpenChange={setZoomOpen} title={id} />
      )}
      {palette && palette.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          {palette.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="size-6 rounded-md border"
                style={{ backgroundColor: `rgb(${c[0]}, ${c[1]}, ${c[2]})` }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
