# Deployment Checklist - Vercel

Tämä lista sisältää kaikki tarvittavat vaiheet MVP:n julkaisuun Vercelissä.

## ✅ Valmisteltu (Code Changes Complete)

- [x] Backend refaktoroitu async-malliksi (Vercel-yhteensopiva)
- [x] Frontend päivitetty polling-mekanismilla
- [x] Tietokantaskeema päivitetty status-seurantaan
- [x] `vercel.json` konfiguraatio lisätty (60s timeout)
- [x] `.env.example` luotu
- [x] README.md dokumentaatio
- [x] Linter-virheet korjattu

## 🔧 Supabase Setup (Tee ennen Vercel-julkaisua)

### 1. Aja SQL-migraatiot Supabase SQL Editorissa

Kirjaudu Supabase-projektiisi ja mene SQL Editor -välilehdelle.

#### Vaihe 1: Päivitä tietokantaskeema async-tukea varten

Kopioi ja aja tämä SQL-koodi:

```sql
-- Migration: Add status tracking for async generation
-- Run this in Supabase SQL Editor

-- Add status column to track generation progress
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed'));

-- Add error message column for failed generations
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Add fal_request_id to track Fal.ai queue requests
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS fal_request_id TEXT;

-- Update timestamp for tracking when processing started/completed
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Create index for faster status polling
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON public.generated_images(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_generated_images_id ON public.generated_images(id);
```

#### Vaihe 2: Varmista Storage-bucketit ja RLS-käytännöt

Jos storage-bucketit (`uploads`, `generations`) eivät ole julkisia, aja:

```sql
-- Make storage buckets public
UPDATE storage.buckets SET public = true WHERE id IN ('uploads', 'generations');

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- Allow public read for all buckets (MVP setup)
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT TO public USING (true);

-- Allow authenticated/service_role insert for uploads and generations
CREATE POLICY "Authenticated users can upload" ON storage.objects
FOR INSERT TO authenticated, service_role
WITH CHECK (bucket_id IN ('uploads', 'generations'));
```

### 2. Tarkista ympäristömuuttujat

Varmista että sinulla on nämä arvot valmiina:

- `NEXT_PUBLIC_SUPABASE_URL` (löytyy: Settings → API)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (löytyy: Settings → API)
- `SUPABASE_SERVICE_ROLE_KEY` (löytyy: Settings → API → Service Role -avain, **pidä salassa!**)
- `FAL_KEY` (rekisteröidy osoitteessa https://fal.ai ja luo API key)

## 🚀 Vercel Deployment

### 1. Alusta Git-repositorio (jos ei vielä tehty)

```bash
git init
git add .
git commit -m "Initial commit - MVP ready for Vercel"
```

### 2. Luo GitHub-repositorio

1. Mene osoitteeseen https://github.com/new
2. Luo uusi repositorio (voi olla private)
3. Yhdistä paikallinen repositorio:

```bash
git remote add origin https://github.com/your-username/tuotekuvasi-fi.git
git branch -M main
git push -u origin main
```

### 3. Deploy Verceliin

1. Mene osoitteeseen https://vercel.com
2. Klikkaa "Add New Project"
3. Tuo GitHub-repositorio
4. **Konfiguroi ympäristömuuttujat** (Environment Variables):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `FAL_KEY`
5. Klikkaa "Deploy"

### 4. Odota deployment valmistumista

Vercel rakentaa projektin (kestää ~2-5 min). Saat deployment-URL:n (esim. `tuotekuvasi-fi.vercel.app`).

## 🧪 Testaus Production-ympäristössä

1. Avaa deployment-URL
2. Lataa testikuva (esim. t-paita)
3. Valitse asetukset (vaatetyyppi, sukupuoli, ympäristö, malli)
4. Klikkaa "Luo uusi kuva"
5. Varmista että:
   - Latausruutu näkyy
   - Polling käynnistyy (3s välein)
   - Tulos näytetään kun valmis
   - Voit ladata genneroidun kuvan

## ⚙️ Vercel Configuration

`vercel.json` on jo valmiina:

```json
{
  "functions": {
    "src/app/actions/**/*.ts": {
      "maxDuration": 60
    }
  }
}
```

Tämä antaa Server Actionsille 60 sekunnin timeout-ajan (riittää async-prosessointiin).

## 🐛 Troubleshooting

### Ongelma: "Timeout Error"
- Tarkista että `vercel.json` on commitoitu
- Varmista että Vercel Pro -tilaus on aktiivinen (jos tarvitset yli 10s timeoutia Free-planilla)

### Ongelma: "Database Error" tai "RLS Policy Violation"
- Aja Supabase SQL -migraatiot uudelleen
- Tarkista että `SUPABASE_SERVICE_ROLE_KEY` on oikein asetettu Vercelissä

### Ongelma: "Fal.ai Unprocessable Entity"
- Varmista että `FAL_KEY` on oikein
- Tarkista että kuva on JPG/PNG-formaatissa ja alle 10 MB

### Ongelma: Kuvat eivät lataudu (404)
- Tarkista Supabase Storage -bucketit ovat `public = true`
- Tarkista RLS-käytännöt storage.objects-taulussa

## 📊 Kustannukset (arvioitu MVP:lle)

- **Vercel Free Plan**: Riittää aluksi (100 GB bandwidth/mo, Hobby-projekteihin)
- **Supabase Free Plan**: 500 MB storage, 2 GB bandwidth/mo
- **Fal.ai**: Pay-as-you-go, ~$0.10-0.50 per image (riippuu mallista)

Kun käyttäjämäärät kasvavat, kannattaa päivittää Vercel Pro ($20/mo) ja Supabase Pro ($25/mo).

## 🎉 Valmis!

Kun kaikki vaiheet on suoritettu, MVP on livenä Vercelissä ja valmis käytettäväksi!
