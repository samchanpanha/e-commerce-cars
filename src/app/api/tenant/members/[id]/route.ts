import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tenantMemberships } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canInTenant } from "@/lib/rbac";

const schema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
  role: z.enum(["TENANT_OWNER", "TENANT_ADMIN", "INVENTORY_MANAGER", "SALES_AGENT"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    const body = await parseBody(req, schema);

    const rows = await db.select().from(tenantMemberships).where(eq(tenantMemberships.id, id)).limit(1);
    const membership = rows[0];
    if (!membership) throw new ApiError(404, "NOT_FOUND", "Team member not found.");
    if (!canInTenant(ctx, membership.tenantId, "member:manage")) {
      throw new ApiError(403, "FORBIDDEN", "You cannot manage this team.");
    }
    if (membership.role === "TENANT_OWNER" && ctx.user.platformRole !== "SUPER_ADMIN") {
      throw new ApiError(403, "OWNER_PROTECTED", "The dealership owner's membership cannot be changed.");
    }

    await db
      .update(tenantMemberships)
      .set({ ...(body.status ? { status: body.status } : {}), ...(body.role ? { role: body.role } : {}) })
      .where(eq(tenantMemberships.id, id));

    await audit({ actorId: ctx.user.id, tenantId: membership.tenantId, action: "tenant.member_update", targetType: "membership", targetId: id, metadata: body });
    return jsonOk({ id, ...body });
  } catch (err) {
    return jsonError(err);
  }
}
