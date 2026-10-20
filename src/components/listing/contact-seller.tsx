"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, MessageSquare, Send, Tag } from "lucide-react";
import { clsx } from "clsx";

type Tab = "MESSAGE" | "VIEWING" | "OFFER";

export function ContactSeller({
  listingId,
  priceUsd,
  isAuthed,
  sellerName,
}: {
  listingId: string;
  priceUsd: number;
  isAuthed: boolean;
  sellerName: string;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("MESSAGE");
  const [message, setMessage] = useState("");
  const [when, setWhen] = useState("");
  const [amount, setAmount] = useState(String(Math.round(priceUsd * 0.94)));
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error" | "auth">("idle");
  const [error, setError] = useState<string | null>(null);
  const [minWhen, setMinWhen] = useState<string | undefined>(undefined);
  const [, startTransition] = useTransition();

  // Never compute this during render: the server and the browser would produce
  // different minutes, which is a hydration mismatch even though both values
  // look correct. Setting it after mount also keeps it in the visitor's local
  // timezone, since <input type="datetime-local"> reads local time.
  useEffect(() => {
    const d = new Date(Date.now() + 30 * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, "0");
    setMinWhen(
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
    );
  }, []);

  if (!isAuthed) {
    return (
      <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 text-center">
        <p className="text-sm font-semibold text-ink-900">Sign in to message {sellerName}</p>
        <p className="mt-1 text-xs text-ink-500">Messages stay inside AngkorEV so both sides have a record.</p>
        <a href={`/login?next=/cars`} className="btn btn-primary mt-3 w-full no-underline">
          Sign in to contact the seller
        </a>
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");

    startTransition(async () => {
      try {
        if (tab === "OFFER") {
          const res = await fetch("/api/offers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ listingId, amountUsd: Number(amount), message }),
          });
          const json = await res.json();
          if (res.status === 401) return setState("auth");
          if (!res.ok) throw new Error(json?.error?.message ?? "Could not send the offer.");
        } else {
          const res = await fetch("/api/inquiries", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              listingId,
              message: message.trim() || (tab === "VIEWING" ? "I would like to view this car." : ""),
              intent: tab === "VIEWING" ? "VIEWING" : "QUESTION",
              appointmentAt: tab === "VIEWING" && when ? new Date(when).toISOString() : null,
            }),
          });
          const json = await res.json();
          if (res.status === 401) return setState("auth");
          if (!res.ok) throw new Error(json?.error?.message ?? "Could not send your message.");
        }
        setState("sent");
        setMessage("");
        setWhen("");
        router.refresh();
      } catch (err) {
        setState("error");
        setError(err instanceof Error ? err.message : "Could not send your message.");
      }
    });
  }

  if (state === "sent") {
    return (
      <div className="rounded-xl border border-ok-100 bg-ok-100/60 p-4">
        <p className="text-sm font-semibold text-ok-700">
          {tab === "OFFER" ? "Offer sent." : tab === "VIEWING" ? "Viewing request sent." : "Message sent."}
        </p>
        <p className="mt-1 text-xs text-ok-700/90">
          {tab === "VIEWING"
            ? "The seller will confirm the appointment in Messages."
            : "You can continue the conversation in Messages."}
        </p>
        <div className="mt-3 flex gap-2">
          <a href="/messages" className="btn btn-secondary btn-sm no-underline">Open messages</a>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setState("idle")}>Send another</button>
        </div>
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "MESSAGE", label: "Message", icon: <MessageSquare className="h-3.5 w-3.5" /> },
    { id: "VIEWING", label: "Viewing", icon: <CalendarClock className="h-3.5 w-3.5" /> },
    { id: "OFFER", label: "Offer", icon: <Tag className="h-3.5 w-3.5" /> },
  ];

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-ink-100 p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => { setTab(item.id); setState("idle"); }}
            className={clsx(
              "flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition",
              tab === item.id ? "bg-white text-ink-950 shadow-sm" : "text-ink-600 hover:text-ink-900",
            )}
            aria-pressed={tab === item.id}
          >
            {item.icon} {item.label}
          </button>
        ))}
      </div>

      {tab === "VIEWING" ? (
        <div>
          <label htmlFor="viewing-when" className="label">Preferred date and time</label>
          <input
            id="viewing-when"
            type="datetime-local"
            className="input"
            value={when}
            min={minWhen}
            onChange={(e) => setWhen(e.target.value)}
            required
          />
        </div>
      ) : null}

      {tab === "OFFER" ? (
        <div>
          <label htmlFor="offer-amount" className="label">Your offer (USD)</label>
          <input
            id="offer-amount"
            type="number"
            inputMode="numeric"
            min={200}
            step={100}
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
          <p className="hint">Offers are recorded for both sides. AngkorEV never holds your money.</p>
        </div>
      ) : null}

      <div>
        <label htmlFor="contact-message" className="label">
          {tab === "OFFER" ? "Message (optional)" : tab === "VIEWING" ? "Message (optional)" : "Message"}
        </label>
        <textarea
          id="contact-message"
          className="textarea min-h-24"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={tab === "VIEWING" ? "I would like to see the car and check the chassis number." : "Is the car still available? Can you share service records?"}
          required={tab === "MESSAGE"}
          maxLength={2000}
        />
      </div>

      {error ? <p className="text-xs font-medium text-danger-700" role="alert">{error}</p> : null}

      <button type="submit" className="btn btn-primary w-full" disabled={state === "sending"}>
        <Send className="h-4 w-4" />
        {state === "sending" ? "Sending…" : tab === "OFFER" ? "Send offer" : tab === "VIEWING" ? "Request viewing" : "Send message"}
      </button>
      <p className="text-center text-[11px] leading-relaxed text-ink-400">
        Never send a deposit before you have seen the car and its original registration card.
      </p>
    </form>
  );
}
