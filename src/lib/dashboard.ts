import { and, desc, eq, gte, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  appointments,
  auditLogs,
  conversations,
  favorites,
  listings,
  messages,
  notifications,
  offers,
  plans,
  reportRequests,
  reportedContent,
  savedSearches,
  tenantMemberships,
  tenantSubscriptions,
  tenants,
  users,
  vehicleDocuments,
  vehicles,
} from "@/db/schema";

async function listingStatusCounts(scope: { sellerId?: string; tenantId?: string }) {
  const where = scope.tenantId
    ? eq(listings.tenantId, scope.tenantId)
    : and(eq(listings.sellerId, scope.sellerId ?? ""), isNull(listings.tenantId))!;
  const rows = await db
    .select({ status: listings.status, count: sql<number>`count(*)` })
    .from(listings)
    .where(where)
    .groupBy(listings.status);
  const map: Record<string, number> = { DRAFT: 0, PENDING: 0, PUBLISHED: 0, REJECTED: 0, SOLD: 0, ARCHIVED: 0 };
  for (const row of rows) map[row.status] = Number(row.count);
  return map;
}

export async function getTenantDashboard(tenantId: string) {
  const [status, engagement, teamCount, upcoming, planRow, recentLeads, inventory] = await Promise.all([
    listingStatusCounts({ tenantId }),
    db
      .select({
        views: sql<number>`coalesce(sum(${listings.viewCount}), 0)`,
        contacts: sql<number>`coalesce(sum(${listings.contactCount}), 0)`,
      })
      .from(listings)
      .where(eq(listings.tenantId, tenantId)),
    db.select({ count: sql<number>`count(*)` }).from(tenantMemberships).where(and(eq(tenantMemberships.tenantId, tenantId), eq(tenantMemberships.status, "ACTIVE"))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(eq(appointments.tenantId, tenantId), inArray(appointments.status, ["REQUESTED", "CONFIRMED"]), gte(appointments.preferredAt, new Date()))),
    db
      .select({ planCode: tenantSubscriptions.planCode, status: tenantSubscriptions.status, name: plans.name, quota: plans.listingQuota, priceUsd: plans.priceUsd })
      .from(tenantSubscriptions)
      .leftJoin(plans, eq(plans.code, tenantSubscriptions.planCode))
      .where(eq(tenantSubscriptions.tenantId, tenantId))
      .orderBy(desc(tenantSubscriptions.createdAt))
      .limit(1),
    db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        lastMessageAt: conversations.lastMessageAt,
        buyerName: users.name,
        listingSlug: listings.slug,
        unread: sql<number>`(select count(*) from messages m where m.conversation_id = ${conversations.id} and m.sender_id = ${conversations.buyerId} and m.read_at is null)`,
      })
      .from(conversations)
      .innerJoin(users, eq(users.id, conversations.buyerId))
      .leftJoin(listings, eq(listings.id, conversations.listingId))
      .where(eq(conversations.tenantId, tenantId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(6),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        status: listings.status,
        priceUsd: listings.priceUsd,
        views: listings.viewCount,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        saves: sql<number>`(select count(*) from favorites f where f.listing_id = ${listings.id})`,
      })
      .from(listings)
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(eq(listings.tenantId, tenantId))
      .orderBy(desc(listings.updatedAt))
      .limit(8),
  ]);

  const favoritesCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(favorites)
    .innerJoin(listings, eq(listings.id, favorites.listingId))
    .where(eq(listings.tenantId, tenantId));

  return {
    status,
    views: Number(engagement[0]?.views ?? 0),
    contacts: Number(engagement[0]?.contacts ?? 0),
    teamCount: Number(teamCount[0]?.count ?? 0),
    upcomingAppointments: Number(upcoming[0]?.count ?? 0),
    plan: planRow[0] ?? null,
    leads: recentLeads,
    inventory,
    favorites: Number(favoritesCount[0]?.count ?? 0),
    totalListings: Object.values(status).reduce((a, b) => a + b, 0),
  };
}

