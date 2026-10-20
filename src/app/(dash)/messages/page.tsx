import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { getAuthContext } from "@/lib/auth";
import { getMessagesForUser } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { timeAgo } from "@/lib/money";
import { EmptyState } from "@/components/ui/empty";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) return null;
  const threads = await getMessagesForUser(ctx.user.id, ctx.memberships.map((m) => m.tenantId));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-xl font-bold text-ink-950 sm:text-2xl">{t("nav.messages")}</h1>
      <p className="mt-0.5 text-xs text-ink-500">
        {lang === "km" ? "សារទាំងអស់នៅក្នុង AngkorEV ដើម្បីឱ្យមានកំណត់ត្រាសុវត្ថិភាព។" : "Conversations stay inside AngkorEV so both sides have a record."}
      </p>

      <div className="card mt-4 divide-y divide-ink-100">
        {threads.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={lang === "km" ? "មិនទាន់មានសារ" : "No messages yet"}
              body={lang === "km" ? "សារទៅអ្នកលក់នឹងបង្ហាញនៅទីនេះ។" : "Messages you send to sellers appear here, with a record of the conversation."}
              icon={<MessageSquare className="h-8 w-8" />}
              action={<ButtonLink href="/cars">{t("nav.browse")}</ButtonLink>}
            />
          </div>
        ) : (
          threads.map((thread) => {
            const isBuyer = thread.buyerId === ctx.user!.id;
            const other = isBuyer ? thread.sellerName : thread.buyerName;
            return (
              <Link key={thread.id} href={`/messages/${thread.id}`} className="flex items-start gap-3 p-4 no-underline hover:bg-ink-50">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-800">
                  {other.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-ink-900">{other}</p>
                    <span className="shrink-0 text-[11px] text-ink-400">{timeAgo(thread.lastMessageAt, lang)}</span>
                  </div>
                  <p className="truncate text-xs text-ink-500">
                    {thread.year} {thread.make} {thread.model}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">{thread.lastMessage}</p>
                </div>
                {Number(thread.unread) > 0 ? <span className="mt-1 chip chip-warn shrink-0">{thread.unread} new</span> : null}
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
