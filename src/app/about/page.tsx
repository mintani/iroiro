"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code2, Github, Heart, Mail, Palette, Sparkles, Twitter, Zap } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  const features = [
    {
      icon: Palette,
      title: "Smart Color Extraction",
      description: "Advanced algorithms to extract the most representative colors from any image",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      icon: Sparkles,
      title: "AI-Powered Analysis",
      description: "Intelligent color clustering and theme generation using machine learning",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Zap,
      title: "Real-time Preview",
      description: "Instantly visualize your color themes with live component previews",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      icon: Code2,
      title: "Export Anywhere",
      description: "Export to CSS, Tailwind, SCSS, JSON, and more format options",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
  ];

  const techStack = [
    { name: "Next.js 15", category: "Framework" },
    { name: "React 19", category: "Library" },
    { name: "TypeScript", category: "Language" },
    { name: "Tailwind CSS", category: "Styling" },
    { name: "shadcn/ui", category: "UI Components" },
    { name: "Better Auth", category: "Authentication" },
    { name: "Prisma", category: "ORM" },
    { name: "PostgreSQL", category: "Database" },
    { name: "Hono", category: "API" },
    { name: "DND Kit", category: "Drag & Drop" },
    { name: "Three.js", category: "3D Graphics" },
    { name: "React Three Fiber", category: "3D" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto space-y-12 px-8 py-16">
        <div className="text-center">
          <Badge className="mb-4" variant="outline">
            v1.0.0
          </Badge>
          <h1 className="mb-4 text-5xl font-bold tracking-tight">
            iR² <span className="text-primary">Color Theme Extractor</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground">
            Professional-grade color extraction and theme management tool for designers and
            developers
          </p>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-2xl">About This Project</CardTitle>
            <CardDescription>The ultimate color workflow solution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">
              iR² is a cutting-edge color theme extraction tool designed to streamline your design
              workflow. Whether you&apos;re building a brand identity, creating a design system, or
              simply exploring color combinations, iR² provides the tools you need to extract,
              analyze, and export color themes with precision.
            </p>
            <p className="leading-relaxed">
              Built with modern web technologies, iR² combines powerful color analysis algorithms
              with an intuitive, desktop-first interface. Upload images, extract color palettes,
              organize colors into themed categories, and export them in multiple formats - all in
              one seamless workflow.
            </p>
          </CardContent>
        </Card>

        <div>
          <h2 className="mb-6 text-3xl font-bold">Key Features</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 transition-all hover:shadow-lg">
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div className={`rounded-lg p-3 ${feature.bgColor}`}>
                      <feature.icon className={`size-6 ${feature.color}`} />
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Technology Stack</CardTitle>
            <CardDescription>Built with modern, production-ready technologies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
              {techStack.map((tech, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-1 rounded-lg border bg-muted/50 p-3 transition-colors hover:bg-muted"
                >
                  <span className="font-semibold">{tech.name}</span>
                  <span className="text-xs text-muted-foreground">{tech.category}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardHeader>
            <CardTitle className="text-2xl">Get Started</CardTitle>
            <CardDescription>Ready to explore color themes?</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="leading-relaxed">
              Start extracting beautiful color themes from your images today. Upload an image, let
              our advanced algorithms analyze the colors, and export your custom theme in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/">
                  <Palette className="mr-2 size-4" />
                  Go to App
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/dashboard">
                  <Sparkles className="mr-2 size-4" />
                  View Dashboard
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Connect With Us</CardTitle>
            <CardDescription>Get in touch or follow our updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="lg">
                <Github className="mr-2 size-4" />
                GitHub
              </Button>
              <Button variant="outline" size="lg">
                <Twitter className="mr-2 size-4" />
                Twitter
              </Button>
              <Button variant="outline" size="lg">
                <Mail className="mr-2 size-4" />
                Email
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
          <span>Made with</span>
          <Heart className="size-4 fill-red-500 text-red-500" />
          <span>by the iR² team</span>
        </div>
      </div>
    </div>
  );
}
