import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "900"],
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
        className={`${dmSans.variable} font-sans antialiased`}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
