"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, Copy as CopyIcon } from "lucide-react";
import { useState } from "react";

type CopyButtonProps = {
  text: string;
  className?: string;
};

export const CopyButton = ({ text, className }: CopyButtonProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // noop: clipboard may fail in unsupported contexts
    }
  };

  return (
    <Button
      type="button"
      onClick={handleCopy}
      size="sm"
      className={cn("h-8 px-2", className)}
      aria-live="polite"
    >
      {copied ? (
        <>
          <Check className="mr-1 h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <CopyIcon className="mr-1 h-4 w-4" />
          Copy
        </>
      )}
    </Button>
  );
};
