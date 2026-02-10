import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase';

export type ClientConfig = Database['public']['Tables']['clients']['Row'];

export interface DropdownOption {
  id: string;
  label: string;
  setting?: string;
  bodyPart?: string;
  promptHints?: string;
  description?: string;
}

/**
 * Load client configuration by slug (browser-side)
 */
export async function loadClientConfig(slug: string): Promise<ClientConfig | null> {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Failed to load client config:', error);
    return null;
  }

  return data;
}

/**
 * Parse custom dropdown options from JSONB
 */
export function parseDropdownOptions(jsonbArray: any): DropdownOption[] {
  if (!jsonbArray || !Array.isArray(jsonbArray)) {
    return [];
  }
  return jsonbArray as DropdownOption[];
}

/**
 * Get environments for a client (uses custom or falls back to defaults)
 */
export function getEnvironments(config: ClientConfig | null): DropdownOption[] {
  if (config?.custom_environments) {
    const custom = parseDropdownOptions(config.custom_environments);
    if (custom.length > 0) return custom;
  }

  // Default environments (fallback)
  return [
    { 
      id: 'studio', 
      label: 'Professional Studio', 
      setting: 'The setting is a clean, professional photo studio background, light grey color. The lighting is soft, diffused daylight coming from the side.' 
    },
    { 
      id: 'winter', 
      label: 'Finnish Winter Landscape', 
      setting: 'The setting is a beautiful Finnish winter landscape with snow-covered pine trees in the background. The lighting is natural, soft winter daylight creating a crisp, fresh atmosphere.' 
    },
  ];
}

/**
 * Get garment types for a client (uses custom or falls back to defaults)
 */
export function getGarmentTypes(config: ClientConfig | null): DropdownOption[] {
  if (config?.custom_garment_types) {
    const custom = parseDropdownOptions(config.custom_garment_types);
    if (custom.length > 0) return custom;
  }

  // Default garment types (fallback)
  return [
    { id: 't-shirt', label: 'T-paita', bodyPart: 'torso', promptHints: 'Ensure the neckline shape, sleeve length, and hem length match exactly.' },
    { id: 'shirt', label: 'Paita', bodyPart: 'torso', promptHints: 'Ensure collar shape, button placket alignment, cuff details match exactly.' },
    { id: 'dress', label: 'Mekko', bodyPart: 'full', promptHints: 'Pay special attention to neckline depth, waistline position, sleeve type, and hem length.' },
    { id: 'jacket', label: 'Takki', bodyPart: 'torso', promptHints: 'Match the collar type, zipper/button closure, pocket placement precisely.' },
    { id: 'pants', label: 'Housut', bodyPart: 'lower', promptHints: 'Match the fit (slim, regular, wide), leg length, and pocket details.' },
    { id: 'shoes', label: 'Kengät', bodyPart: 'feet', promptHints: 'Preserve shoe type, lacing details, sole design, and any logos.' },
  ];
}

/**
 * Get model genders for a client (uses custom or falls back to defaults)
 */
export function getModelGenders(config: ClientConfig | null): DropdownOption[] {
  if (config?.custom_model_genders) {
    const custom = parseDropdownOptions(config.custom_model_genders);
    if (custom.length > 0) return custom;
  }

  // Default model genders (fallback)
  return [
    { 
      id: 'female', 
      label: 'Nainen',
      description: 'female, approx 25 years old, scandinavian ethnicity, blonde hair, natural makeup'
    },
    { 
      id: 'male', 
      label: 'Mies',
      description: 'male, approx 25 years old, scandinavian ethnicity, short hair, clean-shaven'
    },
  ];
}

/**
 * Get AI models for a client (uses custom or falls back to defaults)
 */
export function getModels(config: ClientConfig | null): DropdownOption[] {
  if (config?.custom_models) {
    const custom = parseDropdownOptions(config.custom_models);
    if (custom.length > 0) return custom;
  }

  // Default AI models (fallback)
  return [
    { id: 'gpt-image-1.5/edit', label: 'GPT Image 1.5 Edit' },
    { id: 'gemini-25-flash-image/edit', label: 'Gemini 2.5 Flash Edit' },
  ];
}

/**
 * Get base prompt template for a client
 */
export function getBasePrompt(config: ClientConfig | null): string {
  return config?.base_prompt || 
    'Visualize this garment being worn by a professional fashion model in a high-quality commercial setting.';
}
