"use client";

import { useImageBus } from "@/components/providers/image-bus";
import React from "react";

function luminance([r, g, b]: [number, number, number]) {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}

function ratio(c1: [number, number, number], c2: [number, number, number]) {
  const L1 = luminance(c1) + 0.05;
  const L2 = luminance(c2) + 0.05;
  return L1 > L2 ? L1 / L2 : L2 / L1;
}

export const VisualContrastChecker: React.FC<{
  sourceId?: string;
  fg?: [number, number, number];
  bg?: [number, number, number];
  onFgChange?: (c: [number, number, number]) => void;
  onBgChange?: (c: [number, number, number]) => void;
}> = ({ sourceId = "pool", fg: fgProp, bg: bgProp, onFgChange, onBgChange }) => {
  const bus = useImageBus();
  const [fgState, setFgState] = React.useState<[number, number, number]>([0, 0, 0]);
  const [bgState, setBgState] = React.useState<[number, number, number]>([255, 255, 255]);

  const recMain = bus.get(sourceId);
  React.useEffect(() => {
    const pal = recMain?.palette;
    if (pal && pal.length >= 2) {
      if (!fgProp) setFgState(pal[0]);
      if (!bgProp) setBgState(pal[1]);
    }
  }, [recMain?.palette, fgProp, bgProp]);

  const fg = fgProp ?? fgState;
  const bg = bgProp ?? bgState;
  const setFg = (c: [number, number, number]) => {
    if (onFgChange) {
      onFgChange(c);
    } else {
      setFgState(c);
    }
  };
  const setBg = (c: [number, number, number]) => {
    if (onBgChange) {
      onBgChange(c);
    } else {
      setBgState(c);
    }
  };

  const r = ratio(fg, bg);
  const okAA = r >= 4.5;
  const okAAA = r >= 7;

  return (
    <div className="flex h-full w-full flex-col gap-2 text-xs">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-md border p-2">
          <div className="mb-1 text-muted-foreground">Foreground</div>
          <input
            type="color"
            value={`#${fg.map((v) => v.toString(16).padStart(2, "0")).join("")}`}
            onChange={(e) => {
              const hex = e.target.value.replace("#", "");
              setFg([
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16),
              ]);
            }}
          />
        </div>
        <div className="rounded-md border p-2">
          <div className="mb-1 text-muted-foreground">Background</div>
          <input
            type="color"
            value={`#${bg.map((v) => v.toString(16).padStart(2, "0")).join("")}`}
            onChange={(e) => {
              const hex = e.target.value.replace("#", "");
              setBg([
                parseInt(hex.slice(0, 2), 16),
                parseInt(hex.slice(2, 4), 16),
                parseInt(hex.slice(4, 6), 16),
              ]);
            }}
          />
        </div>
      </div>
      {/* render sample text block */}
      <div
        className="rounded-sm border p-2"
        style={{ color: `rgb(${fg.join(",")})`, background: `rgb(${bg.join(",")})` }}
      >
        The quick brown fox jumps over the lazy dog.
      </div>
      <div className="text-muted-foreground">
        Contrast Ratio: {r.toFixed(2)} {okAAA ? "(AAA)" : okAA ? "(AA)" : "(Fail)"}
      </div>
    </div>
  );
};
