# iroiro

A color extraction and palette editing tool. Extract colors from images, visualize them in 3D space, edit palettes, and export as theme files.

## Features

- Image upload and color extraction with K-means clustering
- Color visualization (3D sphere, pie chart, color pool)
- Image effects (brightness/contrast/saturation, hue shift)
- Contrast checker for accessibility
- Theme export in multiple formats
- Drag and drop interface for editing color arrays

## Tech Stack

- Next.js 15 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Three.js / React Three Fiber
- Better Auth for authentication
- PostgreSQL with Prisma
- Hono for API routes

## Prerequisites

- Node.js 18 or later
- pnpm
- Docker and Docker Compose

## Setup

1. Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd iroiro
pnpm install
```

2. Copy the environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost:5432/app`)
- `NEXT_PUBLIC_BETTER_AUTH_URL`: Application URL (default: `http://localhost:3000`)
- `BETTER_AUTH_SECRET`: Generate with `pnpx @better-auth/cli secret`
- `GITHUB_ID` and `GITHUB_SECRET`: GitHub OAuth credentials (optional)
- S3 configuration: Optional for image storage

3. Start the database:

```bash
docker compose up -d
```

4. Generate Prisma client and push schema:

```bash
pnpx @better-auth/cli generate
pnpm db push
```

5. Start the development server:

```bash
pnpm dev
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

- `pnpm dev`: Start development server with Turbo
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint
- `pnpm lint:fix`: Fix linting issues
- `pnpm typecheck`: Run TypeScript type checking
- `pnpm fmt:check`: Check code formatting
- `pnpm fmt:write`: Format code with Prettier
- `pnpm db`: Access Prisma CLI

## Project Structure

```
src/
├── app/
│   ├── (display)/          # Main application page
│   │   └── _components/    # Color tool modules
│   ├── api/                # API routes (Hono + Better Auth)
│   ├── about/              # About page
│   └── dashboard/          # Dashboard page
├── components/
│   ├── auth/               # Authentication components
│   ├── layout/             # Layout components
│   ├── misc/               # Utility components
│   ├── providers/          # React context providers
│   └── ui/                 # shadcn/ui components
└── lib/
    ├── auth.ts             # Better Auth configuration
    ├── auth-client.ts      # Auth client utilities
    ├── db.ts               # Prisma client
    ├── hono.ts             # Hono RPC client
    └── utils.ts            # Utility functions
```

## Development Notes

- The project uses pnpm for package management
- ESLint and Prettier are configured for code quality
- Husky and lint-staged ensure code quality on commits
- Environment variables are validated with Zod in `src/env.ts`
- Use absolute imports with `@/` alias

## License

MIT