export async function getSellerDashboard(userId: string) {
  const status = await listingStatusCounts({ sellerId: userId });
  const [engagement, upcoming, recentLeads, inventory] = await Promise.all([
    db
      .select({
        views: sql<number>`coalesce(sum(${listings.viewCount}), 0)`,
        contacts: sql<number>`coalesce(sum(${listings.contactCount}), 0)`,
      })
      .from(listings)
      .where(and(eq(listings.sellerId, userId), isNull(listings.tenantId))),
    db
      .select({ count: sql<number>`count(*)` })
      .from(appointments)
      .where(and(eq(appointments.sellerId, userId), inArray(appointments.status, ["REQUESTED", "CONFIRMED"]))),
    db
      .select({
        id: conversations.id,
        subject: conversations.subject,
        lastMessageAt: conversations.lastMessageAt,
        buyerName: users.name,
        listingSlug: listings.slug,
        unread: sql<number>`(select count(*) from messages m where m.conversation_id = ${conversations.id} and m.sender_id = ${conversations.buyerId} and m.read_at is null)`,
      })
      .from(conversations)
      .innerJoin(users, eq(users.id, conversations.buyerId))
      .leftJoin(listings, eq(listings.id, conversations.listingId))
      .where(and(eq(conversations.sellerId, userId), isNull(conversations.tenantId)))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(5),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        status: listings.status,
        priceUsd: listings.priceUsd,
        views: listings.viewCount,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        saves: sql<number>`(select count(*) from favorites f where f.listing_id = ${listings.id})`,
        rejectionReason: listings.rejectionReason,
        moderationFlags: listings.moderationFlags,
        updatedAt: listings.updatedAt,
      })
      .from(listings)
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(and(eq(listings.sellerId, userId), isNull(listings.tenantId)))
      .orderBy(desc(listings.updatedAt))
      .limit(12),
  ]);

  return {
    status,
    views: Number(engagement[0]?.views ?? 0),
    contacts: Number(engagement[0]?.contacts ?? 0),
    upcomingAppointments: Number(upcoming[0]?.count ?? 0),
    leads: recentLeads,
    inventory,
    totalListings: Object.values(status).reduce((a, b) => a + b, 0),
  };
}

export async function getCustomerDashboard(userId: string) {
  const [favoriteCount, searchCount, upcoming, reports, unread, recentFavorites] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(favorites).where(eq(favorites.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(savedSearches).where(eq(savedSearches.userId, userId)),
    db
      .select({
        id: appointments.id,
        preferredAt: appointments.preferredAt,
        status: appointments.status,
        slug: listings.slug,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
      })
      .from(appointments)
      .innerJoin(listings, eq(listings.id, appointments.listingId))
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(and(eq(appointments.buyerId, userId), inArray(appointments.status, ["REQUESTED", "CONFIRMED"])))
      .orderBy(appointments.preferredAt)
      .limit(4),
    db
      .select({
        publicId: reportRequests.publicId,
        status: reportRequests.status,
        riskLevel: reportRequests.riskLevel,
        completedAt: reportRequests.completedAt,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
      })
      .from(reportRequests)
      .innerJoin(vehicles, eq(vehicles.id, reportRequests.vehicleId))
      .where(eq(reportRequests.requestedById, userId))
      .orderBy(desc(reportRequests.requestedAt))
      .limit(4),
    db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), isNull(notifications.readAt))),
    db
      .select({
        id: listings.id,
        slug: listings.slug,
        priceUsd: listings.priceUsd,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        mileageKm: vehicles.mileageKm,
        image: sql<string | null>`(select url from vehicle_images vi where vi.vehicle_id = ${vehicles.id} order by vi.position asc limit 1)`,
      })
      .from(favorites)
      .innerJoin(listings, eq(listings.id, favorites.listingId))
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt))
      .limit(3),
  ]);

  return {
    favoriteCount: Number(favoriteCount[0]?.count ?? 0),
    searchCount: Number(searchCount[0]?.count ?? 0),
    unread: Number(unread[0]?.count ?? 0),
    appointments: upcoming,
    reports,
    recentFavorites,
  };
}

