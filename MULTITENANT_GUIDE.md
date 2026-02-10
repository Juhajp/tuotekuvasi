# Multi-Tenant Arkkitehtuuri - Käyttöohje

Tuotekuvasi.fi tukee nyt multi-tenant arkkitehtuuria, joka mahdollistaa:
- ✅ Julkinen demo-versio kaikille
- ✅ Asiakaskohtaiset räätälöidyt versiot
- ✅ Omat dropdownit ja prompt-mallit per asiakas
- ✅ Brändätyt käyttöliittymät

---

## 📋 Arkkitehtuurin Rakenne

```
/                        → Landing page (valinta: Demo tai Yritysversio)
/demo                    → Julkinen demo (aiempi MVP)
/client/[slug]           → Asiakaskohtainen versio (esim. /client/pilot)
```

### Tietokanta

**Uusi taulu:** `clients`
- Tallentaa asiakaskohtaiset asetukset
- Jokaisella asiakkaalla uniikki `slug` (URL-tunniste)
- Custom dropdownit JSONB-muodossa
- Base prompt ja brändäys

**Päivitetty taulu:** `generated_images`
- Lisätty `client_id` kenttä (viittaus `clients`-tauluun)
- Mahdollistaa analytics per asiakas

---

## 🚀 Asennusohjeet

### 1. Aja Supabase SQL-migraatio

Kirjaudu Supabase-projektiisi ja aja SQL Editor:ssä:

```bash
# Tiedosto: supabase/migration_multitenant.sql
```

Tämä luo:
- `clients`-taulun
- Lisää `client_id` kentän `generated_images`-tauluun
- Luo RLS-käytännöt
- Lisää esimerkkidata (`demo` ja `pilot` asiakkaat)

### 2. Tarkista koodimuutokset

Uudet tiedostot:
- ✅ `src/lib/client-config.ts` - Client-asetusten lataus ja parsinta
- ✅ `src/app/client/[slug]/page.tsx` - Dynaaminen client-route
- ✅ `src/app/demo/page.tsx` - Demo-versio (kopio aiemmasta page.tsx)
- ✅ `src/app/page.tsx` - Uusi landing page

Päivitetyt tiedostot:
- ✅ `src/types/supabase.ts` - Lisätty `clients` taulu ja `client_id`
- ✅ `src/app/actions/generate.ts` - Tukee `clientId` parametria

### 3. Testaa paikallisesti

```bash
npm run dev
```

Testaa reitit:
- `http://localhost:3000` → Landing page
- `http://localhost:3000/demo` → Julkinen demo
- `http://localhost:3000/client/demo` → Demo-asiakkaan versio
- `http://localhost:3000/client/pilot` → Pilotti-asiakkaan versio

---

## 👤 Uuden Asiakkaan Lisääminen

### Vaihtoehto 1: SQL Insert (Suositellaan)

Kirjaudu Supabase SQL Editoriin ja lisää:

```sql
INSERT INTO public.clients (
  slug,              -- URL-tunniste (esim. "acme")
  name,              -- Näytettävä nimi (esim. "ACME Corporation")
  base_prompt,       -- Asiakkaan oma base prompt
  custom_environments,
  custom_garment_types,
  default_environment,
  default_model,
  is_active
) VALUES (
  'acme',
  'ACME Corporation',
  'Create a stunning professional fashion photograph of this garment worn by a model in ACME signature style.',
  '[
    {"id": "acme-studio", "label": "ACME Studio", "setting": "Premium white studio with ACME brand lighting."},
    {"id": "acme-outdoor", "label": "ACME Outdoor", "setting": "Urban street scene with modern architecture."}
  ]'::jsonb,
  '[
    {"id": "jacket", "label": "Takki", "bodyPart": "torso", "promptHints": "Ensure premium leather texture is visible."},
    {"id": "dress", "label": "Mekko", "bodyPart": "full", "promptHints": "Highlight elegant draping and flow."}
  ]'::jsonb,
  'acme-studio',
  'gpt-image-1.5/edit',
  true
);
```

### Vaihtoehto 2: Supabase Dashboard

1. Mene Supabase → Table Editor → `clients`
2. Klikkaa "Insert row"
3. Täytä kentät:
   - `slug`: "acme" (URL-tunniste)
   - `name`: "ACME Corporation"
   - `base_prompt`: "Your custom prompt..."
   - `custom_environments`: `[]` (tyhjä array tai JSON)
   - `is_active`: `true`

### JSONB-formaatti dropdown-optioille

**Ympäristöt (custom_environments):**
```json
[
  {
    "id": "studio-white",
    "label": "White Studio",
    "setting": "Clean white background with professional lighting."
  },
  {
    "id": "outdoor",
    "label": "Outdoor",
    "setting": "Natural outdoor setting with daylight."
  }
]
```

**Vaatteet (custom_garment_types):**
```json
[
  {
    "id": "shirt",
    "label": "Paita",
    "bodyPart": "torso",
    "promptHints": "Ensure collar and button details match exactly."
  },
  {
    "id": "dress",
    "label": "Mekko",
    "bodyPart": "full",
    "promptHints": "Pay attention to waistline and hem length."
  }
]
```

**Sukupuolet (custom_model_genders):**
```json
[
  {
    "id": "female",
    "label": "Nainen",
    "description": "female, 25 years old, scandinavian, blonde"
  },
  {
    "id": "male",
    "label": "Mies",
    "description": "male, 25 years old, scandinavian, short hair"
  }
]
```

**AI-mallit (custom_models):**
```json
[
  {
    "id": "gpt-image-1.5/edit",
    "label": "GPT Image 1.5"
  },
  {
    "id": "gemini-25-flash-image/edit",
    "label": "Gemini 2.5 Flash"
  }
]
```

