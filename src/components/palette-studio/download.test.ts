import {
  type ExportFormat,
  exportFileName,
  exportMediaType,
} from "@/components/palette-studio/download";
import { describe, expect, it } from "vitest";

const FORMATS: ExportFormat[] = ["css", "tailwind", "scss", "json", "hex"];

describe("exportFileName", () => {
  it("maps every format to its own extension", () => {
    expect(FORMATS.map(exportFileName)).toEqual([
      "iroiro-theme.css",
      "iroiro-tailwind.css",
      "iroiro-theme.scss",
      "iroiro-theme.json",
      "iroiro-palette.txt",
    ]);
  });

  it("always includes an extension", () => {
    for (const format of FORMATS) expect(exportFileName(format)).toMatch(/\.[a-z]+$/);
  });

  it("gives the two css exports distinct names", () => {
    expect(exportFileName("css")).not.toBe(exportFileName("tailwind"));
  });
});

describe("exportMediaType", () => {
  it("maps every format to a media type", () => {
    expect(FORMATS.map(exportMediaType)).toEqual([
      "text/css",
      "text/css",
      "text/x-scss",
      "application/json",
      "text/plain",
    ]);
  });
});
