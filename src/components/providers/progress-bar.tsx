"use client";

import { ProgressProvider as BProgressProvider } from "@bprogress/next/app";

export const ProgressBarProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <BProgressProvider
      height="2px"
      color="var(--primary)"
      options={{ showSpinner: false }}
      shallowRouting
    >
      {children}
    </BProgressProvider>
  );
};