---

## 🔧 Asiakkaan Asetusten Muokkaaminen

```sql
-- Päivitä base prompt
UPDATE public.clients
SET base_prompt = 'New custom prompt here...'
WHERE slug = 'acme';

-- Päivitä custom dropdownit
UPDATE public.clients
SET custom_environments = '[{"id": "new-env", "label": "New Environment"}]'::jsonb
WHERE slug = 'acme';

-- Aseta oletusvalinnat
UPDATE public.clients
SET 
  default_environment = 'studio',
  default_model = 'gpt-image-1.5/edit',
  default_garment_type = 'shirt'
WHERE slug = 'acme';
```

---

## 📊 Miten se toimii teknisesti

### 1. Client-asetusten lataus (`src/lib/client-config.ts`)

```typescript
// Lataa asiakkaan config slug:n perusteella
const config = await loadClientConfig('acme');

// Hae dropdownit (käyttää custom tai default-arvoja)
const environments = getEnvironments(config);
const garmentTypes = getGarmentTypes(config);
const modelGenders = getModelGenders(config);
const models = getModels(config);
const basePrompt = getBasePrompt(config);
```

### 2. Dynaaminen routing (`/client/[slug]`)

- Next.js dynamic route `[slug]` lukee URL:sta asiakastunnisteen
- Esim. `/client/acme` → `slug = "acme"`
- Lataa vastaavan asiakkaan asetukset tietokannasta
- Renderöi UI dynaamisesti niiden mukaan

### 3. Generointi (`src/app/actions/generate.ts`)

- Frontend lähettää `clientId`:n mukana `startGeneration`-actionille
- Backend tallentaa `client_id`:n `generated_images`-tauluun
- Mahdollistaa analytics: "Kuinka monta kuvaa asiakas X on generoinut?"

---

## 🎨 Brändäys (tulevaisuudessa)

`clients.branding` JSONB-kentässä voi tallentaa:

```json
{
  "logo": "https://example.com/logo.png",
  "primaryColor": "#FF5733",
  "secondaryColor": "#333333",
  "customText": {
    "title": "ACME Image Generator",
    "subtitle": "Professional fashion photos in seconds"
  }
}
```

Käyttöönotto vaatii lisäkoodia `client/[slug]/page.tsx`:ssä logo- ja värikustomointia varten.

---

## 🧪 Testaus

### Demo-version testaus
1. Mene `/demo`
2. Varmista että kaikki dropdownit toimivat
3. Generoi testikuva

### Client-version testaus
1. Mene `/client/pilot`
2. Tarkista että custom dropdownit näkyvät (jos määritelty)
3. Varmista että base prompt on clientin oma
4. Generoi testikuva

### Uuden clientin testaus
1. Lisää uusi client SQL:llä
2. Mene `/client/uusi-slug`
3. Varmista että custom asetukset latautuvat

---

## 📈 Analytics-mahdollisuudet

Koska `generated_images` taulussa on nyt `client_id`, voit ajaa kyselyitä:

```sql
-- Kuinka monta kuvaa per asiakas?
SELECT 
  c.name,
  COUNT(gi.id) as total_generations
FROM clients c
LEFT JOIN generated_images gi ON c.id = gi.client_id
GROUP BY c.name
ORDER BY total_generations DESC;

-- Asiakkaan generoinnit viimeisen 7 päivän aikana
SELECT COUNT(*)
FROM generated_images
WHERE client_id = 'client-uuid-here'
  AND created_at >= NOW() - INTERVAL '7 days';
```

---

## 🔐 Turvallisuus

- ✅ RLS-käytännöt: Vain aktiiviset clientit (`is_active = true`) näkyvät
- ✅ Public read: Kuka tahansa voi lukea client-asetuksia (tarvitaan frontendille)
- ⚠️ Muokkaus: Vain `service_role` (admin) voi muokata clienteja
- ⚠️ Tulevaisuudessa: Lisää autentikointi jos clientit tarvitsevat kirjautumisen

---

## 🚀 Deployment

Sama deployment-prosessi kuin aiemmin:

1. Commitoi muutokset:
```bash
git add .
git commit -m "Add multi-tenant support"
git push origin main
```

2. Aja SQL-migraatio Supabase production-tietokannassa

3. Vercel deployaa automaattisesti

4. Testaa production-ympäristössä:
   - `tuotekuvasi.fi` → Landing page
   - `tuotekuvasi.fi/demo` → Demo
   - `tuotekuvasi.fi/client/pilot` → Pilotti

---

## 📝 Tiedostot

### Uudet tiedostot
- `supabase/migration_multitenant.sql` - SQL-migraatio
- `src/lib/client-config.ts` - Client config utilities
- `src/app/client/[slug]/page.tsx` - Client-route
- `src/app/demo/page.tsx` - Demo-route
- `MULTITENANT_GUIDE.md` - Tämä ohje

### Muokatut tiedostot
- `src/app/page.tsx` - Uusi landing page
- `src/types/supabase.ts` - Lisätty `clients` taulu
- `src/app/actions/generate.ts` - Lisätty `clientId` tuki

---

## 🎉 Valmista!

Nyt sinulla on:
- ✅ Julkinen demo `/demo`
- ✅ Asiakaskohtaiset versiot `/client/[slug]`
- ✅ Helppo lisätä uusia asiakkaita SQL:llä
- ✅ Jokainen asiakas voi olla täysin räätälöity

**Seuraava askel:** Lisää ensimmäinen oikea pilottiasiakkaasi!