export async function getAdminDashboard() {
  const now = new Date();
  const [userCount, tenantCount, listingRows, reportRows, caseCount, mrr, recentUsers, recentAudit, pendingListings, needsReview] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),
    db.select({ count: sql<number>`count(*)` }).from(tenants),
    db.select({ status: listings.status, count: sql<number>`count(*)` }).from(listings).groupBy(listings.status),
    db.select({ status: reportRequests.status, count: sql<number>`count(*)` }).from(reportRequests).groupBy(reportRequests.status),
    db.select({ count: sql<number>`count(*)` }).from(reportedContent).where(inArray(reportedContent.status, ["OPEN", "REVIEWING"])),
    db
      .select({ sum: sql<number>`coalesce(sum(${plans.priceUsd}), 0)` })
      .from(tenantSubscriptions)
      .innerJoin(plans, eq(plans.code, tenantSubscriptions.planCode))
      .where(eq(tenantSubscriptions.status, "ACTIVE")),
    db.select({ id: users.id, name: users.name, email: users.email, role: users.platformRole, createdAt: users.createdAt }).from(users).orderBy(desc(users.createdAt)).limit(5),
    db
      .select({ id: auditLogs.id, action: auditLogs.action, actorId: auditLogs.actorId, targetType: auditLogs.targetType, targetId: auditLogs.targetId, createdAt: auditLogs.createdAt, actorName: users.name })
      .from(auditLogs)
      .leftJoin(users, eq(users.id, auditLogs.actorId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(8),
    db
      .select({ count: sql<number>`count(*)` })
      .from(listings)
      .where(eq(listings.status, "PENDING")),
    db
      .select({ count: sql<number>`count(*)` })
      .from(reportRequests)
      .where(eq(reportRequests.status, "NEEDS_REVIEW")),
  ]);

  const listingMap: Record<string, number> = {};
  for (const row of listingRows) listingMap[row.status] = Number(row.count);
  const reportMap: Record<string, number> = {};
  for (const row of reportRows) reportMap[row.status] = Number(row.count);

  return {
    users: Number(userCount[0]?.count ?? 0),
    tenants: Number(tenantCount[0]?.count ?? 0),
    listings: listingMap,
    reports: reportMap,
    openCases: Number(caseCount[0]?.count ?? 0),
    mrr: Number(mrr[0]?.sum ?? 0),
    recentUsers,
    recentAudit,
    pendingListings: Number(pendingListings[0]?.count ?? 0),
    needsReview: Number(needsReview[0]?.count ?? 0),
  };
}

export async function getAdminTenants() {
  return db
    .select({
      id: tenants.id,
      name: tenants.name,
      slug: tenants.slug,
      province: tenants.province,
      status: tenants.status,
      verificationStatus: tenants.verificationStatus,
      createdAt: tenants.createdAt,
      suspensionReason: tenants.suspensionReason,
      listings: sql<number>`(select count(*) from listings l where l.tenant_id = ${tenants.id})`,
      published: sql<number>`(select count(*) from listings l where l.tenant_id = ${tenants.id} and l.status = 'PUBLISHED')`,
      staff: sql<number>`(select count(*) from tenant_memberships m where m.tenant_id = ${tenants.id} and m.status = 'ACTIVE')`,
      planCode: sql<string | null>`(select plan_code from tenant_subscriptions s where s.tenant_id = ${tenants.id} order by created_at desc limit 1)`,
    })
    .from(tenants)
    .orderBy(desc(tenants.createdAt));
}

export async function getAdminCases() {
  return db
    .select({
      id: reportedContent.id,
      targetType: reportedContent.targetType,
      targetId: reportedContent.targetId,
      reason: reportedContent.reason,
      details: reportedContent.details,
      status: reportedContent.status,
      createdAt: reportedContent.createdAt,
      reporterName: users.name,
      listingSlug: listings.slug,
    })
    .from(reportedContent)
    .innerJoin(users, eq(users.id, reportedContent.reporterId))
    .leftJoin(listings, eq(listings.id, reportedContent.listingId))
    .orderBy(desc(reportedContent.createdAt))
    .limit(100);
}

