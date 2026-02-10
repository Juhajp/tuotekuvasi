import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "tuotekuvasi.fi - AI-tuotekuvageneraattori",
  description: "Luo ammattitasoisia vaatekuvia mallin päällä sekunneissa tekoälyn avulla. Kokeile ilmaista demoa!",
  keywords: "tuotekuvat, AI, kuvageneraattori, vaatekuvat, muotikuvat, verkkokauppa",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "tuotekuvasi.fi - AI-tuotekuvageneraattori",
    description: "Luo ammattitasoisia vaatekuvia mallin päällä sekunneissa",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fi">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
