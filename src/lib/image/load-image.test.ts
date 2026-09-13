import { fitWithin, MAX_IMAGE_BYTES, validateImageFile } from "@/lib/image/load-image";
import { describe, expect, it } from "vitest";

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
