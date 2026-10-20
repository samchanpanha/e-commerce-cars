import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { favorites, listings } from "@/db/schema";
import { ApiError, jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";

const schema = z.object({
  listingId: z.string().min(1),
  action: z.enum(["add", "remove"]).default("add"),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const { listingId, action } = await parseBody(req, schema);

    const listing = await db.select({ id: listings.id }).from(listings).where(eq(listings.id, listingId)).limit(1);
    if (!listing.length) throw new ApiError(404, "NOT_FOUND", "Listing not found.");

    if (action === "remove") {
      await db.delete(favorites).where(and(eq(favorites.userId, ctx.user.id), eq(favorites.listingId, listingId)));
      return jsonOk({ saved: false });
    }

    const existing = await db
      .select({ id: favorites.id })
      .from(favorites)
      .where(and(eq(favorites.userId, ctx.user.id), eq(favorites.listingId, listingId)))
      .limit(1);
    if (!existing.length) {
      await db.insert(favorites).values({ id: newId("fav"), userId: ctx.user.id, listingId });
    }
    return jsonOk({ saved: true });
  } catch (err) {
    return jsonError(err);
  }
}

export async function GET() {
  try {
    const ctx = await requireUser();
    const rows = await db.select({ listingId: favorites.listingId, createdAt: favorites.createdAt }).from(favorites).where(eq(favorites.userId, ctx.user.id));
    return jsonOk({ items: rows });
  } catch (err) {
    return jsonError(err);
  }
}
