import type { Metadata } from "next";
import { getT } from "@/i18n";
import { CompareTable } from "@/components/listing/compare-table";
import { CompareBar } from "@/components/listing/compare";

export const metadata: Metadata = {
  title: "Compare cars — price, mileage and evidence",
  description: "Compare up to three cars side by side, including what each vehicle report actually verified.",
};

export default async function ComparePage() {
  const { lang, t } = await getT();

  return (
    <div className="container-wide py-9">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold text-ink-950 sm:text-3xl">{t("compare.title")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{t("compare.emptyBody")}</p>
      </div>
      <CompareTable lang={lang} />
      <CompareBar />
    </div>
  );
}
