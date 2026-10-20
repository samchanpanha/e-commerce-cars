import type { Metadata } from "next";
import { desc, eq, and, isNull } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { reportRequests } from "@/db/schema";
import { getReportByPublicId } from "@/lib/reports";
import { getT } from "@/i18n";
import { ReportView } from "@/components/listing/report-view";
import { EmptyState } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sample vehicle report",
  description: "See how an AngkorEV evidence ledger separates verified facts, inconsistencies and unknowns.",
};

export default async function SampleReportPage() {
  const { lang, t } = await getT();

  // A curated, non-personal demo report is seeded with no requester.
  const rows = await db
    .select({ publicId: reportRequests.publicId })
    .from(reportRequests)
    .where(and(isNull(reportRequests.requestedById), eq(reportRequests.status, "READY")))
    .orderBy(desc(reportRequests.completedAt))
    .limit(1);

  const record = rows[0] ? await getReportByPublicId(rows[0].publicId) : null;

  if (!record) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="No sample report available"
          body="Run the database seed to generate the demonstration report."
          icon={<ShieldCheck className="h-8 w-8" />}
          action={<ButtonLink href="/cars">Browse cars</ButtonLink>}
        />
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <div className="mb-5 rounded-2xl border border-gold-300/60 bg-gold-100/50 px-4 py-3 text-sm text-warn-700">
        {lang === "km"
          ? "នេះជារបាយការណ៍គំរូពីទិន្នន័យសាកល្បង។ វាបង្ហាញពីរបៀបដែលភស្តុតាង ភាពមិនស៊ីគ្នា និងការមិនដឹងត្រូវបានបង្ហាញ។"
          : "This is a sample report generated from seeded demonstration data. It shows exactly how evidence, inconsistencies and unknowns are presented."}
      </div>
      <ReportView record={record} lang={lang} sample />
      <p className="mt-6 text-center text-[11px] text-ink-400">
        {t("report.disclaimer")}
      </p>
    </div>
  );
}
