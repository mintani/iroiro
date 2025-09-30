"use client";

import { useImageBus } from "@/components/providers/image-bus";
import React from "react";

export const Palette: React.FC<
  { colors: [number, number, number][] } & React.HTMLAttributes<HTMLDivElement>
> = ({ colors, className, ...rest }) => {
  return (
    <div className={"flex flex-wrap gap-2 " + (className ?? "")} {...rest}>
      {colors.map((c, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div
            className="size-8 rounded-md border shadow-xs"
            style={{ backgroundColor: `rgb(${c[0]}, ${c[1]}, ${c[2]})` }}
            title={`rgb(${c[0]}, ${c[1]}, ${c[2]})`}
          />
          <div className="text-[10px] text-muted-foreground">{`#${[c[0], c[1], c[2]]
            .map((x) =>
              Math.max(0, Math.min(255, Math.round(x)))
                .toString(16)
                .padStart(2, "0")
            )
            .join("")}`}</div>
        </div>
      ))}
    </div>
  );
};

export const PaletteById: React.FC<{ id: string } & React.HTMLAttributes<HTMLDivElement>> = ({
  id,
  ...rest
}) => {
  const bus = useImageBus();
  const rec = bus.get(id);
  if (!rec?.palette?.length) return null;
  return <Palette colors={rec.palette} {...rest} />;
};

export const ThemeExtractor: React.FC = () => {
  const bus = useImageBus();
  const rec = bus.get("quant");
  const colors = rec?.palette ?? [];
  const vars = colors.slice(0, 6).map((c, i) => ({
    name: `--theme-color-${i + 1}`,
    value: `#${[c[0], c[1], c[2]]
      .map((x) =>
        Math.max(0, Math.min(255, Math.round(x)))
          .toString(16)
          .padStart(2, "0")
      )
      .join("")}`,
  }));
  return (
    <div className="flex flex-col gap-2">
      <Palette colors={colors as [number, number, number][]} />
      <div className="grid grid-cols-2 gap-1 text-[10px]">
        {vars.map((v) => (
          <div
            key={v.name}
            className="flex items-center justify-between rounded border bg-background/70 px-2 py-1"
          >
            <span className="text-muted-foreground">{v.name}</span>
            <span className="font-mono">{v.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
