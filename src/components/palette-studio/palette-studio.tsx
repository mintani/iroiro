"use client";

import { DropZone } from "@/components/palette-studio/drop-zone";
import { ExportPanel } from "@/components/palette-studio/export-panel";
import { HarmonyRows } from "@/components/palette-studio/harmony-rows";
import { HowItWorks } from "@/components/palette-studio/how-it-works";
import { ImagePreview } from "@/components/palette-studio/image-preview";
import { PaletteView } from "@/components/palette-studio/palette-view";
import { ScaleRow } from "@/components/palette-studio/scale-row";
import { StudioSection, StudioSubhead } from "@/components/palette-studio/section";
import { type ThemeMode, ThemeSuggestion } from "@/components/palette-studio/theme-suggestion";
import { TextOnColor } from "@/components/palette-studio/text-on-color";
import { usePalette } from "@/components/palette-studio/use-palette";
import { useThemePreview } from "@/components/palette-studio/use-theme-preview";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatHex, suggestTheme } from "@/lib/color";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { type DragEvent, useMemo, useRef, useState } from "react";

export const PaletteStudio = () => {
  const studio = usePalette();
  const { resolvedTheme } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);

  const [modePick, setModePick] = useState<ThemeMode | null>(null);
  const [preview, setPreview] = useState(false);
  const [dragging, setDragging] = useState(false);

  // Follows the app theme until the visitor picks a side for themselves.
  const mode: ThemeMode = modePick ?? (resolvedTheme === "dark" ? "dark" : "light");
  const theme = useMemo(() => suggestTheme(studio.palette, mode), [studio.palette, mode]);
  const hasPalette = studio.palette.length > 0;

  useThemePreview(hasPalette ? theme : null, preview);

  const openPicker = () => fileInput.current?.click();

  const onDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    setDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files.item(0);
    if (dropped) studio.open(dropped);
  };

  return (
    <TooltipProvider delayDuration={500}>
      <div
        // With an image on screen the whole studio takes a drop, so replacing is one gesture.
        onDragOver={hasPalette ? onDragOver : undefined}
        onDragEnter={hasPalette ? onDragOver : undefined}
        onDragLeave={hasPalette ? onDragLeave : undefined}
        onDrop={hasPalette ? onDrop : undefined}
        className={cn(
          "mt-8 flex flex-col gap-7 rounded-lg",
          dragging && "outline-2 outline-offset-8 outline-ring outline-dashed"
        )}
      >
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const picked = event.target.files?.item(0);
            if (picked) studio.open(picked);
            event.target.value = "";
          }}
        />

        {studio.previewUrl ? (
          <ImagePreview
            url={studio.previewUrl}
            fileName={studio.fileName}
            colorCount={studio.colorCount}
            paletteSize={studio.palette.length}
            extracting={studio.extracting}
            onColorCount={studio.setColorCount}
            onReplace={openPicker}
            onClear={studio.clear}
          />
        ) : (
          <>
            <DropZone
              onPick={openPicker}
              onFile={studio.open}
              onSample={studio.openSample}
              error={studio.error}
              busy={studio.status === "loading"}
            />
            <HowItWorks />
          </>
        )}

        {studio.previewUrl && studio.error ? (
          <p role="alert" className="text-sm text-destructive">
            {studio.error}
          </p>
        ) : null}

        {hasPalette ? (
          <>
            <StudioSection title="Palette" meta={`${studio.palette.length} colors`}>
              <PaletteView
                palette={studio.palette}
                baseIndex={studio.baseIndex}
                onSelect={studio.setBaseIndex}
              />
            </StudioSection>

            <StudioSection title="Suggestions" meta={`base ${formatHex(studio.baseColor)}`}>
              <div className="grid gap-8">
                <div>
                  <StudioSubhead title="Theme" meta="11 tokens" />
                  <ThemeSuggestion
                    theme={theme}
                    mode={mode}
                    onMode={setModePick}
                    preview={preview}
                    onPreview={setPreview}
                  />
                </div>
                <div>
                  <StudioSubhead title="Harmonies" />
                  <HarmonyRows base={studio.baseColor} />
                </div>
                <div>
                  <StudioSubhead title="Scale" meta="50 → 950" />
                  <ScaleRow base={studio.baseColor} />
                </div>
                <div>
                  <StudioSubhead title="Text on color" />
                  <TextOnColor palette={studio.palette} />
                </div>
              </div>
            </StudioSection>

            <StudioSection title="Export" meta={mode}>
              <ExportPanel theme={theme} palette={studio.palette} />
            </StudioSection>
          </>
        ) : null}
      </div>
    </TooltipProvider>
  );
};
