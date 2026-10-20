/**
 * Security regression suite.
 *
 * Run with `npm test` after `npm run db:seed`. The suite reads the seeded demo
 * database and exercises the same guard functions and route handlers that run
 * in production.
 */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  listings,
  reportRequests,
  tenantInvitations,
  tenantMemberships,
  tenants,
  users,
  vehicleDocuments,
  vehicles,
} from "@/db/schema";
import { newId, slugify } from "@/lib/ids";
import { safeUser, type AuthContext } from "@/lib/auth";
import {
  canAccessListing,
  canInTenant,
  canPlatform,
  isSuperAdmin,
  resolveTenantForRequest,
} from "@/lib/rbac";
import { canViewReport, getReportByPublicId } from "@/lib/reports";
import { EMPTY_FILTERS, searchListings } from "@/lib/listings";
import { requireUser } from "@/lib/api";

vi.mock("@/lib/api", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/api")>();
  return { ...actual, requireUser: vi.fn() };
});

import { PATCH as tenantSettingsPatch } from "@/app/api/tenant/settings/route";
import { PATCH as adminUserPatch } from "@/app/api/admin/users/[id]/route";
import { GET as listingGet } from "@/app/api/listings/[id]/route";
import { GET as documentGet } from "@/app/api/documents/[id]/route";
import { POST as reportDispute } from "@/app/api/reports/[publicId]/dispute/route";
import { POST as acceptInvite } from "@/app/api/invitations/[token]/accept/route";

async function buildContext(email: string): Promise<AuthContext> {
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const row = rows[0];
  if (!row) throw new Error(`Seed user ${email} not found. Run npm run db:seed first.`);
  const membershipRows = await db
    .select({
      tenantId: tenantMemberships.tenantId,
      role: tenantMemberships.role,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantStatus: tenants.status,
      verificationStatus: tenants.verificationStatus,
      logoUrl: tenants.logoUrl,
      membershipStatus: tenantMemberships.status,
    })
    .from(tenantMemberships)
    .innerJoin(tenants, eq(tenants.id, tenantMemberships.tenantId))
    .where(eq(tenantMemberships.userId, row.id));

  const active = membershipRows
    .filter((m) => m.membershipStatus === "ACTIVE")
    .map(({ membershipStatus: _ignored, ...rest }) => rest);
  const platformRole = row.platformRole;
  return {
    user: safeUser(row),
    memberships: active,
    activeTenantId: active[0]?.tenantId ?? null,
    activeTenant: active[0] ?? null,
    isPlatformAdmin: platformRole === "SUPER_ADMIN",
    isSupport: platformRole === "PLATFORM_SUPPORT",
  };
}

function mockUser(ctx: AuthContext) {
  vi.mocked(requireUser).mockResolvedValue(ctx as never);
}

