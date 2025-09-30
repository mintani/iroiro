"use client";

import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import React from "react";

export const VisualThemeExporter: React.FC<{ sourceId?: string }> = ({ sourceId = "pool" }) => {
  const bus = useImageBus();
  const rec = bus.get(sourceId);
  const hasPalette = !!rec?.palette?.length;

  return (
    <div className="flex h-full w-full flex-col gap-2">
      <div className="text-xs text-muted-foreground">Tailwind Theme Exporter</div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={() => {
            const url = `/theme-editor?sourceId=${encodeURIComponent(sourceId)}`;
            window.open(url, "_blank", "noopener,noreferrer");
          }}
          disabled={!hasPalette}
        >
          Edit
        </Button>
      </div>
    </div>
  );
};
