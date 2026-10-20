import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { audit } from "@/lib/audit";
import { ApiError, clientIp, jsonError, parseBody, rateLimit } from "@/lib/api";
import { createSession, safeNextPath, setSessionCookie, TENANT_COOKIE } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { loginSchema } from "@/lib/validation";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req);
    rateLimit(`login:${ip}`, 12, 10 * 60 * 1000);

    // Accept both JSON and form posts so the server-rendered form also works.
    const contentType = req.headers.get("content-type") ?? "";
    const body = contentType.includes("application/json")
      ? await parseBody(req, loginSchema)
      : loginSchema.parse(Object.fromEntries((await req.formData()).entries()));

    rateLimit(`login:${ip}:${body.email}`, 6, 10 * 60 * 1000);

    const rows = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    const user = rows[0];
    const genericError = new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");

    if (!user) {
      // Constant-ish work even when the user does not exist.
      await verifyPassword(body.password, "scrypt$00$00");
      throw genericError;
    }
    const valid = await verifyPassword(body.password, user.passwordHash);
    if (!valid) throw genericError;
    if (user.status === "SUSPENDED") {
      throw new ApiError(403, "ACCOUNT_SUSPENDED", "This account is suspended. Contact support.");
    }

    const session = await createSession(user.id, { ip, userAgent: req.headers.get("user-agent") });
    await setSessionCookie(session.token, session.expiresAt);

    // Clear any stale tenant context from a previous account.
    const jar = await cookies();
    jar.delete(TENANT_COOKIE);

    await audit({ actorId: user.id, actorRole: user.platformRole, action: "auth.login", targetType: "user", targetId: user.id, ip });

    const next = safeNextPath(body.next, "");
    return NextResponse.json({ data: { redirectTo: next || null } });
  } catch (err) {
    return jsonError(err);
  }
}
