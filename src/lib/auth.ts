import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { and, eq, gt, isNull } from "drizzle-orm";
import { cache } from "react";
import { db } from "@/db";
import { sessions, tenantMemberships, tenants, users } from "@/db/schema";

export const SESSION_COOKIE = "aev_session";
export const TENANT_COOKIE = "aev_tenant";
export const LOCALE_COOKIE = "aev_locale";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  locale: string;
  platformRole: string;
  status: string;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  phoneVerifiedAt: Date | null;
  createdAt: Date;
};

export type Membership = {
  tenantId: string;
  role: string;
  tenantName: string;
  tenantSlug: string;
  tenantStatus: string;
  verificationStatus: string;
  logoUrl: string | null;
};

export type AuthContext = {
  user: SafeUser | null;
  memberships: Membership[];
  activeTenantId: string | null;
  activeTenant: Membership | null;
  isPlatformAdmin: boolean;
  isSupport: boolean;
};

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function safeUser(row: typeof users.$inferSelect): SafeUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    locale: row.locale,
    platformRole: row.platformRole,
    status: row.status,
    avatarUrl: row.avatarUrl,
    emailVerifiedAt: row.emailVerifiedAt,
    phoneVerifiedAt: row.phoneVerifiedAt,
    createdAt: row.createdAt,
  };
}

export async function createSession(
  userId: string,
  meta: { ip?: string | null; userAgent?: string | null } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    id: `ses_${randomBytes(9).toString("hex")}`,
    userId,
    tokenHash: sha256(raw),
    expiresAt,
    ip: meta.ip ?? null,
    userAgent: meta.userAgent?.slice(0, 250) ?? null,
  });
  return { token: raw, expiresAt };
}

export async function revokeSession(rawToken: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(eq(sessions.tokenHash, sha256(rawToken)));
}

export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const empty: AuthContext = {
    user: null,
    memberships: [],
    activeTenantId: null,
    activeTenant: null,
    isPlatformAdmin: false,
    isSupport: false,
  };
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return empty;

  const rows = await db
    .select({ user: users, session: sessions })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(
      and(
        eq(sessions.tokenHash, sha256(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const found = rows[0];
  if (!found || found.user.status === "SUSPENDED" || found.user.status === "PENDING_DELETION") {
    return empty;
  }

  const membershipRows = await db
    .select({
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantStatus: tenants.status,
      verificationStatus: tenants.verificationStatus,
      logoUrl: tenants.logoUrl,
    })
    .from(tenantMemberships)
    .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
    .where(
      and(
        eq(tenantMemberships.userId, found.user.id),
        eq(tenantMemberships.status, "ACTIVE"),
      ),
    );

  const cookieTenant = jar.get(TENANT_COOKIE)?.value;
  const active =
    membershipRows.find((m) => m.tenantId === cookieTenant && m.tenantStatus === "ACTIVE") ??
    membershipRows.find((m) => m.tenantStatus === "ACTIVE") ??
    null;

  return {
    user: safeUser(found.user),
    memberships: membershipRows,
    activeTenantId: active?.tenantId ?? null,
    activeTenant: active,
    isPlatformAdmin: found.user.platformRole === "SUPER_ADMIN",
    isSupport: found.user.platformRole === "PLATFORM_SUPPORT",
  };
});

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(TENANT_COOKIE);
}

export function safeNextPath(next: string | null | undefined, fallback = "/dashboard"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return fallback;
  return next;
}
