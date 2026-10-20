import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { tenantInvitations, tenantMemberships, tenants } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";

/**
 * Accept a staff invitation. The tenant is resolved from the invitation token,
 * never from the request body. The signed-in user's email must match the email
 * the invitation was sent to.
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const ctx = await requireUser();
    const { token } = await params;

    const rows = await db
      .select({
        id: tenantInvitations.id,
        tenantId: tenantInvitations.tenantId,
        email: tenantInvitations.email,
        role: tenantInvitations.role,
        expiresAt: tenantInvitations.expiresAt,
        acceptedAt: tenantInvitations.acceptedAt,
        tenantName: tenants.name,
        tenantStatus: tenants.status,
      })
      .from(tenantInvitations)
      .innerJoin(tenants, eq(tenants.id, tenantInvitations.tenantId))
      .where(eq(tenantInvitations.token, token))
      .limit(1);

    const invitation = rows[0];
    if (!invitation) throw new ApiError(404, "INVITE_NOT_FOUND", "This invitation link is not valid.");
    if (invitation.acceptedAt) throw new ApiError(409, "INVITE_USED", "This invitation has already been used.");
    if (invitation.expiresAt.getTime() < Date.now()) throw new ApiError(410, "INVITE_EXPIRED", "This invitation has expired.");
    if (invitation.tenantStatus !== "ACTIVE") throw new ApiError(403, "TENANT_SUSPENDED", "This dealership is not active.");
    if (invitation.email !== ctx.user.email.toLowerCase()) {
      throw new ApiError(403, "EMAIL_MISMATCH", "Sign in with the email address that received this invitation.");
    }

    const existing = await db
      .select({ id: tenantMemberships.id })
      .from(tenantMemberships)
      .where(and(eq(tenantMemberships.userId, ctx.user.id), eq(tenantMemberships.tenantId, invitation.tenantId)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(tenantMemberships).values({
        id: newId("mem"),
        userId: ctx.user.id,
        tenantId: invitation.tenantId,
        role: invitation.role,
        status: "ACTIVE",
      });
    }

    await db.update(tenantInvitations).set({ acceptedAt: new Date() }).where(eq(tenantInvitations.id, invitation.id));
    await audit({
      actorId: ctx.user.id,
      tenantId: invitation.tenantId,
      action: "tenant.invite_accept",
      targetType: "invitation",
      targetId: invitation.id,
      metadata: { role: invitation.role, alreadyMember: existing.length > 0 },
    });

    return jsonOk({ tenantId: invitation.tenantId, tenantName: invitation.tenantName, redirectTo: "/tenant" });
  } catch (err) {
    return jsonError(err);
  }
}
