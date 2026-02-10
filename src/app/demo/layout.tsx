import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo - tuotekuvasi.fi',
  description: 'Kokeile AI-kuvageneraattoria ilmaiseksi. Luo ammattitasoisia vaatekuvia mallin päällä sekunneissa.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
