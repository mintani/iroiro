import { CopyButton } from "@/components/misc/copy-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Code2,
  Database,
  Lock,
  Palette,
  Server,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { SiGithub } from "react-icons/si";

const libraries = [
  {
    name: "Next.js",
    description:
      "The React Framework for Production. Supports Server Components, API Routes, and more.",
    icon: <Code2 className="h-6 w-6" />,
    url: "https://nextjs.org/docs",
    category: "Framework",
  },
  {
    name: "Better Auth",
    description: "The most comprehensive authentication library for TypeScript",
    icon: <Lock className="h-6 w-6" />,
    url: "https://www.better-auth.com/docs",
    category: "Auth",
  },
  {
    name: "Hono",
    description: "Fast, lightweight, built on Web Standards. Build Type-Safe API with Hono RPC.",
    icon: <Server className="h-6 w-6" />,
    url: "https://hono.dev/docs",
    category: "API",
  },
  {
    name: "Prisma",
    description: "Next-generation ORM for Node.js & TypeScript",
    icon: <Database className="h-6 w-6" />,
    url: "https://www.prisma.io/docs",
    category: "Database",
  },
  {
    name: "shadcn/ui",
    description: "Beautifully designed components built with Radix UI and Tailwind CSS",
    icon: <Palette className="h-6 w-6" />,
    url: "https://ui.shadcn.com/docs",
    category: "UI",
  },
  {
    name: "Tailwind CSS",
    description: "A utility-first CSS framework for rapid UI development",
    icon: <Zap className="h-6 w-6" />,
    url: "https://tailwindcss.com/docs",
    category: "Styling",
  },
];

const features = [
  {
    title: "Authentication Ready",
    description:
      "Built-in authentication with Better Auth supporting multiple providers and session management.",
  },
  {
    title: "Type-Safe API",
    description: "Hono RPC with end-to-end type safety from server to client.",
  },
  {
    title: "Database Integration",
    description: "PostgreSQL with Prisma ORM for type-safe database operations.",
  },
  {
    title: "Modern UI Components",
    description: "shadcn/ui components with dark mode support and beautiful design system.",
  },
  {
    title: "File Upload",
    description: "AWS S3 integration for seamless file upload and management.",
  },
  {
    title: "Developer Experience",
    description: "ESLint, Prettier, TypeScript, and Husky for excellent DX.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <Badge variant="secondary" className="mb-4">
            <Check className="mr-2" />
            Production Ready
          </Badge>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl">Fullstack Template</h1>
          <p className="mb-8 text-xl text-muted-foreground">
            A modern, production-ready fullstack template built with the best tools in the
            ecosystem.
            <br />
            Get started in minutes, not hours.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" asChild>
              <Link className="inline-flex gap-x-2" href="#getting-started" scroll={false}>
                <ArrowDown className="size-4" /> Get Started
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link
                className="inline-flex gap-x-2"
                href="https://github.com/caru-ini/fullstack-template"
              >
                <SiGithub /> View Repository
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16" id="features">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Everything you need</h2>
            <p className="text-lg text-muted-foreground">
              Built with modern tools and best practices for scalable applications
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-muted/40 transition-colors hover:border-border">
                <CardHeader>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="container mx-auto px-4 py-16" id="tech-stack">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold">Built with the best</h2>
            <p className="text-lg text-muted-foreground">
              Carefully selected technologies for modern web development
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {libraries.map((lib, index) => (
              <Card
                key={index}
                className="group gap-2 border-muted/40 transition-all hover:border-border hover:shadow-md"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">{lib.icon}</div>
                      <div>
                        <CardTitle className="text-lg">{lib.name}</CardTitle>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {lib.category}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription className="mb-4 text-sm leading-relaxed">
                    {lib.description}
                  </CardDescription>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                    <Link href={lib.url} target="_blank" rel="noopener noreferrer">
                      Documentation
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="container mx-auto px-4 py-16" id="getting-started">
        <div className="mx-auto max-w-4xl">
          <Card className="border-muted/40">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ready to get started?</CardTitle>
              <CardDescription className="text-base">
                Clone the repository and start building your next project
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center space-y-4">
              <div className="relative rounded-lg bg-muted p-3 font-mono text-sm">
                <div className="flex items-center justify-between gap-x-4">
                  <div>git clone https://github.com/caru-ini/fullstack-template.git</div>
                  <CopyButton
                    text={"git clone https://github.com/caru-ini/fullstack-template.git"}
                  />
                </div>
              </div>
              <div className="flex justify-center">
                <Button asChild>
                  <Link href="https://github.com/caru-ini/fullstack-template">View on GitHub</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
