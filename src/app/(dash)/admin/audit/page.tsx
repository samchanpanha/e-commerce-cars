import { getAuditLog } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminAudit() {
  const [{ lang, t }, events] = await Promise.all([getT(), getAuditLog()]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("admin.audit")}</h1>
        <p className="mt-0.5 text-xs text-ink-500">
          Append-only record of sensitive actions. Passwords, tokens and document contents are never written here.
        </p>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>{t("admin.audit.time")}</th>
              <th>{t("admin.audit.action")}</th>
              <th>{t("admin.audit.actor")}</th>
              <th>{t("admin.audit.target")}</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td className="whitespace-nowrap text-[11px] text-ink-500">{formatDateTime(event.createdAt, lang)}</td>
                <td className="font-mono text-[11px] font-semibold text-ink-800">{event.action}</td>
                <td className="text-xs text-ink-600">
                  {event.actorName ?? "system"}
                  {event.actorRole ? <span className="ml-1 text-[10px] text-ink-400">({event.actorRole})</span> : null}
                </td>
                <td className="text-[11px] text-ink-500">
                  {event.targetType ? `${event.targetType}: ` : ""}
                  <span className="font-mono">{event.targetId?.slice(0, 18) ?? "—"}</span>
                </td>
                <td className="max-w-xs truncate text-[11px] text-ink-400">{event.metadataJson === "{}" ? "—" : event.metadataJson}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
