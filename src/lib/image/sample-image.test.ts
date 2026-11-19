import {
  SAMPLE_HEIGHT,
  SAMPLE_WIDTH,
  sampleImagePlan,
  type SampleShape,
} from "@/lib/image/sample-image";
import { describe, expect, it } from "vitest";

const hex = /^#[0-9a-f]{6}$/;

const insideCanvas = (shape: SampleShape): boolean =>
  shape.kind === "circle"
    ? shape.x - shape.radius >= 0 &&
      shape.y - shape.radius >= 0 &&
      shape.x + shape.radius <= SAMPLE_WIDTH &&
      shape.y + shape.radius <= SAMPLE_HEIGHT
    : shape.x >= 0 && shape.y >= 0 && shape.x <= SAMPLE_WIDTH && shape.y <= SAMPLE_HEIGHT;

describe("sampleImagePlan", () => {
  it("plans an image of the declared size", () => {
    const plan = sampleImagePlan();
    expect(plan.width).toBe(SAMPLE_WIDTH);
    expect(plan.height).toBe(SAMPLE_HEIGHT);
  });

  it("is deterministic", () => {
    expect(sampleImagePlan()).toEqual(sampleImagePlan());
  });

  it("offers enough distinct colors to fill a default palette", () => {
    const plan = sampleImagePlan();
    const colors = new Set([...plan.backdrop, ...plan.shapes.map((shape) => shape.color)]);
    expect(colors.size).toBeGreaterThanOrEqual(6);
    for (const color of colors) expect(color).toMatch(hex);
  });

  it("keeps every shape on the canvas and visible", () => {
    for (const shape of sampleImagePlan().shapes) {
      expect(insideCanvas(shape)).toBe(true);
      expect(shape.alpha).toBeGreaterThan(0.5);
      expect(shape.alpha).toBeLessThanOrEqual(1);
    }
  });
});
