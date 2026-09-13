import { describe, expect, it } from "vitest";
import { type PixelSource, samplePixels } from "@/lib/color/sample";

/** Builds an RGBA image from a callback, so tests can describe layout instead of bytes. */
const makeImage = (
  width: number,
  height: number,
  paint: (x: number, y: number) => [number, number, number, number]
): PixelSource => {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = paint(x, y);
      const offset = (y * width + x) * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = a;
    }
  }
  return { data, width, height };
};

/** Counts how many sampled pixels are dominated by red versus blue. */
const countSides = (pixels: Uint8ClampedArray) => {
  let red = 0;
  let blue = 0;
  for (let offset = 0; offset < pixels.length; offset += 4) {
    if (pixels[offset] > pixels[offset + 2]) red++;
    else blue++;
  }
  return { red, blue, total: pixels.length / 4 };
};

const RED: [number, number, number, number] = [255, 0, 0, 255];
const BLUE: [number, number, number, number] = [0, 0, 255, 255];

describe("samplePixels", () => {
  it("keeps every opaque pixel when the budget is large enough", () => {
    const image = makeImage(10, 10, () => RED);
    expect(samplePixels(image).length / 4).toBe(100);
  });

  it("stays within the budget for a 200x200 image", () => {
    const image = makeImage(200, 200, (_x, y) => (y < 100 ? RED : BLUE));
    for (const budget of [100, 1000, 5000, 40000]) {
      expect(samplePixels(image, budget).length / 4).toBeLessThanOrEqual(budget);
    }
  });

  it("preserves proportions for a horizontally split image", () => {
    const image = makeImage(200, 200, (_x, y) => (y < 100 ? RED : BLUE));
    const { red, blue, total } = countSides(samplePixels(image, 1000));
    expect(total).toBeGreaterThan(500);
    expect(Math.abs(red / total - 0.5)).toBeLessThan(0.02);
    expect(Math.abs(blue / total - 0.5)).toBeLessThan(0.02);
  });

  it("preserves proportions for a vertically split image", () => {
    const image = makeImage(200, 200, (x) => (x < 100 ? RED : BLUE));
    const { red, total } = countSides(samplePixels(image, 1000));
    expect(Math.abs(red / total - 0.5)).toBeLessThan(0.02);
  });

  it("preserves a lopsided split", () => {
    const image = makeImage(200, 200, (_x, y) => (y < 50 ? RED : BLUE));
    const { red, total } = countSides(samplePixels(image, 2000));
    expect(Math.abs(red / total - 0.25)).toBeLessThan(0.02);
  });

  it("skips pixels below the alpha floor", () => {
    const image = makeImage(20, 20, (x) => (x < 10 ? RED : [0, 0, 255, 10]));
    const pixels = samplePixels(image);
    expect(pixels.length / 4).toBe(200);
    const { red, blue } = countSides(pixels);
    expect(red).toBe(200);
    expect(blue).toBe(0);
  });

  it("returns nothing for a fully transparent image", () => {
    const image = makeImage(10, 10, () => [255, 0, 0, 0]);
    expect(samplePixels(image).length).toBe(0);
  });

  it("returns nothing for an empty image", () => {
    expect(samplePixels({ data: new Uint8ClampedArray(0), width: 0, height: 0 }).length).toBe(0);
  });

  it("is deterministic", () => {
    const image = makeImage(200, 200, (x, y) => [x, y, (x * y) % 256, 255]);
    expect(Array.from(samplePixels(image, 777))).toEqual(Array.from(samplePixels(image, 777)));
  });
});
