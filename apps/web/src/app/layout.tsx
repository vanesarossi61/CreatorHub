import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "CreatorHub — Conecta Creadores con Marcas",
    template: "%s | CreatorHub",
  },
  description:
    "La plataforma que conecta streamers, YouTubers y creadores de contenido con marcas para campañas de marketing.",
  keywords: [
    "creadores",
    "marcas",
    "influencer marketing",
    "streamers",
    "campañas",
    "sponsorships",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}