import { session } from "@/app/api/[[...route]]/session";
import { auth } from "@/lib/auth";
import { Hono } from "hono";
import { handle } from "hono/vercel";

export type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new Hono<{ Variables: Variables }>().basePath("/api").route("/session", session);

export type AppType = typeof app;

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
