/** Width of the generated sample image, in pixels. */
export const SAMPLE_WIDTH = 800;

/** Height of the generated sample image, in pixels. */
export const SAMPLE_HEIGHT = 600;

/** One painted shape of the sample image. */
export type SampleShape =
  | { kind: "circle"; x: number; y: number; radius: number; color: string; alpha: number }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      alpha: number;
      rotate: number;
    };

/** Everything needed to paint the sample image, with no canvas involved. */
export type SamplePlan = {
  width: number;
  height: number;
  /** Two stop backdrop gradient, painted from the top left corner to the bottom right one. */
  backdrop: [string, string];
  shapes: SampleShape[];
};

/**
 * The fixed recipe the sample image is painted from. It is deliberately flat and high contrast, so
 * extraction finds a handful of clearly separated colors rather than a muddy gradient.
 */
export const sampleImagePlan = (): SamplePlan => ({
  width: SAMPLE_WIDTH,
  height: SAMPLE_HEIGHT,
  backdrop: ["#1d2b5c", "#2f7f86"],
  shapes: [
    { kind: "circle", x: 250, y: 205, radius: 165, color: "#e8643c", alpha: 0.95 },
    { kind: "circle", x: 565, y: 165, radius: 105, color: "#f2b544", alpha: 0.92 },
    {
      kind: "rect",
      x: 415,
      y: 330,
      width: 300,
      height: 175,
      color: "#7fd1b9",
      alpha: 0.9,
      rotate: -0.11,
    },
    {
      kind: "rect",
      x: 80,
      y: 410,
      width: 235,
      height: 135,
      color: "#b2588f",
      alpha: 0.88,
      rotate: 0.07,
    },
    { kind: "circle", x: 690, y: 480, radius: 58, color: "#f4f1e8", alpha: 0.95 },
  ],
});

/** Paints a plan onto a 2d context of at least the plan's size. */
export const drawSamplePlan = (context: CanvasRenderingContext2D, plan: SamplePlan): void => {
  const gradient = context.createLinearGradient(0, 0, plan.width, plan.height);
  gradient.addColorStop(0, plan.backdrop[0]);
  gradient.addColorStop(1, plan.backdrop[1]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, plan.width, plan.height);

  for (const shape of plan.shapes) {
    context.save();
    context.globalAlpha = shape.alpha;
    context.fillStyle = shape.color;
    if (shape.kind === "circle") {
      context.beginPath();
      context.arc(shape.x, shape.y, shape.radius, 0, Math.PI * 2);
      context.fill();
    } else {
      context.translate(shape.x, shape.y);
      context.rotate(shape.rotate);
      context.fillRect(0, 0, shape.width, shape.height);
    }
    context.restore();
  }
};

/** Paints the sample plan on a canvas and hands it back as a PNG file, ready to drop in. */
export const createSampleImageFile = async (): Promise<File> => {
  const plan = sampleImagePlan();
  const canvas = document.createElement("canvas");
  canvas.width = plan.width;
  canvas.height = plan.height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser cannot draw on a canvas.");
  drawSamplePlan(context, plan);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("The sample image could not be encoded.");
  return new File([blob], "iroiro-sample.png", { type: "image/png" });
};
