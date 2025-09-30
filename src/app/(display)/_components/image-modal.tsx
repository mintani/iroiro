"use client";

import { Button } from "@/components/ui/button";
import { Download, Minus, Plus, RefreshCcw, X } from "lucide-react";
import NextImage from "next/image";
import React from "react";
import { createPortal } from "react-dom";

type Props = {
  src: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
};

export const ImageModal: React.FC<Props> = ({ src, open, onOpenChange, title }) => {
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const dragState = React.useRef<{
    dragging: boolean;
    startX: number;
    startY: number;
    ox: number;
    oy: number;
  } | null>(null);

  React.useEffect(() => {
    if (open) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      document.documentElement.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  if (!open || !src) return null;

  const download = () => {
    try {
      const a = document.createElement("a");
      a.href = src;
      a.download = "image";
      a.click();
    } catch {}
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex flex-col overflow-hidden bg-black/90 select-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
      onWheel={(e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom((z) => Math.min(6, Math.max(0.2, z + delta)));
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") onOpenChange(false);
      }}
      tabIndex={-1}
    >
      <div className="pointer-events-auto relative z-[1100] flex items-center justify-between border-b border-white/10 bg-black/40 px-4 py-2 text-white">
        <div className="truncate text-sm opacity-90">{title ?? "Image"}</div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-white/20 text-primary"
            onClick={() => setZoom((z) => Math.max(0.2, z - 0.1))}
          >
            <Minus className="size-4" />
          </Button>
          <div className="mx-2 text-xs opacity-80">{Math.round(zoom * 100)}%</div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 border-white/20 text-primary"
            onClick={() => setZoom((z) => Math.min(6, z + 0.1))}
          >
            <Plus className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="ml-2 h-8 border-white/20 text-primary"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            <RefreshCcw className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="ml-2 h-8 border-white/20 text-primary"
            onClick={download}
          >
            <Download className="size-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="ml-2 h-8 border-white/20 text-primary"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>

      <div className="relative z-[1000] flex min-h-0 flex-1 items-center justify-center">
        <div
          className="relative max-h-[90vh] max-w-[90vw] cursor-grab active:cursor-grabbing"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          onMouseDown={(e) => {
            dragState.current = {
              dragging: true,
              startX: e.clientX,
              startY: e.clientY,
              ox: offset.x,
              oy: offset.y,
            };
          }}
          onMouseMove={(e) => {
            const s = dragState.current;
            if (!s || !s.dragging) return;
            setOffset({ x: s.ox + (e.clientX - s.startX), y: s.oy + (e.clientY - s.startY) });
          }}
          onMouseUp={() => {
            if (dragState.current) dragState.current.dragging = false;
          }}
          onMouseLeave={() => {
            if (dragState.current) dragState.current.dragging = false;
          }}
          onDoubleClick={() => {
            setZoom(1);
            setOffset({ x: 0, y: 0 });
          }}
        >
          <NextImage
            src={src}
            alt={title ?? "image"}
            width={1600}
            height={1200}
            unoptimized
            className="pointer-events-none object-contain select-none"
          />
        </div>
      </div>
    </div>,
    document.body
  );
};
