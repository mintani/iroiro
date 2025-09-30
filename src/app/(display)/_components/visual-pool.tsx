"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import React from "react";

type Color = [number, number, number];

export const VisualPool: React.FC<{ sourceId?: string; outId?: string; channel?: string }> = ({
  sourceId = "quant",
  outId = "pool",
  channel = "default",
}) => {
  const bus = useImageBus();
  const rec = bus.get(sourceId);
  const [pool, setPool] = React.useState<Color[]>([]);

  const add = (c: Color) =>
    setPool((p) => (p.some((x) => x.join(",") === c.join(",")) ? p : [...p, c]));
  const remove = (c: Color) => setPool((p) => p.filter((x) => x.join(",") !== c.join(",")));

  React.useEffect(() => {
    if (rec?.palette) {
      // no-op; palette shown as candidates
    }
  }, [rec]);

  const exportAsPalette = () => {
    // Write to namespaced key and plain key for compatibility
    bus.setPalette(outId, pool);
    bus.setPalette(`${outId}:${channel}`, pool);
  };

  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  const rgbToHex = (c: Color) => `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="text-xs text-muted-foreground">Candidates</div>
      <div className="flex flex-wrap gap-2">
        {(rec?.palette ?? []).map((c, i) => (
          <button
            key={i}
            type="button"
            aria-label="add color"
            onClick={() => add(c)}
            className="size-6 rounded border"
            style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
            title={`rgb(${c.join(",")})`}
          />
        ))}
      </div>
      <div className="mt-2 text-xs text-muted-foreground">Selected ({channel})</div>
      <div className="flex min-h-0 flex-1 flex-wrap content-start gap-2 overflow-auto rounded-md border p-2">
        {pool.length === 0 && <div className="text-xs text-muted-foreground">No colors yet.</div>}
        {pool.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="group relative">
              <div
                className="size-6 rounded border"
                style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
                title={rgbToHex(c)}
              />
              <button
                type="button"
                aria-label={`remove ${rgbToHex(c)}`}
                onClick={() => remove(c)}
                className="absolute inset-0 flex items-center justify-center rounded bg-black/40 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100"
                title="Remove"
              >
                ×
              </button>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">{rgbToHex(c)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setPool([])} className="pill">
          Clear
        </Button>
        <Button size="sm" onClick={exportAsPalette} className="pill">
          Apply
        </Button>
      </div>
    </div>
  );
};
