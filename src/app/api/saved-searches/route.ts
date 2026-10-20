import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { savedSearches } from "@/db/schema";
import { jsonError, jsonOk, parseBody, requireUser } from "@/lib/api";
import { newId } from "@/lib/ids";
import { savedSearchSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const body = await parseBody(req, savedSearchSchema);
    const existing = await db
      .select({ id: savedSearches.id })
      .from(savedSearches)
      .where(and(eq(savedSearches.userId, ctx.user.id), eq(savedSearches.queryJson, body.query)))
      .limit(1);
    if (existing.length) return jsonOk({ id: existing[0].id, duplicate: true });

    const id = newId("ss");
    await db.insert(savedSearches).values({ id, userId: ctx.user.id, name: body.name, queryJson: body.query, alertsEnabled: true });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const ctx = await requireUser();
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return jsonError(new Error("Missing id"));
    await db.delete(savedSearches).where(and(eq(savedSearches.id, id), eq(savedSearches.userId, ctx.user.id)));
    return jsonOk({ deleted: true });
  } catch (err) {
    return jsonError(err);
  }
}
