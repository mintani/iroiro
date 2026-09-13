"use client";

import { formatRatio } from "@/components/palette-studio/format";
import { SwatchButton } from "@/components/palette-studio/swatch-button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { contrastGrade, contrastRatio, formatHex, SLOTS, type Theme } from "@/lib/color";
import { Eye } from "lucide-react";

/** Light or dark, as `suggestTheme` takes it. */
export type ThemeMode = "light" | "dark";

const PAIRS: [keyof Theme, keyof Theme, string][] = [
  ["foreground", "background", "text on background"],
  ["primaryForeground", "primary", "label on primary"],
  ["secondaryForeground", "secondary", "label on secondary"],
  ["accentForeground", "accent", "label on accent"],
  ["mutedForeground", "muted", "caption on muted"],
];

type ThemeSuggestionProps = {
  theme: Theme;
  mode: ThemeMode;
  onMode: (mode: ThemeMode) => void;
  preview: boolean;
  onPreview: (preview: boolean) => void;
};

export const ThemeSuggestion = ({
  theme,
  mode,
  onMode,
  preview,
  onPreview,
}: ThemeSuggestionProps) => (
  <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          aria-label="Theme mode"
          value={mode}
          onValueChange={(next) => {
            if (next === "light" || next === "dark") onMode(next);
          }}
        >
          <ToggleGroupItem value="light">Light</ToggleGroupItem>
          <ToggleGroupItem value="dark">Dark</ToggleGroupItem>
        </ToggleGroup>
        <Toggle
          size="sm"
          variant="outline"
          pressed={preview}
          onPressedChange={onPreview}
          className="gap-2"
        >
          <Eye className="size-3.5" aria-hidden="true" />
          Preview theme on this page
        </Toggle>
      </div>

      <ul className="mt-4 grid gap-1.5 sm:grid-cols-2">
        {SLOTS.map(([slot, name]) => (
          <li key={name} className="flex items-center gap-2">
            <SwatchButton color={theme[slot]} name={name} className="size-6 shrink-0" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-muted-foreground">
              {name}
            </span>
            <span className="font-mono text-xs tabular-nums">{formatHex(theme[slot])}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-5 grid gap-1.5">
        {PAIRS.map(([fg, bg, label]) => {
          const ratio = contrastRatio(theme[fg], theme[bg]);
          const grade = contrastGrade(theme[fg], theme[bg]);
          return (
            <li key={label} className="flex items-center gap-2 text-xs">
              <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
              <span className="font-mono tabular-nums">{formatRatio(ratio)}</span>
              <Badge variant={grade === "fail" ? "destructive" : "secondary"}>
                {grade === "fail" ? "under AA" : grade}
              </Badge>
            </li>
          );
        })}
      </ul>
    </div>

    <figure
      className="rounded-lg border p-5"
      style={{
        backgroundColor: formatHex(theme.background),
        color: formatHex(theme.foreground),
        borderColor: formatHex(theme.border),
      }}
    >
      <figcaption className="label-mono" style={{ color: formatHex(theme.mutedForeground) }}>
        {mode} preview
      </figcaption>
      <p className="mt-3 text-base font-medium">Tokens, not screenshots</p>
      <p className="mt-1.5 text-sm">
        Every surface here is one of the slots listed on the left, and every label was picked to
        clear WCAG AA on the surface behind it.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: formatHex(theme.primary),
            color: formatHex(theme.primaryForeground),
          }}
        >
          Primary action
        </span>
        <span
          className="rounded-md px-3 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: formatHex(theme.secondary),
            color: formatHex(theme.secondaryForeground),
          }}
        >
          Secondary
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-xs font-medium"
          style={{
            backgroundColor: formatHex(theme.accent),
            color: formatHex(theme.accentForeground),
          }}
        >
          Accent badge
        </span>
      </div>
      <p
        className="mt-4 rounded-md px-3 py-2 text-xs"
        style={{
          backgroundColor: formatHex(theme.muted),
          color: formatHex(theme.mutedForeground),
        }}
      >
        Muted caption — the quiet line under a field.
      </p>
    </figure>
  </div>
);
