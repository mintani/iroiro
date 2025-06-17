# 🚀 Fullstack Template

A modern, production-ready fullstack template built with Next.js, featuring authentication, database integration, and beautiful UI components.

## ✨ Features

- 🔐 **Authentication** - Secure authentication with Better Auth
- 🎨 **Modern UI** - Beautiful components with Shadcn UI and Tailwind CSS
- 🗄️ **Database** - PostgreSQL with Prisma ORM
- 🌐 **API** - Type-safe API routes with Hono
- 🌙 **Dark Mode** - Built-in theme switching
- 📱 **Responsive** - Mobile-first design
- 🔒 **Type Safety** - Full TypeScript support
- 🚀 **Performance** - Optimized with Next.js 15 and Turbo
- 📦 **File Upload** - AWS S3 integration ready
- 🔧 **Developer Experience** - ESLint, Prettier, Husky pre-commit hooks

## 🛠️ Tech Stack

### Frontend

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn UI with Radix UI primitives
- **Icons**: Lucide React & React Icons
- **Theme**: Next Themes for dark/light mode

### Backend

- **API**: Hono with type-safe RPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth
- **File Storage**: AWS S3 (optional)
- **Validation**: Zod schemas

### Development

- **Language**: TypeScript
- **Package Manager**: pnpm
- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier with plugins
- **Git Hooks**: Husky with lint-staged
- **AI-Ready**: Pre-configured cursor rules
- **Environment**: T3 Env for type-safe environment variables

## 📸 Screenshot

![Application Screenshot](docs/screenshot.png)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- Docker & Docker Compose (for database)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/caru-ini/fullstack-template
   cd fullstack-template
   ```

   or

   ```bash
   gh repo clone caru-ini/fullstack-template
   cd fullstack-template
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables in `.env`

   To generate `BETTER_AUTH_SECRET`, run:

   ```bash
   pnpx @better-auth/cli secret
   ```

4. **Start the database**

   ```bash
   docker compose up -d
   ```

5. **Generate Prisma schema with better-auth**

   ```bash
   pnpx @better-auth/cli generate
   ```

6. **Set up the database**

   ```bash
   pnpm db db push # or prisma db push
   ```

7. **Start the development server**

   ```bash
   pnpm dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see your application running! 🎉

## 📝 Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server with Turbo |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm preview` | Build and start production server |
| `pnpm lint` | Run ESLint |
| `pnpm lint:fix` | Fix ESLint issues |
| `pnpm typecheck` | Run TypeScript type checking |
| `pnpm fmt:check` | Check code formatting |
| `pnpm fmt:write` | Format code with Prettier |
| `pnpm check` | Run linting and type checking |
| `pnpm db` | Prisma CLI commands |

## 🏗️ Project Structure

```plaintext
src/
├── app/                    # Next.js App Router
│   ├── (about)/           # Route groups
│   ├── api/               # API routes
│   │   ├── [[...route]]/  # Hono API routes
│   │   └── auth/          # Better Auth endpoints
│   └── globals.css        # Global styles
├── components/            # Reusable components
│   ├── auth/             # Authentication components
│   ├── layout/           # Layout components
│   ├── misc/             # Miscellaneous components
│   ├── providers/        # Context providers
│   └── ui/               # Shadcn UI components
├── lib/                  # Utility libraries
│   ├── auth.ts           # Better Auth configuration
│   ├── auth-client.ts    # Client-side auth utilities
│   ├── db.ts             # Database connection
│   ├── hono.ts           # Hono client setup
│   ├── s3-client.ts      # S3 client setup
│   └── utils.ts          # Utility functions
└── env.ts                # Environment variable validation
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set up environment variables in Vercel dashboard
4. Deploy automatically on every push

### Docker

```bash
# Build the image
docker build -t fullstack-template .

# Run the container
docker run -p 3000:3000 fullstack-template
```

## 🤝 Contributing

Any pull requests/issues are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by caru-ini for the developer community</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
