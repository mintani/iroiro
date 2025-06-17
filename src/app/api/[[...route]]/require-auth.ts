import { auth } from "@/lib/auth";
import type { Context } from "hono";

export async function requireAuth(c: Context, next: () => Promise<void>) {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
}
