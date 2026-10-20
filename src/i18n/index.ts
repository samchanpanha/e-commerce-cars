import { cookies } from "next/headers";
import { en, translate, type Lang, type TranslationKey } from "./dictionary";

export type { Lang };

const LOCALE_COOKIE = "aev_locale";

export function isLang(value: string | null | undefined): value is Lang {
  return value === "en" || value === "km";
}

export async function getLang(): Promise<Lang> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLang(value) ? value : "en";
}

export type Translator = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export async function getT(): Promise<{ lang: Lang; t: Translator }> {
  const lang = await getLang();
  return { lang, t: (key, vars) => translate(lang, key, vars) };
}

/** Localized label for enum-ish codes (fuel type, body type, status…) with a safe fallback. */
export function labelFor(lang: Lang, dict: Record<string, string>, code: string): string {
  return dict[code] ?? code.toLowerCase().replaceAll("_", " ");
}

export const statusDict: Record<string, string> = {
  DRAFT: en["seller.status.DRAFT"],
  PENDING: en["seller.status.PENDING"],
  PUBLISHED: en["seller.status.PUBLISHED"],
  REJECTED: en["seller.status.REJECTED"],
  SOLD: en["seller.status.SOLD"],
  ARCHIVED: en["seller.status.ARCHIVED"],
};

export { translate };
