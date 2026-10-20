import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tenantInvitations, tenantMemberships, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canInTenant } from "@/lib/rbac";
import { newId, token } from "@/lib/ids";

const schema = z.object({
  tenantId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(["TENANT_ADMIN", "INVENTORY_MANAGER", "SALES_AGENT"]),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const body = await parseBody(req, schema);

    if (!canInTenant(ctx, body.tenantId, "member:manage")) {
      throw new ApiError(403, "FORBIDDEN", "You cannot invite staff to this dealership.");
    }

    const target = await db.select().from(users).where(eq(users.email, body.email.toLowerCase())).limit(1);
    if (target.length) {
      const membership = await db
        .select({ id: tenantMemberships.id })
        .from(tenantMemberships)
        .where(and(eq(tenantMemberships.userId, target[0].id), eq(tenantMemberships.tenantId, body.tenantId)))
        .limit(1);
      if (membership.length) throw new ApiError(409, "ALREADY_MEMBER", "This person is already on your team.");
    }

    const inviteToken = token(24);
    const invitationId = newId("inv");
    await db.insert(tenantInvitations).values({
      id: invitationId,
      tenantId: body.tenantId,
      email: body.email.toLowerCase(),
      role: body.role,
      token: inviteToken,
      invitedById: ctx.user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    await audit({ actorId: ctx.user.id, tenantId: body.tenantId, action: "tenant.invite", targetType: "invitation", targetId: invitationId, metadata: { role: body.role } });

    // In production this link is emailed by the notification worker; in the demo it is returned.
    return jsonOk({ id: invitationId, inviteUrl: `/invite/${inviteToken}` }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
