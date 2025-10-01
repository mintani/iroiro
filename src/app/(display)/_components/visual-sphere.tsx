"use client";

import { useImageBus } from "@/components/providers/image-bus";
import React from "react";
import { Sphere } from "./sphere";

type Props = {
  sourceId?: string;
  k?: number;
  maxIter?: number;
  sampleSize?: number;
  maxDisplay?: number;
  pointSize?: number;
  pointOpacity?: number;
};

export const VisualSphere: React.FC<Props> = ({
  sourceId = "quant",
  k = 24,
  maxIter = 24,
  sampleSize = 320,
  maxDisplay = 320,
  pointSize = 0.12,
  pointOpacity = 0.95,
}) => {
  const bus = useImageBus();
  const rec = bus.get(sourceId);
  const [colors, setColors] = React.useState<string[]>([]);

  const loadImage = React.useCallback(async (dataUrl: string) => {
    return new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });
  }, []);

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
    const data: number[] = [];
    for (let i = 0; i < pixels.length; i += 4) {
      const a = pixels[i + 3];
      if (a < 10) continue;
      data.push(pixels[i + 0], pixels[i + 1], pixels[i + 2]);
    }
    if (data.length === 0) return { centroids: [] as number[][], counts: [] as number[] };
    const points = new Float32Array(data);
    const m = points.length / 3;
    const centroids = new Float32Array(kVal * 3);
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
    const cents: number[][] = [];
    const outCounts: number[] = [];
    for (let c = 0; c < kVal; c++) {
      cents.push([centroids[c * 3 + 0], centroids[c * 3 + 1], centroids[c * 3 + 2]]);
      outCounts.push(counts[c]);
    }
    return { centroids: cents, counts: outCounts };
  };

  React.useEffect(() => {
    const run = async () => {
      // prefer raw image data if available to decompose; fallback to existing palette
      if (rec?.dataUrl) {
        try {
          const img = await loadImage(rec.dataUrl);
          const canvas = document.createElement("canvas");
          drawImageToCanvas(img, canvas, sampleSize);
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          const { width, height } = canvas;
          const imgData = ctx.getImageData(0, 0, width, height);
          const { centroids, counts } = kmeans(imgData.data, k, maxIter);
          const sorted = centroids
            .map((c, i) => ({ color: c, size: counts[i] || 0 }))
            .sort((a, b) => b.size - a.size)
            .slice(0, Math.max(1, maxDisplay));
          setColors(
            sorted.map(
              (s) =>
                `rgb(${Math.round(s.color[0])}, ${Math.round(s.color[1])}, ${Math.round(s.color[2])})`
            )
          );
          return;
        } catch {}
      }
      const pal = rec?.palette ?? [];
      setColors(pal.slice(0, Math.max(1, maxDisplay)).map((c) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`));
    };
    run();
  }, [rec?.dataUrl, rec?.palette, k, maxIter, sampleSize, maxDisplay, loadImage]);

  return (
    <div className="flex h-full w-full items-center justify-center self-center">
      <Sphere colors={colors} pointSize={pointSize} pointOpacity={pointOpacity} />
    </div>
  );
};
