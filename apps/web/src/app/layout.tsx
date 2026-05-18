import type { Metadata } from "next";
import { AppHeader } from "../components/layout/app-header";
import { Toaster } from "../components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "OmniGacha MVP",
  description: "Sistema inteligente de recomendacion para Honkai: Star Rail.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <AppHeader />
        <div className="flex-1">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
