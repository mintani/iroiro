import { requireAuth } from "@/app/api/[[...route]]/require-auth";
import type { Variables } from "@/app/api/[[...route]]/route";
import { auth } from "@/lib/auth";
import { Hono } from "hono";
import z from "zod";

export const session = new Hono<{ Variables: Variables }>()
  .post("/revoke", requireAuth, async (c) => {
    try {
      const body = await c.req.json();
      const { sessionId } = z
        .object({
          sessionId: z.string(),
        })
        .parse(body);

      const currentUser = c.get("user");
      const currentSession = c.get("session");

      if (!currentUser || !currentSession) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const allSessions = await auth.api.listSessions({
        headers: c.req.raw.headers,
      });

      const targetSession = allSessions?.find((session) => session.id === sessionId);

      if (!targetSession || targetSession.userId !== currentUser.id) {
        return c.json({ error: "Session not found or unauthorized" }, 404);
      }

      await auth.api.revokeSession({
        headers: c.req.raw.headers,
        body: { token: targetSession.token },
      });

      return c.json({ success: true });
    } catch (error) {
      console.error("Failed to revoke session:", error);
      return c.json({ error: "Failed to revoke session" }, 500);
    }
  })
  .post("/revoke-all", requireAuth, async (c) => {
    try {
      const currentSession = c.get("session");

      if (!currentSession) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const allSessions = await auth.api.listSessions({
        headers: c.req.raw.headers,
      });

      const sessionsToRevoke =
        allSessions?.filter((session) => session.id !== currentSession.id) || [];

      await Promise.all(
        sessionsToRevoke.map((session) =>
          auth.api.revokeSession({
            headers: c.req.raw.headers,
            body: { token: session.token },
          })
        )
      );

      return c.json({ success: true, revokedCount: sessionsToRevoke.length });
    } catch (error) {
      console.error("Failed to revoke all sessions:", error);
      return c.json({ error: "Failed to revoke all sessions" }, 500);
    }
  });
