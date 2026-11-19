/** The export tabs, which double as the download formats. */
export type ExportFormat = "css" | "tailwind" | "scss" | "json" | "hex";

const FILES: Record<ExportFormat, { name: string; mediaType: string }> = {
  css: { name: "iroiro-theme.css", mediaType: "text/css" },
  tailwind: { name: "iroiro-tailwind.css", mediaType: "text/css" },
  scss: { name: "iroiro-theme.scss", mediaType: "text/x-scss" },
  json: { name: "iroiro-theme.json", mediaType: "application/json" },
  hex: { name: "iroiro-palette.txt", mediaType: "text/plain" },
};

/** File name a format downloads as. Every one carries an extension. */
export const exportFileName = (format: ExportFormat): string => FILES[format].name;

/** Media type a format downloads as. */
export const exportMediaType = (format: ExportFormat): string => FILES[format].mediaType;

/** Hands text to the browser as a file download. */
export const downloadText = (text: string, format: ExportFormat): void => {
  const url = URL.createObjectURL(new Blob([text], { type: exportMediaType(format) }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportFileName(format);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Firefox cancels the download if the URL is revoked in the same task.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
