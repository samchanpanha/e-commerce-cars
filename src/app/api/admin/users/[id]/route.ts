import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { isSuperAdmin } from "@/lib/rbac";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("SUSPEND"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("REACTIVATE") }),
  z.object({ action: z.literal("SET_ROLE"), role: z.enum(["USER", "PLATFORM_SUPPORT", "SUPER_ADMIN"]) }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    if (!isSuperAdmin(ctx)) throw new ApiError(403, "FORBIDDEN", "Super admin access required.");
    const body = await parseBody(req, schema);
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const user = rows[0];
    if (!user) throw new ApiError(404, "NOT_FOUND", "User not found.");

    if (body.action === "SUSPEND") {
      if (user.id === ctx.user.id) throw new ApiError(409, "SELF_ACTION", "You cannot suspend your own account.");
      await db.update(users).set({ status: "SUSPENDED", updatedAt: new Date() }).where(eq(users.id, id));
      await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.userId, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "user.suspend", targetType: "user", targetId: id, metadata: { reason: body.reason } });
      return jsonOk({ status: "SUSPENDED" });
    }

    if (body.action === "REACTIVATE") {
      await db.update(users).set({ status: "ACTIVE", updatedAt: new Date() }).where(eq(users.id, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "user.reactivate", targetType: "user", targetId: id });
      return jsonOk({ status: "ACTIVE" });
    }

    if (user.id === ctx.user.id && body.role !== "SUPER_ADMIN") {
      throw new ApiError(409, "SELF_ACTION", "Ask another super admin to change your platform role.");
    }
    await db.update(users).set({ platformRole: body.role, updatedAt: new Date() }).where(eq(users.id, id));
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, action: "user.role_change", targetType: "user", targetId: id, metadata: { role: body.role } });
    return jsonOk({ platformRole: body.role });
  } catch (err) {
    return jsonError(err);
  }
}
