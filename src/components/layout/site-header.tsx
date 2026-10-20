import Link from "next/link";
import { and, eq, isNull, sql } from "drizzle-orm";
import { Bell, Heart, LayoutDashboard, LogOut, MessageSquare, Plus, ShieldCheck, Store } from "lucide-react";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { logoutAction } from "@/app/actions";
import { getAuthContext } from "@/lib/auth";
import { getT } from "@/i18n";
import { Logo } from "./logo";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-links";
import { ButtonLink } from "@/components/ui/button";

export async function SiteHeader() {
  const [{ lang, t }, ctx] = await Promise.all([getT(), getAuthContext()]);

  let unread = 0;
  if (ctx.user) {
    const rows = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, ctx.user.id), isNull(notifications.readAt)));
    unread = Number(rows[0]?.count ?? 0);
  }

  const navItems = [
    { href: "/cars", label: t("nav.browse") },
    { href: "/dealers", label: t("nav.dealers") },
    { href: "/reports", label: t("nav.reports") },
  ];

  const dashHref = ctx.isPlatformAdmin || ctx.isSupport
    ? "/admin"
    : ctx.memberships.length
      ? "/tenant"
      : "/customer";

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/90 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-brand-700 focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="container-wide flex h-16 items-center gap-3">
        <Logo />

        <nav className="ml-3 hidden items-center gap-0.5 md:flex" aria-label="Main">
          {navItems.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <LocaleSwitcher lang={lang} />

          {ctx.user ? (
            <>
              <Link href="/customer/favorites" className="btn btn-ghost btn-sm hidden sm:inline-flex" aria-label={t("nav.favorites")}>
                <Heart className="h-4 w-4" />
              </Link>
              <Link href="/messages" className="btn btn-ghost btn-sm relative hidden sm:inline-flex" aria-label={t("nav.messages")}>
                <MessageSquare className="h-4 w-4" />
              </Link>
              <Link href="/dashboard/notifications" className="btn btn-ghost btn-sm relative" aria-label={t("dash.notifications")}>
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>

              <details className="relative hidden md:block">
                <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ink-100">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-800">
                    {ctx.user.name.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="max-w-28 truncate text-sm font-semibold text-ink-800">{ctx.user.name}</span>
                </summary>
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-ink-200 bg-white p-1.5 shadow-xl">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold text-ink-900">{ctx.user.name}</p>
                    <p className="truncate text-xs text-ink-500">{ctx.user.email}</p>
                  </div>
                  <div className="my-1 h-px bg-ink-100" />
                  <Link href={dashHref} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline hover:bg-ink-100">
                    <LayoutDashboard className="h-4 w-4" /> {t("nav.dashboard")}
                  </Link>
                  <Link href="/messages" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline hover:bg-ink-100">
                    <MessageSquare className="h-4 w-4" /> {t("nav.messages")}
                  </Link>
                  <Link href="/seller/listings/new" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline hover:bg-ink-100">
                    <Plus className="h-4 w-4" /> {t("nav.sell")}
                  </Link>
                  {ctx.isPlatformAdmin || ctx.isSupport ? (
                    <Link href="/admin" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline hover:bg-ink-100">
                      <ShieldCheck className="h-4 w-4" /> {t("nav.admin")}
                    </Link>
                  ) : null}
                  <div className="my-1 h-px bg-ink-100" />
                  <form action={logoutAction}>
                    <button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-ink-700 hover:bg-ink-100">
                      <LogOut className="h-4 w-4" /> {t("nav.logout")}
                    </button>
                  </form>
                </div>
              </details>
            </>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">
                {t("nav.login")}
              </Link>
              <ButtonLink href="/register" size="sm" className="hidden sm:inline-flex">
                {t("nav.register")}
              </ButtonLink>
            </>
          )}

          <ButtonLink href="/seller/listings/new" size="sm" variant="secondary" className="hidden lg:inline-flex">
            <Plus className="h-4 w-4" /> {t("nav.sell")}
          </ButtonLink>

          <MobileNav
            items={[
              ...navItems,
              { href: "/seller/listings/new", label: t("nav.sell") },
              ctx.user
                ? { href: dashHref, label: t("nav.dashboard") }
                : { href: "/login", label: t("nav.login") },
              ...(ctx.user ? [] : [{ href: "/register", label: t("nav.register") }]),
              { href: "/dealers", label: t("nav.dealers") },
            ]}
            footer={
              ctx.user ? (
                <div className="space-y-2">
                  <p className="px-1 text-xs text-ink-500">{ctx.user.email}</p>
                  <form action={logoutAction}>
                    <button type="submit" className="btn btn-secondary w-full">
                      <LogOut className="h-4 w-4" /> {t("nav.logout")}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link href="/login" className="btn btn-secondary">{t("nav.login")}</Link>
                  <Link href="/register" className="btn btn-primary">{t("nav.register")}</Link>
                </div>
              )
            }
          />
        </div>
      </div>
    </header>
  );
}

