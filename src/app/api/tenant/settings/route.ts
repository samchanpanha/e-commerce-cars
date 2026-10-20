import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { tenants } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { canInTenant } from "@/lib/rbac";
import { PROVINCES } from "@/lib/constants";

const schema = z.object({
  tenantId: z.string().min(1),
  name: z.string().trim().min(2).max(150),
  descriptionEn: z.string().trim().max(1500).optional().or(z.literal("")),
  descriptionKm: z.string().trim().max(1500).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  website: z.string().trim().max(200).optional().or(z.literal("")),
  addressLine: z.string().trim().max(300).optional().or(z.literal("")),
  province: z.enum(PROVINCES),
  logoUrl: z.string().trim().max(500).optional().or(z.literal("")),
});

export async function PATCH(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const body = await parseBody(req, schema);
    if (!canInTenant(ctx, body.tenantId, "tenant:manage")) {
      throw new ApiError(403, "FORBIDDEN", "You cannot edit this dealership.");
    }

    await db
      .update(tenants)
      .set({
        name: body.name,
        descriptionEn: body.descriptionEn || null,
        descriptionKm: body.descriptionKm || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        addressLine: body.addressLine || null,
        province: body.province,
        logoUrl: body.logoUrl || null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, body.tenantId));

    await audit({ actorId: ctx.user.id, tenantId: body.tenantId, action: "tenant.settings_update", targetType: "tenant", targetId: body.tenantId });
    return jsonOk({ updated: true });
  } catch (err) {
    return jsonError(err);
  }
}
