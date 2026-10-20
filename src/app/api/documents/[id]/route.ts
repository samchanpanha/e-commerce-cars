import { readFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings, vehicleDocuments } from "@/db/schema";
import { ApiError, jsonError, requireUser } from "@/lib/api";
import { canAccessListing, canPlatform } from "@/lib/rbac";

/**
 * Authorized document download. Never expose a public object URL for identity
 * documents. Every access is checked against the listing and the caller's role.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();

    const rows = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, id)).limit(1);
    const doc = rows[0];
    if (!doc) throw new ApiError(404, "NOT_FOUND", "Document not found.");

    const listingRows = await db.select().from(listings).where(eq(listings.vehicleId, doc.vehicleId)).limit(1);
    const listing = listingRows[0];

    const isReviewer = canPlatform(ctx, "moderation:handle");
    const isOwner = listing ? await canAccessListing(ctx, listing, "listing:read") : false;
    if (!isReviewer && !isOwner) throw new ApiError(403, "FORBIDDEN", "You cannot access this document.");

    if (!doc.fileUrl?.startsWith("private://")) throw new ApiError(404, "NOT_FOUND", "File is unavailable.");
    const fileName = doc.fileUrl.replace("private://", "");
    const full = path.join(process.cwd(), "data", "private-documents", path.basename(fileName));
    const bytes = await readFile(full);

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${doc.fileName ?? "document"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    return jsonError(err);
  }
}
