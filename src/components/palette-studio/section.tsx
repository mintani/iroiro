import type { ReactNode } from "react";

type SectionProps = {
  title: string;
  /** Right aligned readout, such as a count or a size. */
  meta?: ReactNode;
  children: ReactNode;
};

/** A rule, a monospace section label with an optional readout, then the content. */
export const StudioSection = ({ title, meta, children }: SectionProps) => (
  <section className="border-t pt-5">
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="label-mono text-muted-foreground">{title}</h2>
      {meta ? <span className="label-mono text-muted-foreground tabular-nums">{meta}</span> : null}
    </div>
    <div className="mt-4">{children}</div>
  </section>
);

/** A subheading inside a section, for the parts of the suggestion block. */
export const StudioSubhead = ({ title, meta }: { title: string; meta?: ReactNode }) => (
  <div className="flex items-baseline justify-between gap-3">
    <h3 className="text-sm font-medium">{title}</h3>
    {meta ? <span className="label-mono text-muted-foreground tabular-nums">{meta}</span> : null}
  </div>
);
