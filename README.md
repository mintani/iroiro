# iroiro

Drop an image, take its colors. iroiro pulls the dominant colors out of a picture, suggests a
contrast-checked UI theme around them, and hands the result back as CSS, Tailwind, SCSS, JSON or a
plain hex list. Everything happens in the browser: the file is never uploaded.

_No screenshot in this README — the tool is one page, and `bun dev` plus any image on your desktop
shows more than a still would._

## The flow

1. **Drop** — drop a file on the target, paste from the clipboard, pick one through the file dialog,
   or press **Try a sample** to generate an image on a canvas.
2. **Extract** — the image is decoded and capped at 512 px on its long side, sampled at a fixed
   stride, then clustered with k-means in CIELAB. You get 2 to 12 colors, each with the share of the
   image it covers.
3. **Export** — copy any hex with one click, or take the whole theme as CSS, Tailwind, SCSS, JSON or
   a hex list.

## Features

- Drag and drop, paste anywhere on the page, a file picker, or a generated sample image
- Dominant colors with their share of the image, from 2 to 12 clusters
- A suggested semantic theme — background, foreground, primary, secondary, accent, muted, border —
  with every foreground graded against WCAG AA and AAA
- **Preview theme on this page**: the suggestion is painted onto iroiro's own tokens, so you see it
  on real UI before you export it
- Harmonies of the selected base color: complementary, analogous, triadic, split-complementary,
  tetradic
- A 50 to 950 ramp of the base color
- The readable text color for every palette color, with the ratio it reaches
- Exports: CSS custom properties (hex or oklch), a Tailwind v4 `@theme` block, SCSS variables, JSON,
  and a plain hex list — copy or download
- Light and dark, keyboard accessible, and usable from 400 px up

## Tech Stack

- Next.js 16 with App Router (Turbopack)
- React 19
- TypeScript 5, type-checked with tsgo
- Tailwind CSS 4
- shadcn/ui (new-york) with sonner for toasts
- bun for packages and scripts
- oxlint and oxfmt for linting and formatting
- lefthook for git hooks
- vitest with jsdom and Testing Library
- Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)

The app runs entirely in the browser. There is no server, database or API — the Worker serves the
prerendered page and the static assets, and the color math runs on the client.

## Prerequisites

