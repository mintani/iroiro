"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { client, useSession } from "@/lib/auth-client";
import { LogIn, LogOut, User } from "lucide-react";
import { getImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export const UserMenu = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { props: imageProps } = getImageProps({
    src: session?.user?.image ?? "",
    alt: session?.user?.name ?? "User",
    className: "size-full",
    width: 36,
    height: 36,
  });

  const handleSignOut = useCallback(async () => {
    await client.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
  }, [router]);

  if (isPending) {
    return <Skeleton className="size-20" />;
  }

  if (!session?.user) {
    return (
      <Button
        onClick={() =>
          client.signIn.social({
            provider: "github",
            callbackURL: "/",
          })
        }
        variant="ghost"
        className="size-20 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
        aria-label="Sign in"
        title="Sign in"
      >
        <LogIn className="size-8" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="size-20 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
          aria-label="User menu"
        >
          <Avatar className="size-12 select-none">
            <AvatarImage {...imageProps} />
            <AvatarFallback>
              {isPending ? (
                <Skeleton className="size-full" />
              ) : (
                (session.user.name?.[0]?.toUpperCase() ?? <User className="size-full" />)
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="" passHref>
            <div className="flex cursor-pointer flex-col">
              <span className="truncate font-semibold">{session.user.name ?? "User"}</span>
              <span className="truncate text-xs text-muted-foreground">{session.user.email}</span>
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="mr-2 size-4" /> Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
