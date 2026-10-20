import Link from "next/link";
import { ArrowLeft, BadgeCheck, FileSearch, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 no-underline hover:text-brand-800">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to marketplace
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-[11px] text-ink-400">
          © {new Date().getFullYear()} AngkorEV · demonstration environment
        </p>
      </div>

      <aside className="relative hidden overflow-hidden bg-ink-950 lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/hero-phnom-penh.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/70 to-ink-950/20" />
        <div className="relative flex h-full flex-col justify-end p-10">
          <p className="eyebrow !text-brand-300">Evidence-first marketplace</p>
          <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight text-white">
            A listing that tells you what it does not know.
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-200">
            Verified documents, potential inconsistencies and missing data are shown separately — so you can decide what to check in person.
          </p>
          <ul className="mt-7 space-y-3">
            {[
              { icon: <BadgeCheck className="h-4 w-4" />, text: "Dealership verification with an explicit explanation" },
              { icon: <FileSearch className="h-4 w-4" />, text: "Vehicle reports with sources and confidence, in Khmer and English" },
              { icon: <ShieldCheck className="h-4 w-4" />, text: "Private documents, role-based access and a full audit trail" },
            ].map((item) => (
              <li key={item.text} className="flex items-start gap-2.5 text-sm text-ink-100">
                <span className="mt-0.5 text-brand-300">{item.icon}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
