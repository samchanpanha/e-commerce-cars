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
    <html lang={lang === "km" ? "km" : "en"}>
      <body>{children}</body>
    </html>
  );
}
