import { describe, expect, it } from "vitest";
import { deltaE76, rgbToLab } from "@/lib/color/convert";
import { extractPalette } from "@/lib/color/kmeans";
import type { Rgb } from "@/lib/color/types";

/** Deterministic PRNG, so the noisy fixtures below are stable across runs. */
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

/** Lays out `perColor` opaque pixels for each color, in order. */
const flatPixels = (colors: Rgb[], perColor: number): Uint8ClampedArray => {
  const data = new Uint8ClampedArray(colors.length * perColor * 4);
  let offset = 0;
  for (const color of colors) {
    for (let i = 0; i < perColor; i++) {
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
      offset += 4;
    }
  }
  return data;
};

const THREE: Rgb[] = [
  [220, 40, 40],
  [40, 180, 90],
  [50, 70, 200],
];

describe("extractPalette", () => {
  it("recovers three flat colors with equal shares", () => {
    const palette = extractPalette(flatPixels(THREE, 1000));
    expect(palette).toHaveLength(3);
    for (const entry of palette) {
      expect(entry.share).toBeCloseTo(1 / 3, 3);
      const nearest = Math.min(
        ...THREE.map((color) => deltaE76(rgbToLab(entry.color), rgbToLab(color)))
      );
      expect(nearest).toBeLessThan(1);
    }
    expect(palette.reduce((sum, entry) => sum + entry.share, 0)).toBeCloseTo(1, 10);
  });

  it("sorts entries by share, largest first", () => {
    const data = new Uint8ClampedArray(1000 * 4);
    for (let i = 0; i < 1000; i++) {
      const color = i < 700 ? THREE[0] : i < 900 ? THREE[1] : THREE[2];
      data[i * 4] = color[0];
      data[i * 4 + 1] = color[1];
      data[i * 4 + 2] = color[2];
      data[i * 4 + 3] = 255;
    }
    const palette = extractPalette(data);
    expect(palette).toHaveLength(3);
    expect(palette[0].share).toBeCloseTo(0.7, 3);
    expect(palette[1].share).toBeCloseTo(0.2, 3);
    expect(palette[2].share).toBeCloseTo(0.1, 3);
  });

  it("is deterministic for the same seed", () => {
    const random = mulberry32(5);
    const data = new Uint8ClampedArray(4000 * 4);
    for (let i = 0; i < 4000; i++) {
      data[i * 4] = random() * 255;
      data[i * 4 + 1] = random() * 255;
      data[i * 4 + 2] = random() * 255;
      data[i * 4 + 3] = 255;
    }
    const first = extractPalette(data, { seed: 99 });
    const second = extractPalette(data, { seed: 99 });
    expect(first).toEqual(second);
    expect(first.length).toBeGreaterThan(1);
  });

  it("does not exceed the number of distinct colors when k is larger", () => {
    const palette = extractPalette(flatPixels(THREE, 500), { k: 16 });
    expect(palette.length).toBeLessThanOrEqual(3);
    expect(palette).toHaveLength(3);
  });

  it("handles a single pixel and a single color", () => {
    expect(extractPalette(flatPixels([THREE[0]], 1))).toHaveLength(1);
    expect(extractPalette(flatPixels([THREE[0]], 400))).toHaveLength(1);
    expect(extractPalette(flatPixels([THREE[0]], 400))[0].share).toBe(1);
  });

  it("returns nothing for transparent or empty input", () => {
    const transparent = new Uint8ClampedArray(400 * 4);
    for (let i = 0; i < 400; i++) transparent[i * 4] = 255;
    expect(extractPalette(transparent)).toEqual([]);
    expect(extractPalette(new Uint8ClampedArray(0))).toEqual([]);
  });

  it("ignores pixels below the alpha floor", () => {
    const data = flatPixels([THREE[0], THREE[1]], 500);
    for (let i = 500; i < 1000; i++) data[i * 4 + 3] = 10;
    const palette = extractPalette(data);
    expect(palette).toHaveLength(1);
    expect(deltaE76(rgbToLab(palette[0].color), rgbToLab(THREE[0]))).toBeLessThan(1);
  });

  it("clamps k into 1..16", () => {
    const data = flatPixels(THREE, 300);
    expect(extractPalette(data, { k: 0 })).toHaveLength(1);
    expect(extractPalette(data, { k: 999 }).length).toBeLessThanOrEqual(3);
  });

  it("respects mergeThreshold", () => {
    const near: Rgb[] = [
      [120, 120, 120],
      [124, 122, 121],
    ];
    expect(extractPalette(flatPixels(near, 500), { k: 2, mergeThreshold: 20 })).toHaveLength(1);
    expect(extractPalette(flatPixels(near, 500), { k: 2, mergeThreshold: 0 })).toHaveLength(2);
  });

  it("clusters 40k noisy pixels quickly", () => {
    const random = mulberry32(11);
    const total = 40000;
    const data = new Uint8ClampedArray(total * 4);
    const anchors: Rgb[] = [
      [230, 70, 60],
      [40, 120, 210],
      [250, 205, 90],
      [30, 30, 40],
      [240, 240, 235],
    ];
    for (let i = 0; i < total; i++) {
      const anchor = anchors[i % anchors.length];
      data[i * 4] = anchor[0] + (random() - 0.5) * 40;
      data[i * 4 + 1] = anchor[1] + (random() - 0.5) * 40;
      data[i * 4 + 2] = anchor[2] + (random() - 0.5) * 40;
      data[i * 4 + 3] = 255;
    }

    const started = performance.now();
    const palette = extractPalette(data, { k: 8 });
    const elapsed = performance.now() - started;
    console.log(`extractPalette: 40000 pixels, k=8 -> ${elapsed.toFixed(2)} ms`);

    expect(palette.length).toBeGreaterThan(1);
    expect(palette.length).toBeLessThanOrEqual(8);
    expect(elapsed).toBeLessThan(500);
  });
});