export function SiteFooter({ lang }: { lang: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-20 border-t border-ink-200 bg-ink-50">
      <div className="container-wide grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-500">
            {lang === "km"
              ? "វេទិការថយន្តកម្ពុជា ដែលបង្ហាញភស្តុតាង មិនមែនការធានា។"
              : "A Cambodian car marketplace built around evidence, not guarantees."}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-500">
            <Store className="h-4 w-4" /> Phnom Penh, Cambodia
          </div>
        </div>
        <FooterColumn
          title={lang === "km" ? "វេទិកា" : "Marketplace"}
          links={[
            { href: "/cars", label: lang === "km" ? "រកមើលរថយន្ត" : "Browse cars" },
            { href: "/dealers", label: lang === "km" ? "សាលដេឡា" : "Dealerships" },
            { href: "/compare", label: lang === "km" ? "ប្រៀបធៀប" : "Compare" },
            { href: "/seller/listings/new", label: lang === "km" ? "លក់រថយន្ត" : "Sell a car" },
          ]}
        />
        <FooterColumn
          title={lang === "km" ? "ទំនុកចិត្ត" : "Trust"}
          links={[
            { href: "/reports", label: lang === "km" ? "របៀបរបាយការណ៍" : "How reports work" },
            { href: "/reports/sample", label: lang === "km" ? "របាយការណ៍គំរូ" : "Sample report" },
            { href: "/safety", label: lang === "km" ? "ការណែនាំសុវត្ថិភាព" : "Safety guidance" },
            { href: "/pricing", label: lang === "km" ? "សម្រាប់សាលដេឡា" : "For dealerships" },
          ]}
        />
        <div>
          <h3 className="text-sm font-bold text-ink-900">{lang === "km" ? "ព័ត៌មាន" : "About this build"}</h3>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            {lang === "km"
              ? "AngkorEV ជាគំរូផលិតផលសម្រាប់កម្ពុជា។ ការផ្សាយ តម្លៃ និងលទ្ធផលរបាយការណ៍ក្នុងបរិស្ថាននេះជាទិន្នន័យគំរូ មិនមែនការផ្តល់ជូនពាណិជ្ជកម្មទេ។"
              : "AngkorEV is a product prototype for Cambodia. Listings, prices and report findings in this environment are seeded sample data, not commercial offers."}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-500">
            {lang === "km"
              ? "តម្លៃបង្ហាញជាដុល្លារ ជាមួយការបំប្លែងរៀលប៉ាន់ស្មាន។ AngkorEV មិនកាន់ប្រាក់អ្នកទិញទេ។"
              : "Prices are USD with an indicative riel conversion. AngkorEV does not hold buyer funds."}
          </p>
        </div>
      </div>
      <div className="border-t border-ink-200">
        <div className="container-wide flex flex-col items-start justify-between gap-2 py-5 text-xs text-ink-500 sm:flex-row sm:items-center">
          <p>© {year} AngkorEV — product prototype for the Cambodian market.</p>
          <p>{lang === "km" ? "បង្កើតដោយគិតគូរពីទូរស័ព្ទ និងអ៊ីនធឺណិតយឺត" : "Designed mobile-first for Cambodian networks"}</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <h3 className="text-sm font-bold text-ink-900">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-sm text-ink-500 no-underline hover:text-brand-800 hover:underline">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
