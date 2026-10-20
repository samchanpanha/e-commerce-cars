import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canPlatform } from "@/lib/rbac";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("SUSPEND"), reason: z.string().trim().min(5).max(500) }),
  z.object({ action: z.literal("REINSTATE") }),
  z.object({ action: z.literal("VERIFY") }),
  z.object({ action: z.literal("UNVERIFY"), reason: z.string().trim().max(500).optional() }),
]);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    if (!canPlatform(ctx, "tenant:admin")) throw new ApiError(403, "FORBIDDEN", "Super admin access required.");

    const body = await parseBody(req, schema);
    const rows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
    const tenant = rows[0];
    if (!tenant) throw new ApiError(404, "NOT_FOUND", "Dealership not found.");

    if (body.action === "SUSPEND") {
      await db.update(tenants).set({ status: "SUSPENDED", suspendedAt: new Date(), suspensionReason: body.reason, updatedAt: new Date() }).where(eq(tenants.id, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: id, action: "tenant.suspend", targetType: "tenant", targetId: id, metadata: { reason: body.reason } });
      return jsonOk({ status: "SUSPENDED" });
    }

    if (body.action === "REINSTATE") {
      await db.update(tenants).set({ status: "ACTIVE", suspendedAt: null, suspensionReason: null, updatedAt: new Date() }).where(eq(tenants.id, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: id, action: "tenant.reinstate", targetType: "tenant", targetId: id });
      return jsonOk({ status: "ACTIVE" });
    }

    if (body.action === "VERIFY") {
      await db.update(tenants).set({ verificationStatus: "VERIFIED", verifiedAt: new Date(), verificationNote: null, updatedAt: new Date() }).where(eq(tenants.id, id));
      await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: id, action: "tenant.verify", targetType: "tenant", targetId: id });
      return jsonOk({ verificationStatus: "VERIFIED" });
    }

    await db.update(tenants).set({ verificationStatus: "REJECTED", verifiedAt: null, verificationNote: body.reason ?? null, updatedAt: new Date() }).where(eq(tenants.id, id));
    await audit({ actorId: ctx.user.id, actorRole: ctx.user.platformRole, tenantId: id, action: "tenant.unverify", targetType: "tenant", targetId: id });
    return jsonOk({ verificationStatus: "REJECTED" });
  } catch (err) {
    return jsonError(err);
  }
}
