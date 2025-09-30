import { UserMenu } from "@/components/auth/user-menu";
import { ThemeToggle } from "@/components/misc/theme-toggle";
import { cn } from "@/lib/utils";
import { Home, Info, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export const Sidebar = () => {
  const icons = {
    Home: <Home className="size-8" />,
    About: <Info className="size-8" />,
    Dashboard: <LayoutDashboard className="size-8" />,
  };

  const navItems = [
    { href: "/", label: "Home", color: "bg-primary", icon: icons.Home },
    { href: "/about", label: "About", color: "bg-secondary", icon: icons.About },
    { href: "/dashboard", label: "Dashboard", color: "bg-tertiary", icon: icons.Dashboard },
  ];

  return (
    <aside className="hidden h-screen border-r bg-background/80 md:flex md:w-20 md:flex-col">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="size-24 p-4 text-center text-5xl font-bold tracking-tight text-primary"
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
              item.color,
              "flex size-20 items-center justify-center text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
            )}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
      <div className="mt-auto flex flex-col items-center">
        <ThemeToggle variant="icon" />
        <UserMenu />
      </div>
    </aside>
  );
};
