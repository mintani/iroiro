import { usePalette } from "@/components/palette-studio/use-palette";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadImageData, createSampleImageFile } = vi.hoisted(() => ({
  loadImageData: vi.fn<(file: File) => Promise<ImageData>>(),
  createSampleImageFile: vi.fn<() => Promise<File>>(),
}));

vi.mock("@/lib/image/load-image", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/image/load-image")>()),
  loadImageData,
}));

vi.mock("@/lib/image/sample-image", () => ({ createSampleImageFile }));

/** A 2x2 image that decodes fine and is fully transparent. */
const TRANSPARENT: ImageData = {
  data: new Uint8ClampedArray(16),
  width: 2,
  height: 2,
  colorSpace: "srgb",
};

/** A 2x2 image of one opaque color. */
const OPAQUE: ImageData = {
  data: new Uint8ClampedArray([
    30, 90, 200, 255, 30, 90, 200, 255, 30, 90, 200, 255, 30, 90, 200, 255,
  ]),
  width: 2,
  height: 2,
  colorSpace: "srgb",
};

const imageFile = (name: string): File =>
  new File([new Uint8Array(1)], name, { type: "image/png" });

beforeEach(() => {
  loadImageData.mockReset();
  createSampleImageFile.mockReset();
  URL.createObjectURL = vi.fn<typeof URL.createObjectURL>(() => "blob:studio");
  URL.revokeObjectURL = vi.fn<typeof URL.revokeObjectURL>();
});

describe("usePalette", () => {
  it("says why an image with no opaque pixels gave nothing, and keeps it out", async () => {
    loadImageData.mockResolvedValue(TRANSPARENT);
    const { result } = renderHook(() => usePalette());

    act(() => result.current.open(imageFile("glass.png")));
    await waitFor(() => expect(result.current.status).toBe("error"));

    expect(result.current.error).toContain("opaque pixels");
    expect(result.current.previewUrl).toBeNull();
    expect(result.current.palette).toHaveLength(0);
  });

  it("keeps a rejected file from touching the image on screen", () => {
    const { result } = renderHook(() => usePalette());

    act(() =>
      result.current.open(new File([new Uint8Array(1)], "report.pdf", { type: "application/pdf" }))
    );

    expect(result.current.error).toContain("not an image");
    expect(result.current.status).toBe("empty");
  });

  it("clears a message a rejected file left behind while an image was decoding", async () => {
    loadImageData.mockResolvedValue(OPAQUE);
    const { result } = renderHook(() => usePalette());

    act(() => result.current.open(imageFile("photo.png")));
    act(() =>
      result.current.open(new File([new Uint8Array(1)], "notes.txt", { type: "text/plain" }))
    );
    expect(result.current.error).toContain("not an image");

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.error).toBeNull();
    expect(result.current.palette.length).toBeGreaterThan(0);
  });

  it("drops a sample that is drawn after the visitor dropped their own image", async () => {
    let handOver: (file: File) => void = () => {};
    createSampleImageFile.mockReturnValue(
      new Promise<File>((resolve) => {
        handOver = resolve;
      })
    );
    loadImageData.mockResolvedValue(OPAQUE);
    const { result } = renderHook(() => usePalette());

    act(() => result.current.openSample());
    act(() => result.current.open(imageFile("dropped.png")));
    await waitFor(() => expect(result.current.status).toBe("ready"));

    await act(async () => handOver(imageFile("sample.png")));

    expect(result.current.fileName).toBe("dropped.png");
    expect(loadImageData).toHaveBeenCalledTimes(1);
  });
});
