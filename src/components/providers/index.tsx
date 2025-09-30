/**
 * Root providers component that wraps the entire application.
 * You can add more providers here.
 */
import { ImageBusProvider } from "./image-bus";
import { ProgressBarProvider } from "./progress-bar";
import { ThemeProvider } from "./theme";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProgressBarProvider>
      <ThemeProvider>
        <ImageBusProvider>{children}</ImageBusProvider>
      </ThemeProvider>
    </ProgressBarProvider>
  );
};
