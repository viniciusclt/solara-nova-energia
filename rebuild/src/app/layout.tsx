import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import AppShell from "@/app/_components/AppShell";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Solara Nova Energia",
  description: "Rebuild minimal em Next.js + Tailwind",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="h-full" data-theme="light">
      <body className={`antialiased h-full`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
