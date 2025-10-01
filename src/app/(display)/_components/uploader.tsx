import { useImageBus } from "@/components/providers/image-bus";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Trash2, Upload } from "lucide-react";
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
        bus.setLoading(true, "Loading image...");
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        // Also write into ImageBus as data URL
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === "string") {
            bus.setImage(id, reader.result);
            // Keep loading for a bit to allow sampler to start loading
            setTimeout(() => {
              bus.setLoading(false);
            }, 300);
          }
        };
        reader.onerror = () => {
          setError("Failed to load image");
          bus.setLoading(false);
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
    <div className="flex h-full w-full flex-col gap-2">
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
          className="glass relative flex min-h-0 w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed transition-all hover:border-foreground/20"
          aria-label="Upload image via click, drag-and-drop or paste"
        >
          <div className="pointer-events-none flex flex-col items-center gap-3 px-3 text-center">
            <ImageIcon className="size-12 text-muted-foreground/40" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-foreground">Upload Image</span>
              <span className="text-xs text-muted-foreground">
                Drop image, click to browse, or paste (Ctrl+V)
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground">PNG, JPG, WEBP up to 10MB</div>
          </div>
        </div>
      )}

      {previewUrl && (
        <div className="flex min-h-0 flex-1 flex-col gap-2">
          <div className="glass flex items-center justify-between rounded-md border bg-background/60 px-3 py-2 backdrop-blur">
            <div className="flex items-center gap-2">
              <ImageIcon className="size-4 text-muted-foreground" />
              <div className="flex flex-col">
                <div className="truncate text-xs font-medium text-foreground">
                  {file?.name ?? "Selected image"}
                </div>
                {file?.size && (
                  <div className="text-[10px] text-muted-foreground">
                    {(file.size / 1024).toFixed(0)} KB
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                className="h-7 px-2 text-xs"
              >
                <Upload className="size-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFile(null);
                  setPreviewUrl(null);
                  setSuccess(false);
                  setError(null);
                  bus.remove(id);
                  // Reset file input to allow re-uploading the same file
                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }}
                className="h-7 px-2 text-xs"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          </div>
          <div className="glass relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-md border">
            <div className="relative h-full w-full bg-muted/20">
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
        </div>
      )}

      {error && <div className="text-xs text-destructive">{error}</div>}
      {success && <div className="text-xs text-green-600">Upload successful!</div>}
    </div>
  );
};
