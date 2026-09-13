# iroiro(end of development)

A color extraction and palette editing tool. Extract colors from images, visualize them in 3D space, edit palettes, and export as theme files.
<img width="2879" height="1615" alt="image" src="https://github.com/user-attachments/assets/0d0d5830-0884-4c0a-b4b9-9cc91041889c" />


## Features

- Image upload and color extraction with K-means clustering
- Color visualization (3D sphere, pie chart, color pool)
- Image effects (brightness/contrast/saturation, hue shift)
- Contrast checker for accessibility
- Theme export in multiple formats
- Drag and drop interface for editing color arrays

## Tech Stack

- Next.js 16 with App Router (Turbopack)
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Three.js
- Cloudflare Workers via `@opennextjs/cloudflare`
- oxlint / oxfmt for linting and formatting
- lefthook for git hooks
- vitest for tests

The app runs entirely in the browser. There is no server, database or API.

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

### Basic Workflow

1. **Upload Image**: Click or drag-and-drop an image into the Image Uploader module
2. **Extract Colors**: Use the Sampler module to extract colors with K-means clustering
3. **Visualize**: View colors in 3D sphere, pie chart, or color pool
4. **Edit**: Drag and drop colors in the Color Pool to rearrange
5. **Export**: Use Theme Exporter to download palette in various formats

### Modules

Each module can be flipped to see configuration options on the back side:

- **Image Uploader**: Upload images via click, drag-and-drop, or paste
- **Sampler**: Extract colors using K-means algorithm with adjustable parameters
- **Effect: Adjustment**: Apply brightness, contrast, and saturation adjustments
- **Effect: Shifter**: Apply hue rotation to images
- **3D Sphere**: Visualize colors in 3D RGB color space
- **Contrast Checker**: Check color contrast ratios for accessibility
- **Pie Chart**: Display color distribution as a pie chart
- **Color Pool**: Edit color array with drag-and-drop
- **Theme Exporter**: Export palettes in multiple formats

### Module Configuration

Click the "Flip" button on each module to access its configuration panel. Configure input/output IDs to connect modules together.

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
│   ├── (display)/          # Main application page
│   │   └── _components/    # Color tool modules
│   └── about/              # About page
├── components/
│   ├── layout/             # Layout components
│   ├── misc/               # Utility components
│   ├── providers/          # React context providers
│   └── ui/                 # shadcn/ui components
├── lib/
│   └── utils.ts            # Utility functions
└── types/                  # Ambient type declarations
```

## Development Notes

- The project uses bun for package management and script running
- oxlint and oxfmt handle linting and formatting
- lefthook runs lint and format on commit, and `check` / `typecheck` on push
- Use absolute imports with `@/` alias

## License

MIT
