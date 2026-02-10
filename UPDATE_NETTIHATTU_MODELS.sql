-- Lisää uusi AI-malli vaihtoehto nettihattu-asiakkaalle
-- Suorita tämä Supabase SQL Editorissa

UPDATE public.clients
SET custom_models = '[
  {"id": "gpt-image-1.5/edit", "label": "GPT Image 1.5 (High Quality)"},
  {"id": "gpt-image-1.5/edit-medium", "label": "GPT Image 1.5 (Medium Quality)"},
  {"id": "gemini-25-flash-image/edit", "label": "Gemini 2.5 Flash"}
]'::jsonb
WHERE slug = 'nettihattu';

-- Voit myös asettaa oletusmallin medium-laatuun:
-- UPDATE public.clients
-- SET default_model = 'gpt-image-1.5/edit-medium'
-- WHERE slug = 'nettihattu';
