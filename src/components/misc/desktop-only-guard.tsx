"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

export const DesktopOnlyGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (!isMounted) {
    return null;
  }

  if (isMobile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mb-4 flex justify-center gap-4">
              <Smartphone className="size-12 text-muted-foreground" />
              <div className="flex items-center">
                <span className="text-2xl text-muted-foreground">→</span>
              </div>
              <Monitor className="size-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Desktop Only</CardTitle>
            <CardDescription className="text-base">
              This application is designed for desktop use only
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-center text-sm text-muted-foreground">
                Please access this site from a desktop or laptop computer with a screen width of at
                least <span className="font-semibold text-foreground">1024px</span>.
              </p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Current screen width: {window.innerWidth}px</p>
              <p>Required: 1024px or wider</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
