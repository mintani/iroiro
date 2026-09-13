import { ThemeToggle } from "@/components/misc/theme-toggle";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export const REPO_URL = "https://github.com/mintani/iroiro";

/** The four-square wordmark: one square per color the tool pulls out of an image. */
const Mark = () => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className="size-5 shrink-0">
    <rect x="1" y="1" width="13" height="13" rx="3.5" fill="#e2564b" />
    <rect x="18" y="1" width="13" height="13" rx="3.5" fill="#e8a33d" />
    <rect x="1" y="18" width="13" height="13" rx="3.5" fill="#4a9d6f" />
    <rect x="18" y="18" width="13" height="13" rx="3.5" fill="#4470d8" />
  </svg>
);

export const SiteHeader = () => (
  <header className="border-b">
    <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
      <span className="flex items-center gap-2">
        <Mark />
        <span className="text-base font-medium tracking-tight">iroiro</span>
      </span>
      <p className="hidden truncate text-xs text-muted-foreground sm:block">
        Colors, theme tokens and exports out of any image — in the browser.
      </p>
      <div className="ml-auto flex items-center gap-0.5">
        <ThemeToggle />
        <Button variant="ghost" size="icon" asChild>
          <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label="iroiro on GitHub">
            <Github className="size-4" />
          </a>
        </Button>
      </div>
    </div>
  </header>
);
