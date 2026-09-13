import { useDebounced } from "@/components/palette-studio/use-debounced";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const DELAY = 150;

const renderDebounced = (value: number) =>
  renderHook(({ value: next }: { value: number }) => useDebounced(next, DELAY), {
    initialProps: { value },
  });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useDebounced", () => {
  it("starts on the value it was handed", () => {
    expect(renderDebounced(6).result.current).toBe(6);
  });

  it("skips the values passed through inside the delay", () => {
    const { result, rerender } = renderDebounced(6);

    for (const value of [7, 8, 9]) {
      rerender({ value });
      act(() => vi.advanceTimersByTime(DELAY - 50));
    }
    expect(result.current).toBe(6);

    act(() => vi.advanceTimersByTime(DELAY));
    expect(result.current).toBe(9);
  });

  it("settles on nothing when the value comes back on its own", () => {
    const { result, rerender } = renderDebounced(6);

    rerender({ value: 9 });
    act(() => vi.advanceTimersByTime(DELAY - 50));
    rerender({ value: 6 });
    act(() => vi.advanceTimersByTime(DELAY * 2));

    expect(result.current).toBe(6);
  });
});
