"use client";

import { extractPalette, type PaletteEntry, type Rgb, samplePixels } from "@/lib/color";
import { loadImageData, validateImageFile } from "@/lib/image/load-image";
import { createSampleImageFile } from "@/lib/image/sample-image";
import {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** Fewest colors the count control allows. */
export const MIN_COLORS = 2;

/** Most colors the count control allows. */
export const MAX_COLORS = 12;

/** Colors a fresh image is extracted into. */
export const DEFAULT_COLORS = 6;

/** Used for harmonies and scales before an image has been read. */
const FALLBACK_BASE: Rgb = [90, 100, 130];

const EMPTY_PALETTE: PaletteEntry[] = [];

/** Where the studio is in the drop, extract, export flow. */
export type StudioStatus = "empty" | "loading" | "ready" | "error";

/** Everything the studio views read and write. */
export type PaletteStudioState = {
  status: StudioStatus;
  error: string | null;
  fileName: string | null;
  previewUrl: string | null;
  palette: PaletteEntry[];
  /** True while a palette for the current settings is still being worked out. */
  extracting: boolean;
  colorCount: number;
  /** Palette index the suggestions are built from. */
  baseIndex: number;
  baseColor: Rgb;
  open: (file: File) => void;
  openSample: () => void;
  clear: () => void;
  setColorCount: (count: number) => void;
  setBaseIndex: (index: number) => void;
};

/**
 * Owns the image and the palette derived from it: validation, decoding, sampling, extraction and
 * the object URL behind the preview. The palette is derived rather than stored, so changing the
 * color count re-extracts in a deferred render instead of blocking the slider.
 */
export const usePalette = (): PaletteStudioState => {
  const [status, setStatus] = useState<StudioStatus>("empty");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<{ name: string; url: string } | null>(null);
  const [pixels, setPixels] = useState<Uint8ClampedArray | null>(null);
  const [colorCount, setColorCount] = useState(DEFAULT_COLORS);
  const [baseIndex, setBaseIndex] = useState(0);

  const objectUrl = useRef<string | null>(null);
  const request = useRef(0);

  const deferredCount = useDeferredValue(colorCount);
  const palette = useMemo(
    () => (pixels ? extractPalette(pixels, { k: deferredCount }) : EMPTY_PALETTE),
    [pixels, deferredCount]
  );

  // Revoke the object URL of the image being replaced, and of the last one on unmount.
  const takeUrl = useCallback((next: string | null) => {
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = next;
  }, []);
  useEffect(() => () => takeUrl(null), [takeUrl]);

  const open = useCallback(
    (file: File) => {
      const invalid = validateImageFile(file);
      // Keep whatever is on screen; the message is shown next to the drop target.
      if (invalid) {
        setError(invalid);
        return;
      }

      const ticket = ++request.current;
      setError(null);
      setStatus("loading");

      void loadImageData(file)
        .then((image) => {
          if (ticket !== request.current) return;
          const sampled = samplePixels(image);
          const url = URL.createObjectURL(file);
          takeUrl(url);
          startTransition(() => {
            setSource({ name: file.name, url });
            setPixels(sampled);
            setBaseIndex(0);
            setStatus("ready");
          });
        })
        .catch(() => {
          if (ticket !== request.current) return;
          setError("That image could not be decoded. Try another file.");
          setStatus("error");
        });
    },
    [takeUrl]
  );

  const openSample = useCallback(() => {
    setError(null);
    setStatus("loading");
    void createSampleImageFile()
      .then(open)
      .catch(() => {
        setError("The sample image could not be drawn in this browser.");
        setStatus("error");
      });
  }, [open]);

  const clear = useCallback(() => {
    request.current++;
    takeUrl(null);
    setSource(null);
    setPixels(null);
    setError(null);
    setBaseIndex(0);
    setColorCount(DEFAULT_COLORS);
    setStatus("empty");
  }, [takeUrl]);

  // A paste lands on the document, not on the drop zone, so it works wherever the caret is.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const pasted =
        Array.from(event.clipboardData?.files ?? [])[0] ??
        Array.from(event.clipboardData?.items ?? [])
          .find((item) => item.kind === "file")
          ?.getAsFile();
      if (!pasted) return;
      event.preventDefault();
      open(pasted);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [open]);

  const safeBaseIndex = palette.length > 0 ? Math.min(baseIndex, palette.length - 1) : 0;

  return {
    status,
    error,
    fileName: source?.name ?? null,
    previewUrl: source?.url ?? null,
    palette,
    extracting: status === "loading" || colorCount !== deferredCount,
    colorCount,
    baseIndex: safeBaseIndex,
    baseColor: palette[safeBaseIndex]?.color ?? FALLBACK_BASE,
    open,
    openSample,
    clear,
    setColorCount,
    setBaseIndex,
  };
};
