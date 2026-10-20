import { getAuthContext } from "@/lib/auth";
import { getTenantTeam } from "@/lib/dashboard";
import { canInTenant } from "@/lib/rbac";
import { getT } from "@/i18n";
import { formatDate } from "@/lib/money";
import { SectionCard, StatusPill } from "@/components/dashboard/kpi";
import { InviteStaffForm } from "@/components/dashboard/tenant-forms";
import { ActionButton } from "@/components/dashboard/action-button";
import { NoTenant } from "@/components/dashboard/no-tenant";

export const dynamic = "force-dynamic";

export default async function TenantTeam() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  if (!ctx.activeTenantId) return <NoTenant />;
  const tenantId = ctx.activeTenantId;
  const [members, canManage] = await Promise.all([getTenantTeam(tenantId), Promise.resolve(canInTenant(ctx, tenantId, "member:manage"))]);

  return (
    <div className="max-w-4xl space-y-5">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("tenant.team")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          Roles within this dealership. A membership never grants access to another dealership's data.
        </p>
      </div>

      <SectionCard title={t("tenant.invite")}>
        {canManage ? <InviteStaffForm tenantId={tenantId} /> : <p className="text-sm text-ink-500">{t("tenant.ownerOnly")}</p>}
      </SectionCard>

      <SectionCard title={t("tenant.team")} subtitle={`${members.length}`}>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>{t("tenant.member")}</th>
                <th>{t("tenant.memberRole")}</th>
                <th>{t("tenant.memberStatus")}</th>
                <th>{t("tenant.memberSince")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id}>
                  <td>
                    <p className="text-sm font-medium text-ink-900">{member.name}</p>
                    <p className="text-[11px] text-ink-400">{member.email}</p>
                  </td>
                  <td><span className="chip chip-slate">{member.role.replaceAll("_", " ").toLowerCase()}</span></td>
                  <td><StatusPill status={member.status} /></td>
                  <td className="text-xs text-ink-500">{formatDate(member.since, lang)}</td>
                  <td className="text-right">
                    {canManage && member.role !== "TENANT_OWNER" ? (
                      <ActionButton
                        endpoint={`/api/tenant/members/${member.id}`}
                        body={{ status: member.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }}
                        label={member.status === "ACTIVE" ? t("tenant.removeMember") : "Reactivate"}
                        variant={member.status === "ACTIVE" ? "ghost" : "secondary"}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
