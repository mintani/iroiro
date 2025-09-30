"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import React from "react";
import { ImageModal } from "./image-modal";

type Centroid = [number, number, number];

// keep for future use

export const Sampler: React.FC<{ inId?: string; outId?: string }> = ({
  inId = "source",
  outId = "quant",
}) => {
  const bus = useImageBus();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const quantCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [zoomOpen, setZoomOpen] = React.useState<null | { kind: "source" | "quant" }>(null);
  const [zoomSrc, setZoomSrc] = React.useState<string | null>(null);

  const [img, setImg] = React.useState<HTMLImageElement | null>(null);
  const [k, setK] = React.useState(16);
  const [maxIter, setMaxIter] = React.useState(16);
  const [sampleSize, setSampleSize] = React.useState(256);
  const [running, setRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const drawImageToCanvas = (
    image: HTMLImageElement,
    target: HTMLCanvasElement,
    maxSide: number
  ) => {
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const tw = Math.max(1, Math.round(w * scale));
    const th = Math.max(1, Math.round(h * scale));
    target.width = tw;
    target.height = th;
    const ctx = target.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, tw, th);
    ctx.drawImage(image, 0, 0, tw, th);
  };

  const kmeans = (pixels: Uint8ClampedArray, kVal: number, maxIterations: number) => {
    const n = pixels.length / 4;
    const data: number[] = [];
    for (let i = 0; i < n; i++) {
      const base = i * 4;
      const a = pixels[base + 3];
      if (a < 10) continue;
      data.push(pixels[base], pixels[base + 1], pixels[base + 2]);
    }
    if (data.length === 0)
      return { centroids: [] as Centroid[], labels: [] as number[], counts: [] as number[] };

    const points = new Float32Array(data);
    const m = points.length / 3;
    const centroids: Float32Array = new Float32Array(kVal * 3);
    const labels = new Int32Array(m);

    const used = new Set<number>();
    for (let c = 0; c < kVal; c++) {
      let idx = Math.floor(Math.random() * m);
      while (used.has(idx)) idx = Math.floor(Math.random() * m);
      used.add(idx);
      centroids[c * 3 + 0] = points[idx * 3 + 0];
      centroids[c * 3 + 1] = points[idx * 3 + 1];
      centroids[c * 3 + 2] = points[idx * 3 + 2];
    }

    const assign = () => {
      let changed = 0;
      for (let i = 0; i < m; i++) {
        const pr = points[i * 3 + 0];
        const pg = points[i * 3 + 1];
        const pb = points[i * 3 + 2];
        let best = 0;
        let bestD = Infinity;
        for (let c = 0; c < kVal; c++) {
          const cr = centroids[c * 3 + 0];
          const cg = centroids[c * 3 + 1];
          const cb = centroids[c * 3 + 2];
          const dr = pr - cr;
          const dg = pg - cg;
          const db = pb - cb;
          const d = dr * dr + dg * dg + db * db;
          if (d < bestD) {
            bestD = d;
            best = c;
          }
        }
        if (labels[i] !== best) {
          labels[i] = best;
          changed++;
        }
      }
      return changed;
    };

    const update = () => {
      const sums = new Float32Array(kVal * 3);
      const counts = new Int32Array(kVal);
      for (let i = 0; i < m; i++) {
        const c = labels[i];
        sums[c * 3 + 0] += points[i * 3 + 0];
        sums[c * 3 + 1] += points[i * 3 + 1];
        sums[c * 3 + 2] += points[i * 3 + 2];
        counts[c]++;
      }
      for (let c = 0; c < kVal; c++) {
        if (counts[c] > 0) {
          centroids[c * 3 + 0] = sums[c * 3 + 0] / counts[c];
          centroids[c * 3 + 1] = sums[c * 3 + 1] / counts[c];
          centroids[c * 3 + 2] = sums[c * 3 + 2] / counts[c];
        }
      }
      return counts;
    };

    let counts = new Int32Array(kVal);
    for (let iter = 0; iter < maxIterations; iter++) {
      const moved = assign();
      counts = update();
      if (moved === 0) break;
    }

    const outCentroids: Centroid[] = [];
    const outCounts: number[] = [];
    for (let c = 0; c < kVal; c++) {
      outCentroids.push([centroids[c * 3 + 0], centroids[c * 3 + 1], centroids[c * 3 + 2]]);
      outCounts.push(counts[c]);
    }
    return { centroids: outCentroids, labels: Array.from(labels), counts: outCounts };
  };

  const quantizeFullImage = (image: HTMLImageElement, cents: Centroid[]) => {
    const canvas = quantCanvasRef.current!;
    const w = image.naturalWidth || image.width;
    const h = image.naturalHeight || image.height;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(image, 0, 0, w, h);
    const imgData = ctx.getImageData(0, 0, w, h);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 10) continue;
      const pr = data[i + 0];
      const pg = data[i + 1];
      const pb = data[i + 2];
      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < cents.length; c++) {
        const cr = cents[c][0];
        const cg = cents[c][1];
        const cb = cents[c][2];
        const dr = pr - cr;
        const dg = pg - cg;
        const db = pb - cb;
        const d = dr * dr + dg * dg + db * db;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      data[i + 0] = cents[best][0];
      data[i + 1] = cents[best][1];
      data[i + 2] = cents[best][2];
    }
    ctx.putImageData(imgData, 0, 0);
  };

  const run = async () => {
    if (!img) {
      setError("Select an image first.");
      return;
    }
    if (k < 1) {
      setError("K must be >= 1.");
      return;
    }
    setRunning(true);
    setError(null);
    try {
      const baseCanvas = canvasRef.current!;
      drawImageToCanvas(img, baseCanvas, sampleSize);
      const ctx = baseCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available.");
      const { width, height } = baseCanvas;
      const imgData = ctx.getImageData(0, 0, width, height);
      const { centroids, counts } = kmeans(imgData.data, k, maxIter);
      const sorted = centroids
        .map((c, i) => ({ color: c, size: counts[i] || 0 }))
        .sort((a, b) => b.size - a.size);
      if (centroids.length > 0) {
        quantizeFullImage(
          img,
          sorted.map((s) => s.color)
        );
        // publish quantized image and palette to bus
        try {
          const canvas = quantCanvasRef.current!;
          const dataUrl = canvas.toDataURL();
          bus.setImage(outId, dataUrl);
          // also publish palette (sorted by frequency)
          const palette = sorted.map((s) => [
            Math.round(s.color[0]),
            Math.round(s.color[1]),
            Math.round(s.color[2]),
          ]) as Array<[number, number, number]>;
          bus.setPalette(outId, palette);
        } catch {}
      }
    } catch {
      setError("Sampling failed.");
    } finally {
      setRunning(false);
    }
  };

  // hydrate from bus by inId if present
  React.useEffect(() => {
    try {
      const rec = bus.get(inId);
      if (rec?.dataUrl) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => setImg(image);
        image.src = rec.dataUrl;
      }
    } catch {}
  }, [bus, inId]);

  // draw source preview when image or sample size changes
  React.useEffect(() => {
    if (!img) return;
    const baseCanvas = canvasRef.current;
    if (!baseCanvas) return;
    drawImageToCanvas(img, baseCanvas, sampleSize);
  }, [img, sampleSize]);

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            K
            <input
              type="number"
              min={1}
              max={16}
              value={k}
              onChange={(e) => setK(parseInt(e.target.value || "1", 10))}
              className="number-input h-7 w-14"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Iter
            <input
              type="number"
              min={1}
              max={50}
              value={maxIter}
              onChange={(e) => setMaxIter(parseInt(e.target.value || "1", 10))}
              className="number-input h-7 w-14"
            />
          </label>
          <label className="flex items-center gap-1 text-xs text-muted-foreground">
            Sample
            <input
              type="number"
              min={64}
              max={1024}
              step={32}
              value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value || "256", 10))}
              className="number-input h-7 w-16"
            />
          </label>
          <Button onClick={run} disabled={running || !img} className="rounded-full">
            {running ? "Running..." : "Run"}
          </Button>
        </div>
      </div>

      {error && <div className="text-xs text-destructive">{error}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        <div className="flex min-h-0 flex-col gap-1">
          <div className="text-xs text-muted-foreground">Source (downsampled)</div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full cursor-zoom-in"
              onClick={() => {
                setZoomOpen({ kind: "source" });
                try {
                  const url = canvasRef.current?.toDataURL() ?? null;
                  setZoomSrc(url);
                } catch {
                  setZoomSrc(null);
                }
              }}
            />
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-1">
          <div className="text-xs text-muted-foreground">Quantized preview</div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            <canvas
              ref={quantCanvasRef}
              className="max-h-full max-w-full cursor-zoom-in"
              onClick={() => {
                setZoomOpen({ kind: "quant" });
                try {
                  const url = quantCanvasRef.current?.toDataURL() ?? null;
                  setZoomSrc(url);
                } catch {
                  setZoomSrc(null);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Zoom overlay via shared ImageModal */}
      {zoomOpen && (
        <ImageModal
          src={zoomSrc}
          open={!!zoomOpen}
          onOpenChange={(v) => {
            if (!v) {
              setZoomOpen(null);
              setZoomSrc(null);
            }
          }}
          title={zoomOpen.kind === "source" ? "Source" : "Quantized"}
        />
      )}

      {/* Palette display removed; Visualizer handles palette */}
    </div>
  );
};
