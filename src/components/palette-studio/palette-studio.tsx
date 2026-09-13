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
import { useDropTarget } from "@/components/palette-studio/use-drop-target";
import { usePalette } from "@/components/palette-studio/use-palette";
import { useThemePreview } from "@/components/palette-studio/use-theme-preview";
import { TooltipProvider } from "@/components/ui/tooltip";
import { formatHex, suggestTheme } from "@/lib/color";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useMemo, useRef, useState } from "react";

export const PaletteStudio = () => {
  const studio = usePalette();
  const { resolvedTheme } = useTheme();
  const fileInput = useRef<HTMLInputElement>(null);

  const [modePick, setModePick] = useState<ThemeMode | null>(null);
  const [preview, setPreview] = useState(false);
  const drop = useDropTarget(studio.open, studio.rejectEmptyDrop);

  // Follows the app theme until the visitor picks a side for themselves.
  const mode: ThemeMode = modePick ?? (resolvedTheme === "dark" ? "dark" : "light");
  const theme = useMemo(() => suggestTheme(studio.palette, mode), [studio.palette, mode]);
  const hasPalette = studio.palette.length > 0;

  useThemePreview(hasPalette ? theme : null, preview);

  const openPicker = () => fileInput.current?.click();

  return (
    <TooltipProvider delayDuration={500}>
      <div
        // With an image on screen the whole studio takes a drop, so replacing is one gesture. It
        // hangs off the preview, not the palette: an image that yielded nothing still takes a drop.
        {...(studio.previewUrl ? drop.handlers : {})}
        className={cn(
          "mt-8 flex flex-col gap-7 rounded-lg",
          drop.dragging && "outline-2 outline-offset-8 outline-ring outline-dashed"
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
              onEmptyDrop={studio.rejectEmptyDrop}
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    Built from the whole palette. The base color drives the harmonies, the scale and
                    the text colors below.
                  </p>
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
