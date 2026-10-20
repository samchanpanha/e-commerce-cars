import type { Metadata, Viewport } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/noto-sans-khmer/400.css";
import "@fontsource/noto-sans-khmer/500.css";
import "@fontsource/noto-sans-khmer/700.css";
import "./globals.css";
import { getLang } from "@/i18n";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: {
    default: "AngkorEV — Evidence-first car marketplace for Cambodia",
    template: "%s · AngkorEV",
  },
  description:
    "Buy and sell cars in Cambodia with listings that show what is verified, what is unverified and what is unknown. Khmer and English.",
  applicationName: "AngkorEV",
  openGraph: {
    title: "AngkorEV — Evidence-first car marketplace for Cambodia",
    description: "Compare real listings and read vehicle reports that separate documents, observations and unknowns.",
    type: "website",
    locale: "en_KH",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c5f56",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLang();
  return (
    // Browser translation and password managers inject attributes (and sometimes
    // nodes) before React hydrates. The root element is the one place where that
    // must not be reported as an application bug; everything below still hydrates
    // strictly, so real mismatches remain visible.
    <html lang={lang === "km" ? "km" : "en"} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