function jsonRequest(url: string, method: "PATCH" | "POST", body: unknown) {
  return new NextRequest(url, {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

let buyer: AuthContext;
let dealer: AuthContext;
let sales: AuthContext;
let owner2: AuthContext;
let admin: AuthContext;
let support: AuthContext;
let mekongOwner: AuthContext;
let newhire: AuthContext;

let angkorId: string;
let mekongId: string;
let hubId: string;
let angkorListingId: string;
let cx5DocumentId: string;

const probeListingIds: string[] = [];
const probeVehicleIds: string[] = [];

beforeAll(async () => {
  [buyer, dealer, sales, owner2, admin, support, mekongOwner, newhire] = await Promise.all([
    buildContext("buyer@angkorev.kh"),
    buildContext("dealer@angkorev.kh"),
    buildContext("sales@angkorev.kh"),
    buildContext("owner2@angkorev.kh"),
    buildContext("admin@angkorev.kh"),
    buildContext("support@angkorev.kh"),
    buildContext("mekong@angkorev.kh"),
    buildContext("newhire@angkorev.kh"),
  ]);
  const tenantRows = await db.select({ id: tenants.id, slug: tenants.slug }).from(tenants);
  angkorId = tenantRows.find((t) => t.slug === "angkor-auto-group")!.id;
  mekongId = tenantRows.find((t) => t.slug === "mekong-motors")!.id;
  hubId = tenantRows.find((t) => t.slug === "phnom-penh-auto-hub")!.id;

  const listingRow = await db
    .select({ id: listings.id })
    .from(listings)
    .where(and(eq(listings.tenantId, angkorId), eq(listings.status, "PUBLISHED")))
    .limit(1);
  angkorListingId = listingRow[0]!.id;

  const docRow = await db
    .select({ id: vehicleDocuments.id })
    .from(vehicleDocuments)
    .innerJoin(listings, eq(listings.vehicleId, vehicleDocuments.vehicleId))
    .where(and(eq(listings.tenantId, angkorId), eq(vehicleDocuments.type, "REGISTRATION"), eq(vehicleDocuments.status, "VERIFIED")))
    .limit(1);
  cx5DocumentId = docRow[0]!.id;
});

afterAll(async () => {
  for (const id of probeListingIds) await db.delete(listings).where(eq(listings.id, id));
  for (const id of probeVehicleIds) await db.delete(vehicles).where(eq(vehicles.id, id));
});

async function createProbeListing(tenantId: string, label: string) {
  const vehicleId = newId("veh");
  const listingId = newId("lst");
  probeVehicleIds.push(vehicleId);
  probeListingIds.push(listingId);
  await db.insert(vehicles).values({
    id: vehicleId,
    make: label,
    model: "Probe",
    year: 2024,
    mileageKm: 1000,
    transmission: "AUTOMATIC",
    fuelType: "PETROL",
    bodyType: "SEDAN",
  });
  await db.insert(listings).values({
    id: listingId,
    slug: `${slugify(label)}-${listingId.slice(-5)}`,
    vehicleId,
    sellerId: (tenantId === mekongId ? mekongOwner : owner2).user!.id,
    tenantId,
    priceUsd: 20000,
    status: "PUBLISHED",
    province: "Phnom Penh",
    descriptionEn: `${label} probe listing for automated visibility tests.`,
    publishedAt: new Date(),
  });
  return listingId;
}

describe("tenant isolation", () => {
  it("allows a dealership owner inside their own tenant", () => {
    expect(canInTenant(dealer, angkorId, "tenant:manage")).toBe(true);
    expect(canInTenant(dealer, angkorId, "listing:edit")).toBe(true);
  });

  it("denies a dealership owner from another tenant's data", () => {
    expect(canInTenant(owner2, angkorId, "listing:read")).toBe(false);
    expect(canInTenant(owner2, angkorId, "tenant:manage")).toBe(false);
    expect(canInTenant(dealer, hubId, "lead:read")).toBe(false);
    expect(canInTenant(buyer, angkorId, "listing:read")).toBe(false);
  });

  it("resolves tenant identity only from active membership, never from a requested id", async () => {
    expect(await resolveTenantForRequest(owner2, angkorId)).toBeNull();
    expect(await resolveTenantForRequest(dealer, angkorId)).toBe(angkorId);
    expect(await resolveTenantForRequest(buyer, angkorId)).toBeNull();
  });

  it("blocks cross-tenant listing access through the shared ownership check", async () => {
    const rows = await db.select().from(listings).where(eq(listings.id, angkorListingId)).limit(1);
    const angkorListing = rows[0]!;
    expect(await canAccessListing(owner2, angkorListing, "listing:read")).toBe(false);
    expect(await canAccessListing(owner2, angkorListing, "listing:edit")).toBe(false);
    expect(await canAccessListing(dealer, angkorListing, "listing:read")).toBe(true);
    expect(await canAccessListing(buyer, angkorListing, "listing:read")).toBe(false);
  });
});

describe("role escalation", () => {
  it("does not let a SALES_AGENT manage the team or the dealership", () => {
    expect(canInTenant(sales, angkorId, "lead:read")).toBe(true);
    expect(canInTenant(sales, angkorId, "lead:manage")).toBe(true);
    expect(canInTenant(sales, angkorId, "member:manage")).toBe(false);
    expect(canInTenant(sales, angkorId, "tenant:manage")).toBe(false);
    expect(canInTenant(sales, angkorId, "listing:create")).toBe(false);
    expect(canInTenant(sales, angkorId, "subscription:manage")).toBe(false);
  });

  it("keeps platform permissions separate from tenant permissions", () => {
    expect(canPlatform(buyer, "moderation:handle")).toBe(false);
    expect(canPlatform(dealer, "moderation:handle")).toBe(false);
    expect(canPlatform(support, "moderation:handle")).toBe(true);
    expect(canPlatform(support, "user:manage")).toBe(false);
    expect(canPlatform(support, "tenant:admin")).toBe(false);
    expect(canPlatform(admin, "user:manage")).toBe(true);
    expect(isSuperAdmin(support)).toBe(false);
    expect(isSuperAdmin(admin)).toBe(true);
  });

  it("gives suspended tenant memberships no permissions at all", async () => {
    expect(canInTenant(mekongOwner, mekongId, "listing:read")).toBe(false);
    expect(canInTenant(mekongOwner, mekongId, "tenant:manage")).toBe(false);
    expect(await resolveTenantForRequest(mekongOwner, mekongId)).toBeNull();
  });
});

describe("private reports", () => {
  it("allows only the requester, the seller, tenant staff and platform staff", async () => {
    const rows = await db
      .select({ publicId: reportRequests.publicId })
      .from(reportRequests)
      .where(eq(reportRequests.requestedById, buyer.user!.id))
      .limit(1);
    const record = await getReportByPublicId(rows[0]!.publicId);
    expect(record).not.toBeNull();

    expect(canViewReport({ userId: buyer.user!.id, platformRole: "USER" }, record!)).toBe(true);
    expect(canViewReport({ userId: owner2.user!.id, platformRole: "USER", tenantIds: [hubId] }, record!)).toBe(false);
    expect(canViewReport({ userId: dealer.user!.id, platformRole: "USER", tenantIds: [angkorId] }, record!)).toBe(true);
    expect(canViewReport({ userId: support.user!.id, platformRole: "PLATFORM_SUPPORT" }, record!)).toBe(true);
    expect(canViewReport(null, record!)).toBe(false);
  });

  it("denies an unrelated user the report dispute endpoint", async () => {
    const rows = await db
      .select({ publicId: reportRequests.publicId })
      .from(reportRequests)
      .where(eq(reportRequests.requestedById, buyer.user!.id))
      .limit(1);
    mockUser(owner2);
    const res = await reportDispute(
      jsonRequest("http://localhost/api/reports/x/dispute", "POST", { reason: "INCORRECT_INFO", details: "Should not be allowed." }),
      { params: Promise.resolve({ publicId: rows[0]!.publicId }) },
    );
    expect(res.status).toBe(403);
  });
});

describe("documents", () => {
  it("denies a private document to a member of another tenant", async () => {
    mockUser(owner2);
    const res = await documentGet(new NextRequest(`http://localhost/api/documents/${cx5DocumentId}`), {
      params: Promise.resolve({ id: cx5DocumentId }),
    });
    expect(res.status).toBe(403);
  });

  it("allows the owning dealership to open the document", async () => {
    mockUser(dealer);
    const res = await documentGet(new NextRequest(`http://localhost/api/documents/${cx5DocumentId}`), {
      params: Promise.resolve({ id: cx5DocumentId }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/pdf");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });
});

describe("suspended tenants", () => {
  it("hides published listings belonging to a suspended tenant", async () => {
    const hiddenProbe = await createProbeListing(mekongId, "Suspensionprobe");
    const visibleProbe = await createProbeListing(hubId, "Controlprobe");

    const hidden = await searchListings({ ...EMPTY_FILTERS, q: "Suspensionprobe" });
    const visible = await searchListings({ ...EMPTY_FILTERS, q: "Controlprobe" });

    expect(hidden.total).toBe(0);
    expect(hidden.items.map((i) => i.id)).not.toContain(hiddenProbe);
    expect(visible.total).toBe(1);
    expect(visible.items[0]?.id).toBe(visibleProbe);
  });
});

describe("API route guards", () => {
  it("rejects a sales agent trying to edit dealership settings", async () => {
    mockUser(sales);
    const res = await tenantSettingsPatch(
      jsonRequest("http://localhost/api/tenant/settings", "PATCH", {
        tenantId: angkorId,
        name: "Hijacked Dealership",
        province: "Phnom Penh",
      }),
    );
    expect(res.status).toBe(403);
  });

  it("ignores a spoofed tenantId from another dealership owner", async () => {
    const before = await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, angkorId)).limit(1);
    mockUser(owner2);
    const res = await tenantSettingsPatch(
      jsonRequest("http://localhost/api/tenant/settings", "PATCH", {
        tenantId: angkorId,
        name: "Cross Tenant Rename",
        province: "Phnom Penh",
      }),
    );
    expect(res.status).toBe(403);
    const after = await db.select({ name: tenants.name }).from(tenants).where(eq(tenants.id, angkorId)).limit(1);
    expect(after[0]!.name).toBe(before[0]!.name);
  });

  it("denies cross-tenant listing reads", async () => {
    mockUser(owner2);
    const res = await listingGet(new NextRequest(`http://localhost/api/listings/${angkorListingId}`), {
      params: Promise.resolve({ id: angkorListingId }),
    });
    expect(res.status).toBe(403);
  });

  it("does not let platform support change platform roles", async () => {
    mockUser(support);
    const res = await adminUserPatch(
      jsonRequest("http://localhost/api/admin/users/x", "PATCH", { action: "SET_ROLE", role: "SUPER_ADMIN" }),
      { params: Promise.resolve({ id: buyer.user!.id }) },
    );
    expect(res.status).toBe(403);
  });

  it("blocks a super admin from changing their own platform role", async () => {
    mockUser(admin);
    const res = await adminUserPatch(
      jsonRequest("http://localhost/api/admin/users/x", "PATCH", { action: "SET_ROLE", role: "USER" }),
      { params: Promise.resolve({ id: admin.user!.id }) },
    );
    expect(res.status).toBe(409);
  });

  it("rejects an invitation accepted by the wrong email", async () => {
    const rows = await db
      .select({ token: tenantInvitations.token })
      .from(tenantInvitations)
      .where(eq(tenantInvitations.email, newhire.user!.email))
      .limit(1);
    mockUser(buyer);
    const res = await acceptInvite(new NextRequest("http://localhost/api/invitations/x/accept", { method: "POST" }), {
      params: Promise.resolve({ token: rows[0]!.token }),
    });
    expect(res.status).toBe(403);
    const membership = await db
      .select({ id: tenantMemberships.id })
      .from(tenantMemberships)
      .where(and(eq(tenantMemberships.userId, buyer.user!.id), eq(tenantMemberships.tenantId, angkorId)))
      .limit(1);
    expect(membership).toHaveLength(0);
  });
});
