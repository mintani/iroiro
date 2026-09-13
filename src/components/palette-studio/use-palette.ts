"use client";

import { useDebounced } from "@/components/palette-studio/use-debounced";
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

/** How long the color count has to hold still before the palette is extracted again. */
const COUNT_SETTLE_MS = 150;

/** Used for harmonies and scales before an image has been read. */
const FALLBACK_BASE: Rgb = [90, 100, 130];

const EMPTY_PALETTE: PaletteEntry[] = [];

/** Shown when an image decodes but holds nothing a palette could be read from. */
const NO_PIXELS = "That image has no opaque pixels to read.";

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
 * color count re-extracts instead of blocking the slider.
 */
export const usePalette = (): PaletteStudioState => {
  const [status, setStatus] = useState<StudioStatus>("empty");
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<{ name: string; url: string } | null>(null);
  const [pixels, setPixels] = useState<Uint8ClampedArray | null>(null);
  const [colorCount, setColorCount] = useState(DEFAULT_COLORS);
  const [baseIndex, setBaseIndex] = useState(0);

  /** Every object URL this hook has minted, newest last. */
  const urls = useRef<string[]>([]);
  const request = useRef(0);

  // Extraction is synchronous and costs milliseconds, so it waits for the slider to stop moving
  // and then for a paint: dragging from 2 to 12 extracts once, not eleven times.
  const settledCount = useDeferredValue(useDebounced(colorCount, COUNT_SETTLE_MS));
  const palette = useMemo(
    () => (pixels ? extractPalette(pixels, { k: settledCount }) : EMPTY_PALETTE),
    [pixels, settledCount]
  );

  // Revoking the URL of a replaced image before React commits the new one would leave the mounted
  // <img> pointing at a dead URL, so the outgoing ones are revoked here, after the commit. A URL
  // minted for a load that was superseded before it committed is dropped the same way.
  useEffect(() => {
    const live = source?.url ?? null;
    const stale = urls.current.filter((url) => url !== live);
    urls.current = live ? [live] : [];
    for (const url of stale) URL.revokeObjectURL(url);
  }, [source]);

  // On unmount, invalidate the load in flight as well: its URL would otherwise be minted for a
  // gone component, with nobody left to revoke it.
  useEffect(
    () => () => {
      request.current++;
      for (const url of urls.current) URL.revokeObjectURL(url);
      urls.current = [];
    },
    []
  );

  const open = useCallback((file: File) => {
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
        // A fully transparent image decodes fine and clusters into nothing, so it never becomes
        // the source: the visitor would be left reading "0 colors found" with no reason why.
        if (sampled.length === 0) {
          setError(NO_PIXELS);
          setStatus("error");
          return;
        }

        const url = URL.createObjectURL(file);
        urls.current.push(url);
        startTransition(() => {
          // A file rejected while this one was decoding left a message behind.
          setError(null);
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
  }, []);

  const openSample = useCallback(() => {
    const ticket = ++request.current;
    setError(null);
    setStatus("loading");
    void createSampleImageFile()
      .then((file) => {
        // An image dropped while the sample was being drawn wins over the sample.
        if (ticket !== request.current) return;
        open(file);
      })
      .catch(() => {
        if (ticket !== request.current) return;
        setError("The sample image could not be drawn in this browser.");
        setStatus("error");
      });
  }, [open]);

  const clear = useCallback(() => {
    request.current++;
    setSource(null);
    setPixels(null);
    setError(null);
    setBaseIndex(0);
    setColorCount(DEFAULT_COLORS);
    setStatus("empty");
  }, []);

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
    extracting: status === "loading" || colorCount !== settledCount,
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
