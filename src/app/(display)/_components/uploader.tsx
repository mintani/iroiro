import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Plus, Trash2, Upload } from "lucide-react";
import NextImage from "next/image";
import React from "react";

export const Uploader = ({ id = "source" }: { id?: string }) => {
  const bus = useImageBus();
  const [file, setFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const dropRef = React.useRef<HTMLDivElement | null>(null);

  // Handle file selection and preview
  const handleFileChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      setSuccess(false);
      const selectedFile = e.target.files && e.target.files[0];
      setFile(selectedFile ?? null);

      if (selectedFile) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        // Also write into ImageBus as data URL
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            bus.setImage(id, reader.result);
          }
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreviewUrl(null);
      }
    },
    [bus, id]
  );

  // Clean up preview URL
  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      const evt = { target: { files: [f] } } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleFileChange(evt);
    }
  };
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Paste support (Ctrl+V)
  React.useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const it of items) {
        if (it.kind === "file") {
          const f = it.getAsFile();
          if (f) {
            const evt = {
              target: { files: [f] },
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            handleFileChange(evt);
            break;
          }
        }
      }
    };
    const el = dropRef.current ?? document;
    el.addEventListener("paste", onPaste as unknown as EventListener);
    return () => el.removeEventListener("paste", onPaste as unknown as EventListener);
  }, [handleFileChange]);

  return (
    <div className="flex h-full w-full flex-col">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {!previewUrl && (
        <div
          ref={dropRef}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
          }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="relative flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed bg-background/60 transition hover:bg-accent/40"
          aria-label="Upload image via click, drag-and-drop or paste"
        >
          <div className="pointer-events-none flex flex-col items-center gap-2 px-3 text-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ImageIcon className="size-5" />
              <span className="text-xs">Drop image or click to browse</span>
            </div>
            <div className="text-[10px] text-muted-foreground">PNG, JPG, WEBP up to 10MB</div>
            <div className="mt-1">
              <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                <Plus className="mr-1 size-3" /> Choose
              </Button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="relative mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-muted/40">
          <div className="flex items-center justify-between border-b bg-background/70 px-2 py-1.5">
            <div className="truncate text-xs text-muted-foreground">
              {file?.name ?? "Selected image"}
              {file?.size ? ` • ${(file.size / 1024).toFixed(0)} KB` : ""}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="mr-1 size-4" /> Replace
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setSuccess(false);
                  setError(null);
                }}
              >
                <Trash2 className="mr-1 size-4" /> Clear
              </Button>
            </div>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center bg-muted">
            <div className="relative h-full w-full">
              {previewUrl && (
                <NextImage
                  src={previewUrl}
                  alt="preview"
                  fill
                  unoptimized
                  className="object-contain"
                />
              )}
            </div>
          </div>
          <div className="flex items-center justify-between bg-background/60 px-2 py-1.5">
            <div className="text-[10px] text-muted-foreground">Press Ctrl+V to paste image</div>
          </div>
        </div>
      )}

      {error && <div className="mt-2 text-xs text-destructive">{error}</div>}
      {success && <div className="text-success mt-2 text-xs">Upload successful!</div>}
    </div>
  );
};
