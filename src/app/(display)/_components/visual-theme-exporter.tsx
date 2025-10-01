"use client";

import { CopyButton } from "@/components/misc/copy-button";
import { useImageBus, type ColorAssignments } from "@/components/providers/image-bus";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Palette as PaletteIcon, Plus, Trash2 } from "lucide-react";
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
type Category = "primary" | "secondary" | "accent" | "sub";

export const VisualThemeExporter: React.FC<{ sourceId?: string }> = ({ sourceId = "pool" }) => {
  const bus = useImageBus();
  const rec = bus.get(sourceId);
  const hasAssignments = !!rec?.assignments;
  const hasPalette = !!rec?.palette?.length;
  const [open, setOpen] = React.useState(false);
  const [assignments, setAssignments] = React.useState<ColorAssignments>({
    primary: [],
    secondary: [],
    accent: [],
    sub: [],
  });
  const [activeCat, setActiveCat] = React.useState<Category>("primary");
  const [mode, setMode] = React.useState<Mode>("hex");

  React.useEffect(() => {
    if (open) {
      const poolRec = bus.get(sourceId);
      if (poolRec?.assignments) {
        setAssignments({
          primary: poolRec.assignments.primary ?? [],
          secondary: poolRec.assignments.secondary ?? [],
          accent: poolRec.assignments.accent ?? [],
          sub: poolRec.assignments.sub ?? [],
        });
      } else {
        setAssignments({
          primary: [],
          secondary: [],
          accent: [],
          sub: [],
        });
      }
    }
  }, [open, sourceId, bus]);

  const flatPalette = React.useMemo(() => {
    const cats: Category[] = ["primary", "secondary", "accent", "sub"];
    const result: Array<[number, number, number]> = [];
    const maxLen = Math.max(...cats.map((k) => (assignments[k] ?? []).length), 0);
    for (let i = 0; i < maxLen; i++) {
      for (const k of cats) {
        const v = assignments[k]?.[i];
        if (v) result.push(v);
      }
    }
    return result;
  }, [assignments]);

  const cssVars = React.useMemo(() => {
    const vars: Record<string, string> = {};
    const cats: Category[] = ["primary", "secondary", "accent", "sub"];
    cats.forEach((cat) => {
      assignments[cat]?.forEach((c, i) => {
        vars[`--${cat}-${i + 1}`] = `rgb(${c[0]} ${c[1]} ${c[2]})`;
      });
    });
    return `:root {\n${Object.entries(vars)
      .map(([k, v]) => `  ${k}: ${v};`)
      .join("\n")}\n}`;
  }, [assignments]);

  const tailwindConfig = React.useMemo(() => {
    const colors: Record<string, Record<string, string>> = {};
    const cats: Category[] = ["primary", "secondary", "accent", "sub"];
    cats.forEach((cat) => {
      if (assignments[cat]?.length) {
        colors[cat] = {};
        assignments[cat]?.forEach((c, i) => {
          colors[cat][i === 0 ? "DEFAULT" : `${i + 1}`] = hexFromRgb(c);
        });
      }
    });
    return `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(colors, null, 8).replace(/^/gm, "        ").trim()}\n    }\n  }\n}`;
  }, [assignments]);

  const scssVars = React.useMemo(() => {
    const cats: Category[] = ["primary", "secondary", "accent", "sub"];
    return cats
      .flatMap((cat) =>
        (assignments[cat] ?? []).map((c, i) => `$${cat}-${i + 1}: ${hexFromRgb(c)};`)
      )
      .join("\n");
  }, [assignments]);

  const jsonExport = React.useMemo(() => {
    const colors: Record<string, Record<string, string>> = {};
    const cats: Category[] = ["primary", "secondary", "accent", "sub"];
    cats.forEach((cat) => {
      if (assignments[cat]?.length) {
        colors[cat] = {};
        assignments[cat]?.forEach((c, i) => {
          colors[cat][i === 0 ? "DEFAULT" : `${i + 1}`] = hexFromRgb(c);
        });
      }
    });
    return JSON.stringify(colors, null, 2);
  }, [assignments]);

  const previewBindings = React.useMemo(() => {
    return {
      ["--primary"]: assignments.primary?.[0] && `rgb(${assignments.primary[0].join(" ")})`,
      ["--secondary"]: assignments.secondary?.[0] && `rgb(${assignments.secondary[0].join(" ")})`,
      ["--accent"]: assignments.accent?.[0] && `rgb(${assignments.accent[0].join(" ")})`,
      ["--muted"]: assignments.sub?.[0] && `rgb(${assignments.sub[0].join(" ")})`,
    } as Record<string, string | undefined>;
  }, [assignments]);

  const handleColorChange = (cat: Category, index: number, next: [number, number, number]) => {
    setAssignments((prev) => ({
      ...prev,
      [cat]: (prev[cat] ?? []).map((c, i) => (i === index ? next : c)),
    }));
  };

  const handleAddColor = (cat: Category) => {
    setAssignments((prev) => ({
      ...prev,
      [cat]: [...(prev[cat] ?? []), [128, 128, 128] as [number, number, number]],
    }));
  };

  const handleRemoveColor = (cat: Category, index: number) => {
    setAssignments((prev) => ({
      ...prev,
      [cat]: (prev[cat] ?? []).filter((_, i) => i !== index),
    }));
  };

  const applyToPool = () => {
    if (sourceId) {
      bus.setAssignments(sourceId, assignments);
      bus.setPalette(sourceId, flatPalette);
    }
  };

  const resetFromPool = () => {
    const poolRec = bus.get(sourceId);
    if (poolRec?.assignments) {
      setAssignments({
        primary: poolRec.assignments.primary ?? [],
        secondary: poolRec.assignments.secondary ?? [],
        accent: poolRec.assignments.accent ?? [],
        sub: poolRec.assignments.sub ?? [],
      });
    } else {
      setAssignments({
        primary: [],
        secondary: [],
        accent: [],
        sub: [],
      });
    }
  };

  const downloadAsJson = () => {
    const blob = new Blob([jsonExport], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "theme-colors.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="text-xs text-muted-foreground">Tailwind Theme Exporter</div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" disabled={!hasAssignments && !hasPalette}>
            <PaletteIcon className="size-4" />
            Open Editor
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] min-w-7xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Theme Editor</DialogTitle>
            <DialogDescription>
              Edit colors and export to various formats for Tailwind CSS
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="w-auto">
                  <TabsList>
                    <TabsTrigger value="hex">HEX</TabsTrigger>
                    <TabsTrigger value="hsl">HSL</TabsTrigger>
                    <TabsTrigger value="lch">LCH</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="secondary" onClick={resetFromPool}>
                    Reset
                  </Button>
                  <Button size="sm" onClick={applyToPool}>
                    Apply
                  </Button>
                </div>
              </div>

              <Tabs value={activeCat} onValueChange={(v) => setActiveCat(v as Category)}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="primary">Primary</TabsTrigger>
                  <TabsTrigger value="secondary">Secondary</TabsTrigger>
                  <TabsTrigger value="accent">Accent</TabsTrigger>
                  <TabsTrigger value="sub">Sub</TabsTrigger>
                </TabsList>
                {(["primary", "secondary", "accent", "sub"] as Category[]).map((cat) => (
                  <TabsContent key={cat} value={cat} className="mt-3">
                    <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto rounded-md border bg-muted/20 p-3">
                      {(assignments[cat] ?? []).length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-sm text-muted-foreground">
                          <PaletteIcon className="size-8 opacity-50" />
                          <div>No {cat} colors</div>
                          <div className="text-xs">Add custom colors below</div>
                        </div>
                      )}
                      {(assignments[cat] ?? []).map((c, i) => {
                        const hex = hexFromRgb(c);
                        const hsl = rgbToHsl(c);
                        const lch = rgbToLch(c);
                        return (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-md border bg-background/80 p-3"
                          >
                            <div
                              className="size-10 shrink-0 rounded border"
                              style={{ background: `rgb(${c[0]} ${c[1]} ${c[2]})` }}
                            />
                            <Badge variant="secondary" className="shrink-0">
                              {i === 0 ? "DEFAULT" : `#${i + 1}`}
                            </Badge>
                            {mode === "hex" && (
                              <div className="flex flex-1 items-center gap-2">
                                <input
                                  type="color"
                                  value={hex}
                                  onChange={(e) =>
                                    handleColorChange(cat, i, rgbFromHex(e.target.value))
                                  }
                                  className="size-8 cursor-pointer"
                                />
                                <Input
                                  type="text"
                                  className="w-28 font-mono text-xs"
                                  value={hex}
                                  onChange={(e) =>
                                    handleColorChange(cat, i, rgbFromHex(e.target.value))
                                  }
                                />
                              </div>
                            )}
                            {mode === "hsl" && (
                              <div className="flex flex-1 flex-wrap items-center gap-2 text-xs">
                                <label className="flex items-center gap-1">
                                  H
                                  <Input
                                    type="number"
                                    className="w-16"
                                    value={Math.round(hsl[0])}
                                    onChange={(e) =>
                                      handleColorChange(
                                        cat,
                                        i,
                                        hslToRgb([
                                          parseFloat(e.target.value || "0"),
                                          hsl[1],
                                          hsl[2],
                                        ])
                                      )
                                    }
                                  />
                                </label>
                                <label className="flex items-center gap-1">
                                  S
                                  <Input
                                    type="number"
                                    className="w-16"
                                    value={Math.round(hsl[1])}
                                    onChange={(e) =>
                                      handleColorChange(
                                        cat,
                                        i,
                                        hslToRgb([
                                          hsl[0],
                                          parseFloat(e.target.value || "0"),
                                          hsl[2],
                                        ])
                                      )
                                    }
                                  />
                                </label>
                                <label className="flex items-center gap-1">
                                  L
                                  <Input
                                    type="number"
                                    className="w-16"
                                    value={Math.round(hsl[2])}
                                    onChange={(e) =>
                                      handleColorChange(
                                        cat,
                                        i,
                                        hslToRgb([
                                          hsl[0],
                                          hsl[1],
                                          parseFloat(e.target.value || "0"),
                                        ])
                                      )
                                    }
                                  />
                                </label>
                              </div>
                            )}
                            {mode === "lch" && (
                              <div className="flex flex-1 flex-wrap items-center gap-2 text-xs">
                                <label className="flex items-center gap-1">
                                  L
                                  <Input
                                    type="number"
                                    className="w-16"
                                    value={Math.round(lch[0])}
                                    onChange={(e) =>
                                      handleColorChange(
                                        cat,
                                        i,
                                        lchToRgb([
                                          parseFloat(e.target.value || "0"),
                                          lch[1],
                                          lch[2],
                                        ])
                                      )
                                    }
                                  />
                                </label>
                                <label className="flex items-center gap-1">
                                  C
                                  <Input
                                    type="number"
                                    className="w-16"
                                    value={Math.round(lch[1])}
                                    onChange={(e) =>
                                      handleColorChange(
                                        cat,
                                        i,
                                        lchToRgb([
                                          lch[0],
                                          parseFloat(e.target.value || "0"),
                                          lch[2],
                                        ])
                                      )
                                    }
                                  />
                                </label>
                                <label className="flex items-center gap-1">
                                  H
                                  <Input
                                    type="number"
                                    className="w-16"
                                    value={Math.round(lch[2])}
                                    onChange={(e) =>
                                      handleColorChange(
                                        cat,
                                        i,
                                        lchToRgb([
                                          lch[0],
                                          lch[1],
                                          parseFloat(e.target.value || "0"),
                                        ])
                                      )
                                    }
                                  />
                                </label>
                              </div>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="shrink-0"
                              onClick={() => handleRemoveColor(cat, i)}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        );
                      })}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddColor(cat)}
                        className="mt-2"
                      >
                        <Plus className="size-4" />
                        Add {cat} Color
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <Tabs defaultValue="css" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="css">CSS</TabsTrigger>
                  <TabsTrigger value="tailwind">Tailwind</TabsTrigger>
                  <TabsTrigger value="scss">SCSS</TabsTrigger>
                  <TabsTrigger value="json">JSON</TabsTrigger>
                </TabsList>
                <TabsContent value="css" className="space-y-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">CSS Variables</CardTitle>
                      <CardDescription>Copy and paste into your global CSS</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[120px] w-full rounded-md border bg-background p-3 font-mono text-xs"
                        value={cssVars}
                        readOnly
                      />
                    </CardContent>
                    <CardFooter className="justify-end">
                      <CopyButton text={cssVars} />
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="tailwind" className="space-y-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Tailwind Config</CardTitle>
                      <CardDescription>Add to your tailwind.config.js</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[120px] w-full rounded-md border bg-background p-3 font-mono text-xs"
                        value={tailwindConfig}
                        readOnly
                      />
                    </CardContent>
                    <CardFooter className="justify-end">
                      <CopyButton text={tailwindConfig} />
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="scss" className="space-y-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">SCSS Variables</CardTitle>
                      <CardDescription>Import into your SCSS files</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[120px] w-full rounded-md border bg-background p-3 font-mono text-xs"
                        value={scssVars}
                        readOnly
                      />
                    </CardContent>
                    <CardFooter className="justify-end">
                      <CopyButton text={scssVars} />
                    </CardFooter>
                  </Card>
                </TabsContent>
                <TabsContent value="json" className="space-y-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">JSON Export</CardTitle>
                      <CardDescription>Use in config files or scripts</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <textarea
                        className="min-h-[120px] w-full rounded-md border bg-background p-3 font-mono text-xs"
                        value={jsonExport}
                        readOnly
                      />
                    </CardContent>
                    <CardFooter className="justify-between">
                      <Button size="sm" variant="outline" onClick={downloadAsJson}>
                        <Download className="size-4" />
                        Download
                      </Button>
                      <CopyButton text={jsonExport} />
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                  <CardDescription>Preview with shadcn/ui components</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="flex flex-col gap-4"
                    style={previewBindings as React.CSSProperties}
                  >
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
                    <div className="grid grid-cols-1 gap-3">
                      <Card>
                        <CardHeader>
                          <CardTitle>Card Component</CardTitle>
                          <CardDescription>Example card with current theme</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            This is sample body text showing how your theme looks with different
                            components.
                          </p>
                        </CardContent>
                        <CardFooter>
                          <Button size="sm">Action</Button>
                        </CardFooter>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Dropdown Menu</CardTitle>
                          <CardDescription>Test menu styles</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Open Menu
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem>Option One</DropdownMenuItem>
                              <DropdownMenuItem>Option Two</DropdownMenuItem>
                              <DropdownMenuItem>Option Three</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Color Assignments</CardTitle>
                  <CardDescription>Quick reference</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {(["primary", "secondary", "accent", "sub"] as Category[]).map((cat) => (
                      <div key={cat} className="flex flex-col gap-1">
                        <div className="text-xs font-medium text-muted-foreground capitalize">
                          {cat}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(assignments[cat] ?? []).map((c, i) => (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <div
                                className="size-10 rounded-md border shadow-sm"
                                style={{ backgroundColor: `rgb(${c[0]}, ${c[1]}, ${c[2]})` }}
                                title={`rgb(${c[0]}, ${c[1]}, ${c[2]})`}
                              />
                              <div className="text-[10px] text-muted-foreground">
                                {hexFromRgb(c)}
                              </div>
                            </div>
                          ))}
                          {(assignments[cat] ?? []).length === 0 && (
                            <div className="text-xs text-muted-foreground">No colors</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
