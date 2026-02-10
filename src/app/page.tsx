import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Building2, TestTube } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center space-y-4 mb-16 pt-12">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            tuotekuvasi.fi
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto">
            Luo ammattitasoisia vaatekuvia mallin päällä sekunneissa tekoälyn avulla
          </p>
          <div className="flex items-center justify-center gap-2 text-slate-500">
            <Sparkles className="w-5 h-5" />
            <span className="text-sm">Powered by Fal.ai & Supabase</span>
          </div>
        </div>

        {/* Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Demo Card */}
          <Card className="border-2 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300">
            <CardHeader className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center gap-2">
                <TestTube className="w-6 h-6" />
                <CardTitle className="text-2xl">Julkinen Demo</CardTitle>
              </div>
              <CardDescription className="text-blue-100">
                Kokeile palvelua ilmaiseksi ilman rekisteröitymistä
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Täysi valikoima vaatteita ja ympäristöjä</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Useita AI-malleja valittavana</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">✓</span>
                  <span>Ei vaadi kirjautumista</span>
                </li>
              </ul>
              <Button 
                asChild 
                size="lg" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-lg h-12"
              >
                <Link href="/demo">
                  <Sparkles className="mr-2 h-5 w-5" />
                  Kokeile demoa
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Client Card */}
          <Card className="border-2 shadow-xl hover:shadow-2xl transition-all hover:scale-105 duration-300 border-slate-300">
            <CardHeader className="bg-gradient-to-br from-slate-700 to-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                <CardTitle className="text-2xl">Yritysversio</CardTitle>
              </div>
              <CardDescription className="text-slate-300">
                Räätälöity ratkaisu yrityksellesi
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <ul className="space-y-2 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 font-bold">✓</span>
                  <span>Omat valinnat ja prompt-mallit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 font-bold">✓</span>
                  <span>Brändätty käyttöliittymä</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-slate-700 font-bold">✓</span>
                  <span>Prioriteettituki</span>
                </li>
              </ul>
              <div className="pt-2 space-y-3">
                <p className="text-sm text-slate-500">
                  Jos olet pilottiasiakkaamme, käytä saamaasi URL-osoitetta.
                </p>
                <p className="text-sm text-slate-600 font-medium">
                  Esimerkki: <code className="bg-slate-100 px-2 py-1 rounded text-xs">/client/yritys</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-8">
            Miten se toimii?
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-3">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold text-lg text-slate-800">Lataa kuva</h3>
              <p className="text-slate-600 text-sm">
                Valitse kuva vaatteesta tasaisella taustalla
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600">2</span>
              </div>
              <h3 className="font-semibold text-lg text-slate-800">Valitse asetukset</h3>
              <p className="text-slate-600 text-sm">
                Vaatetyyppi, malli, ympäristö ja AI-malli
              </p>
            </div>
            <div className="text-center space-y-3">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold text-lg text-slate-800">Lataa tulos</h3>
              <p className="text-slate-600 text-sm">
                AI luo ammattilaatukuvan mallin päällä
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center text-slate-400 text-sm mt-20 pb-8">
          <p>&copy; 2026 tuotekuvasi.fi</p>
          <p className="mt-2">
            Kiinnostaako yritysversio? Ota yhteyttä: <a href="mailto:info@tuotekuvasi.fi" className="text-blue-500 hover:underline">info@tuotekuvasi.fi</a>
          </p>
        </footer>
      </div>
    </main>
  );
}
