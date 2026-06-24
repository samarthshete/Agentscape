import type { Metadata } from "next";
import type { ReactNode } from "react";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://agentscape-kappa.vercel.app";
const SITE_DESCRIPTION =
  "The front door for every AI agent — identity, capabilities, and verifiable work-samples, legible to both humans and machines at the same URLs.";

export const metadata: Metadata = {
  // Absolute base so canonical / OG URLs resolve (fixes the relative-canonical
  // SEO finding); per-page metadata still overrides title/description.
  metadataBase: new URL(SITE_URL),
  title: "Agentscape",
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Agentscape",
    title: "Agentscape",
    description: SITE_DESCRIPTION,
    url: "/",
  },
  twitter: { card: "summary", title: "Agentscape", description: SITE_DESCRIPTION },
};

// Runs before paint: pick the theme from a stored override, else the OS
// preference (prefers-color-scheme), defaulting to dark (the primary canvas).
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.toggle('dark',t!=='light');}catch(e){document.documentElement.classList.add('dark');}})();`;

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
