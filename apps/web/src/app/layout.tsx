import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppHeader } from "../components/layout/app-header";
import { SpaceBackdrop } from "../components/layout/space-backdrop";
import { Toaster } from "../components/ui/sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OmniGacha MVP",
  description: "Sistema inteligente de recomendación para Honkai: Star Rail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <SpaceBackdrop />
        <AppHeader />
        <div className="flex-1">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
