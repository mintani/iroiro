"use client";

import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/misc/theme-toggle";
import { cn } from "@/lib/utils";
import { Home, Info, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const Sidebar = () => {
  const pathname = usePathname();

  const icons = {
    Home: <Home className="size-8" />,
    About: <Info className="size-8" />,
    Dashboard: <LayoutDashboard className="size-8" />,
  };

  const navItems = [
    { href: "/", label: "Home", icon: icons.Home },
    { href: "/about", label: "About", icon: icons.About },
    { href: "/dashboard", label: "Dashboard", icon: icons.Dashboard },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname?.startsWith(href);
  };

  return (
    <aside className="hidden h-screen border-r bg-background/80 md:flex md:w-20 md:flex-col">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="size-24 p-4 text-center text-5xl font-bold tracking-tight text-primary transition-transform hover:scale-105"
        >
          <span className="self-center text-5xl">iR²</span>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex size-20 items-center justify-center text-sm font-medium transition-all hover:bg-accent",
              isActive(item.href)
                ? "border-r-4 border-primary bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-primary"
            )}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col items-center pb-4">
        <ThemeToggle variant="icon" />
        <UserMenu />
      </div>
    </aside>
  );
};
