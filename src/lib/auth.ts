import { env } from "@/env";
import { db } from "@/lib/db";

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";

const adminUserIds = env.ADMIN_USER_IDS?.replaceAll(" ", "").split(",") ?? [];

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  socialProviders: {
    github: {
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    },
  },
  plugins: [
    nextCookies(),
    admin({
      adminRoles: ["admin", "superadmin"],
      adminUserIds,
    }),
  ],
});

export type Session = typeof auth.$Infer.Session;
