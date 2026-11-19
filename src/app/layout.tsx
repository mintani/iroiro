import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "iroiro — palette and color suggestions from any image",
  description:
    "Drop an image and read back its dominant colors, a contrast-checked theme, harmonies and a scale. Copy CSS, Tailwind, SCSS, JSON or a hex list. Runs entirely in your browser.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#131316" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* The Workers bundle is built with esbuild keepNames, which rewrites the function
            next-themes stringifies into its pre-paint script. Without this shim that script
            throws in the browser and dark mode only lands after hydration. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "window.__name=window.__name||function(fn){return fn}",
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="bottom-center" />
        </Providers>
      </body>
    </html>
  );
}
