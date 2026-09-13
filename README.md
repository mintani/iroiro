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

- Next.js 15 with App Router
- React 19
- TypeScript 5
- Tailwind CSS 4
- shadcn/ui
- Three.js
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

| Script               | Description                         |
| -------------------- | ----------------------------------- |
| `bun dev`            | Start development server with Turbo |
| `bun run build`      | Build for production                |
| `bun run start`      | Start production server             |
| `bun run lint`       | Run oxlint                          |
| `bun run lint:fix`   | Run oxlint and apply fixes          |
| `bun run format`     | Check formatting with oxfmt         |
| `bun run format:fix` | Format with oxfmt                   |
| `bun run check`      | Run lint and format checks          |
| `bun run check:fix`  | Run lint and format with fixes      |
| `bun run typecheck`  | Type check with tsgo                |
| `bun run test`       | Run tests with vitest               |

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
