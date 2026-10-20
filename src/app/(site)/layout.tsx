import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { getLang } from "@/i18n";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter lang={lang} />
    </div>
  );
}
