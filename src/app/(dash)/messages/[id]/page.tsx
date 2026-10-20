import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { db } from "@/db";
import { conversations, messages, notifications } from "@/db/schema";
import { getAuthContext } from "@/lib/auth";
import { getConversation, markConversationRead } from "@/lib/dashboard";
import { getT } from "@/i18n";
import { formatDateTime, timeAgo } from "@/lib/money";
import { newId } from "@/lib/ids";
import { messageSchema } from "@/lib/validation";

async function sendMessage(formData: FormData) {
  "use server";
  const ctx = await getAuthContext();
  if (!ctx.user) redirect("/login");
  const parsed = messageSchema.safeParse({ body: formData.get("body") });
  if (!parsed.success) return;
  const conversationId = String(formData.get("conversationId") ?? "");

  const rows = await db.select().from(conversations).where(eq(conversations.id, conversationId)).limit(1);
  const conversation = rows[0];
  if (!conversation) return;
  const isMember =
    conversation.buyerId === ctx.user.id ||
    conversation.sellerId === ctx.user.id ||
    (conversation.tenantId ? ctx.memberships.some((m) => m.tenantId === conversation.tenantId) : false);
  if (!isMember) return;

  await db.insert(messages).values({ id: newId("msg"), conversationId, senderId: ctx.user.id, body: parsed.data.body });
  await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, conversationId));

  const recipient = conversation.buyerId === ctx.user.id ? conversation.sellerId : conversation.buyerId;
  await db.insert(notifications).values({
    id: newId("ntf"),
    userId: recipient,
    type: "MESSAGE",
    titleKey: "notifications.newMessage",
    dataJson: JSON.stringify({ car: conversation.subject ?? "a car" }),
    link: `/messages/${conversationId}`,
  });

  await db
    .update(messages)
    .set({ readAt: new Date() })
    .where(and(eq(messages.conversationId, conversationId), ne(messages.senderId, ctx.user.id)));
  revalidatePath(`/messages/${conversationId}`);
}

export const dynamic = "force-dynamic";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);
  if (!ctx.user) redirect(`/login?next=/messages/${id}`);

  const data = await getConversation(id);
  if (!data) notFound();

  const isBuyer = data.conversation.buyerId === ctx.user.id;
  const isSeller = data.conversation.sellerId === ctx.user.id;
  const isTenantStaff = data.conversation.tenantId ? ctx.memberships.some((m) => m.tenantId === data.conversation.tenantId) : false;
  const isStaff = ctx.isPlatformAdmin || ctx.isSupport;
  if (!isBuyer && !isSeller && !isTenantStaff && !isStaff) notFound();

  await markConversationRead(id, ctx.user.id);
  const otherName = isBuyer ? "Seller" : data.buyerName;

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/messages" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 no-underline hover:text-brand-800">
        <ArrowLeft className="h-3.5 w-3.5" /> {t("nav.messages")}
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-bold text-ink-950">{otherName}</h1>
          {data.listingSlug ? (
            <Link href={`/cars/${data.listingSlug}`} className="text-xs text-brand-700 no-underline hover:underline">
              {data.year} {data.make} {data.model} · {data.priceUsd ? `$${data.priceUsd.toLocaleString("en-US")}` : ""}
            </Link>
          ) : null}
        </div>
        <span className="chip chip-slate">{isBuyer ? "You are the buyer" : "You are the seller"}</span>
      </div>

      <div className="card mt-4 flex h-[60vh] flex-col">
        <ol className="flex-1 space-y-3 overflow-y-auto p-4">
          {data.messages.map((msg) => {
            const mine = msg.senderId === ctx.user!.id;
            if (msg.kind === "SAFETY_NOTICE") {
              return (
                <li key={msg.id} className="mx-auto flex max-w-md items-start gap-2 rounded-xl border border-gold-300/50 bg-gold-100/40 px-3 py-2 text-[11px] leading-relaxed text-warn-700">
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {msg.body}
                </li>
              );
            }
            return (
              <li key={msg.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                <div className={mine ? "max-w-[85%] rounded-2xl rounded-br-md bg-brand-700 px-3.5 py-2.5 text-white" : "max-w-[85%] rounded-2xl rounded-bl-md bg-ink-100 px-3.5 py-2.5 text-ink-900"}>
                  <p className="whitespace-pre-line text-sm leading-relaxed">{msg.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-brand-100/80" : "text-ink-400"}`}>
                    {formatDateTime(msg.createdAt, lang)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        <form action={sendMessage} className="border-t border-ink-100 p-3">
          <input type="hidden" name="conversationId" value={id} />
          <div className="flex items-end gap-2">
            <textarea
              name="body"
              required
              maxLength={2000}
              placeholder={lang === "km" ? "សរសេរសារ…" : "Write a message…"}
              className="textarea min-h-11 flex-1 !py-2.5"
              rows={1}
            />
            <button type="submit" className="btn btn-primary">{lang === "km" ? "ផ្ញើ" : "Send"}</button>
          </div>
          <p className="mt-1.5 text-[10px] text-ink-400">
            {lang === "km"
              ? "កុំផ្ញើប្រាក់កក់មុនពេលមើលរថយន្ត។ AngkorEV មិនកាន់ប្រាក់ទេ។"
              : "Never send a deposit before viewing the car. AngkorEV does not hold funds."}
          </p>
        </form>
      </div>

      <p className="mt-3 text-[11px] text-ink-400">
        Conversation opened {timeAgo(data.conversation.createdAt, lang)} · {data.conversation.status.toLowerCase()}
      </p>
    </div>
  );
}
