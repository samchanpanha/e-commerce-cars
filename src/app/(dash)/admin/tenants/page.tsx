import Link from "next/link";
import { getAdminTenants } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDate } from "@/lib/money";
import { StatusPill } from "@/components/dashboard/kpi";
import { ActionButton, ReasonAction } from "@/components/dashboard/action-button";

export const dynamic = "force-dynamic";

export default async function AdminTenants() {
  const [{ lang, t }, tenants] = await Promise.all([getT(), getAdminTenants()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.tenants")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">{tenants.length} dealership tenants · suspension keeps historical records intact</p>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Dealership</th>
              <th>{t("common.status")}</th>
              <th>Verification</th>
              <th className="text-right">{t("admin.tenant.listings")}</th>
              <th className="text-right">{t("admin.tenant.staff")}</th>
              <th>{t("admin.tenant.plan")}</th>
              <th>{t("admin.tenant.created")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {tenants.map((tenant) => (
              <tr key={tenant.id}>
                <td>
                  <Link href={`/dealers/${tenant.slug}`} className="text-sm font-semibold text-ink-900 no-underline hover:text-brand-800">
                    {tenant.name}
                  </Link>
                  <p className="text-[11px] text-ink-400">{tenant.province} · /{tenant.slug}</p>
                  {tenant.suspensionReason ? <p className="mt-0.5 max-w-xs text-[10px] text-danger-700">{tenant.suspensionReason}</p> : null}
                </td>
                <td><StatusPill status={tenant.status} /></td>
                <td><StatusPill status={tenant.verificationStatus} /></td>
                <td className="text-right text-xs text-ink-600">{tenant.published}/{tenant.listings}</td>
                <td className="text-right text-xs text-ink-600">{tenant.staff}</td>
                <td className="text-xs text-ink-500">{tenant.planCode ?? "—"}</td>
                <td className="text-xs text-ink-500">{formatDate(tenant.createdAt, lang)}</td>
                <td>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {tenant.verificationStatus !== "VERIFIED" ? (
                      <ActionButton endpoint={`/api/admin/tenants/${tenant.id}`} body={{ action: "VERIFY" }} label={t("admin.tenant.verify")} variant="primary" />
                    ) : null}
                    {tenant.status === "ACTIVE" ? (
                      <ReasonAction
                        endpoint={`/api/admin/tenants/${tenant.id}`}
                        body={{ action: "SUSPEND" }}
                        label={t("admin.tenant.suspend")}
                        placeholder={t("admin.tenant.suspendReason")}
                        promptLabel={t("admin.tenant.suspend")}
                        minLength={5}
                      />
                    ) : (
                      <ActionButton endpoint={`/api/admin/tenants/${tenant.id}`} body={{ action: "REINSTATE" }} label={t("admin.tenant.reinstate")} variant="secondary" />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
