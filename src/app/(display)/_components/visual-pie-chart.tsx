"use client";

import { useImageBus } from "@/components/providers/image-bus";
import React from "react";

export const VisualPieChart: React.FC<{ sourceId?: string }> = ({ sourceId = "quant" }) => {
  const bus = useImageBus();
  const rec = bus.get(sourceId);
  const ref = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    const canvas = ref.current;
    const pal = rec?.palette ?? [];
    if (!canvas || pal.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = (canvas.width = 160);
    const h = (canvas.height = 160);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 4;
    const n = pal.length;
    let start = -Math.PI / 2;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI) / n;
      const end = start + angle;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end);
      ctx.closePath();
      const [R, G, B] = pal[i];
      ctx.fillStyle = `rgb(${R},${G},${B})`;
      ctx.fill();
      start = end;
    }
  }, [rec]);

  return (
    <div className="flex items-center justify-center">
      <canvas ref={ref} width={160} height={160} className="rounded-md border" />
    </div>
  );
};
