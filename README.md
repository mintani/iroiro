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
- Cloudflare Workers via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare), deployed
  with [Alchemy](https://alchemy.run)

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

| Script               | Description                                   |
| -------------------- | --------------------------------------------- |
| `bun dev`            | Start the development server                  |
| `bun run build`      | Build for production                          |
| `bun run start`      | Start the Node production server              |
| `bun run preview`    | Serve the Worker bundle locally under workerd |
| `bun run deploy`     | Deploy to Cloudflare Workers                  |
| `bun run destroy`    | Delete the deployed Worker                    |
| `bun run lint`       | Run oxlint                                    |
| `bun run lint:fix`   | Run oxlint and apply fixes                    |
| `bun run format`     | Check formatting with oxfmt                   |
| `bun run format:fix` | Format with oxfmt                             |
| `bun run check`      | Run lint and format checks                    |
| `bun run check:fix`  | Run lint and format with fixes                |
| `bun run typecheck`  | Type check with tsgo                          |
| `bun run test`       | Run tests with vitest                         |

## Deploy to Cloudflare Workers

The deployment is two files: `alchemy.run.ts` declares the Worker and `open-next.config.ts`
configures the adapter. [Alchemy](https://alchemy.run) runs it — it builds the app with
[`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) and uploads the Worker with the
prerendered page and the static assets. There is no wrangler file.

### 1. Connect your Cloudflare account

Credentials live in `~/.alchemy/profiles.json`, never in the repo. Connect the account once — the
prompt offers OAuth in the browser or an API token you paste:

```bash
bunx alchemy profile edit --add Cloudflare
```

`bunx alchemy profile show` lists what is connected.

CI has no profile: set `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` there instead.

### 2. Deploy

```bash
bun run deploy
```

The first run asks twice. Once to create the state store, where Alchemy records what it deployed: a
Worker named `alchemy-state-store` and two secrets in the account Secrets Store. Then once to
approve the plan (`+ Website`). Nothing about either lands in the repo.

It prints the URL when it finishes:

```
{
  url: "https://iroiro.<your-account-subdomain>.workers.dev",
}
```

The Worker name is pinned to `iroiro` in `alchemy.run.ts`, so the URL never changes. The account
subdomain is shown in the Cloudflare dashboard under **Workers & Pages**. Deploys run in the `prod`
stage, so your machine and CI update the same Worker instead of fighting over the name.

Run it again after a change. Alchemy hashes the files the build reads, so an unchanged tree reports
no changes and skips the build.

### 3. Preview locally (optional)

```bash
bun run preview
```

This builds the Worker and serves it under `workerd`, the runtime Cloudflare uses, with production
asset routing. It reads the credentials from step 1, because the Worker's configuration is resolved
against the account even though the server is local.

`bun dev` is still the fastest loop for day-to-day work; it runs the normal Next.js dev server on
http://localhost:3000.

### 4. Add a custom domain (optional)

The domain must already be a zone on the same Cloudflare account. Add `domain` to the Website:

```ts
export const Website = Cloudflare.Website.Nextjs("Website", {
  name: "iroiro",
  domain: "iroiro.example.com",
});
```

`bun run deploy` creates the DNS record and the certificate, and the stack output becomes
`https://iroiro.example.com`. Use `routes` instead when a pattern has to match paths.

### 5. Tear it down

```bash
bun run destroy
```

This deletes the Worker and its assets. The state store Worker stays behind for the next deploy.

### Deploy from GitHub Actions (optional)

Add two repository secrets:

- `CLOUDFLARE_API_TOKEN` - create it at **My Profile** -> **API Tokens** with the *Edit Cloudflare
  Workers* template
- `CLOUDFLARE_ACCOUNT_ID` - shown on the Workers overview page

Deploy once from your machine first, so the state store exists without a prompt in CI. Then save
this as `.github/workflows/deploy.yaml`:

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

      - name: Deploy
        run: bun run deploy --yes
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

### Notes

- `public/_headers` marks `/_next/static/*` as immutable so Cloudflare caches hashed assets for a
  year.
- `next/image` optimization is off (`images.unoptimized`), so the Worker needs no Images binding.
- The incremental cache reads the payloads shipped with the static assets and never writes. Every
  route is prerendered, so there is nothing to revalidate; a write attempt logs
  `StaticAssetsIncrementalCache: Failed to set to read-only cache` and changes nothing.
- `bun run preview` clears `npm_execpath` so the Alchemy CLI runs under node. Under bun, its dev
  watcher also hooks the project's own `node_modules` and breaks CJS imports there
  (alchemy 2.0.0-beta.77).
- Alchemy is a beta on an Effect release candidate: `package.json` pins `alchemy`, `effect` and the
  `@effect/*` packages Alchemy pulls in to the exact versions that work together. Bump them
  together.

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
