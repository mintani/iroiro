"use client";

import { useEffect, useState } from "react";

/**
 * Follows `value` once it has held still for `delay` milliseconds. Values it passes through on the
 * way are skipped, so work keyed off the result runs once per gesture instead of once per step.
 */
export const useDebounced = <T>(value: T, delay: number): T => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    if (settled === value) return;
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, settled, delay]);

  return settled;
};
