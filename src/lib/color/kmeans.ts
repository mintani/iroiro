import { labToRgb, rgbToLabInto } from "./convert";
import { clampRgb } from "./gamut";
import type { PaletteEntry } from "./types";

/** Pixels below this alpha never take part in clustering. */
const ALPHA_FLOOR = 128;

/** Hard ceiling on cluster count, which keeps the assignment loop cheap. */
const MAX_K = 16;

/** Knobs for `extractPalette`. Every default is chosen to finish well under a frame. */
export type ExtractPaletteOptions = {
  /** Clusters to look for, 1 to 16. */
  k?: number;
  /** Upper bound on Lloyd iterations. */
  maxIterations?: number;
  /** Seed for the deterministic PRNG used by k-means++ seeding. */
  seed?: number;
  /** Centroids closer than this CIE76 distance are folded together. */
  mergeThreshold?: number;
};

/** Mulberry32: a tiny deterministic PRNG, so the same seed always yields the same palette. */
const mulberry32 = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/**
 * Clusters the opaque pixels of an RGBA buffer in CIELAB and returns the dominant colors with the
 * share of pixels each one covers, largest first. Deterministic for a given seed.
 */
export const extractPalette = (
  pixels: Uint8ClampedArray,
  options?: ExtractPaletteOptions
): PaletteEntry[] => {
  const maxIterations = Math.max(1, Math.floor(options?.maxIterations ?? 20));
  const mergeThreshold = Math.max(0, options?.mergeThreshold ?? 6);
  const random = mulberry32(options?.seed ?? 1);

  const pixelCount = Math.floor(pixels.length / 4);
  let count = 0;
  for (let index = 0; index < pixelCount; index++) {
    if (pixels[index * 4 + 3] >= ALPHA_FLOOR) count++;
  }
  if (count === 0) return [];

  const labs = new Float32Array(count * 3);
  let cursor = 0;
  for (let index = 0; index < pixelCount; index++) {
    const source = index * 4;
    if (pixels[source + 3] < ALPHA_FLOOR) continue;
    rgbToLabInto(pixels[source], pixels[source + 1], pixels[source + 2], labs, cursor);
    cursor += 3;
  }

  const k = Math.min(Math.max(1, Math.floor(options?.k ?? 8)), MAX_K, count);
  const centroids = new Float64Array(k * 3);
  const nearest = new Float64Array(count);
  nearest.fill(Number.POSITIVE_INFINITY);

  // k-means++ seeding: the first center is random, later ones favor pixels far from every center.
  let first = Math.floor(random() * count);
  if (first >= count) first = count - 1;
  centroids[0] = labs[first * 3];
  centroids[1] = labs[first * 3 + 1];
  centroids[2] = labs[first * 3 + 2];

  for (let center = 1; center < k; center++) {
    const previous = (center - 1) * 3;
    const cl = centroids[previous];
    const ca = centroids[previous + 1];
    const cb = centroids[previous + 2];
    let sum = 0;
    for (let index = 0; index < count; index++) {
      const offset = index * 3;
      const dl = labs[offset] - cl;
      const da = labs[offset + 1] - ca;
      const db = labs[offset + 2] - cb;
      const distance = dl * dl + da * da + db * db;
      if (distance < nearest[index]) nearest[index] = distance;
      sum += nearest[index];
    }

    let pick = count - 1;
    if (sum > 0) {
      let target = random() * sum;
      for (let index = 0; index < count; index++) {
        target -= nearest[index];
        if (target <= 0) {
          pick = index;
          break;
        }
      }
    } else {
      pick = Math.min(count - 1, Math.floor(random() * count));
    }
    const offset = center * 3;
    centroids[offset] = labs[pick * 3];
    centroids[offset + 1] = labs[pick * 3 + 1];
    centroids[offset + 2] = labs[pick * 3 + 2];
  }

  const labels = new Int32Array(count).fill(-1);
  const sums = new Float64Array(k * 3);
  const counts = new Int32Array(k);

  const assign = (): number => {
    let changed = 0;
    for (let index = 0; index < count; index++) {
      const offset = index * 3;
      const pl = labs[offset];
      const pa = labs[offset + 1];
      const pb = labs[offset + 2];
      let best = 0;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (let center = 0; center < k; center++) {
        const base = center * 3;
        const dl = pl - centroids[base];
        const da = pa - centroids[base + 1];
        const db = pb - centroids[base + 2];
        const distance = dl * dl + da * da + db * db;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = center;
        }
      }
      if (labels[index] !== best) {
        labels[index] = best;
        changed++;
      }
    }
    return changed;
  };

  const recenter = (): void => {
    sums.fill(0);
    counts.fill(0);
    for (let index = 0; index < count; index++) {
      const label = labels[index];
      const offset = index * 3;
      const base = label * 3;
      sums[base] += labs[offset];
      sums[base + 1] += labs[offset + 1];
      sums[base + 2] += labs[offset + 2];
      counts[label]++;
    }
    for (let center = 0; center < k; center++) {
      const size = counts[center];
      if (size === 0) continue;
      const base = center * 3;
      centroids[base] = sums[base] / size;
      centroids[base + 1] = sums[base + 1] / size;
      centroids[base + 2] = sums[base + 2] / size;
    }
  };

  let settled = false;
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    if (assign() === 0) {
      settled = true;
      break;
    }
    recenter();
  }
  // Count only once the labels match the centroids they will be reported with.
  if (!settled) assign();
  recenter();

  const clusters: { l: number; a: number; b: number; count: number }[] = [];
  for (let center = 0; center < k; center++) {
    if (counts[center] === 0) continue;
    const base = center * 3;
    clusters.push({
      l: centroids[base],
      a: centroids[base + 1],
      b: centroids[base + 2],
      count: counts[center],
    });
  }

  // Fold near-duplicate centroids together, weighting each by how many pixels it holds.
  const squaredThreshold = mergeThreshold * mergeThreshold;
  let merged = true;
  while (merged && clusters.length > 1) {
    merged = false;
    for (let i = 0; i < clusters.length && !merged; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const left = clusters[i];
        const right = clusters[j];
        const dl = left.l - right.l;
        const da = left.a - right.a;
        const db = left.b - right.b;
        if (dl * dl + da * da + db * db >= squaredThreshold) continue;
        const total = left.count + right.count;
        left.l = (left.l * left.count + right.l * right.count) / total;
        left.a = (left.a * left.count + right.a * right.count) / total;
        left.b = (left.b * left.count + right.b * right.count) / total;
        left.count = total;
        clusters.splice(j, 1);
        merged = true;
        break;
      }
    }
  }

  return clusters
    .map((cluster) => ({
      color: clampRgb(labToRgb({ l: cluster.l, a: cluster.a, b: cluster.b })),
      share: cluster.count / count,
    }))
    .sort((left, right) => right.share - left.share);
};
