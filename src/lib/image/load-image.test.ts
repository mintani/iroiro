import {
  fitWithin,
  loadImageData,
  MAX_IMAGE_BYTES,
  validateImageFile,
} from "@/lib/image/load-image";
import { afterEach, describe, expect, it, vi } from "vitest";

const fileOf = (type: string, size: number, name = "photo.png"): File => {
  const file = new File([new Uint8Array(1)], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

describe("validateImageFile", () => {
  it("accepts an image inside the size limit", () => {
    expect(validateImageFile(fileOf("image/png", 1024))).toBeNull();
  });

  it("rejects a file that is not an image", () => {
    expect(validateImageFile(fileOf("application/pdf", 1024, "report.pdf"))).toContain(
      "report.pdf"
    );
  });

  it("rejects an image over the size limit", () => {
    const message = validateImageFile(fileOf("image/jpeg", MAX_IMAGE_BYTES + 1));
    expect(message).toContain("20 MiB");
  });
});

describe("fitWithin", () => {
  it("leaves a small image alone", () => {
    expect(fitWithin(320, 200)).toEqual({ width: 320, height: 200 });
  });

  it("caps the long side of a landscape image", () => {
    expect(fitWithin(4000, 3000)).toEqual({ width: 512, height: 384 });
  });

  it("caps the long side of a portrait image", () => {
    expect(fitWithin(1000, 2500)).toEqual({ width: 205, height: 512 });
  });

  it("never returns a zero edge", () => {
    expect(fitWithin(1000, 1, 512)).toEqual({ width: 512, height: 1 });
  });
});

/** An `<img>` that always fails, so the fallback path settles instead of waiting for a load. */
class FailingImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;

  set src(_url: string) {
    queueMicrotask(() => this.onerror?.());
  }
}

const stubDecoding = (bitmaps: ImageBitmap[]) => {
  const createBitmap = vi.fn<(source: Blob | ImageBitmap) => Promise<ImageBitmap>>(() => {
    const next = bitmaps.shift();
    return next ? Promise.resolve(next) : Promise.reject(new Error("this codec resists resizing"));
  });
  vi.stubGlobal("createImageBitmap", createBitmap);
  vi.stubGlobal("Image", FailingImage);
  URL.createObjectURL = vi.fn<typeof URL.createObjectURL>(() => "blob:load-image");
  URL.revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();
  return createBitmap;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadImageData", () => {
  it("closes the bitmap when reading its pixels fails", async () => {
    const close = vi.fn<() => void>();
    stubDecoding([{ width: 8, height: 8, close }]);

    // jsdom hands out no 2d context, which is exactly the case this guards. The failure is
    // reported rather than retried through an <img>, which would fail the same way.
    await expect(loadImageData(fileOf("image/png", 1024))).rejects.toThrow(
      "This browser cannot read pixels from a canvas."
    );
    expect(close).toHaveBeenCalledOnce();
  });

  it("closes the full size bitmap when the resize fails", async () => {
    const close = vi.fn<() => void>();
    stubDecoding([{ width: 2048, height: 1024, close }]);

    // The resize throws, so the load falls back to an <img>, which fails in jsdom too.
    await expect(loadImageData(fileOf("image/png", 1024))).rejects.toThrow(
      "That image could not be decoded."
    );
    expect(close).toHaveBeenCalledOnce();
  });
});
