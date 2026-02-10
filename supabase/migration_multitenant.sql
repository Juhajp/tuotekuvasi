-- Migration: Multi-tenant support for client-specific settings
-- Run this in Supabase SQL Editor

-- Create clients table for multi-tenant support
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- URL-friendly identifier (e.g., "acme", "pilot-company")
  name TEXT NOT NULL, -- Display name (e.g., "ACME Corporation")
  
  -- Custom prompt settings
  base_prompt TEXT, -- Custom base prompt template for this client
  
  -- Custom dropdown options (stored as JSONB arrays)
  custom_environments JSONB DEFAULT '[]'::jsonb,
  custom_garment_types JSONB DEFAULT '[]'::jsonb,
  custom_model_genders JSONB DEFAULT '[]'::jsonb,
  custom_models JSONB DEFAULT '[]'::jsonb,
  
  -- Default selections
  default_environment TEXT,
  default_model TEXT,
  default_garment_type TEXT,
  default_model_gender TEXT,
  
  -- Branding & customization
  branding JSONB DEFAULT '{}'::jsonb, -- logo, colors, custom text, etc.
  
  -- Status & metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add client_id to generated_images for tracking which client generated each image
ALTER TABLE public.generated_images 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- Create index for faster client lookups
CREATE INDEX IF NOT EXISTS idx_clients_slug ON public.clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_active ON public.clients(is_active);
CREATE INDEX IF NOT EXISTS idx_generated_images_client ON public.generated_images(client_id);

-- RLS policies for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active clients (so frontend can load settings)
CREATE POLICY "Public can read active clients" ON public.clients
  FOR SELECT
  USING (is_active = true);

-- Only service_role can modify clients (admin-only)
CREATE POLICY "Only service_role can modify clients" ON public.clients
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Example: Insert a demo client (represents the public demo)
INSERT INTO public.clients (slug, name, base_prompt, is_active)
VALUES (
  'demo',
  'Public Demo',
  'Visualize this garment being worn by a professional fashion model in a high-quality commercial setting.',
  true
)
ON CONFLICT (slug) DO NOTHING;

-- Example: Insert a pilot client (you can customize this for your actual pilot)
INSERT INTO public.clients (
  slug, 
  name, 
  base_prompt,
  custom_environments,
  custom_garment_types,
  is_active
)
VALUES (
  'pilot',
  'Pilot Company',
  'Create a professional fashion photograph showing this garment worn by a model. The image should be suitable for e-commerce use with clean composition and proper lighting.',
  '[
    {"id": "studio-white", "label": "White Studio", "setting": "Clean white studio background with professional lighting from multiple angles."},
    {"id": "studio-grey", "label": "Grey Studio", "setting": "Modern grey studio background with soft diffused lighting."}
  ]'::jsonb,
  '[
    {"id": "dress", "label": "Dress", "bodyPart": "full", "promptHints": "Ensure proper draping and hem length."},
    {"id": "shirt", "label": "Shirt", "bodyPart": "torso", "promptHints": "Pay attention to collar and button details."}
  ]'::jsonb,
  true
)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE public.clients IS 'Multi-tenant client configurations for custom branding and settings';
COMMENT ON COLUMN public.clients.slug IS 'URL-safe identifier used in routes (/client/slug)';
COMMENT ON COLUMN public.clients.custom_environments IS 'JSONB array of custom environment options for this client';
COMMENT ON COLUMN public.clients.custom_garment_types IS 'JSONB array of custom garment type options for this client';
