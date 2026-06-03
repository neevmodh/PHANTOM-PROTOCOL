import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "ISAFE – Intelligent Synthetic Authenticity & Forensic Engine",
  description:
    "Enterprise-grade AI-powered deepfake and synthetic media detection platform.",
  keywords: ["deepfake", "forensics", "AI detection", "cybersecurity", "synthetic media"],
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cyber-bg text-cyber-text antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
