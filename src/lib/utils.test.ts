import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("joins class names", () => {
    expect(cn("px-2", "py-1")).toBe("px-2 py-1");
  });

  it("keeps the last conflicting tailwind class", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("skips nullish values", () => {
    expect(cn("px-2", undefined, null)).toBe("px-2");
  });
});