- [Bun](https://bun.sh) 1.3 or later

## Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd iroiro
bun install
```

2. Start the development server:

```bash
bun dev
```

Open http://localhost:3000 in your browser.

## Usage

- **Colors**: the slider sets how many clusters k-means looks for. Changing it re-extracts from the
  pixels already sampled, so it is cheap.
- **Base color**: clicking a swatch copies its hex *and* makes it the base for the harmonies, the
  ramp and the suggested theme. The selected swatch carries a ring and a check.
- **Light / Dark**: the theme suggestion follows the app theme until you pick a side, and the export
  reflects whichever side is showing.
- **Keyboard**: every swatch, tab and toggle is a real button. Tab to it, press Enter or Space, and
  the hex is on your clipboard.
- Nothing is stored. Reload and the image is gone.

## The color library

`src/lib/color` is a dependency-free, tested module that does the math: conversions (sRGB, XYZ, Lab,
LCH, OkLab, OkLCH, HSL), gamut mapping, WCAG contrast, k-means extraction, stride sampling, harmony
and ramp generation, theme suggestion, and the exporters. It has no DOM or React imports, so it is
usable on its own.

## Available Scripts

| Script               | Description                                     |
| -------------------- | ----------------------------------------------- |
| `bun dev`            | Start the development server                    |
| `bun run build`      | Build for production                            |
| `bun run start`      | Start the Node production server                |
| `bun run preview`    | Build and serve the Workers bundle locally      |
| `bun run deploy`     | Build and deploy to Cloudflare Workers          |
| `bun run upload`     | Build and upload a version without releasing it |
| `bun run cf-typegen` | Regenerate the Cloudflare binding types         |
| `bun run lint`       | Run oxlint                                      |
| `bun run lint:fix`   | Run oxlint and apply fixes                      |
| `bun run format`     | Check formatting with oxfmt                     |
| `bun run format:fix` | Format with oxfmt                               |
| `bun run check`      | Run lint and format checks                      |
| `bun run check:fix`  | Run lint and format with fixes                  |
| `bun run typecheck`  | Type check with tsgo                            |
| `bun run test`       | Run tests with vitest                           |

## Deploy to Cloudflare Workers

The app is built for Cloudflare Workers with [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare).
`wrangler.jsonc` holds the Worker configuration and `open-next.config.ts` the adapter configuration.

### Prerequisites

- A Cloudflare account
- Log in once, which opens a browser for OAuth:

```bash
bunx wrangler login
```

### 1. Preview locally

This builds the Worker bundle and serves it with `workerd`, the same runtime Cloudflare uses in
production. It is the last check before deploying:

```bash
bun run preview
```

Open http://localhost:8787.

`bun dev` is still the fastest loop for day-to-day work; it runs the normal Next.js dev server on
http://localhost:3000.

### 2. Deploy

```bash
bun run deploy
```

Wrangler prints the deployed URL when it finishes. With the Worker named `iroiro` in `wrangler.jsonc`
it is:

```
https://iroiro.<your-account-subdomain>.workers.dev
```

The account subdomain is shown in the Cloudflare dashboard under **Workers & Pages**. If you rename
the Worker, change the `name` field and the `WORKER_SELF_REFERENCE` service binding in
`wrangler.jsonc` together, because the binding points the Worker at itself by name.

### 3. Add a custom domain (optional)

The domain must be a zone on the same Cloudflare account. Add a route to `wrangler.jsonc`:

```jsonc
{
  "routes": [{ "pattern": "iroiro.example.com", "custom_domain": true }]
}
```

Then run `bun run deploy` again. Wrangler creates the DNS record and the certificate for you.

You can also do this in the dashboard: **Workers & Pages** -> your Worker -> **Settings** ->
**Domains & Routes** -> **Add**.

### 4. Deploy from GitHub Actions (optional)

Add two repository secrets:

- `CLOUDFLARE_API_TOKEN` - create it at **My Profile** -> **API Tokens** with the *Edit Cloudflare
  Workers* template
- `CLOUDFLARE_ACCOUNT_ID` - shown on the Workers overview page

Then save this as `.github/workflows/deploy.yaml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy-${{ github.ref }}
  cancel-in-progress: true

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Bun
        uses: oven-sh/setup-bun@v2

      - name: Install
        run: bun install --frozen-lockfile

      - name: Build
        run: bunx opennextjs-cloudflare build

      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

### Notes

- `cloudflare-env.d.ts` is generated, not committed. Run `bun run cf-typegen` after changing
  bindings in `wrangler.jsonc`.
- `public/_headers` marks `/_next/static/*` as immutable so Cloudflare caches hashed assets for a
  year.
- `next/image` optimization is off (`images.unoptimized`), so the Worker needs no Images binding.
- There is no incremental cache binding. Every route is statically prerendered, so there is nothing
  to revalidate.

## Project Structure

```
src/
├── app/
│   ├── icon.svg            # The four-square mark, served as the favicon
│   ├── layout.tsx          # Fonts, metadata, theme provider, toaster
│   └── page.tsx            # The single route: shell + studio
├── components/
│   ├── palette-studio/     # The tool: drop zone, palette, suggestions, export
│   ├── site/               # Header and footer
│   ├── misc/               # Theme toggle
│   ├── providers/          # next-themes provider
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── color/              # Pure color math and exporters (tested)
│   ├── image/              # File decoding and the sample image generator
│   └── utils.ts            # cn()
└── types/                  # Ambient type declarations
```

## Development Notes

- The project uses bun for package management and script running
- oxlint and oxfmt handle linting and formatting
- lefthook runs lint and format on commit, and `check` / `typecheck` on push
- Use absolute imports with `@/` alias

## License

MIT
