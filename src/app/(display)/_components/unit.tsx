"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus } from "lucide-react";
import React from "react";
import { EffectColorAdjustment } from "./effect-color-adjustment";
import { EffectColorShifter } from "./effect-color-shifter";
import { Sampler } from "./sampler";
import { Uploader } from "./uploader";
import { VisualContrastChecker } from "./visual-contrast-checker";
import { VisualPieChart } from "./visual-pie-chart";
import { VisualPool } from "./visual-pool";
import { VisualSphere } from "./visual-sphere";
import { VisualThemeExporter } from "./visual-theme-exporter";
type UnitCardProps = {
  title: string;
  front?: React.ReactNode;
  back?: React.ReactNode;
  children?: React.ReactNode;
  onRemove?: () => void;
  onFlip?: () => void;
  size?: "sm" | "md" | "lg";
  menu?: React.ReactNode;
  className?: string;
  bgClass?: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

const UnitCard: React.FC<UnitCardProps> = ({
  title,
  front,
  back,
  children,
  onRemove,
  menu,
  className,
  bgClass,
  dragHandleProps,
}) => {
  const [flipped, setFlipped] = React.useState(false);
  const frontContent = front ?? children ?? null;
  const backContent = back ?? null;

  return (
    <div
      className={`flex h-full flex-col rounded-2xl border shadow-sm ${bgClass ?? "bg-muted/80"}`}
    >
      <div className="flex h-8 items-center justify-between border-b bg-none px-3 text-sm text-muted-foreground">
        <div
          className="flex flex-1 cursor-grab items-center gap-2 active:cursor-grabbing"
          {...dragHandleProps}
        >
          <span className="size-1.5 rounded-full bg-foreground/60" />
          <span>{title}</span>
        </div>
        <div className={`flex items-center gap-2 ${className}`}>
          <span className="size-3 rounded bg-green-400" title="Active" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title="Plugin menu"
                aria-label="Plugin menu"
                className="size-3 rounded bg-amber-300 transition-colors hover:bg-amber-400"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              {menu ?? <div className="px-2 py-1 text-xs text-muted-foreground">No actions</div>}
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            type="button"
            title="Remove"
            aria-label="Remove module"
            onClick={onRemove}
            className="size-3 rounded bg-rose-500 transition-colors hover:bg-rose-600"
          />
          <button
            type="button"
            aria-pressed={flipped}
            onClick={() => setFlipped((v) => !v)}
            className="ml-2 rounded-md border bg-background px-2 py-0.5 text-xs hover:bg-accent"
          >
            Flip
          </button>
        </div>
      </div>
      <div className="relative flex-1 [perspective:1000px]">
        <div
          className={
            "absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d]" +
            (flipped ? " rotate-y-180" : "")
          }
        >
          <div className={`absolute inset-0 rounded-b-2xl px-4 py-4 [backface-visibility:hidden]`}>
            {frontContent}
          </div>
          <div
            className={`absolute inset-0 rotate-y-180 rounded-b-2xl px-3 py-2 [backface-visibility:hidden]`}
          >
            {backContent}
          </div>
        </div>
      </div>
    </div>
  );
};

// Module component props type
type ModuleKind =
  | "source"
  | "sampler"
  | "effect-adjustment"
  | "effect-shifter"
  | "sphere"
  | "contrast"
  | "pie"
  | "pool"
  | "theme";

type ModuleProps = {
  variant: ModuleKind | "empty";
  onPick?: (kind: ModuleKind) => void;
  size?: "sm" | "md" | "lg";
  allowedKinds?: ModuleKind[];
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
};

export const Unit: React.FC<ModuleProps> = ({
  variant,
  onPick,
  size = "md",
  allowedKinds,
  dragHandleProps,
}) => {
  const [kind, setKind] = React.useState<ModuleProps["variant"]>(variant);
  const [samplerInId, setSamplerInId] = React.useState<string>("source");
  const [samplerOutId, setSamplerOutId] = React.useState<string>("quant");
  const [uploaderOutId, setUploaderOutId] = React.useState<string>("source");
  // Plugins initial values
  const [effectInId, setEffectInId] = React.useState<string>("source");
  const [effectOutId, setEffectOutId] = React.useState<string>("effect");
  const [visualSourceId, setVisualSourceId] = React.useState<string>("quant");
  const [contrastSourceId, setContrastSourceId] = React.useState<string>("pool");
  const [sphereK] = React.useState<number>(512);
  const [sphereIter] = React.useState<number>(25);
  const [sphereSample] = React.useState<number>(512);
  const [sphereMaxDisplay, setSphereMaxDisplay] = React.useState<number>(512);
  const [spherePointSize, setSpherePointSize] = React.useState<number>(0.12);
  const [sphereOpacity, setSphereOpacity] = React.useState<number>(0.95);
  const [visualPoolOutId, setVisualPoolOutId] = React.useState<string>("pool");
  const [contrastFg, setContrastFg] = React.useState<[number, number, number] | undefined>(
    undefined
  );
  const [contrastBg, setContrastBg] = React.useState<[number, number, number] | undefined>(
    undefined
  );
  const allowed: ModuleKind[] = allowedKinds ?? [
    "source",
    "sampler",
    "effect-adjustment",
    "effect-shifter",
    "sphere",
    "contrast",
    "pie",
    "pool",
    "theme",
  ];
  // height is controlled by parent grid rows via h-full
  const sizeFilter = (k: ModuleKind) => {
    if (size === "lg") {
      return true;
    }
    if (size === "sm") {
      return k !== "pool";
    }
    return k !== "pool";
  };
  const effectiveAllowed = allowed.filter(sizeFilter);

  const handlePick = (k: ModuleKind) => {
    if (!effectiveAllowed.includes(k)) return;
    setKind(k);
    onPick?.(k);
  };

  const handleRemove = () => {
    setKind("empty");
  };

  const resetEffectState = () => {
    setEffectInId("source");
    setEffectOutId("effect");
  };

  const bgByKind: Record<ModuleKind, string> = {
    source: "glass tint-sky",
    sampler: "glass tint-emerald",
    "effect-adjustment": "glass tint-amber",
    "effect-shifter": "glass tint-fuchsia",
    sphere: "glass tint-indigo",
    contrast: "glass tint-stone",
    pie: "glass tint-rose",
    pool: "glass tint-teal",
    theme: "glass tint-violet",
  };

  const labelForKind = (k: ModuleKind) => {
    switch (k) {
      case "source":
        return "Image Uploader";
      case "sampler":
        return "Sampler";
      case "effect-adjustment":
        return "Effect: Adjustment";
      case "effect-shifter":
        return "Effect: Shifter";
      case "sphere":
        return "3D Sphere";
      case "contrast":
        return "Contrast Checker";
      case "pie":
        return "Pie Chart";
      case "pool":
        return "Color Pool";
      case "theme":
        return "Theme Exporter";
      default:
        return k;
    }
  };

  const pluginMenu = (
    <>
      {effectiveAllowed
        .filter((k) => k !== kind)
        .map((k) => (
          <DropdownMenuItem key={k} onSelect={() => handlePick(k)}>
            {labelForKind(k)}
          </DropdownMenuItem>
        ))}
    </>
  );

  return (
    <div className="flex size-full flex-col">
      {kind === "source" && (
        <UnitCard
          title="Image Uploader"
          bgClass={bgByKind.source}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center">
              <Uploader id={uploaderOutId} />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-3 p-3">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">OUT</div>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    OUT
                  </span>
                  <input
                    type="text"
                    value={uploaderOutId}
                    onChange={(e) => setUploaderOutId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Uploader OUT ID"
                    placeholder="source"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-3 pl-4 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Upload images by clicking, drag-and-drop, or pasting.</div>
                <div>Images are saved to OUT ID immediately upon selection.</div>
                <div>Click the upload button to send to the backend.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "sampler" && (
        <UnitCard
          title="Sampler Module"
          bgClass={bgByKind.sampler}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={<Sampler inId={samplerInId} outId={samplerOutId} />}
          back={
            <div className="grid h-full grid-cols-2 gap-3 p-3">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">IN / OUT</div>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">IN</span>
                  <input
                    type="text"
                    value={samplerInId}
                    onChange={(e) => setSamplerInId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Sampler IN ID"
                    placeholder="source"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    OUT
                  </span>
                  <input
                    type="text"
                    value={samplerOutId}
                    onChange={(e) => setSamplerOutId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Sampler OUT ID"
                    placeholder="quant"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-3 pl-4 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Extracts colors from IN image and saves quantized result to OUT.</div>
                <div>Adjust K/iterations/sample size with the top-left parameters.</div>
                <div>Click the canvas to open a fullscreen preview.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "effect-adjustment" && (
        <UnitCard
          title="Effect: Color Adjustment"
          bgClass={bgByKind["effect-adjustment"]}
          onRemove={() => {
            resetEffectState();
            handleRemove();
          }}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center p-2">
              <EffectColorAdjustment inId={effectInId} outId={effectOutId} />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-3 p-3">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">IN / OUT</div>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">IN</span>
                  <input
                    type="text"
                    value={effectInId}
                    onChange={(e) => setEffectInId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Effect IN ID"
                    placeholder="source"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    OUT
                  </span>
                  <input
                    type="text"
                    value={effectOutId}
                    onChange={(e) => setEffectOutId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Effect OUT ID"
                    placeholder="effect"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-3 pl-4 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Apply brightness/contrast/saturation to the input image.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "effect-shifter" && (
        <UnitCard
          title="Effect: Color Shifter"
          bgClass={bgByKind["effect-shifter"]}
          onRemove={() => {
            resetEffectState();
            handleRemove();
          }}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center p-2">
              <EffectColorShifter inId={effectInId} outId={effectOutId} />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-3 p-3">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">IN / OUT</div>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">IN</span>
                  <input
                    type="text"
                    value={effectInId}
                    onChange={(e) => setEffectInId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Effect IN ID"
                    placeholder="source"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    OUT
                  </span>
                  <input
                    type="text"
                    value={effectOutId}
                    onChange={(e) => setEffectOutId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Effect OUT ID"
                    placeholder="effect"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-3 pl-4 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Apply hue shift to the input image.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "sphere" && (
        <UnitCard
          title="3D Sphere"
          bgClass={bgByKind.sphere}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center">
              <VisualSphere
                sourceId={visualSourceId}
                k={sphereK}
                maxIter={sphereIter}
                sampleSize={sphereSample}
                maxDisplay={sphereMaxDisplay}
                pointSize={spherePointSize}
                pointOpacity={sphereOpacity}
              />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-1">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">SOURCE</div>
                <label className="flex items-center">
                  <span className="w-8 shrink-0 text-xs text-muted-foreground">SRC</span>
                  <input
                    type="text"
                    value={visualSourceId}
                    onChange={(e) => setVisualSourceId(e.target.value)}
                    className="h-7 w-14 rounded-md border bg-background px-2 text-xs"
                    aria-label="Sphere SOURCE ID"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/40 p-2">
                <div className="text-xs font-medium text-muted-foreground">DISPLAY</div>
                <div className="flex flex-wrap items-center">
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Colors
                    <input
                      type="number"
                      min={1}
                      max={512}
                      value={sphereMaxDisplay}
                      onChange={(e) => setSphereMaxDisplay(parseInt(e.target.value || "1", 10))}
                      className="h-7 w-14 rounded-md border bg-background px-2 text-xs"
                      aria-label="Sphere Max Display"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Opacity
                    <input
                      type="number"
                      min={0}
                      max={1}
                      step={0.05}
                      value={sphereOpacity}
                      onChange={(e) => setSphereOpacity(parseFloat(e.target.value || "1"))}
                      className="h-7 w-12 rounded-md border bg-background px-2 text-xs"
                      aria-label="Sphere Point Opacity"
                    />
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    Size
                    <input
                      type="number"
                      min={0.01}
                      max={0.5}
                      step={0.01}
                      value={spherePointSize}
                      onChange={(e) => setSpherePointSize(parseFloat(e.target.value || "0.1"))}
                      className="h-7 w-12 rounded-md border bg-background px-2 text-xs"
                      aria-label="Sphere Point Size"
                    />
                  </label>
                </div>
              </div>
            </div>
          }
        />
      )}

      {kind === "contrast" && (
        <UnitCard
          title="Contrast"
          bgClass={bgByKind.contrast}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center">
              <VisualContrastChecker
                sourceId={contrastSourceId}
                fg={contrastFg}
                bg={contrastBg}
                onFgChange={setContrastFg}
                onBgChange={setContrastBg}
              />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-1">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">SOURCE</div>
                <label className="flex items-center">
                  <span className="w-8 shrink-0 text-xs text-muted-foreground">SRC</span>
                  <input
                    type="text"
                    value={contrastSourceId}
                    onChange={(e) => setContrastSourceId(e.target.value)}
                    className="h-7 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Contrast SOURCE ID"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-2 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Automatically picks colors from the specified channel (default: pool).</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "pie" && (
        <UnitCard
          title="Pie Chart"
          bgClass={bgByKind.pie}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center p-2">
              <VisualPieChart sourceId={visualSourceId} />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-1">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">SOURCE</div>
                <label className="flex items-center">
                  <span className="w-8 shrink-0 text-xs text-muted-foreground">SRC</span>
                  <input
                    type="text"
                    value={visualSourceId}
                    onChange={(e) => setVisualSourceId(e.target.value)}
                    className="h-7 w-14 rounded-md border bg-background px-2 text-xs"
                    aria-label="Pie SOURCE ID"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-2 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Displays extracted palette as a pie chart with equal angles.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "pool" && (
        <UnitCard
          title="Color Pool"
          bgClass={bgByKind.pool}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center p-2">
              <VisualPool sourceId={visualSourceId} outId={visualPoolOutId} />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-3 p-3">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">IO</div>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    SRC
                  </span>
                  <input
                    type="text"
                    value={visualSourceId}
                    onChange={(e) => setVisualSourceId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Pool SOURCE ID"
                  />
                </label>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    OUT
                  </span>
                  <input
                    type="text"
                    value={visualPoolOutId}
                    onChange={(e) => setVisualPoolOutId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Pool OUT ID"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-3 pl-4 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Drag and drop colors to edit the array and save to new output.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "theme" && (
        <UnitCard
          title="Theme Exporter"
          bgClass={bgByKind.theme}
          onRemove={handleRemove}
          size={size}
          menu={pluginMenu}
          dragHandleProps={dragHandleProps}
          front={
            <div className="flex h-full items-center justify-center p-2">
              <VisualThemeExporter sourceId={visualPoolOutId} />
            </div>
          }
          back={
            <div className="grid h-full grid-cols-2 gap-3 p-3">
              <div className="flex flex-col justify-center gap-3 rounded-md border bg-background/60 p-3 backdrop-blur">
                <div className="text-xs font-medium text-muted-foreground">SOURCE</div>
                <label className="flex items-center gap-2">
                  <span className="w-10 shrink-0 text-right text-xs text-muted-foreground">
                    SRC
                  </span>
                  <input
                    type="text"
                    value={visualPoolOutId}
                    onChange={(e) => setVisualPoolOutId(e.target.value)}
                    className="h-8 w-full rounded-md border bg-background px-2 text-xs"
                    aria-label="Theme SOURCE ID"
                  />
                </label>
              </div>
              <div className="flex flex-col justify-center gap-2 rounded-md border bg-background/40 p-3 pl-4 text-xs text-muted-foreground">
                <div className="text-xs font-medium text-muted-foreground">GUIDE</div>
                <div>Exports the color palette as theme files in various formats.</div>
              </div>
            </div>
          }
        />
      )}

      {kind === "empty" && (
        <div className="flex h-full items-center justify-center rounded-2xl border bg-muted/80 text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="mt-5 rounded-full py-6 text-base">
                <Plus className="size-5" /> Add module
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-48">
              {effectiveAllowed.includes("source") && (
                <DropdownMenuItem onSelect={() => handlePick("source")}>Source</DropdownMenuItem>
              )}
              {effectiveAllowed.includes("sampler") && (
                <DropdownMenuItem onSelect={() => handlePick("sampler")}>Sampler</DropdownMenuItem>
              )}
              {effectiveAllowed.includes("effect-adjustment") && (
                <DropdownMenuItem onSelect={() => handlePick("effect-adjustment")}>
                  Effect: Adjustment
                </DropdownMenuItem>
              )}
              {effectiveAllowed.includes("effect-shifter") && (
                <DropdownMenuItem onSelect={() => handlePick("effect-shifter")}>
                  Effect: Shifter
                </DropdownMenuItem>
              )}
              {effectiveAllowed.includes("sphere") && (
                <DropdownMenuItem onSelect={() => handlePick("sphere")}>3D Sphere</DropdownMenuItem>
              )}
              {effectiveAllowed.includes("contrast") && (
                <DropdownMenuItem onSelect={() => handlePick("contrast")}>
                  Contrast Checker
                </DropdownMenuItem>
              )}
              {effectiveAllowed.includes("pie") && (
                <DropdownMenuItem onSelect={() => handlePick("pie")}>Pie Chart</DropdownMenuItem>
              )}
              {effectiveAllowed.includes("pool") && (
                <DropdownMenuItem onSelect={() => handlePick("pool")}>Color Pool</DropdownMenuItem>
              )}
              {effectiveAllowed.includes("theme") && (
                <DropdownMenuItem onSelect={() => handlePick("theme")}>
                  Theme Exporter
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
