import { describe, expect, it } from "vitest";
import { hexToRgb } from "@/lib/color/convert";
import {
  SLOTS,
  toCssVariables,
  toHexList,
  toJson,
  toScss,
  toTailwindTheme,
} from "@/lib/color/export";
import { suggestTheme } from "@/lib/color/theme";
import type { PaletteEntry, Theme } from "@/lib/color/types";

const PALETTE: PaletteEntry[] = [
  { color: [59, 130, 246], share: 0.5 },
  { color: [244, 244, 245], share: 0.3 },
  { color: [24, 24, 27], share: 0.2 },
];

const THEME: Theme = suggestTheme(PALETTE, "light");

/** The eleven CSS variable names every exporter emits, in order. */
const NAMES = [
  "background",
  "foreground",
  "primary",
  "primary-foreground",
  "secondary",
  "secondary-foreground",
  "accent",
  "accent-foreground",
  "muted",
  "muted-foreground",
  "border",
];

const HEX = /^#[0-9a-f]{6}$/;

describe("SLOTS", () => {
  it("names every theme slot once, in the order the exporters write them", () => {
    expect(SLOTS.map(([, name]) => name)).toEqual(NAMES);
    expect(new Set(SLOTS.map(([slot]) => slot)).size).toBe(SLOTS.length);
  });

  it("points every entry at a slot the theme actually has", () => {
    for (const [slot] of SLOTS) expect(THEME[slot]).toHaveLength(3);
  });
});

describe("toCssVariables", () => {
  it("emits a root block with one variable per slot", () => {
    const lines = toCssVariables(THEME).split("\n");
    expect(lines).toHaveLength(13);
    expect(lines[0]).toBe(":root {");
    expect(lines[12]).toBe("}");
    NAMES.forEach((name, index) => {
      expect(lines[index + 1].startsWith(`  --${name}: `)).toBe(true);
    });
  });

  it("writes parsable hex by default", () => {
    for (const line of toCssVariables(THEME).split("\n").slice(1, 12)) {
      const value = line.split(": ")[1].replace(";", "");
      expect(value).toMatch(HEX);
      expect(hexToRgb(value)).not.toBeNull();
    }
  });

  it("writes oklch when asked", () => {
    const lines = toCssVariables(THEME, { format: "oklch" }).split("\n");
    for (const line of lines.slice(1, 12)) {
      expect(line).toMatch(/^ {2}--[a-z-]+: oklch\(\d+\.\d% \d\.\d{3} \d+\.\d\);$/);
    }
  });

  it("honors a custom selector", () => {
    expect(toCssVariables(THEME, { selector: ".dark" }).split("\n")[0]).toBe(".dark {");
  });
});

describe("toTailwindTheme", () => {
  it("puts the root block ahead of an at theme inline block", () => {
    const lines = toTailwindTheme(THEME).split("\n");
    expect(lines).toHaveLength(27);
    expect(lines[0]).toBe(":root {");
    expect(lines[12]).toBe("}");
    expect(lines[13]).toBe("");
    expect(lines[14]).toBe("@theme inline {");
    expect(lines[26]).toBe("}");
  });

  it("maps every color utility onto the matching variable", () => {
    const lines = toTailwindTheme(THEME).split("\n");
    NAMES.forEach((name, index) => {
      expect(lines[index + 15]).toBe(`  --color-${name}: var(--${name});`);
    });
  });
});

describe("toScss", () => {
  it("emits one parsable variable per slot", () => {
    const lines = toScss(THEME).split("\n");
    expect(lines).toHaveLength(11);
    NAMES.forEach((name, index) => {
      expect(lines[index].startsWith(`$${name}: `)).toBe(true);
      const value = lines[index].split(": ")[1].replace(";", "");
      expect(value).toMatch(HEX);
    });
  });
});

describe("toJson", () => {
  it("emits pretty printed theme hex without a palette", () => {
    const parsed = JSON.parse(toJson(THEME)) as { theme: Record<string, string> };
    expect(Object.keys(parsed)).toEqual(["theme"]);
    expect(Object.keys(parsed.theme)).toHaveLength(11);
    for (const value of Object.values(parsed.theme)) expect(value).toMatch(HEX);
    expect(toJson(THEME).includes("\n  ")).toBe(true);
  });

  it("includes the palette when one is given", () => {
    const parsed = JSON.parse(toJson(THEME, PALETTE)) as {
      theme: Record<string, string>;
      palette: { hex: string; share: number }[];
    };
    expect(Object.keys(parsed)).toEqual(["theme", "palette"]);
    expect(parsed.palette).toHaveLength(3);
    expect(parsed.palette[0]).toEqual({ hex: "#3b82f6", share: 0.5 });
    for (const entry of parsed.palette) expect(entry.hex).toMatch(HEX);
  });
});

describe("toHexList", () => {
  it("emits one hex per palette entry", () => {
    const lines = toHexList(PALETTE).split("\n");
    expect(lines).toEqual(["#3b82f6", "#f4f4f5", "#18181b"]);
    for (const line of lines) expect(line).toMatch(HEX);
  });

  it("emits nothing for an empty palette", () => {
    expect(toHexList([])).toBe("");
  });
});