export async function getAdminReports() {
  return db
    .select({
      id: reportRequests.id,
      publicId: reportRequests.publicId,
      status: reportRequests.status,
      riskLevel: reportRequests.riskLevel,
      confidence: reportRequests.confidence,
      requestedAt: reportRequests.requestedAt,
      reviewedAt: reportRequests.reviewedAt,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      listingSlug: listings.slug,
    })
    .from(reportRequests)
    .innerJoin(vehicles, eq(vehicles.id, reportRequests.vehicleId))
    .leftJoin(listings, eq(listings.id, reportRequests.listingId))
    .orderBy(desc(reportRequests.requestedAt))
    .limit(100);
}

export async function getAdminPendingListings() {
  return db
    .select({
      id: listings.id,
      slug: listings.slug,
      status: listings.status,
      priceUsd: listings.priceUsd,
      createdAt: listings.createdAt,
      moderationFlags: listings.moderationFlags,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      sellerName: users.name,
      tenantName: tenants.name,
      image: sql<string | null>`(select url from vehicle_images vi where vi.vehicle_id = ${vehicles.id} order by vi.position asc limit 1)`,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, listings.sellerId))
    .leftJoin(tenants, eq(tenants.id, listings.tenantId))
    .where(inArray(listings.status, ["PENDING", "REJECTED"]))
    .orderBy(desc(listings.createdAt))
    .limit(100);
}

export async function getAdminUsers() {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      phone: users.phone,
      platformRole: users.platformRole,
      status: users.status,
      createdAt: users.createdAt,
      listings: sql<number>`(select count(*) from listings l where l.seller_id = ${users.id})`,
      memberships: sql<number>`(select count(*) from tenant_memberships m where m.user_id = ${users.id} and m.status = 'ACTIVE')`,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(200);
}

export async function getAuditLog() {
  return db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      actorName: users.name,
      actorRole: auditLogs.actorRole,
      tenantId: auditLogs.tenantId,
      targetType: auditLogs.targetType,
      targetId: auditLogs.targetId,
      metadataJson: auditLogs.metadataJson,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorId))
    .orderBy(desc(auditLogs.createdAt))
    .limit(200);
}

export async function getTenantTeam(tenantId: string) {
  return db
    .select({
      id: tenantMemberships.id,
      userId: users.id,
      name: users.name,
      email: users.email,
      role: tenantMemberships.role,
      status: tenantMemberships.status,
      since: tenantMemberships.createdAt,
    })
    .from(tenantMemberships)
    .innerJoin(users, eq(users.id, tenantMemberships.userId))
    .where(eq(tenantMemberships.tenantId, tenantId))
    .orderBy(tenantMemberships.createdAt);
}

