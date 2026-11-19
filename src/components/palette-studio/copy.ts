"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

/** How long the copy buttons stay in their copied state. */
const FLASH_MS = 1200;

/** Writes text to the clipboard. Resolves `false` when the browser refuses. */
export const copyText = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

/** Copies text and reports the outcome in a toast. `label` is what the toast names. */
export const copyWithToast = async (text: string, label = text): Promise<boolean> => {
  const copied = await copyText(text);
  if (copied) toast(`Copied ${label}`);
  else toast.error("Copy failed. Your browser blocked clipboard access.");
  return copied;
};

/**
 * Tracks a short lived "copied" flag for a button. The timer is cleared on unmount, so a button
 * that disappears mid flash never sets state on a gone component.
 */
export const useCopiedFlash = (): [boolean, () => void] => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  const flash = useCallback(() => {
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), FLASH_MS);
  }, []);

  return [copied, flash];
};
