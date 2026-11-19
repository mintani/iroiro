/** Largest file the studio accepts, in bytes. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;

/** Long side, in pixels, of the canvas the palette is read from. */
export const MAX_EDGE = 512;

/** A source the 2d context can draw from. */
type Drawable = ImageBitmap | HTMLImageElement;

/** A pixel size in whole pixels. */
export type PixelSize = { width: number; height: number };

/**
 * Checks a file before decoding it. Returns a message to show the visitor, or `null` when the file
 * is usable.
 */
export const validateImageFile = (file: File): string | null => {
  if (!file.type.startsWith("image/")) {
    return `${file.name || "That file"} is not an image. Try a PNG, JPEG, WebP, GIF or AVIF.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    const size = (file.size / 1024 / 1024).toFixed(1);
    return `That image is ${size} MiB. The limit is 20 MiB.`;
  }
  return null;
};

/** Scales a size down so its long side fits `maxEdge`. Never scales up, never returns 0. */
export const fitWithin = (width: number, height: number, maxEdge = MAX_EDGE): PixelSize => {
  const longest = Math.max(width, height);
  const factor = longest > maxEdge && longest > 0 ? maxEdge / longest : 1;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
};

/** Draws a decoded image at `size` and reads its pixels back. */
const readPixels = (source: Drawable, size: PixelSize): ImageData => {
  if (typeof OffscreenCanvas === "function") {
    const canvas = new OffscreenCanvas(size.width, size.height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (context) {
      context.drawImage(source, 0, 0, size.width, size.height);
      return context.getImageData(0, 0, size.width, size.height);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("This browser cannot read pixels from a canvas.");
  context.drawImage(source, 0, 0, size.width, size.height);
  return context.getImageData(0, 0, size.width, size.height);
};

/** Decodes to a bitmap, resizing during the decode so a large photo is never held at full size. */
const decodeBitmap = async (file: File): Promise<ImageBitmap> => {
  const source = await createImageBitmap(file);
  const size = fitWithin(source.width, source.height);
  if (size.width === source.width && size.height === source.height) return source;

  try {
    return await createImageBitmap(source, {
      resizeWidth: size.width,
      resizeHeight: size.height,
      resizeQuality: "high",
    });
  } finally {
    // The full size bitmap is never handed out, so it is released even when the resize throws.
    source.close();
  }
};

/** Decodes through an `<img>`, for browsers without `createImageBitmap` or with a codec it rejects. */
const decodeElement = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That image could not be decoded."));
    };
    image.src = url;
  });

/**
 * Decodes an image file and returns its pixels, capped at {@link MAX_EDGE} on the long side. That
 * cap is what keeps palette extraction cheap enough to run on the main thread.
 */
export const loadImageData = async (file: File): Promise<ImageData> => {
  if (typeof createImageBitmap === "function") {
    let bitmap: ImageBitmap | null = null;
    try {
      bitmap = await decodeBitmap(file);
    } catch {
      // Some codecs decode in an <img> but not in createImageBitmap, so fall through. Only the
      // decode is forgiven here: a canvas that cannot be read is worth reporting.
    }

    if (bitmap) {
      try {
        return readPixels(bitmap, { width: bitmap.width, height: bitmap.height });
      } finally {
        bitmap.close();
      }
    }
  }

  const image = await decodeElement(file);
  return readPixels(image, fitWithin(image.naturalWidth, image.naturalHeight));
};