export async function getTenantLeads(tenantId: string) {
  const [convos, appts, offerRows] = await Promise.all([
    db
      .select({
        id: conversations.id,
        buyerName: users.name,
        listingSlug: listings.slug,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
        lastMessageAt: conversations.lastMessageAt,
        lastMessage: sql<string>`(select body from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
        unread: sql<number>`(select count(*) from messages m where m.conversation_id = ${conversations.id} and m.sender_id = ${conversations.buyerId} and m.read_at is null)`,
      })
      .from(conversations)
      .innerJoin(users, eq(users.id, conversations.buyerId))
      .leftJoin(listings, eq(listings.id, conversations.listingId))
      .leftJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(eq(conversations.tenantId, tenantId))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(50),
    db
      .select({
        id: appointments.id,
        preferredAt: appointments.preferredAt,
        status: appointments.status,
        location: appointments.location,
        note: appointments.note,
        buyerName: users.name,
        listingSlug: listings.slug,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
      })
      .from(appointments)
      .innerJoin(users, eq(users.id, appointments.buyerId))
      .innerJoin(listings, eq(listings.id, appointments.listingId))
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(eq(appointments.tenantId, tenantId))
      .orderBy(desc(appointments.preferredAt))
      .limit(50),
    db
      .select({
        id: offers.id,
        amountUsd: offers.amountUsd,
        message: offers.message,
        status: offers.status,
        createdAt: offers.createdAt,
        buyerName: users.name,
        listingSlug: listings.slug,
        make: vehicles.make,
        model: vehicles.model,
        year: vehicles.year,
      })
      .from(offers)
      .innerJoin(users, eq(users.id, offers.buyerId))
      .innerJoin(listings, eq(listings.id, offers.listingId))
      .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
      .where(eq(offers.tenantId, tenantId))
      .orderBy(desc(offers.createdAt))
      .limit(50),
  ]);
  return { conversations: convos, appointments: appts, offers: offerRows };
}

export async function getTenantInventory(tenantId: string) {
  return db
    .select({
      id: listings.id,
      slug: listings.slug,
      status: listings.status,
      priceUsd: listings.priceUsd,
      views: listings.viewCount,
      updatedAt: listings.updatedAt,
      featuredUntil: listings.featuredUntil,
      rejectionReason: listings.rejectionReason,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      mileageKm: vehicles.mileageKm,
      image: sql<string | null>`(select url from vehicle_images vi where vi.vehicle_id = ${vehicles.id} order by vi.position asc limit 1)`,
      saves: sql<number>`(select count(*) from favorites f where f.listing_id = ${listings.id})`,
    })
    .from(listings)
    .innerJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .where(eq(listings.tenantId, tenantId))
    .orderBy(desc(listings.updatedAt))
    .limit(100);
}

export async function getMessagesForUser(userId: string, tenantIds: string[]) {
  const tenantFilter = tenantIds.length
    ? or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId), inArray(conversations.tenantId, tenantIds))
    : or(eq(conversations.buyerId, userId), eq(conversations.sellerId, userId));
  return db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      lastMessageAt: conversations.lastMessageAt,
      buyerId: conversations.buyerId,
      sellerId: conversations.sellerId,
      buyerName: sql<string>`(select name from users u where u.id = ${conversations.buyerId})`,
      sellerName: sql<string>`(select name from users u where u.id = ${conversations.sellerId})`,
      listingSlug: listings.slug,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      lastMessage: sql<string>`(select body from messages m where m.conversation_id = ${conversations.id} order by m.created_at desc limit 1)`,
      unread: sql<number>`(select count(*) from messages m where m.conversation_id = ${conversations.id} and m.sender_id != ${userId} and m.read_at is null)`,
    })
    .from(conversations)
    .leftJoin(listings, eq(listings.id, conversations.listingId))
    .leftJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .where(tenantFilter)
    .orderBy(desc(conversations.lastMessageAt))
    .limit(50);
}

export async function getConversation(conversationId: string) {
  const rows = await db
    .select({
      conversation: conversations,
      listingSlug: listings.slug,
      listingId: listings.id,
      priceUsd: listings.priceUsd,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      image: sql<string | null>`(select url from vehicle_images vi where vi.vehicle_id = ${vehicles.id} order by vi.position asc limit 1)`,
      buyerName: users.name,
    })
    .from(conversations)
    .leftJoin(listings, eq(listings.id, conversations.listingId))
    .leftJoin(vehicles, eq(vehicles.id, listings.vehicleId))
    .innerJoin(users, eq(users.id, conversations.buyerId))
    .where(eq(conversations.id, conversationId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  const msgs = await db
    .select({
      id: messages.id,
      senderId: messages.senderId,
      body: messages.body,
      kind: messages.kind,
      createdAt: messages.createdAt,
      senderName: users.name,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
  return { ...row, messages: msgs };
}

export async function markConversationRead(conversationId: string, userId: string) {
  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, userId), isNull(messages.readAt)));
}

export async function getNotifications(userId: string) {
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function getPendingDocuments() {
  return db
    .select({
      id: vehicleDocuments.id,
      type: vehicleDocuments.type,
      status: vehicleDocuments.status,
      fileName: vehicleDocuments.fileName,
      uploadedAt: vehicleDocuments.uploadedAt,
      note: vehicleDocuments.note,
      vehicleId: vehicleDocuments.vehicleId,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
      listingSlug: listings.slug,
      listingId: listings.id,
      uploaderName: users.name,
    })
    .from(vehicleDocuments)
    .innerJoin(vehicles, eq(vehicles.id, vehicleDocuments.vehicleId))
    .leftJoin(listings, eq(listings.vehicleId, vehicleDocuments.vehicleId))
    .leftJoin(users, eq(users.id, vehicleDocuments.uploadedById))
    .orderBy(desc(vehicleDocuments.uploadedAt))
    .limit(60);
}
