import { and, asc, desc, eq, gte, inArray, isNull, lte, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  favorites,
  listings,
  reportRequests,
  tenants,
  users,
  vehicleDocuments,
  vehicleImages,
  vehicles,
} from "@/db/schema";
import { MAX_COMPARE, PROVINCES } from "./constants";
import { newId, slugify } from "./ids";

export type SearchFilters = {
  q: string;
  make: string;
  model: string;
  province: string;
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxYear: number | null;
  maxMileage: number | null;
  fuel: string;
  transmission: string;
  bodyType: string;
  sellerType: "all" | "private" | "dealer";
  verifiedOnly: boolean;
  sort: string;
  page: number;
  pageSize: number;
};

export const EMPTY_FILTERS: SearchFilters = {
  q: "",
  make: "",
  model: "",
  province: "",
  minPrice: null,
  maxPrice: null,
  minYear: null,
  maxYear: null,
  maxMileage: null,
  fuel: "",
  transmission: "",
  bodyType: "",
  sellerType: "all",
  verifiedOnly: false,
  sort: "relevance",
  page: 1,
  pageSize: 12,
};

function num(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseSearchParams(sp: URLSearchParams): SearchFilters {
  const sort = sp.get("sort") ?? "relevance";
  const sellerType = sp.get("sellerType");
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const pageSize = Math.min(48, Math.max(1, Number(sp.get("pageSize") ?? 12) || 12));
  return {
    q: (sp.get("q") ?? "").trim().slice(0, 120),
    make: (sp.get("make") ?? "").trim().slice(0, 60),
    model: (sp.get("model") ?? "").trim().slice(0, 60),
    province: (sp.get("province") ?? "").trim().slice(0, 60),
    minPrice: num(sp.get("minPrice")),
    maxPrice: num(sp.get("maxPrice")),
    minYear: num(sp.get("minYear")),
    maxYear: num(sp.get("maxYear")),
    maxMileage: num(sp.get("maxMileage")),
    fuel: (sp.get("fuel") ?? "").trim(),
    transmission: (sp.get("transmission") ?? "").trim(),
    bodyType: (sp.get("bodyType") ?? "").trim(),
    sellerType: sellerType === "private" || sellerType === "dealer" ? sellerType : "all",
    verifiedOnly: sp.get("verifiedOnly") === "1",
    sort: ["relevance", "newest", "price_asc", "price_desc", "mileage_asc", "year_desc"].includes(sort)
      ? sort
      : "relevance",
    page,
    pageSize,
  };
}

export function filtersToQueryString(f: SearchFilters, overrides: Record<string, string | number | undefined> = {}): string {
  const params = new URLSearchParams();
  const entries: [string, string | number | boolean | null][] = [
    ["q", f.q], ["make", f.make], ["model", f.model], ["province", f.province],
    ["minPrice", f.minPrice], ["maxPrice", f.maxPrice], ["minYear", f.minYear],
    ["maxYear", f.maxYear], ["maxMileage", f.maxMileage], ["fuel", f.fuel],
    ["transmission", f.transmission], ["bodyType", f.bodyType],
    ["sellerType", f.sellerType === "all" ? "" : f.sellerType],
    ["verifiedOnly", f.verifiedOnly ? "1" : ""],
    ["sort", f.sort === "relevance" ? "" : f.sort],
    ["page", f.page > 1 ? f.page : ""],
  ];
  for (const [k, v] of entries) {
    if (v !== "" && v !== null && v !== undefined) params.set(k, String(v));
  }
  for (const [k, v] of Object.entries(overrides)) {
    if (v === "" || v === undefined) params.delete(k);
    else params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `?${s}` : "";
}

export type ListingCard = {
  id: string;
  slug: string;
  priceUsd: number;
  province: string;
  status: string;
  featured: boolean;
  publishedAt: Date | null;
  make: string;
  model: string;
  variant: string | null;
  year: number;
  mileageKm: number;
  transmission: string;
  fuelType: string;
  bodyType: string;
  image: string | null;
  imageCount: number;
  sellerName: string;
  sellerType: "dealer" | "private";
  tenantName: string | null;
  tenantSlug: string | null;
  tenantVerified: boolean;
  inspectionAvailable: boolean;
  ownershipDocStatus: string;
  hasVerifiedDoc: boolean;
};

function publishedCondition(): SQL {
  const now = new Date();
  return and(
    eq(listings.status, "PUBLISHED"),
    or(sql`${listings.expiresAt} IS NULL`, gte(listings.expiresAt, now))!,
  )!;
}

/**
 * Public visibility additionally requires an active tenant. Suspending a
 * dealership hides its cars from search, facets and detail pages without
 * deleting any data.
 */
function activeListingCondition(): SQL {
  return and(
    publishedCondition(),
    or(isNull(listings.tenantId), eq(tenants.status, "ACTIVE"))!,
  )!;
}

export async function searchListings(filters: SearchFilters): Promise<{
  items: ListingCard[];
  total: number;
  facets: { makes: { name: string; count: number }[]; provinces: { name: string; count: number }[] };
}> {
  const conds: SQL[] = [activeListingCondition()];

  if (filters.q) {
    const term = `%${filters.q.toLowerCase()}%`;
    conds.push(
      or(
        sql`lower(${vehicles.make}) like ${term}`,
        sql`lower(${vehicles.model}) like ${term}`,
        sql`lower(${vehicles.variant}) like ${term}`,
        sql`lower(${listings.descriptionEn}) like ${term}`,
        sql`lower(coalesce(${listings.descriptionKm}, '')) like ${term}`,
        sql`lower(coalesce(${tenants.name}, '')) like ${term}`,
      )!,
    );
  }
  if (filters.make) conds.push(eq(vehicles.make, filters.make));
  if (filters.model) conds.push(sql`lower(${vehicles.model}) = ${filters.model.toLowerCase()}`);
  if (filters.province) conds.push(eq(listings.province, filters.province));
  if (filters.minPrice != null) conds.push(gte(listings.priceUsd, filters.minPrice));
  if (filters.maxPrice != null) conds.push(lte(listings.priceUsd, filters.maxPrice));
  if (filters.minYear != null) conds.push(gte(vehicles.year, filters.minYear));
  if (filters.maxYear != null) conds.push(lte(vehicles.year, filters.maxYear));
  if (filters.maxMileage != null) conds.push(lte(vehicles.mileageKm, filters.maxMileage));
  if (filters.fuel) conds.push(eq(vehicles.fuelType, filters.fuel));
  if (filters.transmission) conds.push(eq(vehicles.transmission, filters.transmission));
  if (filters.bodyType) conds.push(eq(vehicles.bodyType, filters.bodyType));
  if (filters.sellerType === "dealer") conds.push(sql`${listings.tenantId} IS NOT NULL`);
  if (filters.sellerType === "private") conds.push(sql`${listings.tenantId} IS NULL`);
  if (filters.verifiedOnly) {
    conds.push(
      or(
        eq(tenants.verificationStatus, "VERIFIED"),
        sql`exists (select 1 from vehicle_documents d where d.vehicle_id = ${listings.vehicleId} and d.status = 'VERIFIED')`,
      )!,
    );
  }

  const where = and(...conds)!;
  const orderBy = (() => {
    switch (filters.sort) {
      case "price_asc": return [asc(listings.priceUsd)];
      case "price_desc": return [desc(listings.priceUsd)];
      case "mileage_asc": return [asc(vehicles.mileageKm)];
      case "year_desc": return [desc(vehicles.year)];
      case "newest": return [desc(listings.publishedAt)];
      default: return [
        sql`case when ${listings.featuredUntil} > ${new Date()} then 0 else 1 end`,
        desc(listings.publishedAt),
      ];
    }
  })();

  const base = db
    .select({
      id: listings.id,
      slug: listings.slug,
      priceUsd: listings.priceUsd,
      province: listings.province,
      status: listings.status,
      featuredUntil: listings.featuredUntil,
      publishedAt: listings.publishedAt,
      make: vehicles.make,
      model: vehicles.model,
      variant: vehicles.variant,
      year: vehicles.year,
      mileageKm: vehicles.mileageKm,
      transmission: vehicles.transmission,
      fuelType: vehicles.fuelType,
      bodyType: vehicles.bodyType,
      vehicleId: vehicles.id,
      sellerName: users.name,
      tenantId: listings.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantVerified: tenants.verificationStatus,
      inspectionAvailable: listings.inspectionAvailable,
      ownershipDocStatus: listings.ownershipDocStatus,
      hasVerifiedDoc: sql<number>`exists (select 1 from vehicle_documents d where d.vehicle_id = ${listings.vehicleId} and d.status = 'VERIFIED')`,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .leftJoin(tenants, eq(tenants.id, listings.tenantId));

  const [rows, countRows] = await Promise.all([
    base.where(where).orderBy(...orderBy).limit(filters.pageSize).offset((filters.page - 1) * filters.pageSize),
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .leftJoin(tenants, eq(tenants.id, listings.tenantId))
      .where(where),
  ]);

  const vehicleIds = rows.map((r) => r.vehicleId);
  const images = vehicleIds.length
    ? await db
        .select({ vehicleId: vehicleImages.vehicleId, url: vehicleImages.url, position: vehicleImages.position })
        .from(vehicleImages)
        .where(inArray(vehicleImages.vehicleId, vehicleIds))
        .orderBy(asc(vehicleImages.position))
    : [];
  const byVehicle = new Map<string, { first: string; count: number }>();
  for (const img of images) {
    const entry = byVehicle.get(img.vehicleId);
    if (entry) entry.count += 1;
    else byVehicle.set(img.vehicleId, { first: img.url, count: 1 });
  }

  const facetMakes = await db
    .select({ name: vehicles.make, count: sql<number>`count(*)` })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .leftJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(activeListingCondition())
    .groupBy(vehicles.make)
    .orderBy(desc(sql`count(*)`));
  const facetProvinces = await db
    .select({ name: listings.province, count: sql<number>`count(*)` })
    .from(listings)
    .leftJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(activeListingCondition())
    .groupBy(listings.province)
    .orderBy(desc(sql`count(*)`));

  return {
    items: rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      priceUsd: r.priceUsd,
      province: r.province,
      status: r.status,
      featured: Boolean(r.featuredUntil && r.featuredUntil > new Date()),
      publishedAt: r.publishedAt,
      make: r.make,
      model: r.model,
      variant: r.variant,
      year: r.year,
      mileageKm: r.mileageKm,
      transmission: r.transmission,
      fuelType: r.fuelType,
      bodyType: r.bodyType,
      image: byVehicle.get(r.vehicleId)?.first ?? null,
      imageCount: byVehicle.get(r.vehicleId)?.count ?? 0,
      sellerName: r.sellerName,
      sellerType: r.tenantId ? "dealer" : "private",
      tenantName: r.tenantName,
      tenantSlug: r.tenantSlug,
      tenantVerified: r.tenantVerified === "VERIFIED",
      inspectionAvailable: r.inspectionAvailable,
      ownershipDocStatus: r.ownershipDocStatus,
      hasVerifiedDoc: Number(r.hasVerifiedDoc) > 0,
    })),
    total: Number(countRows[0]?.count ?? 0),
    facets: {
      makes: facetMakes.map((m) => ({ name: m.name, count: Number(m.count) })),
      provinces: facetProvinces.map((p) => ({ name: p.name, count: Number(p.count) })),
    },
  };
}

export type ListingDetail = Awaited<ReturnType<typeof getListingBySlug>>;

export async function getListingBySlug(slug: string) {
  const rows = await db
    .select({
      listing: listings,
      vehicle: vehicles,
      seller: {
        id: users.id,
        name: users.name,
        createdAt: users.createdAt,
        phoneVerifiedAt: users.phoneVerifiedAt,
        emailVerifiedAt: users.emailVerifiedAt,
      },
      tenant: tenants,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .leftJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(eq(listings.slug, slug))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const [images, docs, verifiedReports] = await Promise.all([
    db
      .select()
      .from(vehicleImages)
      .where(eq(vehicleImages.vehicleId, row.vehicle.id))
      .orderBy(asc(vehicleImages.position)),
    db
      .select({
        id: vehicleDocuments.id,
        type: vehicleDocuments.type,
        status: vehicleDocuments.status,
        verifiedAt: vehicleDocuments.verifiedAt,
      })
      .from(vehicleDocuments)
      .where(and(eq(vehicleDocuments.vehicleId, row.vehicle.id), eq(vehicleDocuments.status, "VERIFIED"))),
    db
      .select({
        id: reportRequests.id,
        publicId: reportRequests.publicId,
        status: reportRequests.status,
        completedAt: reportRequests.completedAt,
      })
      .from(reportRequests)
      .where(and(eq(reportRequests.vehicleId, row.vehicle.id), inArray(reportRequests.status, ["READY", "NEEDS_REVIEW"])))
      .orderBy(desc(reportRequests.requestedAt))
      .limit(1),
  ]);

  return { ...row, images, docs, report: verifiedReports[0] ?? null };
}

export async function incrementView(listingId: string): Promise<void> {
  await db
    .update(listings)
    .set({ viewCount: sql`${listings.viewCount} + 1` })
    .where(eq(listings.id, listingId));
}

/** Lazily expire listings so search never shows stale cars. */
export async function expireListings(): Promise<void> {
  const now = new Date();
  await db
    .update(listings)
    .set({ status: "ARCHIVED" })
    .where(and(eq(listings.status, "PUBLISHED"), lte(listings.expiresAt, now)));
}

// ------------------------------------------------------------- moderation heuristics

export type FlagCode =
  | "DUPLICATE_VIN"
  | "DUPLICATE_PLATE"
  | "POSSIBLE_DUPLICATE_LISTING"
  | "PRICE_OUT_OF_RANGE"
  | "PHOTOS_MISSING"
  | "CONTACT_INFO_IN_DESCRIPTION"
  | "DEPOSIT_REQUESTED"
  | "MILEAGE_IMPLAUSIBLE"
  | "NEW_ACCOUNT";

export type Flag = { code: FlagCode; severity: "INFO" | "WARNING" | "CRITICAL"; detail?: string };

const CONTACT_PATTERNS = [
  /\b0\d{2}[\s.-]?\d{3}[\s.-]?\d{3}\b/,
  /(?:\+855|855)\d{7,10}/,
  /t\.me\//i,
  /telegram/i,
  /@[a-z0-9_]{4,}/i,
];
const DEPOSIT_PATTERNS = [/\bdeposit\b/i, /advance payment/i, /pay first/i, /aba\s*:?\s*\d/i, /wing\s*:?\s*\d/i];

export function computeModerationFlags(input: {
  description: string;
  priceUsd: number;
  imageCount: number;
  mileageKm: number;
  year: number;
  sellerCreatedAt: Date;
  duplicateVin?: boolean;
  duplicatePlate?: boolean;
  similarListing?: boolean;
  marketMedian?: number | null;
}): Flag[] {
  const flags: Flag[] = [];
  if (input.duplicateVin) flags.push({ code: "DUPLICATE_VIN", severity: "CRITICAL", detail: "Same VIN is already used on another active listing." });
  if (input.duplicatePlate) flags.push({ code: "DUPLICATE_PLATE", severity: "WARNING", detail: "Same plate number appears on another active listing." });
  if (input.similarListing) flags.push({ code: "POSSIBLE_DUPLICATE_LISTING", severity: "WARNING", detail: "Same seller has a very similar active listing." });
  if (input.imageCount === 0) flags.push({ code: "PHOTOS_MISSING", severity: "WARNING" });
  if (CONTACT_PATTERNS.some((p) => p.test(input.description))) flags.push({ code: "CONTACT_INFO_IN_DESCRIPTION", severity: "WARNING", detail: "Phone, Telegram or social handle in the description." });
  if (DEPOSIT_PATTERNS.some((p) => p.test(input.description))) flags.push({ code: "DEPOSIT_REQUESTED", severity: "CRITICAL" });
  const age = Math.max(1, new Date().getFullYear() - input.year);
  if (input.mileageKm / age < 2500 && input.year < new Date().getFullYear() - 2) flags.push({ code: "MILEAGE_IMPLAUSIBLE", severity: "WARNING", detail: "Very low mileage for its age." });
  if (input.marketMedian && input.priceUsd < input.marketMedian * 0.6) flags.push({ code: "PRICE_OUT_OF_RANGE", severity: "WARNING", detail: "Price is far below comparable listings." });
  if (Date.now() - input.sellerCreatedAt.getTime() < 1000 * 60 * 60 * 24) flags.push({ code: "NEW_ACCOUNT", severity: "INFO" });
  return flags;
}

export async function detectDuplicates(input: {
  vehicleId?: string;
  vin?: string | null;
  plate?: string | null;
  sellerId: string;
  make: string;
  model: string;
  year: number;
}) {
  const [vinRows, plateRows, similarRows] = await Promise.all([
    input.vin
      ? db
          .select({ id: listings.id })
          .from(listings)
          .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
          .where(and(eq(vehicles.vin, input.vin), ne(listings.status, "ARCHIVED"), ...(input.vehicleId ? [ne(vehicles.id, input.vehicleId)] : [])))
          .limit(1)
      : Promise.resolve([]),
    input.plate
      ? db
          .select({ id: listings.id })
          .from(listings)
          .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
          .where(and(eq(vehicles.plateNumber, input.plate), ne(listings.status, "ARCHIVED"), ...(input.vehicleId ? [ne(vehicles.id, input.vehicleId)] : [])))
          .limit(1)
      : Promise.resolve([]),
    db
      .select({ id: listings.id })
      .from(listings)
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(
        and(
          eq(listings.sellerId, input.sellerId),
          eq(vehicles.make, input.make),
          eq(vehicles.model, input.model),
          eq(vehicles.year, input.year),
          inArray(listings.status, ["PENDING", "PUBLISHED"]),
          ...(input.vehicleId ? [ne(vehicles.id, input.vehicleId)] : []),
        ),
      )
      .limit(1),
  ]);
  return {
    duplicateVin: vinRows.length > 0,
    duplicatePlate: plateRows.length > 0,
    similarListing: similarRows.length > 0,
  };
}

export async function marketMedian(make: string, model: string, year: number): Promise<{ median: number | null; sample: number }> {
  const rows = await db
    .select({ priceUsd: listings.priceUsd })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .where(
      and(
        eq(vehicles.make, make),
        eq(vehicles.model, model),
        gte(vehicles.year, year - 1),
        lte(vehicles.year, year + 1),
        eq(listings.status, "PUBLISHED"),
      ),
    );
  const prices = rows.map((r) => r.priceUsd).sort((a, b) => a - b);
  if (prices.length < 3) return { median: null, sample: prices.length };
  const mid = Math.floor(prices.length / 2);
  const median = prices.length % 2 ? prices[mid] : Math.round((prices[mid - 1] + prices[mid]) / 2);
  return { median, sample: prices.length };
}

export async function uniqueSlug(base: string): Promise<string> {
  const root = slugify(base) || `car-${Date.now()}`;
  for (let i = 0; i < 20; i += 1) {
    const candidate = i === 0 ? root : `${root}-${i + 1}`;
    const exists = await db.select({ id: listings.id }).from(listings).where(eq(listings.slug, candidate)).limit(1);
    if (!exists.length) return candidate;
  }
  return `${root}-${newId("x").slice(2, 8)}`;
}

export async function getComparableListings(ids: string[]): Promise<ListingCard[]> {
  const clean = ids.filter(Boolean).slice(0, MAX_COMPARE);
  if (!clean.length) return [];
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      priceUsd: listings.priceUsd,
      province: listings.province,
      status: listings.status,
      featuredUntil: listings.featuredUntil,
      publishedAt: listings.publishedAt,
      make: vehicles.make,
      model: vehicles.model,
      variant: vehicles.variant,
      year: vehicles.year,
      mileageKm: vehicles.mileageKm,
      transmission: vehicles.transmission,
      fuelType: vehicles.fuelType,
      bodyType: vehicles.bodyType,
      vehicleId: vehicles.id,
      sellerName: users.name,
      tenantId: listings.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantVerified: tenants.verificationStatus,
      inspectionAvailable: listings.inspectionAvailable,
      ownershipDocStatus: listings.ownershipDocStatus,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .leftJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(and(inArray(listings.id, clean), or(isNull(listings.tenantId), eq(tenants.status, "ACTIVE"))!));

  const images = await db
    .select({ vehicleId: vehicleImages.vehicleId, url: vehicleImages.url })
    .from(vehicleImages)
    .where(inArray(vehicleImages.vehicleId, rows.map((r) => r.vehicleId)))
    .orderBy(asc(vehicleImages.position));
  const first = new Map<string, string>();
  for (const img of images) if (!first.has(img.vehicleId)) first.set(img.vehicleId, img.url);

  return clean
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r))
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      priceUsd: r.priceUsd,
      province: r.province,
      status: r.status,
      featured: Boolean(r.featuredUntil && r.featuredUntil > new Date()),
      publishedAt: r.publishedAt,
      make: r.make,
      model: r.model,
      variant: r.variant,
      year: r.year,
      mileageKm: r.mileageKm,
      transmission: r.transmission,
      fuelType: r.fuelType,
      bodyType: r.bodyType,
      image: first.get(r.vehicleId) ?? null,
      imageCount: images.filter((i) => i.vehicleId === r.vehicleId).length,
      sellerName: r.sellerName,
      sellerType: r.tenantId ? "dealer" : "private",
      tenantName: r.tenantName,
      tenantSlug: r.tenantSlug,
      tenantVerified: r.tenantVerified === "VERIFIED",
      inspectionAvailable: r.inspectionAvailable,
      ownershipDocStatus: r.ownershipDocStatus,
      hasVerifiedDoc: false,
    }));
}

