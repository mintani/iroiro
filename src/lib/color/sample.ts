/** Pixels below this alpha are treated as absent and never sampled. */
const ALPHA_FLOOR = 128;

/** The shape of a browser `ImageData`, narrowed to what sampling needs. */
export type PixelSource = { data: Uint8ClampedArray; width: number; height: number };

/**
 * Keeps at most `maxPixels` opaque pixels by walking them at a fixed stride, so the sample
 * mirrors the image's color proportions without any randomness.
 */
export const samplePixels = (image: PixelSource, maxPixels = 40000): Uint8ClampedArray => {
  const { data, width, height } = image;
  const total = Math.max(0, Math.min(width * height, Math.floor(data.length / 4)));
  const budget = Math.max(1, Math.floor(maxPixels));

  let opaque = 0;
  for (let index = 0; index < total; index++) {
    if (data[index * 4 + 3] >= ALPHA_FLOOR) opaque++;
  }
  if (opaque === 0) return new Uint8ClampedArray(0);

  let stride = Math.max(1, Math.ceil(opaque / budget));
  // A stride that divides the row width would land on the same columns in every row and skew the
  // sample for images whose colors are laid out vertically, so step off that alignment.
  if (stride > 1 && width % stride === 0) stride++;

  const out = new Uint8ClampedArray(Math.ceil(opaque / stride) * 4);
  let seen = 0;
  let written = 0;
  for (let index = 0; index < total; index++) {
    const source = index * 4;
    if (data[source + 3] < ALPHA_FLOOR) continue;
    if (seen % stride === 0) {
      out[written] = data[source];
      out[written + 1] = data[source + 1];
      out[written + 2] = data[source + 2];
      out[written + 3] = data[source + 3];
      written += 4;
    }
    seen++;
  }
  return out.subarray(0, written);
};
