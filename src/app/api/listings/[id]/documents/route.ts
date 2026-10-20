import { createHash, randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@/db";
import { listings, vehicleDocuments } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, clientIp, jsonError, jsonOk, rateLimit, requireUser } from "@/lib/api";
import { canAccessListing } from "@/lib/rbac";
import { newId } from "@/lib/ids";
import { DOCUMENT_TYPES } from "@/lib/constants";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const ctx = await requireUser();
    rateLimit(`doc-upload:${ctx.user.id}`, 20, 60 * 60 * 1000);

    const rows = await db.select().from(listings).where(eq(listings.id, id)).limit(1);
    const listing = rows[0];
    if (!listing) throw new ApiError(404, "NOT_FOUND", "Listing not found.");
    if (!(await canAccessListing(ctx, listing, "listing:edit"))) {
      throw new ApiError(403, "FORBIDDEN", "You cannot upload documents for this listing.");
    }

    const form = await req.formData();
    const file = form.get("file");
    const type = String(form.get("type") ?? "");
    const note = String(form.get("note") ?? "").slice(0, 300);

    if (!(file instanceof File)) throw new ApiError(400, "NO_FILE", "No file was uploaded.");
    if (!DOCUMENT_TYPES.includes(type as (typeof DOCUMENT_TYPES)[number])) {
      throw new ApiError(422, "INVALID_TYPE", "Choose a valid document type.");
    }
    if (!ALLOWED.includes(file.type)) throw new ApiError(415, "UNSUPPORTED_TYPE", "Upload a JPG, PNG, WebP or PDF.");
    if (file.size > MAX_BYTES) throw new ApiError(413, "FILE_TOO_LARGE", "Documents must be 10 MB or smaller.");

    const bytes = Buffer.from(await file.arrayBuffer());
    const hash = createHash("sha256").update(bytes).digest("hex");
    const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
    const fileName = `${newId("docfile")}.${ext}`;

    // Documents live outside /public so they can never be fetched by URL guessing.
    const dir = path.join(process.cwd(), "data", "private-documents");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), bytes);

    const documentId = newId("doc");
    await db.insert(vehicleDocuments).values({
      id: documentId,
      vehicleId: listing.vehicleId,
      type,
      status: "PENDING",
      fileUrl: `private://${fileName}`,
      fileName: file.name.slice(0, 200),
      mimeType: file.type,
      fileSize: file.size,
      hash,
      note: note || null,
      visibility: "PRIVATE",
      uploadedById: ctx.user.id,
      uploadedAt: new Date(),
    });

    await audit({ actorId: ctx.user.id, tenantId: listing.tenantId, action: "document.upload", targetType: "vehicle_document", targetId: documentId, metadata: { type }, ip: clientIp(req) });

    return jsonOk({ id: documentId, status: "PENDING", type }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}
