import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <Card className="w-full max-w-2xl border-2">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <Clock className="size-16 text-primary" />
            </div>
          </div>
          <Badge className="mx-auto mb-4 w-fit" variant="outline">
            Coming Soon
          </Badge>
          <CardTitle className="text-4xl">Dashboard</CardTitle>
          <CardDescription className="text-lg">
            We&apos;re working hard to bring you an amazing dashboard experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-6">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              <h3 className="font-semibold">What to expect</h3>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>Project management and organization</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>Analytics and insights for your color themes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>Team collaboration features</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>Export history and version control</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1" size="lg">
              <Link href="/">Go to App</Link>
            </Button>
            <Button asChild className="flex-1" size="lg" variant="outline">
              <Link href="/about">Learn More</Link>
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Stay tuned for updates. In the meantime, explore the color extraction tool!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
