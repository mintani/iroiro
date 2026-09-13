import { PaletteStudio } from "@/components/palette-studio/palette-studio";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <h1 className="max-w-xl text-2xl leading-tight font-medium tracking-tight sm:text-3xl">
          Pull a palette out of any image.
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Drop a picture and read back its dominant colors, a contrast-checked theme, harmonies and
          a scale — then copy CSS, Tailwind, SCSS, JSON or a plain hex list. The file never leaves
          your browser.
        </p>
        <PaletteStudio />
      </main>
      <SiteFooter />
    </div>
  );
}
