import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { audit } from "@/lib/audit";
import { jsonError } from "@/lib/api";
import { SESSION_COOKIE, clearSessionCookie, getAuthContext, revokeSession } from "@/lib/auth";

export async function POST(_req: NextRequest) {
  try {
    const jar = await cookies();
    const token = jar.get(SESSION_COOKIE)?.value;
    const ctx = await getAuthContext();
    if (token) await revokeSession(token);
    await clearSessionCookie();
    if (ctx.user) await audit({ actorId: ctx.user.id, action: "auth.logout", targetType: "session" });
    return NextResponse.json({ data: { ok: true } });
  } catch (err) {
    return jsonError(err);
  }
}
