import type { Metadata } from "next";
import Link from "next/link";
import { Lock, LogIn } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { canViewReport, getReportByPublicId } from "@/lib/reports";
import { getT } from "@/i18n";
import { ReportView } from "@/components/listing/report-view";
import { ReportIssue } from "@/components/listing/report-issue";
import { EmptyState } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ publicId: string }> }): Promise<Metadata> {
  const { publicId } = await params;
  return { title: `Vehicle report ${publicId}`, robots: { index: false, follow: false } };
}

export default async function ReportPage({ params }: { params: Promise<{ publicId: string }> }) {
  const { publicId } = await params;
  const [{ lang, t }, ctx, record] = await Promise.all([getT(), getAuthContext(), getReportByPublicId(publicId)]);

  if (!record) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title={t("report.notFound.title")}
          body={t("report.notFound.body")}
          icon={<Lock className="h-8 w-8" />}
          action={<ButtonLink href="/cars">{t("nav.browse")}</ButtonLink>}
        />
      </div>
    );
  }

  if (!ctx.user) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title={t("report.noAccess")}
          body={t("report.noAccessBody")}
          icon={<LogIn className="h-8 w-8" />}
          action={<ButtonLink href={`/login?next=/reports/${publicId}`}>{t("nav.login")}</ButtonLink>}
        />
      </div>
    );
  }

  const allowed = canViewReport(
    { userId: ctx.user.id, platformRole: ctx.user.platformRole, tenantIds: ctx.memberships.map((m) => m.tenantId) },
    { report: { requestedById: record.report.requestedById }, listing: record.listing ? { sellerId: record.listing.sellerId, tenantId: record.listing.tenantId } : null },
  );

  if (!allowed) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title={t("report.noAccess")}
          body={t("report.noAccessBody")}
          icon={<Lock className="h-8 w-8" />}
          action={<ButtonLink href="/cars">{t("nav.browse")}</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <ReportView record={record} lang={lang} disputeSlot={<ReportIssue reportPublicId={record.report.publicId} />} />
      <p className="mt-6 text-center text-[11px] text-ink-400">
        <Link href="/reports" className="no-underline hover:underline">{t("nav.reports")}</Link>
        <span aria-hidden> · </span>
        <Link href="/safety" className="no-underline hover:underline">{t("footer.safety")}</Link>
      </p>
    </div>
  );
}
