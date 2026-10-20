import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch() * 1000)`;

/** Platform identity */
export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    phone: text("phone"),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    locale: text("locale").notNull().default("en"),
    avatarUrl: text("avatar_url"),
    // USER | SUPER_ADMIN | PLATFORM_SUPPORT
    platformRole: text("platform_role").notNull().default("USER"),
    // ACTIVE | SUSPENDED | PENDING_DELETION
    status: text("status").notNull().default("ACTIVE"),
    emailVerifiedAt: integer("email_verified_at", { mode: "timestamp_ms" }),
    phoneVerifiedAt: integer("phone_verified_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email), index("users_role_idx").on(t.platformRole)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    revokedAt: integer("revoked_at", { mode: "timestamp_ms" }),
    ip: text("ip"),
    userAgent: text("user_agent"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("sessions_token_uq").on(t.tokenHash),
    index("sessions_user_idx").on(t.userId),
  ],
);

/** Dealership tenant */
export const tenants = sqliteTable(
  "tenants",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    legalName: text("legal_name"),
    type: text("type").notNull().default("DEALER"),
    logoUrl: text("logo_url"),
    coverUrl: text("cover_url"),
    descriptionEn: text("description_en"),
    descriptionKm: text("description_km"),
    phone: text("phone"),
    email: text("email"),
    website: text("website"),
    addressLine: text("address_line"),
    province: text("province").notNull().default("Phnom Penh"),
    // NONE | PENDING | VERIFIED | REJECTED
    verificationStatus: text("verification_status").notNull().default("NONE"),
    verificationNote: text("verification_note"),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
    // ACTIVE | SUSPENDED | ARCHIVED
    status: text("status").notNull().default("ACTIVE"),
    suspendedAt: integer("suspended_at", { mode: "timestamp_ms" }),
    suspensionReason: text("suspension_reason"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [uniqueIndex("tenants_slug_uq").on(t.slug), index("tenants_status_idx").on(t.status)],
);

export const tenantMemberships = sqliteTable(
  "tenant_memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    // TENANT_OWNER | TENANT_ADMIN | INVENTORY_MANAGER | SALES_AGENT
    role: text("role").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("membership_user_tenant_uq").on(t.userId, t.tenantId),
    index("membership_tenant_role_idx").on(t.tenantId, t.role),
  ],
);

export const tenantInvitations = sqliteTable(
  "tenant_invitations",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: text("role").notNull(),
    token: text("token").notNull(),
    invitedById: text("invited_by_id").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    acceptedAt: integer("accepted_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("invitation_token_uq").on(t.token),
    index("invitation_tenant_email_idx").on(t.tenantId, t.email),
  ],
);

export const plans = sqliteTable("plans", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  priceUsd: integer("price_usd").notNull().default(0),
  listingQuota: integer("listing_quota").notNull().default(5),
  featuredQuota: integer("featured_quota").notNull().default(0),
  featuresJson: text("features_json").notNull().default("[]"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
});

export const tenantSubscriptions = sqliteTable(
  "tenant_subscriptions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    planCode: text("plan_code").notNull(),
    // TRIALING | ACTIVE | PAST_DUE | CANCELED
    status: text("status").notNull().default("TRIALING"),
    currentPeriodStart: integer("current_period_start", { mode: "timestamp_ms" })
      .notNull()
      .default(now),
    currentPeriodEnd: integer("current_period_end", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [index("subscription_tenant_idx").on(t.tenantId, t.status)],
);

/** Vehicle inventory */
export const vehicles = sqliteTable(
  "vehicles",
  {
    id: text("id").primaryKey(),
    make: text("make").notNull(),
    model: text("model").notNull(),
    variant: text("variant"),
    year: integer("year").notNull(),
    registrationYear: integer("registration_year"),
    mileageKm: integer("mileage_km").notNull(),
    transmission: text("transmission").notNull(),
    fuelType: text("fuel_type").notNull(),
    engineCc: integer("engine_cc"),
    drivetrain: text("drivetrain"),
    bodyType: text("body_type").notNull(),
    exteriorColor: text("exterior_color"),
    interiorColor: text("interior_color"),
    seats: integer("seats"),
    vin: text("vin"),
    chassisNumber: text("chassis_number"),
    engineNumber: text("engine_number"),
    plateNumber: text("plate_number"),
    importCountry: text("import_country"),
    // MISSING | PROVIDED | INVALID
    vinStatus: text("vin_status").notNull().default("MISSING"),
    accidentClaim: text("accident_claim"),
    maintenanceClaim: text("maintenance_claim"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    index("vehicles_make_model_idx").on(t.make, t.model, t.year),
    index("vehicles_vin_idx").on(t.vin),
    index("vehicles_plate_idx").on(t.plateNumber),
  ],
);

export const vehicleImages = sqliteTable(
  "vehicle_images",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    alt: text("alt"),
    position: integer("position").notNull().default(0),
    hash: text("hash"),
    width: integer("width"),
    height: integer("height"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [index("images_vehicle_idx").on(t.vehicleId, t.position), index("images_hash_idx").on(t.hash)],
);

export const vehicleDocuments = sqliteTable(
  "vehicle_documents",
  {
    id: text("id").primaryKey(),
    vehicleId: text("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    // REGISTRATION | IMPORT_DECLARATION | OWNERSHIP_TRANSFER | SERVICE_RECORD | INSPECTION_REPORT | OTHER
    type: text("type").notNull(),
    // PENDING | VERIFIED | REJECTED
    status: text("status").notNull().default("PENDING"),
    fileUrl: text("file_url"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    fileSize: integer("file_size"),
    hash: text("hash"),
    extractedJson: text("extracted_json"),
    visibility: text("visibility").notNull().default("PRIVATE"),
    note: text("note"),
    uploadedById: text("uploaded_by_id"),
    uploadedAt: integer("uploaded_at", { mode: "timestamp_ms" }).notNull().default(now),
    verifiedById: text("verified_by_id"),
    verifiedAt: integer("verified_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("documents_vehicle_idx").on(t.vehicleId, t.type)],
);

export const listings = sqliteTable(
  "listings",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull(),
    vehicleId: text("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    sellerId: text("seller_id").notNull().references(() => users.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    priceUsd: integer("price_usd").notNull(),
    priceKhr: integer("price_khr"),
    negotiable: integer("negotiable", { mode: "boolean" }).notNull().default(true),
    currencyNote: text("currency_note"),
    // DRAFT | PENDING | PUBLISHED | REJECTED | SOLD | ARCHIVED
    status: text("status").notNull().default("DRAFT"),
    condition: text("condition").notNull().default("USED"),
    province: text("province").notNull(),
    district: text("district"),
    descriptionEn: text("description_en").notNull(),
    descriptionKm: text("description_km"),
    // ORIGINAL_AVAILABLE | COPY_ONLY | NOT_PROVIDED
    ownershipDocStatus: text("ownership_doc_status").notNull().default("NOT_PROVIDED"),
    importDocStatus: text("import_doc_status").notNull().default("NOT_PROVIDED"),
    inspectionAvailable: integer("inspection_available", { mode: "boolean" })
      .notNull()
      .default(false),
    inspectionNote: text("inspection_note"),
    featuredUntil: integer("featured_until", { mode: "timestamp_ms" }),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    soldAt: integer("sold_at", { mode: "timestamp_ms" }),
    rejectionReason: text("rejection_reason"),
    moderationFlags: text("moderation_flags").notNull().default("[]"),
    viewCount: integer("view_count").notNull().default(0),
    contactCount: integer("contact_count").notNull().default(0),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("listings_slug_uq").on(t.slug),
    uniqueIndex("listings_vehicle_uq").on(t.vehicleId),
    index("listings_status_idx").on(t.status, t.publishedAt),
    index("listings_tenant_idx").on(t.tenantId, t.status),
    index("listings_seller_idx").on(t.sellerId, t.status),
    index("listings_price_idx").on(t.priceUsd),
  ],
);

/** Evidence-based AI reports */
export const reportRequests = sqliteTable(
  "report_requests",
  {
    id: text("id").primaryKey(),
    publicId: text("public_id").notNull(),
    vehicleId: text("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
    listingId: text("listing_id").references(() => listings.id),
    requestedById: text("requested_by_id"),
    // QUEUED | PROCESSING | READY | NEEDS_REVIEW | FAILED
    status: text("status").notNull().default("QUEUED"),
    provider: text("provider").notNull().default("rules-v1"),
    version: text("version").notNull().default("1.0.0"),
    confidence: integer("confidence"),
    riskLevel: text("risk_level"),
    summaryEn: text("summary_en"),
    summaryKm: text("summary_km"),
    limitationsEn: text("limitations_en"),
    limitationsKm: text("limitations_km"),
    priceUsd: integer("price_usd").notNull().default(0),
    requestedAt: integer("requested_at", { mode: "timestamp_ms" }).notNull().default(now),
    startedAt: integer("started_at", { mode: "timestamp_ms" }),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    reviewedById: text("reviewed_by_id"),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewerNote: text("reviewer_note"),
  },
  (t) => [
    uniqueIndex("reports_public_uq").on(t.publicId),
    index("reports_vehicle_idx").on(t.vehicleId, t.requestedAt),
    index("reports_status_idx").on(t.status),
  ],
);

export const reportFindings = sqliteTable(
  "report_findings",
  {
    id: text("id").primaryKey(),
    reportId: text("report_id").notNull().references(() => reportRequests.id, { onDelete: "cascade" }),
    // IDENTITY | REGISTRATION | DOCUMENTS | MILEAGE | HISTORY | PHOTOS | PRICE | INSPECTION
    category: text("category").notNull(),
    code: text("code").notNull(),
    // VERIFIED_BY_SOURCE | EVIDENCE_FOUND | POTENTIAL_INCONSISTENCY | NOT_VERIFIED | NO_DATA
    status: text("status").notNull(),
    // INFO | WARNING | CRITICAL
    severity: text("severity").notNull().default("INFO"),
    confidence: integer("confidence"),
    dataJson: text("data_json").notNull().default("{}"),
    sourceRef: text("source_ref"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("findings_report_idx").on(t.reportId, t.sortOrder)],
);

/** Marketplace communication + transactions */
export const conversations = sqliteTable(
  "conversations",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id").references(() => listings.id),
    buyerId: text("buyer_id").notNull().references(() => users.id),
    sellerId: text("seller_id").notNull().references(() => users.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    subject: text("subject"),
    status: text("status").notNull().default("OPEN"),
    lastMessageAt: integer("last_message_at", { mode: "timestamp_ms" }).notNull().default(now),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    index("conv_buyer_idx").on(t.buyerId, t.lastMessageAt),
    index("conv_seller_idx").on(t.sellerId, t.lastMessageAt),
    index("conv_tenant_idx").on(t.tenantId, t.lastMessageAt),
  ],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("sender_id").notNull().references(() => users.id),
    body: text("body").notNull(),
    kind: text("kind").notNull().default("TEXT"),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [index("messages_conv_idx").on(t.conversationId, t.createdAt)],
);

export const favorites = sqliteTable(
  "favorites",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    uniqueIndex("favorites_user_listing_uq").on(t.userId, t.listingId),
    index("favorites_listing_idx").on(t.listingId),
  ],
);

export const savedSearches = sqliteTable(
  "saved_searches",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    queryJson: text("query_json").notNull(),
    alertsEnabled: integer("alerts_enabled", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    lastNotifiedAt: integer("last_notified_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("saved_searches_user_idx").on(t.userId)],
);

export const appointments = sqliteTable(
  "appointments",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id").notNull().references(() => listings.id),
    buyerId: text("buyer_id").notNull().references(() => users.id),
    sellerId: text("seller_id").notNull().references(() => users.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    preferredAt: integer("preferred_at", { mode: "timestamp_ms" }).notNull(),
    location: text("location"),
    note: text("note"),
    // REQUESTED | CONFIRMED | DECLINED | COMPLETED | CANCELLED
    status: text("status").notNull().default("REQUESTED"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    index("appointments_seller_idx").on(t.sellerId, t.status),
    index("appointments_tenant_idx").on(t.tenantId, t.status),
    index("appointments_buyer_idx").on(t.buyerId, t.status),
  ],
);

export const offers = sqliteTable(
  "offers",
  {
    id: text("id").primaryKey(),
    listingId: text("listing_id").notNull().references(() => listings.id),
    buyerId: text("buyer_id").notNull().references(() => users.id),
    tenantId: text("tenant_id").references(() => tenants.id),
    amountUsd: integer("amount_usd").notNull(),
    message: text("message"),
    // PENDING | ACCEPTED | DECLINED | WITHDRAWN
    status: text("status").notNull().default("PENDING"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }),
  },
  (t) => [index("offers_listing_idx").on(t.listingId, t.status), index("offers_buyer_idx").on(t.buyerId)],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    titleKey: text("title_key").notNull(),
    dataJson: text("data_json").notNull().default("{}"),
    link: text("link"),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt, t.createdAt)],
);

export const reportedContent = sqliteTable(
  "reported_content",
  {
    id: text("id").primaryKey(),
    reporterId: text("reporter_id").notNull().references(() => users.id),
    // LISTING | USER | MESSAGE | REPORT
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    listingId: text("listing_id").references(() => listings.id),
    reason: text("reason").notNull(),
    details: text("details"),
    // OPEN | REVIEWING | RESOLVED | DISMISSED
    status: text("status").notNull().default("OPEN"),
    resolutionNote: text("resolution_note"),
    handledById: text("handled_by_id"),
    handledAt: integer("handled_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    index("reported_status_idx").on(t.status, t.createdAt),
    index("reported_target_idx").on(t.targetType, t.targetId),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id"),
    actorRole: text("actor_role"),
    tenantId: text("tenant_id"),
    action: text("action").notNull(),
    targetType: text("target_type"),
    targetId: text("target_id"),
    metadataJson: text("metadata_json").notNull().default("{}"),
    ip: text("ip"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().default(now),
  },
  (t) => [
    index("audit_created_idx").on(t.createdAt),
    index("audit_tenant_idx").on(t.tenantId, t.createdAt),
    index("audit_actor_idx").on(t.actorId, t.createdAt),
  ],
);
