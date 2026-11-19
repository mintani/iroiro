const STEPS: [string, string][] = [
  [
    "Drop",
    "Drop a file, paste from the clipboard, or pick one. It is decoded in the page — nothing is uploaded.",
  ],
  [
    "Extract",
    "k-means in CIELAB finds the dominant colors and how much of the image each one covers.",
  ],
  [
    "Export",
    "Copy the contrast-checked theme as CSS, Tailwind, SCSS or JSON, or the palette as a hex list.",
  ],
];

/** The three step explainer under the drop zone, shown until an image arrives. */
export const HowItWorks = () => (
  <ol className="grid gap-6 border-t pt-6 sm:grid-cols-3 sm:gap-8">
    {STEPS.map(([name, body], index) => (
      <li key={name}>
        <p className="flex items-baseline gap-2">
          <span className="label-mono text-muted-foreground tabular-nums">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium">{name}</span>
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      </li>
    ))}
  </ol>
);
