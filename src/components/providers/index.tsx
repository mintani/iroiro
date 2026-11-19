/**
 * Root providers component that wraps the entire application.
 * You can add more providers here.
 */
import { ThemeProvider } from "./theme";

export const Providers = ({ children }: { children: React.ReactNode }) => {
  return <ThemeProvider>{children}</ThemeProvider>;
};
