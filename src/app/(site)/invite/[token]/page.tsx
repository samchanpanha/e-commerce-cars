import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, Clock, Mail, Store, UserX } from "lucide-react";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { tenantInvitations, tenants } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getT } from "@/i18n";
import type { TranslationKey } from "@/i18n/dictionary";
import { AcceptInviteButton } from "./accept-invite";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dealership invitation",
  robots: { index: false, follow: false },
};

const ROLE_LABELS: Record<string, string> = {
  TENANT_OWNER: "Owner",
  TENANT_ADMIN: "Admin",
  INVENTORY_MANAGER: "Inventory manager",
  SALES_AGENT: "Sales agent",
};

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { t } = await getT();
  const ctx = await getAuthContext();

  const rows = await db
    .select({
      id: tenantInvitations.id,
      email: tenantInvitations.email,
      role: tenantInvitations.role,
      expiresAt: tenantInvitations.expiresAt,
      acceptedAt: tenantInvitations.acceptedAt,
      tenantName: tenants.name,
      tenantSlug: tenants.slug,
      tenantStatus: tenants.status,
    })
    .from(tenantInvitations)
    .innerJoin(tenants, eq(tenants.id, tenantInvitations.tenantId))
    .where(eq(tenantInvitations.token, token))
    .limit(1);

  const invitation = rows[0];

  let state: "ready" | "notFound" | "expired" | "used" | "suspended" | "mismatch" | "signedOut" = "ready";
  if (!invitation) state = "notFound";
  else if (invitation.acceptedAt) state = "used";
  else if (invitation.expiresAt.getTime() < Date.now()) state = "expired";
  else if (invitation.tenantStatus !== "ACTIVE") state = "suspended";
  else if (!ctx.user) state = "signedOut";
  else if (ctx.user.email.toLowerCase() !== invitation.email) state = "mismatch";

  const nextPath = `/invite/${token}`;
  const roleLabel = invitation ? ROLE_LABELS[invitation.role] ?? invitation.role : "";

  const messages: Partial<Record<typeof state, { title: TranslationKey; body: TranslationKey; icon: React.ReactNode }>> = {
    notFound: { title: "invite.notFound.title", body: "invite.notFound.body", icon: <AlertTriangle className="h-5 w-5 text-danger-600" /> },
    expired: { title: "invite.expired.title", body: "invite.expired.body", icon: <Clock className="h-5 w-5 text-warn-600" /> },
    used: { title: "invite.used.title", body: "invite.used.body", icon: <AlertTriangle className="h-5 w-5 text-warn-600" /> },
    suspended: { title: "invite.suspended.title", body: "invite.suspended.body", icon: <Store className="h-5 w-5 text-warn-600" /> },
    mismatch: { title: "invite.mismatch.title", body: "invite.mismatch.body", icon: <UserX className="h-5 w-5 text-danger-600" /> },
  };
  const info = messages[state];

  return (
    <div className="container-wide py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-ink-200 bg-white p-6 shadow-sm sm:p-7">
        {invitation && (state === "ready" || state === "signedOut" || state === "mismatch") ? (
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-700">
            <Store className="h-6 w-6" />
          </span>
        ) : null}

        {invitation && (state === "ready" || state === "signedOut" || state === "mismatch") ? (
          <>
            <h1 className="mt-4 text-center text-xl font-bold text-ink-950">{t("invite.title", { tenant: invitation.tenantName })}</h1>
            <p className="mt-1 text-center text-sm text-ink-500">{t("invite.sub", { role: roleLabel })}</p>
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-[11px] leading-relaxed text-ink-500">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {t("invite.emailNote", { email: invitation.email })}
            </p>

            {state === "ready" ? (
              <div className="mt-5">
                <AcceptInviteButton token={token} label={t("invite.accept")} pendingLabel={t("invite.accepting")} />
              </div>
            ) : null}

            {state === "signedOut" ? (
              <div className="mt-5 space-y-2">
                <p className="text-xs leading-relaxed text-ink-500">{t("invite.signIn.body", { email: invitation.email })}</p>
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn btn-primary w-full justify-center no-underline">
                  {t("invite.signIn.cta")} <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href={`/register?next=${encodeURIComponent(nextPath)}&email=${encodeURIComponent(invitation.email)}`} className="btn btn-secondary w-full justify-center no-underline">
                  {t("invite.register.cta")}
                </Link>
              </div>
            ) : null}

            {state === "mismatch" ? (
              <div className="mt-5 space-y-2">
                <p className="text-xs leading-relaxed text-ink-500">
                  {ctx.user?.email ? <span className="font-medium text-ink-700">{ctx.user.email}</span> : null}
                </p>
                <Link href={`/login?next=${encodeURIComponent(nextPath)}`} className="btn btn-primary w-full justify-center no-underline">
                  {t("invite.signIn.cta")}
                </Link>
              </div>
            ) : null}
          </>
        ) : info ? (
          <>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-ink-50">{info.icon}</span>
            <h1 className="mt-4 text-center text-xl font-bold text-ink-950">{t(info.title)}</h1>
            <p className="mt-2 text-center text-sm leading-relaxed text-ink-500">{t(info.body)}</p>
            <div className="mt-5 flex flex-col gap-2">
              <Link href={ctx.user ? "/dashboard" : "/login"} className="btn btn-primary w-full justify-center no-underline">
                {ctx.user ? t("invite.goDashboard") : t("invite.signIn.cta")}
              </Link>
              <Link href="/" className="btn btn-ghost w-full justify-center no-underline">{t("common.back")}</Link>
            </div>
          </>
        ) : null}

        {invitation && invitation.tenantSlug && state === "ready" ? (
          <p className="mt-4 text-center text-[11px] text-ink-400">
            <Link href={`/dealers/${invitation.tenantSlug}`} className="no-underline hover:underline">{invitation.tenantName}</Link>
          </p>
        ) : null}
      </div>
    </div>
  );
}
