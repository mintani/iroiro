"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import React from "react";
import { ImageModal } from "./image-modal";

type Centroid = [number, number, number];

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

  const rgbToLab = (r: number, g: number, b: number): [number, number, number] => {
    let rNorm = r / 255;
    let gNorm = g / 255;
    let bNorm = b / 255;

    rNorm = rNorm > 0.04045 ? Math.pow((rNorm + 0.055) / 1.055, 2.4) : rNorm / 12.92;
    gNorm = gNorm > 0.04045 ? Math.pow((gNorm + 0.055) / 1.055, 2.4) : gNorm / 12.92;
    bNorm = bNorm > 0.04045 ? Math.pow((bNorm + 0.055) / 1.055, 2.4) : bNorm / 12.92;

    let x = rNorm * 0.4124564 + gNorm * 0.3575761 + bNorm * 0.1804375;
    let y = rNorm * 0.2126729 + gNorm * 0.7151522 + bNorm * 0.072175;
    let z = rNorm * 0.0193339 + gNorm * 0.119192 + bNorm * 0.9503041;

    x = x / 0.95047;
    y = y / 1.0;
    z = z / 1.08883;

    x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
    y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
    z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

    const L = 116 * y - 16;
    const a = 500 * (x - y);
    const bLab = 200 * (y - z);

    return [L, a, bLab];
  };

  const labToRgb = (L: number, a: number, b: number): [number, number, number] => {
    let y = (L + 16) / 116;
    let x = a / 500 + y;
    let z = y - b / 200;

    x = x > 0.206897 ? x * x * x : (x - 16 / 116) / 7.787;
    y = y > 0.206897 ? y * y * y : (y - 16 / 116) / 7.787;
    z = z > 0.206897 ? z * z * z : (z - 16 / 116) / 7.787;

    x = x * 0.95047;
    y = y * 1.0;
    z = z * 1.08883;

    let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
    let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
    let bRgb = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

    r = r > 0.0031308 ? 1.055 * Math.pow(r, 1 / 2.4) - 0.055 : 12.92 * r;
    g = g > 0.0031308 ? 1.055 * Math.pow(g, 1 / 2.4) - 0.055 : 12.92 * g;
    bRgb = bRgb > 0.0031308 ? 1.055 * Math.pow(bRgb, 1 / 2.4) - 0.055 : 12.92 * bRgb;

    return [
      Math.max(0, Math.min(255, Math.round(r * 255))),
      Math.max(0, Math.min(255, Math.round(g * 255))),
      Math.max(0, Math.min(255, Math.round(bRgb * 255))),
    ];
  };
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
    const rgbData: number[] = [];
    const labData: number[] = [];

    for (let i = 0; i < n; i++) {
      const base = i * 4;
      const a = pixels[base + 3];
      if (a < 10) continue;

      const r = pixels[base];
      const g = pixels[base + 1];
      const b = pixels[base + 2];

      rgbData.push(r, g, b);
      const [L, aLab, bLab] = rgbToLab(r, g, b);
      labData.push(L, aLab, bLab);
    }

    if (labData.length === 0)
      return { centroids: [] as Centroid[], labels: [] as number[], counts: [] as number[] };

    const points = new Float32Array(labData);
    // const rgbPoints = new Float32Array(rgbData);
    const m = points.length / 3;
    const centroids: Float32Array = new Float32Array(kVal * 3);
    const labels = new Int32Array(m);

    // k-means++ initialization for better initial centroids
    const distances = new Float32Array(m);
    const firstIdx = Math.floor(Math.random() * m);
    centroids[0] = points[firstIdx * 3 + 0];
    centroids[1] = points[firstIdx * 3 + 1];
    centroids[2] = points[firstIdx * 3 + 2];

    for (let c = 1; c < kVal; c++) {
      let sumDist = 0;

      for (let i = 0; i < m; i++) {
        const pL = points[i * 3 + 0];
        const pa = points[i * 3 + 1];
        const pb = points[i * 3 + 2];
        let minDist = Infinity;

        for (let j = 0; j < c; j++) {
          const cL = centroids[j * 3 + 0];
          const ca = centroids[j * 3 + 1];
          const cb = centroids[j * 3 + 2];
          const dL = pL - cL;
          const da = pa - ca;
          const db = pb - cb;
          const dist = dL * dL + da * da + db * db;
          if (dist < minDist) minDist = dist;
        }

        distances[i] = minDist;
        sumDist += minDist;
      }

      let target = Math.random() * sumDist;
      let chosenIdx = 0;

      for (let i = 0; i < m; i++) {
        target -= distances[i];
        if (target <= 0) {
          chosenIdx = i;
          break;
        }
      }

      centroids[c * 3 + 0] = points[chosenIdx * 3 + 0];
      centroids[c * 3 + 1] = points[chosenIdx * 3 + 1];
      centroids[c * 3 + 2] = points[chosenIdx * 3 + 2];
    }

    const assign = () => {
      let changed = 0;
      for (let i = 0; i < m; i++) {
        const pL = points[i * 3 + 0];
        const pa = points[i * 3 + 1];
        const pb = points[i * 3 + 2];
        let best = 0;
        let bestD = Infinity;
        for (let c = 0; c < kVal; c++) {
          const cL = centroids[c * 3 + 0];
          const ca = centroids[c * 3 + 1];
          const cb = centroids[c * 3 + 2];
          const dL = pL - cL;
          const da = pa - ca;
          const db = pb - cb;
          const d = dL * dL + da * da + db * db;
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
      const [r, g, b] = labToRgb(centroids[c * 3 + 0], centroids[c * 3 + 1], centroids[c * 3 + 2]);
      outCentroids.push([r, g, b]);
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

    const centroidsLab = cents.map(([r, g, b]) => rgbToLab(r, g, b));

    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3];
      if (a < 10) continue;

      const pr = data[i + 0];
      const pg = data[i + 1];
      const pb = data[i + 2];
      const [pL, pa, pLabB] = rgbToLab(pr, pg, pb);

      let best = 0;
      let bestD = Infinity;
      for (let c = 0; c < centroidsLab.length; c++) {
        const [cL, ca, cb] = centroidsLab[c];
        const dL = pL - cL;
        const da = pa - ca;
        const db = pLabB - cb;
        const d = dL * dL + da * da + db * db;
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

  const stratifiedSampling = (imgData: ImageData, maxSamples: number): Uint8ClampedArray => {
    const { width, height, data } = imgData;
    const gridSize = Math.ceil(Math.sqrt((width * height) / maxSamples));
    const sampledPixels: number[] = [];

    for (let gy = 0; gy < height; gy += gridSize) {
      for (let gx = 0; gx < width; gx += gridSize) {
        const cellSamples: Array<[number, number, number, number]> = [];

        for (let dy = 0; dy < gridSize && gy + dy < height; dy++) {
          for (let dx = 0; dx < gridSize && gx + dx < width; dx++) {
            const x = gx + dx;
            const y = gy + dy;
            const idx = (y * width + x) * 4;
            const a = data[idx + 3];
            if (a >= 10) {
              cellSamples.push([data[idx], data[idx + 1], data[idx + 2], a]);
            }
          }
        }

        if (cellSamples.length > 0) {
          const sample = cellSamples[Math.floor(Math.random() * cellSamples.length)];
          sampledPixels.push(sample[0], sample[1], sample[2], sample[3]);
        }
      }
    }

    return new Uint8ClampedArray(sampledPixels);
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
    bus.setLoading(true, "Processing image...");

    // Wait for loading UI to render before starting heavy computation
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      // Create temporary canvas for sampling (downsampled for performance)
      const tempCanvas = document.createElement("canvas");
      drawImageToCanvas(img, tempCanvas, sampleSize);
      const ctx = tempCanvas.getContext("2d");
      if (!ctx) throw new Error("Canvas not available.");
      const { width, height } = tempCanvas;
      const imgData = ctx.getImageData(0, 0, width, height);

      const maxSamplePixels = Math.min(sampleSize * sampleSize, width * height);
      const sampledData = stratifiedSampling(imgData, maxSamplePixels);

      // Yield to browser to keep UI responsive
      await new Promise((resolve) => setTimeout(resolve, 0));

      const { centroids, counts } = kmeans(sampledData, k, maxIter);
      const sorted = centroids
        .map((c, i) => ({ color: c, size: counts[i] || 0 }))
        .sort((a, b) => b.size - a.size);

      if (centroids.length > 0) {
        // Yield to browser before quantization
        await new Promise((resolve) => setTimeout(resolve, 0));

        quantizeFullImage(
          img,
          sorted.map((s) => s.color)
        );

        try {
          const canvas = quantCanvasRef.current!;
          const dataUrl = canvas.toDataURL();
          bus.setImage(outId, dataUrl);
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
      // Wait a bit before hiding loading UI to ensure final render completes
      await new Promise((resolve) => setTimeout(resolve, 100));
      setRunning(false);
      bus.setLoading(false);
    }
  };

  // Track previous dataUrl to properly handle add/remove
  const prevDataUrlRef = React.useRef<string | undefined>(undefined);

  // hydrate from bus by inId if present
  React.useEffect(() => {
    try {
      const rec = bus.get(inId);
      const currentDataUrl = rec?.dataUrl;

      // Image was added or changed
      if (currentDataUrl && currentDataUrl !== prevDataUrlRef.current) {
        bus.setLoading(true, "Loading image into sampler...");
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
          setImg(image);
          setTimeout(() => {
            bus.setLoading(false);
          }, 100);
        };
        image.onerror = () => {
          setError("Failed to load image from bus");
          bus.setLoading(false);
        };
        image.src = currentDataUrl;
      }
      // Image was removed
      else if (!currentDataUrl && prevDataUrlRef.current) {
        setImg(null);
        setError(null);
        const baseCanvas = canvasRef.current;
        const quantCanvas = quantCanvasRef.current;
        if (baseCanvas) {
          const ctx = baseCanvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, baseCanvas.width, baseCanvas.height);
            baseCanvas.width = 0;
            baseCanvas.height = 0;
          }
        }
        if (quantCanvas) {
          const ctx = quantCanvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, quantCanvas.width, quantCanvas.height);
            quantCanvas.width = 0;
            quantCanvas.height = 0;
          }
        }
      }

      prevDataUrlRef.current = currentDataUrl;
    } catch {
      bus.setLoading(false);
    }
  });

  // draw source preview when image changes (always full size)
  React.useEffect(() => {
    if (!img) return;
    const baseCanvas = canvasRef.current;
    if (!baseCanvas) return;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    baseCanvas.width = w;
    baseCanvas.height = h;
    const ctx = baseCanvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
  }, [img]);

  return (
    <div className="flex h-full w-full flex-col gap-2">
      {error && <div className="text-xs text-destructive">{error}</div>}

      <div className="grid min-h-0 flex-1 grid-cols-2 gap-2">
        <div className="flex min-h-0 flex-col gap-1">
          <div className="text-xs text-muted-foreground">Source</div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            <canvas
              ref={canvasRef}
              className="max-h-full max-w-full cursor-zoom-in object-contain"
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
          <div className="text-xs text-muted-foreground">Quantized</div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            <canvas
              ref={quantCanvasRef}
              className="max-h-full max-w-full cursor-zoom-in object-contain"
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
      {/* Controls row: left side for inputs, right side for run button */}
      <div className="flex w-full items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
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
        </div>
        <div className="flex w-auto flex-0 justify-end">
          <Button
            onClick={run}
            disabled={running || !img}
            className="glass pill flex justify-end rounded-full px-4 text-foreground"
          >
            {running ? "Running..." : "Run"}
          </Button>
        </div>
      </div>
      {/* Palette display removed; Visualizer handles palette */}
    </div>
  );
};
