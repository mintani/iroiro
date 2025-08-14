import { env } from "@/env";
import { adminClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { Plug } from "lucide-react";
import { SiGithub, SiGoogle } from "react-icons/si";

export const client = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,
  plugins: [adminClient()],
});

export type Session = typeof client.$Infer.Session;

const providersMap = {
  github: {
    name: "github",
    displayName: "GitHub",
    icon: SiGithub,
  },
  google: {
    name: "google",
    displayName: "Google",
    icon: SiGoogle,
  },
} as const;

export const getProviderMap = (provider: string) => {
  return (
    providersMap?.[provider as keyof typeof providersMap] ?? {
      name: provider,
      displayName: provider,
      icon: Plug,
    }
  );
};

export const { signIn, signUp, useSession } = client;
