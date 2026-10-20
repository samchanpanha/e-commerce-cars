import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { listings, tenantMemberships } from "@/db/schema";
import type { AuthContext } from "./auth";

export type Permission =
  | "listing:read"
  | "listing:create"
  | "listing:edit"
  | "listing:delete"
  | "listing:publish"
  | "listing:feature"
  | "listing:moderate"
  | "lead:read"
  | "lead:manage"
  | "member:manage"
  | "tenant:manage"
  | "analytics:read"
  | "subscription:manage"
  | "report:request"
  | "report:review"
  | "moderation:read"
  | "moderation:handle"
  | "user:read"
  | "user:manage"
  | "tenant:admin"
  | "audit:read"
  | "settings:manage";

/** Tenant-level roles. Platform admins bypass these checks explicitly. */
export const TENANT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  TENANT_OWNER: [
    "listing:read", "listing:create", "listing:edit", "listing:delete", "listing:publish",
    "listing:feature", "lead:read", "lead:manage", "member:manage", "tenant:manage",
    "analytics:read", "subscription:manage", "report:request",
  ],
  TENANT_ADMIN: [
    "listing:read", "listing:create", "listing:edit", "listing:delete", "listing:publish",
    "listing:feature", "lead:read", "lead:manage", "member:manage", "tenant:manage",
    "analytics:read", "report:request",
  ],
  INVENTORY_MANAGER: [
    "listing:read", "listing:create", "listing:edit", "listing:delete", "listing:publish",
    "analytics:read", "report:request",
  ],
  SALES_AGENT: ["listing:read", "lead:read", "lead:manage", "analytics:read"],
};

export const PLATFORM_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    "listing:read", "listing:moderate", "listing:feature", "report:review", "moderation:read",
    "moderation:handle", "user:read", "user:manage", "tenant:admin", "audit:read", "settings:manage",
    "analytics:read",
  ],
  PLATFORM_SUPPORT: ["listing:read", "listing:moderate", "report:review", "moderation:read", "moderation:handle", "user:read", "audit:read"],
  USER: [],
};

export function isPlatformStaff(ctx: AuthContext): boolean {
  return ctx.user?.platformRole === "SUPER_ADMIN" || ctx.user?.platformRole === "PLATFORM_SUPPORT";
}

export function isSuperAdmin(ctx: AuthContext): boolean {
  return ctx.user?.platformRole === "SUPER_ADMIN";
}

/** Permission inside a tenant. Derives membership from the DB-validated context, never from a request body. */
export function canInTenant(ctx: AuthContext, tenantId: string, permission: Permission): boolean {
  if (!ctx.user) return false;
  if (ctx.user.platformRole === "SUPER_ADMIN") return true;
  const membership = ctx.memberships.find(
    (m) => m.tenantId === tenantId && m.tenantStatus === "ACTIVE",
  );
  if (!membership) return false;
  return TENANT_ROLE_PERMISSIONS[membership.role]?.includes(permission) ?? false;
}

export function canPlatform(ctx: AuthContext, permission: Permission): boolean {
  if (!ctx.user) return false;
  const perms = PLATFORM_PERMISSIONS[ctx.user.platformRole] ?? [];
  return perms.includes(permission);
}

/** A user's private (non-tenant) seller capability: creating own listings is allowed to any active user. */
export function canSell(ctx: AuthContext): boolean {
  return Boolean(ctx.user && ctx.user.status === "ACTIVE");
}

/**
 * Central ownership check for a listing. Tenant listings require a permitted membership;
 * private listings require the caller to be the seller.
 */
export async function canAccessListing(
  ctx: AuthContext,
  listing: { id: string; sellerId: string; tenantId: string | null },
  permission: Permission,
): Promise<boolean> {
  if (!ctx.user) return false;
  if (isPlatformStaff(ctx) && permission === "listing:read") return true;
  if (listing.tenantId) return canInTenant(ctx, listing.tenantId, permission);
  return listing.sellerId === ctx.user.id && (permission === "listing:read" || permission.startsWith("listing:") || permission === "analytics:read");
}

/** Returns the tenant id only when the user has an authorized, active membership. */
export async function resolveTenantForRequest(
  ctx: AuthContext,
  requestedTenantId?: string | null,
): Promise<string | null> {
  const candidate = requestedTenantId ?? ctx.activeTenantId;
  if (!candidate || !ctx.user) return null;
  if (ctx.user.platformRole === "SUPER_ADMIN") return candidate;
  const membership = await db
    .select({ id: tenantMemberships.id })
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.userId, ctx.user.id),
        eq(tenantMemberships.tenantId, candidate),
        eq(tenantMemberships.status, "ACTIVE"),
      ),
    )
    .limit(1);
  const contextMembership = ctx.memberships.find((m) => m.tenantId === candidate);
  if (contextMembership && contextMembership.tenantStatus !== "ACTIVE") return null;
  return membership.length ? candidate : null;
}

/** Tenant-scoped listing fetch; returns null when the listing is outside the caller's tenant. */
export async function getTenantListing(ctx: AuthContext, tenantId: string, listingId: string) {
  if (!canInTenant(ctx, tenantId, "listing:read")) return null;
  const rows = await db
    .select()
    .from(listings)
    .where(and(eq(listings.id, listingId), eq(listings.tenantId, tenantId)))
    .limit(1);
  return rows[0] ?? null;
}

export function dashboardHome(ctx: AuthContext, hasListings: boolean): string {
  if (ctx.isPlatformAdmin || ctx.isSupport) return "/admin";
  if (ctx.memberships.length > 0) return "/tenant";
  if (hasListings) return "/seller";
  return "/customer";
}
