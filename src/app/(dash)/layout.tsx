import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth";
import { getT } from "@/i18n";
import { DashboardShell } from "@/components/dashboard/shell";

export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const [ctx, { lang, t }] = await Promise.all([getAuthContext(), getT()]);
  if (!ctx.user) redirect("/login?next=/dashboard");
  return (
    <DashboardShell ctx={{ ...ctx, user: ctx.user }} t={t} lang={lang}>
      {children}
    </DashboardShell>
  );
}
