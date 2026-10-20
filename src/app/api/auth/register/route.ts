import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantMemberships, tenantSubscriptions, tenants, users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, clientIp, jsonError, parseBody, rateLimit } from "@/lib/api";
import { createSession, setSessionCookie } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";
import { newId, slugify } from "@/lib/ids";

export async function POST(req: NextRequest) {
  try {
    rateLimit(`register:${clientIp(req)}`, 6, 10 * 60 * 1000);
    const body = await parseBody(req, registerSchema);
    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length) {
      throw new ApiError(409, "EMAIL_TAKEN", "An account with this email already exists.");
    }

    const userId = newId("usr");
    const passwordHash = await hashPassword(body.password);
    await db.insert(users).values({
      id: userId,
      email: body.email,
      phone: body.phone || null,
      passwordHash,
      name: body.name,
      locale: body.locale,
      platformRole: "USER",
      status: "ACTIVE",
    });

    let createdTenantId: string | null = null;
    if (body.accountType === "DEALER") {
      const baseName = body.dealerName?.trim() || `${body.name} Motors`;
      let slug = slugify(baseName) || `dealer-${userId.slice(-6)}`;
      const clash = await db.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
      if (clash.length) slug = `${slug}-${userId.slice(-4)}`;

      createdTenantId = newId("tnt");
      await db.insert(tenants).values({
        id: createdTenantId,
        name: baseName,
        slug,
        type: "DEALER",
        phone: body.phone || null,
        email: body.email,
        province: "Phnom Penh",
        verificationStatus: "PENDING",
        status: "ACTIVE",
      });
      await db.insert(tenantMemberships).values({
        id: newId("mem"),
        userId,
        tenantId: createdTenantId,
        role: "TENANT_OWNER",
        status: "ACTIVE",
      });
      await db.insert(tenantSubscriptions).values({
        id: newId("sub"),
        tenantId: createdTenantId,
        planCode: "free",
        status: "ACTIVE",
      });
    }

    const session = await createSession(userId, {
      ip: clientIp(req),
      userAgent: req.headers.get("user-agent"),
    });
    await setSessionCookie(session.token, session.expiresAt);
    await audit({
      actorId: userId,
      actorRole: "USER",
      tenantId: createdTenantId,
      action: "auth.register",
      targetType: "user",
      targetId: userId,
      metadata: { accountType: body.accountType },
      ip: clientIp(req),
    });

    const redirectTo = createdTenantId ? "/tenant" : body.accountType === "SELLER" ? "/seller" : "/customer";
    return NextResponse.json({ data: { userId, redirectTo } }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
