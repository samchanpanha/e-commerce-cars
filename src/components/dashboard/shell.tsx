import Link from "next/link";
import { eq, and, isNull, sql } from "drizzle-orm";
import {
  BarChart3,
  Bell,
  CarFront,
  FileSearch,
  Gauge,
  Heart,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { logoutAction, switchTenantAction } from "@/app/actions";
import type { AuthContext } from "@/lib/auth";
import type { Translator } from "@/i18n";
import { Logo } from "@/components/layout/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { DashLink } from "@/components/layout/nav-links";
import { MobileNav } from "@/components/layout/mobile-nav";

type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

export async function DashboardShell({
  ctx,
  t,
  lang,
  children,
}: {
  ctx: AuthContext & { user: NonNullable<AuthContext["user"]> };
  t: Translator;
  lang: "en" | "km";
  children: React.ReactNode;
}) {
  const unreadRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, ctx.user.id), isNull(notifications.readAt)));
  const unread = Number(unreadRows[0]?.count ?? 0);

  const groups: { title: string; items: NavItem[] }[] = [];

  if (ctx.isPlatformAdmin || ctx.isSupport) {
    groups.push({
      title: t("admin.title"),
      items: [
        { href: "/admin", label: t("admin.overview"), icon: <Gauge className="h-4 w-4" />, exact: true },
        { href: "/admin/tenants", label: t("admin.tenants"), icon: <Store className="h-4 w-4" /> },
        { href: "/admin/listings", label: t("admin.listings"), icon: <ListChecks className="h-4 w-4" /> },
        { href: "/admin/moderation", label: t("admin.moderation"), icon: <ShieldCheck className="h-4 w-4" /> },
        { href: "/admin/reports", label: t("admin.reports"), icon: <FileSearch className="h-4 w-4" /> },
        { href: "/admin/users", label: t("admin.users"), icon: <Users className="h-4 w-4" /> },
        { href: "/admin/audit", label: t("admin.audit"), icon: <BarChart3 className="h-4 w-4" /> },
      ],
    });
  }

  if (ctx.memberships.length > 0) {
    groups.push({
      title: t("tenant.title"),
      items: [
        { href: "/tenant", label: t("admin.overview"), icon: <Gauge className="h-4 w-4" />, exact: true },
        { href: "/tenant/inventory", label: t("tenant.inventory"), icon: <CarFront className="h-4 w-4" /> },
        { href: "/tenant/leads", label: t("tenant.leads"), icon: <MessageSquare className="h-4 w-4" /> },
        { href: "/tenant/analytics", label: t("tenant.analytics"), icon: <BarChart3 className="h-4 w-4" /> },
        { href: "/tenant/team", label: t("tenant.team"), icon: <Users className="h-4 w-4" /> },
        { href: "/tenant/settings", label: t("tenant.settings"), icon: <Settings className="h-4 w-4" /> },
      ],
    });
  }

  groups.push({
    title: t("seller.title"),
    items: [
      { href: "/seller", label: t("dash.overview"), icon: <LayoutDashboard className="h-4 w-4" />, exact: true },
      { href: "/seller/listings/new", label: t("dash.createListing"), icon: <Plus className="h-4 w-4" /> },
    ],
  });

  groups.push({
    title: t("customer.title"),
    items: [
      { href: "/customer", label: t("dash.overview"), icon: <Gauge className="h-4 w-4" />, exact: true },
      { href: "/customer/favorites", label: t("customer.favorites"), icon: <Heart className="h-4 w-4" /> },
      { href: "/customer/reports", label: t("customer.reports"), icon: <FileSearch className="h-4 w-4" /> },
      { href: "/messages", label: t("nav.messages"), icon: <MessageSquare className="h-4 w-4" /> },
      { href: "/dashboard/notifications", label: t("dash.notifications"), icon: <Bell className="h-4 w-4" /> },
    ],
  });

  const mobileItems = [
    ...groups.flatMap((g) => g.items.map((i) => ({ href: i.href, label: i.label }))),
    { href: "/cars", label: t("nav.browse") },
    { href: "/dealer", label: t("nav.dealers") },
  ];

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="mx-auto flex w-full max-w-[1440px]">
        {/* sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
          <div className="flex h-16 items-center border-b border-ink-100 px-4">
            <Logo />
          </div>

          {ctx.memberships.length > 0 ? (
            <div className="border-b border-ink-100 p-3">
              <label htmlFor="tenant-switch" className="text-[10px] font-bold uppercase tracking-wider text-ink-400">
                {t("dash.switchTenant")}
              </label>
              <form action={switchTenantAction} className="mt-1 flex gap-1.5">
                <select
                  id="tenant-switch"
                  name="tenantId"
                  defaultValue={ctx.activeTenantId ?? ctx.memberships[0]?.tenantId}
                  className="select !py-1.5 text-xs"
                >
                  {ctx.memberships.map((m) => (
                    <option key={m.tenantId} value={m.tenantId}>{m.tenantName}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-secondary btn-sm px-2" aria-label={t("dash.switch")}>
                  <Store className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          ) : null}

          <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Dashboard">
            {groups.map((group) => (
              <div key={group.title} className="mb-4">
                <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">{group.title}</p>
                <div className="space-y-0.5">
                  {group.items.map((item) => (
                    <DashLink key={item.href} href={item.href} exact={item.exact}>
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                    </DashLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-ink-100 p-3">
            <DashLink href="/cars">
              <Search className="h-4 w-4" /> {t("dash.viewSite")}
            </DashLink>
            <form action={logoutAction}>
              <button type="submit" className="dash-link w-full text-left">
                <LogOut className="h-4 w-4" /> {t("dash.signOut")}
              </button>
            </form>
          </div>
        </aside>

        {/* content */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/95 px-4 backdrop-blur sm:px-6">
            <div className="lg:hidden">
              <Logo compact />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-950">{ctx.activeTenant?.tenantName ?? t("dash.title")}</p>
              <p className="truncate text-[11px] text-ink-500">
                {ctx.user.name} · {ctx.activeTenant?.role ?? ctx.user.platformRole}
              </p>
            </div>

            <div className="ml-auto flex items-center gap-1">
              <LocaleSwitcher lang={lang} />
              <Link href="/dashboard/notifications" className="btn btn-ghost btn-sm relative" aria-label={t("dash.notifications")}>
                <Bell className="h-4 w-4" />
                {unread > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger-600 px-1 text-[10px] font-bold text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                ) : null}
              </Link>
              <Link href="/" className="hidden text-xs font-medium text-ink-500 no-underline hover:text-brand-800 sm:block">
                {t("dash.viewSite")}
              </Link>
              <div className="lg:hidden">
                <MobileNav
                  items={mobileItems}
                  footer={
                    <form action={logoutAction}>
                      <button type="submit" className="btn btn-secondary w-full">
                        <LogOut className="h-4 w-4" /> {t("dash.signOut")}
                      </button>
                    </form>
                  }
                />
              </div>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
