import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { Bell } from "lucide-react";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getNotifications } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime } from "@/lib/money";
import { EmptyState } from "@/components/ui/empty";

async function markAllRead() {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx.user) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, ctx.user.id), isNull(notifications.readAt)));
  revalidatePath("/dashboard/notifications");
  revalidatePath("/", "layout");
}

export default async function NotificationsPage() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  const items = await getNotifications(ctx.user.id);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-ink-950">{t("dash.notifications")}</h1>
        {items.some((n) => !n.readAt) ? (
          <form action={markAllRead}>
            <button type="submit" className="btn btn-secondary btn-sm">{t("dash.markAllRead")}</button>
          </form>
        ) : null}
      </div>

      <div className="card mt-4 divide-y divide-ink-100">
        {items.length === 0 ? (
          <div className="p-6">
            <EmptyState title={t("dash.noNotifications")} icon={<Bell className="h-7 w-7" />} />
          </div>
        ) : (
          items.map((item) => {
            const data = safeParse(item.dataJson) as { car?: string; amount?: number };
            const label = translateNotification(item.titleKey, t, data);
            return (
              <div key={item.id} className={`flex items-start gap-3 p-4 ${item.readAt ? "" : "bg-brand-50/40"}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.readAt ? "bg-ink-200" : "bg-brand-600"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">{label}</p>
                  <p className="mt-0.5 text-[11px] text-ink-400">{formatDateTime(item.createdAt, lang)}</p>
                </div>
                {item.link ? (
                  <Link href={item.link} className="text-xs font-semibold text-brand-700 no-underline hover:underline">
                    Open
                  </Link>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function safeParse(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function translateNotification(
  titleKey: string,
  t: (key: Parameters<typeof import("@/i18n/dictionary").translate>[1], vars?: Record<string, string | number>) => string,
  data: { car?: string; amount?: number },
): string {
  try {
    return t(titleKey as Parameters<typeof t>[0], { car: data.car ?? "a car", amount: data.amount ?? 0 });
  } catch {
    return titleKey;
  }
}
