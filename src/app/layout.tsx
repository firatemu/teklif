import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ToastProvider } from "@/components/ui/Toast";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AzemTeklif — Fiyat & Teklif Yönetim Portalı",
  description: "Azem Yazılım Logo Fiyat & Teklif Portalı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ToastProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-4rem)]">{children}</main>
        </ToastProvider>
      </body>
    </html>
  );
}