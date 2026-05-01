import type { Metadata, Viewport } from "next";
import { getLocale } from "next-intl/server";
import "react-grid-layout/css/styles.css";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "DesksAI",
  description: "Your AI-powered workspace",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "DesksAI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0d0d1a",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale().catch(() => "en");

  return (
    <html lang={locale} className="dark">
      <body>{children}</body>
    </html>
  );
}
