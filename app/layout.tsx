import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aegis | Risk & Fraud Intelligence",
  description: "Explainable risk signals, linked evidence and human-reviewed findings for banking and NBFC teams.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
