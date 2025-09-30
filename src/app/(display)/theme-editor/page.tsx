"use client";

import { CopyButton } from "@/components/misc/copy-button";
import { useImageBus } from "@/components/providers/image-bus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React from "react";

const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
const toHex2 = (v: number) => clamp255(v).toString(16).padStart(2, "0");
const hexFromRgb = (rgb: [number, number, number]) =>
  `#${toHex2(rgb[0])}${toHex2(rgb[1])}${toHex2(rgb[2])}`;
const rgbFromHex = (hex: string): [number, number, number] => {
  const h = hex.replace(/^#/, "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    return [r, g, b];
  }
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return [r, g, b];
};

const rgbToHsl = ([r, g, b]: [number, number, number]): [number, number, number] => {
  const r1 = r / 255;
  const g1 = g / 255;
  const b1 = b / 255;
  const max = Math.max(r1, g1, b1);
  const min = Math.min(r1, g1, b1);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  const d = max - min;
  if (d !== 0) {
    s = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r1:
        h = 60 * (((g1 - b1) / d) % 6);
        break;
      case g1:
        h = 60 * ((b1 - r1) / d + 2);
        break;
      default:
        h = 60 * ((r1 - g1) / d + 4);
    }
  }
  if (h < 0) h += 360;
  return [h, s * 100, l * 100];
};

const hslToRgb = ([h, s, l]: [number, number, number]): [number, number, number] => {
  const S = Math.max(0, Math.min(100, s)) / 100;
  const L = Math.max(0, Math.min(100, l)) / 100;
  const C = (1 - Math.abs(2 * L - 1)) * S;
  const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = L - C / 2;
  let r1 = 0,
    g1 = 0,
    b1 = 0;
  const hh = ((h % 360) + 360) % 360;
  if (hh < 60) [r1, g1, b1] = [C, X, 0];
  else if (hh < 120) [r1, g1, b1] = [X, C, 0];
  else if (hh < 180) [r1, g1, b1] = [0, C, X];
  else if (hh < 240) [r1, g1, b1] = [0, X, C];
  else if (hh < 300) [r1, g1, b1] = [X, 0, C];
  else [r1, g1, b1] = [C, 0, X];
  return [clamp255((r1 + m) * 255), clamp255((g1 + m) * 255), clamp255((b1 + m) * 255)];
};

// RGB <-> LCH(ab) conversions
type Lch = [number, number, number];

