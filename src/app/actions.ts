"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantMemberships } from "@/db/schema";
import { audit } from "@/lib/audit";
import {
  LOCALE_COOKIE,
  TENANT_COOKIE,
  clearSessionCookie,
  getAuthContext,
  revokeSession,
  SESSION_COOKIE,
} from "@/lib/auth";
import { isLang } from "@/i18n";

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "en");
  const next = String(formData.get("next") ?? "/");
  const jar = await cookies();
  jar.set(LOCALE_COOKIE, isLang(locale) ? locale : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function switchTenantAction(formData: FormData) {
  const ctx = await getAuthContext();
  const tenantId = String(formData.get("tenantId") ?? "");
  if (!ctx.user || !tenantId) redirect("/login");

  // Membership is verified against the database — the cookie alone grants nothing.
  const membership = await db
    .select({ id: tenantMemberships.id })
    .from(tenantMemberships)
    .where(
      and(
        eq(tenantMemberships.userId, ctx.user.id),
        eq(tenantMemberships.tenantId, tenantId),
        eq(tenantMemberships.status, "ACTIVE"),
      ),
    )
    .limit(1);
  if (!membership.length) redirect("/dashboard");

  const jar = await cookies();
  jar.set(TENANT_COOKIE, tenantId, { path: "/", httpOnly: true, sameSite: "lax" });
  await audit({
    actorId: ctx.user.id,
    actorRole: ctx.user.platformRole,
    tenantId,
    action: "tenant.switch",
    targetType: "tenant",
    targetId: tenantId,
  });
  revalidatePath("/", "layout");
  redirect("/tenant");
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  const ctx = await getAuthContext();
  if (token) await revokeSession(token);
  if (ctx.user) {
    await audit({ actorId: ctx.user.id, action: "auth.logout", targetType: "session" });
  }
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/?loggedOut=1");
}
