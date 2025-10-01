"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import React from "react";

type Color = [number, number, number];
type Category = "primary" | "secondary" | "accent" | "sub";

export const VisualPool: React.FC<{ sourceId?: string; outId?: string; channel?: string }> = ({
  sourceId = "quant",
  outId = "pool",
  channel = "default",
}) => {
  const bus = useImageBus();
  const rec = bus.get(sourceId);
  const [activeCat, setActiveCat] = React.useState<Category>("primary");
  const [pools, setPools] = React.useState<Record<Category, Color[]>>({
    primary: [],
    secondary: [],
    accent: [],
    sub: [],
  });
  const labelByCat: Record<Category, string> = {
    primary: "Primary",
    secondary: "Secondary",
    accent: "Accent",
    sub: "Sub",
  };

  const keyOf = (c: Color) => c.join(",");
  const isSelected = (c: Color): boolean => {
    const curr = pools[activeCat] ?? [];
    return curr.length > 0 && keyOf(curr[0]) === keyOf(c);
  };
  const toggle = (c: Color) =>
    setPools((all) => {
      const curr = all[activeCat] ?? [];
      if (curr.length > 0 && keyOf(curr[0]) === keyOf(c)) {
        return { ...all, [activeCat]: [] };
      }
      return { ...all, [activeCat]: [c] };
    });

  React.useEffect(() => {
    if (rec?.palette) {
      // no-op; palette shown as candidates
    }
  }, [rec]);

  const exportAll = () => {
    // Flatten as: [primary[0], secondary[0], accent[0], sub[0], primary[1], ...]
    const cats: Category[] = ["primary", "secondary", "accent", "sub"];
    const maxLen = Math.max(...cats.map((k) => (pools[k] ?? []).length), 0);
    const merged: Color[] = [];
    for (let i = 0; i < maxLen; i++) {
      for (const k of cats) {
        const v = pools[k][i];
        if (v) merged.push(v);
      }
    }
    // Write to base and channel-specific for backward compatibility
    bus.setPalette(outId, merged);
    bus.setPalette(`${outId}:${channel}`, merged);

    // Also save assignments structure
    bus.setAssignments(outId, {
      primary: pools.primary,
      secondary: pools.secondary,
      accent: pools.accent,
      sub: pools.sub,
    });
  };

  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, "0");
  const rgbToHex = (c: Color) => `#${toHex(c[0])}${toHex(c[1])}${toHex(c[2])}`;
  const hexToRgb = (hex: string): Color | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : null;
  };

  const addCustomColor = (hex: string) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return;
    toggle(rgb);
  };

  return (
    <div className="flex h-full w-full flex-col gap-3">
      <div className="text-xs font-medium text-muted-foreground">CANDIDATES</div>
      <div className="rounded-md border bg-background/60 p-3 backdrop-blur">
        <div className="mb-2 flex items-center justify-between"></div>
        <div className="flex flex-wrap gap-2">
          {(rec?.palette ?? []).map((c, i) => {
            const selected = isSelected(c);
            return (
              <button
                key={i}
                type="button"
                aria-pressed={selected}
                onClick={() => toggle(c)}
                className={`size-6 rounded border transition-all hover:scale-110 ${
                  selected
                    ? "ring-2 ring-foreground ring-offset-1"
                    : "hover:ring-1 hover:ring-foreground/50"
                }`}
                style={{ background: `rgb(${c[0]},${c[1]},${c[2]})` }}
                title={`rgb(${c.join(",")})`}
              />
            );
          })}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">ASSIGNMENTS</div>
          <div className="text-xs text-muted-foreground">Active: {labelByCat[activeCat]}</div>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2 overflow-hidden rounded-md border bg-background/60 p-3 backdrop-blur">
          {(["primary", "secondary", "accent", "sub"] as Category[]).map((k) => (
            <div key={k} className="flex items-center gap-2 rounded-md border bg-background/40 p-2">
              <span className="w-14 shrink-0 text-xs text-muted-foreground">{labelByCat[k]}</span>
              {(pools[k] ?? []).length === 0 ? (
                <button
                  type="button"
                  className={`rounded-md border px-3 py-1 text-xs font-medium transition-all ${
                    activeCat === k
                      ? "bg-accent text-accent-foreground shadow-sm"
                      : "bg-background hover:bg-accent/80"
                  }`}
                  onClick={() => setActiveCat(k)}
                >
                  Pick
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <div className="group relative">
                    <button
                      type="button"
                      className="size-7 rounded border transition-all hover:scale-110 hover:ring-2 hover:ring-foreground/50"
                      style={{
                        background: `rgb(${pools[k][0][0]},${pools[k][0][1]},${pools[k][0][2]})`,
                      }}
                      onClick={() => setPools((all) => ({ ...all, [k]: [] }))}
                      title="Clear"
                    >
                      <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <span className="text-xs font-bold">×</span>
                      </div>
                    </button>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {rgbToHex(pools[k][0])}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              type="color"
              className="absolute inset-0 size-6 cursor-pointer rounded-3xl opacity-0"
              onChange={(e) => addCustomColor(e.target.value)}
              title="Add custom color"
            />
            <button
              type="button"
              className="flex size-6 items-center justify-center rounded-full border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Add custom color"
            >
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            className="size-6 rounded-full border border-gray-300 bg-white transition-all hover:scale-110 hover:ring-2 hover:ring-foreground/50"
            onClick={() => addCustomColor("#ffffff")}
            title="Add white"
          />
          <button
            type="button"
            className="size-6 rounded-full border border-gray-700 bg-black transition-all hover:scale-110 hover:ring-2 hover:ring-foreground/50"
            onClick={() => addCustomColor("#000000")}
            title="Add black"
          />
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPools({ primary: [], secondary: [], accent: [], sub: [] })}
            className="pill"
          >
            Reset
          </Button>
          <Button size="sm" onClick={exportAll} className="glass pill px-4 text-foreground">
            Apply All
          </Button>
        </div>
      </div>
    </div>
  );
};
