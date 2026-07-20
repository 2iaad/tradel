import type { Metadata, Viewport } from "next";

import "../styles/swiper.css";
import "../styles/site.css";
import "../styles/tradel.css";

export const metadata: Metadata = {
  title: "Tradel — AI-powered trading agents",
  description:
    "Create, direct, and evolve autonomous AI trading agents in one conversation.",
  applicationName: "Tradel",
  robots: { index: false, follow: false, noarchive: true },
  icons: { icon: { url: "/favicon.svg", type: "image/svg+xml" } },
};

export const viewport: Viewport = {
  themeColor: "#050505",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body data-theme="default" data-educational-clone="true">
        {children}
      </body>
    </html>
  );
}
