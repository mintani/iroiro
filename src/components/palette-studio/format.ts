/**
 * Formats a 0-1 share as a percentage. Shares under 10% keep one decimal, so a color that covers
 * a sliver of the image does not read as "0%".
 */
export const formatShare = (share: number): string => {
  const percent = Math.max(0, Math.min(1, share)) * 100;
  return percent < 9.95 ? `${percent.toFixed(1)}%` : `${Math.round(percent)}%`;
};

/** Formats a WCAG contrast ratio the way the spec writes it. */
export const formatRatio = (ratio: number): string => `${ratio.toFixed(2)}:1`;