const pivotRgb = (v: number) => {
  v /= 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const rgbToXyz = ([r, g, b]: [number, number, number]) => {
  const R = pivotRgb(r);
  const G = pivotRgb(g);
  const B = pivotRgb(b);
  const x = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
  const y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
  const z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
  return [x, y, z] as [number, number, number];
};
const xyzToLab = ([x, y, z]: [number, number, number]) => {
  const Xn = 0.95047,
    Yn = 1,
    Zn = 1.08883;
  let fx = x / Xn,
    fy = y / Yn,
    fz = z / Zn;
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  fx = f(fx);
  fy = f(fy);
  fz = f(fz);
  const L = 116 * fy - 16;
  const a = 500 * (fx - fy);
  const b = 200 * (fy - fz);
  return [L, a, b] as [number, number, number];
};
const labToLch = ([L, a, b]: [number, number, number]): Lch => {
  const C = Math.sqrt(a * a + b * b);
  let h = Math.atan2(b, a) * (180 / Math.PI);
  if (h < 0) h += 360;
  return [L, C, h];
};
const lchToLab = ([L, C, h]: Lch): [number, number, number] => {
  const hr = (h * Math.PI) / 180;
  return [L, C * Math.cos(hr), C * Math.sin(hr)];
};
const labToXyz = ([L, a, b]: [number, number, number]) => {
  const Xn = 0.95047,
    Yn = 1,
    Zn = 1.08883;
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const fn = (t: number) => (t > 6 / 29 ? t * t * t : (108 / 841) * (t - 4 / 29));
  const xr = fn(fx),
    yr = fn(fy),
    zr = fn(fz);
  return [xr * Xn, yr * Yn, zr * Zn] as [number, number, number];
};
const xyzToRgb = ([x, y, z]: [number, number, number]) => {
  let r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  let g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  let b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;
  const gamma = (u: number) => (u <= 0.0031308 ? 12.92 * u : 1.055 * Math.pow(u, 1 / 2.4) - 0.055);
  r = gamma(r);
  g = gamma(g);
  b = gamma(b);
  return [clamp255(r * 255), clamp255(g * 255), clamp255(b * 255)] as [number, number, number];
};
const rgbToLch = (rgb: [number, number, number]): Lch => labToLch(xyzToLab(rgbToXyz(rgb)));
const lchToRgb = (lch: Lch): [number, number, number] => xyzToRgb(labToXyz(lchToLab(lch)));

type Mode = "hex" | "hsl" | "lch";

export default function ThemeEditorPage() {
  const bus = useImageBus();
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : "");
  const rawSource = params.get("sourceId") || "pool";
  const sourceId = rawSource;
  // Try main key and namespaced default for backward compatibility
  const rec = bus.get(sourceId) ?? bus.get(`${sourceId}:default`);

  const [palette, setPalette] = React.useState<Array<[number, number, number]>>(rec?.palette ?? []);
  const [mode, setMode] = React.useState<Mode>("hex");

  React.useEffect(() => {
    setPalette(rec?.palette ?? []);
  }, [rec]);

  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {};
    palette.forEach((c, i) => {
      vars[`--color-${i + 1}`] = `rgb(${c[0]} ${c[1]} ${c[2]})`;
    });
    return `:root{${Object.entries(vars)
      .map(([k, v]) => `${k}: ${v};`)
      .join("")}}`;
  }, [palette]);

  const previewBindings = React.useMemo(() => {
    const p = palette;
    const get = (i: number) => (p[i] ? `rgb(${p[i][0]} ${p[i][1]} ${p[i][2]})` : undefined);
    return {
      ["--primary"]: get(0),
      ["--secondary"]: get(1),
      ["--accent"]: get(2),
      ["--muted"]: get(3),
      ["--card"]: get(4),
    } as Record<string, string | undefined>;
  }, [palette]);

  const handleColorChange = (index: number, next: [number, number, number]) => {
    setPalette((prev) => prev.map((c, i) => (i === index ? next : c)));
  };

  const applyToPool = () => {
    bus.setPalette(sourceId, palette);
  };
  const resetFromPool = () => {
    setPalette(rec?.palette ?? []);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 text-sm text-muted-foreground">Editing theme from: {sourceId}</div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="inline-flex overflow-hidden rounded-md border bg-background text-xs">
              <button
                type="button"
                className={`px-3 py-1 ${mode === "hex" ? "bg-accent" : ""}`}
                onClick={() => setMode("hex")}
              >
                HEX
              </button>
              <button
                type="button"
                className={`px-3 py-1 ${mode === "hsl" ? "bg-accent" : ""}`}
                onClick={() => setMode("hsl")}
              >
                HSL
              </button>
              <button
                type="button"
                className={`px-3 py-1 ${mode === "lch" ? "bg-accent" : ""}`}
                onClick={() => setMode("lch")}
              >
                LCH
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={resetFromPool}>
                Reset
              </Button>
              <Button size="sm" onClick={applyToPool}>
                Apply to Pool
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {palette.map((c, i) => {
              const hex = hexFromRgb(c);
              const hsl = rgbToHsl(c);
              const lch = rgbToLch(c);
              return (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-md border bg-background/60 p-3"
                >
                  <div
                    className="size-8 rounded border"
                    style={{ background: `rgb(${c[0]} ${c[1]} ${c[2]})` }}
                  />
                  <Badge variant="secondary">#{i + 1}</Badge>
                  {mode === "hex" && (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={hex}
                        onChange={(e) => handleColorChange(i, rgbFromHex(e.target.value))}
                      />
                      <input
                        type="text"
                        className="number-input w-28 font-mono"
                        value={hex}
                        onChange={(e) => handleColorChange(i, rgbFromHex(e.target.value))}
                      />
                    </div>
                  )}
                  {mode === "hsl" && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <label className="flex items-center gap-1">
                        H
                        <input
                          type="number"
                          className="number-input w-16"
                          value={Math.round(hsl[0])}
                          onChange={(e) =>
                            handleColorChange(
                              i,
                              hslToRgb([parseFloat(e.target.value || "0"), hsl[1], hsl[2]])
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        S
                        <input
                          type="number"
                          className="number-input w-16"
                          value={Math.round(hsl[1])}
                          onChange={(e) =>
                            handleColorChange(
                              i,
                              hslToRgb([hsl[0], parseFloat(e.target.value || "0"), hsl[2]])
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        L
                        <input
                          type="number"
                          className="number-input w-16"
                          value={Math.round(hsl[2])}
                          onChange={(e) =>
                            handleColorChange(
                              i,
                              hslToRgb([hsl[0], hsl[1], parseFloat(e.target.value || "0")])
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                  {mode === "lch" && (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <label className="flex items-center gap-1">
                        L
                        <input
                          type="number"
                          className="number-input w-16"
                          value={Math.round(lch[0])}
                          onChange={(e) =>
                            handleColorChange(
                              i,
                              lchToRgb([parseFloat(e.target.value || "0"), lch[1], lch[2]])
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        C
                        <input
                          type="number"
                          className="number-input w-16"
                          value={Math.round(lch[1])}
                          onChange={(e) =>
                            handleColorChange(
                              i,
                              lchToRgb([lch[0], parseFloat(e.target.value || "0"), lch[2]])
                            )
                          }
                        />
                      </label>
                      <label className="flex items-center gap-1">
                        H
                        <input
                          type="number"
                          className="number-input w-16"
                          value={Math.round(lch[2])}
                          onChange={(e) =>
                            handleColorChange(
                              i,
                              lchToRgb([lch[0], lch[1], parseFloat(e.target.value || "0")])
                            )
                          }
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Tailwind CSS Variables</CardTitle>
              <CardDescription>Copy and paste into your global CSS.</CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[180px] w-full rounded-md border bg-background p-2 font-mono text-xs"
                value={cssVars}
                onChange={() => {}}
                readOnly
              />
            </CardContent>
            <CardFooter className="justify-between">
              <div className="text-xs text-muted-foreground">
                Exports: --color-1 .. --color-{palette.length}
              </div>
              <CopyButton text={cssVars} />
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Preview Bindings</CardTitle>
              <CardDescription>
                Map first colors to semantic tokens for preview only.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <textarea
                className="min-h-[120px] w-full rounded-md border bg-background p-2 font-mono text-xs"
                value={`:root{--primary:${previewBindings["--primary"]};--secondary:${previewBindings["--secondary"]};--accent:${previewBindings["--accent"]};--muted:${previewBindings["--muted"]};--card:${previewBindings["--card"]};}`}
                onChange={() => {}}
                readOnly
              />
            </CardContent>
            <CardFooter className="justify-end">
              <CopyButton
                text={`:root{--primary:${previewBindings["--primary"]};--secondary:${previewBindings["--secondary"]};--accent:${previewBindings["--accent"]};--muted:${previewBindings["--muted"]};--card:${previewBindings["--card"]};}`}
              />
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">shadcn/ui Preview</CardTitle>
              <CardDescription>Live preview with current bindings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4" style={previewBindings as React.CSSProperties}>
                <div className="flex flex-wrap items-center gap-2">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge className="bg-primary text-primary-foreground">Primary</Badge>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>Card description</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">Body text and muted color.</p>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm">Action</Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Dropdown</CardTitle>
                      <CardDescription>Menu styles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Open
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem>Item One</DropdownMenuItem>
                          <DropdownMenuItem>Item Two</DropdownMenuItem>
                          <DropdownMenuItem>Item Three</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardContent>
                    <CardFooter>
                      <span className="text-xs text-muted-foreground">Popover/Surface tokens</span>
                    </CardFooter>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
