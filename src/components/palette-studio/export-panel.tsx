"use client";

import { copyWithToast, useCopiedFlash } from "@/components/palette-studio/copy";
import {
  type ExportFormat,
  exportFileName,
  downloadText,
} from "@/components/palette-studio/download";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  type ColorFormat,
  type PaletteEntry,
  type Theme,
  toCssVariables,
  toHexList,
  toJson,
  toScss,
  toTailwindTheme,
} from "@/lib/color";
import { Check, Copy, Download } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const TABS: [ExportFormat, string][] = [
  ["css", "CSS"],
  ["tailwind", "Tailwind"],
  ["scss", "SCSS"],
  ["json", "JSON"],
  ["hex", "Hex"],
];

const render = (
  format: ExportFormat,
  colorFormat: ColorFormat,
  theme: Theme,
  palette: PaletteEntry[]
): string => {
  switch (format) {
    case "css":
      return toCssVariables(theme, { format: colorFormat });
    case "tailwind":
      return toTailwindTheme(theme);
    case "scss":
      return toScss(theme);
    case "json":
      return toJson(theme, palette);
    case "hex":
      return toHexList(palette);
  }
};

type ExportPanelProps = { theme: Theme; palette: PaletteEntry[] };

export const ExportPanel = ({ theme, palette }: ExportPanelProps) => {
  const [format, setFormat] = useState<ExportFormat>("css");
  const [colorFormat, setColorFormat] = useState<ColorFormat>("hex");
  const [copied, flash] = useCopiedFlash();

  const label = TABS.find(([value]) => value === format)?.[1] ?? "CSS";
  const text = useMemo(
    () => render(format, colorFormat, theme, palette),
    [format, colorFormat, theme, palette]
  );

  return (
    <Tabs
      value={format}
      onValueChange={(next) => setFormat(next as ExportFormat)}
      className="mt-4 gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TabsList>
          {TABS.map(([value, name]) => (
            <TabsTrigger key={value} value={value}>
              {name}
            </TabsTrigger>
          ))}
        </TabsList>

        {format === "css" ? (
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={colorFormat}
            onValueChange={(next) => {
              if (next === "hex" || next === "oklch") setColorFormat(next);
            }}
          >
            <ToggleGroupItem value="hex">hex</ToggleGroupItem>
            <ToggleGroupItem value="oklch">oklch</ToggleGroupItem>
          </ToggleGroup>
        ) : null}
      </div>

      <TabsContent value={format} className="gap-3">
        {/* The tab panel around this block is focusable, so the overflow is keyboard scrollable. */}
        <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
          <code>{text}</code>
        </pre>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => {
              void copyWithToast(text, `the ${label} export`).then((ok) => {
                if (ok) flash();
              });
            }}
          >
            {copied ? (
              <Check className="size-3.5" aria-hidden="true" />
            ) : (
              <Copy className="size-3.5" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              downloadText(text, format);
              toast(`Saving ${exportFileName(format)}`);
            }}
          >
            <Download className="size-3.5" aria-hidden="true" />
            Download
          </Button>
          <span className="font-mono text-xs text-muted-foreground">{exportFileName(format)}</span>
        </div>
      </TabsContent>
    </Tabs>
  );
};
