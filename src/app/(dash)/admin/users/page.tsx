import { getAdminUsers } from "@/lib/dashboard";
import { getAuthContext } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { getT } from "@/i18n";
import { formatDate } from "@/lib/money";
import { StatusPill } from "@/components/dashboard/kpi";
import { ActionButton, ReasonAction } from "@/components/dashboard/action-button";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const [{ lang, t }, ctx, users] = await Promise.all([getT(), getAuthContext(), getAdminUsers()]);
  const superAdmin = isSuperAdmin(ctx);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.users")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          {superAdmin
            ? "Platform role changes and suspensions are restricted to super admins and fully audited."
            : "Support accounts can review users but cannot change platform roles or suspend accounts."}
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>User</th>
              <th>Platform role</th>
              <th>{t("common.status")}</th>
              <th className="text-right">Listings</th>
              <th className="text-right">Tenants</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <p className="text-sm font-medium text-ink-900">{user.name}</p>
                  <p className="text-[11px] text-ink-400">{user.email}{user.phone ? ` · ${user.phone}` : ""}</p>
                </td>
                <td><span className="chip chip-slate">{user.platformRole.replaceAll("_", " ").toLowerCase()}</span></td>
                <td><StatusPill status={user.status} /></td>
                <td className="text-right text-xs text-ink-600">{user.listings}</td>
                <td className="text-right text-xs text-ink-600">{user.memberships}</td>
                <td className="text-xs text-ink-500">{formatDate(user.createdAt, lang)}</td>
                <td>
                  {superAdmin && user.id !== ctx.user?.id ? (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {user.status === "ACTIVE" ? (
                        <ReasonAction endpoint={`/api/admin/users/${user.id}`} body={{ action: "SUSPEND" }} label="Suspend" placeholder="Reason for suspending this account" promptLabel="Suspend" minLength={5} />
                      ) : (
                        <ActionButton endpoint={`/api/admin/users/${user.id}`} body={{ action: "REACTIVATE" }} label="Reactivate" variant="secondary" />
                      )}
                      {user.platformRole === "USER" ? (
                        <ActionButton endpoint={`/api/admin/users/${user.id}`} body={{ action: "SET_ROLE", role: "PLATFORM_SUPPORT" }} label="Make support" variant="ghost" confirmText="Grant platform support access?" />
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-[11px] text-ink-400">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
