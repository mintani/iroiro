"use client";

import { copyWithToast } from "@/components/palette-studio/copy";
import { formatHex, type Rgb } from "@/lib/color";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type SwatchButtonProps = {
  color: Rgb;
  /** Read out after the hex, to say what the swatch is. */
  name?: string;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
};

/** A color chip that copies its own hex. */
export const SwatchButton = ({ color, name, className, onClick, children }: SwatchButtonProps) => {
  const hex = formatHex(color);

  return (
    <button
      type="button"
      aria-label={name ? `Copy ${hex}, ${name}` : `Copy ${hex}`}
      onClick={() => {
        onClick?.();
        void copyWithToast(hex);
      }}
      style={{ backgroundColor: hex }}
      className={cn(
        "rounded-sm ring-1 ring-foreground/10 transition-transform ring-inset focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {children}
    </button>
  );
};
