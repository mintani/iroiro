import { formatRatio, formatShare } from "@/components/palette-studio/format";
import { describe, expect, it } from "vitest";

describe("formatShare", () => {
  it("rounds a large share to a whole percent", () => {
    expect(formatShare(0.5)).toBe("50%");
    expect(formatShare(0.4449)).toBe("44%");
    expect(formatShare(1)).toBe("100%");
  });

  it("keeps a decimal for a small share", () => {
    expect(formatShare(0.0123)).toBe("1.2%");
    expect(formatShare(0.0004)).toBe("0.0%");
  });

  it("clamps values outside 0 to 1", () => {
    expect(formatShare(-1)).toBe("0.0%");
    expect(formatShare(4)).toBe("100%");
  });
});

describe("formatRatio", () => {
  it("writes a ratio against 1", () => {
    expect(formatRatio(4.5)).toBe("4.50:1");
    expect(formatRatio(21)).toBe("21.00:1");
  });
});