export async function getFavorites(userId: string, listingIds?: string[]) {
  return db
    .select({ listingId: favorites.listingId })
    .from(favorites)
    .where(and(eq(favorites.userId, userId), ...(listingIds?.length ? [inArray(favorites.listingId, listingIds)] : [])));
}

export function validProvince(value: string): boolean {
  return (PROVINCES as readonly string[]).includes(value);
}

/** Published inventory for one dealership storefront. */
export async function getListingsForTenant(tenantId: string, limit = 24): Promise<ListingCard[]> {
  const rows = await db
    .select({
      id: listings.id,
      slug: listings.slug,
      priceUsd: listings.priceUsd,
      province: listings.province,
      status: listings.status,
      featuredUntil: listings.featuredUntil,
      publishedAt: listings.publishedAt,
      make: vehicles.make,
      model: vehicles.model,
      variant: vehicles.variant,
      year: vehicles.year,
      mileageKm: vehicles.mileageKm,
      transmission: vehicles.transmission,
      fuelType: vehicles.fuelType,
      bodyType: vehicles.bodyType,
      vehicleId: vehicles.id,
      sellerName: users.name,
      tenantId: listings.tenantId,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantVerified: tenants.verificationStatus,
      inspectionAvailable: listings.inspectionAvailable,
      ownershipDocStatus: listings.ownershipDocStatus,
      hasVerifiedDoc: sql<number>`exists (select 1 from vehicle_documents d where d.vehicle_id = ${listings.vehicleId} and d.status = 'VERIFIED')`,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .innerJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(and(eq(listings.tenantId, tenantId), eq(listings.status, "PUBLISHED")))
    .orderBy(desc(listings.publishedAt))
    .limit(limit);

  const images = rows.length
    ? await db
        .select({ vehicleId: vehicleImages.vehicleId, url: vehicleImages.url, position: vehicleImages.position })
        .from(vehicleImages)
        .where(inArray(vehicleImages.vehicleId, rows.map((r) => r.vehicleId)))
        .orderBy(asc(vehicleImages.position))
    : [];
  const byVehicle = new Map<string, { first: string; count: number }>();
  for (const img of images) {
    const entry = byVehicle.get(img.vehicleId);
    if (entry) entry.count += 1;
    else byVehicle.set(img.vehicleId, { first: img.url, count: 1 });
  }

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    priceUsd: r.priceUsd,
    province: r.province,
    status: r.status,
    featured: Boolean(r.featuredUntil && r.featuredUntil > new Date()),
    publishedAt: r.publishedAt,
    make: r.make,
    model: r.model,
    variant: r.variant,
    year: r.year,
    mileageKm: r.mileageKm,
    transmission: r.transmission,
    fuelType: r.fuelType,
    bodyType: r.bodyType,
    image: byVehicle.get(r.vehicleId)?.first ?? null,
    imageCount: byVehicle.get(r.vehicleId)?.count ?? 0,
    sellerName: r.sellerName,
    sellerType: "dealer",
    tenantName: r.tenantName,
    tenantSlug: r.tenantSlug,
    tenantVerified: r.tenantVerified === "VERIFIED",
    inspectionAvailable: r.inspectionAvailable,
    ownershipDocStatus: r.ownershipDocStatus,
    hasVerifiedDoc: Number(r.hasVerifiedDoc) > 0,
  }));
}
