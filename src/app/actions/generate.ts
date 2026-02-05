'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { fal } from '@fal-ai/client';
import { v4 as uuidv4 } from 'uuid';
import { Database, Json } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server Action: generateProductImage
 * Handle product image generation from user upload to Fal.ai processing and saving results.
 */
export async function generateProductImage(formData: FormData) {
  try {
    const file = formData.get('image') as File;
    const backgroundPrompt = formData.get('backgroundPrompt') as string || 'in a professional studio setting, high quality, commercial photography';
    const selectedModel = formData.get('model') as string || 'gpt-image-1.5/edit';
    
    if (!file) {
      throw new Error('Kuvaa ei löytynyt.');
    }

    const supabase: SupabaseClient<Database> = createAdminClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = fileName;

    // 1. Upload original image to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Alkuperäisen kuvan lataus epäonnistui: ${uploadError.message}`);
    }

    const { data: { publicUrl: originalImageUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // 2. Fal.ai API Call
    console.log('Sending to Fal.ai:', { model: `fal-ai/${selectedModel}`, prompt: backgroundPrompt, image_url: originalImageUrl });
    
    let input: any = {
      prompt: backgroundPrompt,
    };

    // Mallikohtaiset asetukset
    if (selectedModel === 'gpt-image-1.5/edit') {
      input.image_urls = [originalImageUrl];
      input.quality = 'medium';
      input.input_fidelity = 'high';
    } else if (selectedModel === 'gemini-25-flash-image/edit') {
      input.image_urls = [originalImageUrl];
    } else {
      // Oletus: background-change malli tai muut
      input.image_url = originalImageUrl;
    }

    const result = await fal.subscribe(`fal-ai/${selectedModel}`, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs.map((log) => console.log(`[Fal.ai Log]: ${log.message}`));
        }
      },
    });

    const data = result.data as any;
    // Vastausrakenne voi vaihdella malleittain
    const falImageUrl = data.images?.[0]?.url || data.image?.url;

    if (!falImageUrl) {
      console.error('Fal.ai response data:', data);
      throw new Error('AI ei palauttanut kuvan osoitetta.');
    }

    // 3. Download from Fal.ai CDN and save to our own Supabase Storage
    const response = await fetch(falImageUrl);
    const imageBlob = await response.blob();
    const generatedFileName = `gen-${uuidv4()}.png`;
    const generatedFilePath = `generations/${generatedFileName}`;

    const { error: genUploadError } = await supabase.storage
      .from('generations')
      .upload(generatedFilePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (genUploadError) {
      console.error('Generation upload error:', genUploadError);
      throw new Error(`Generoidun kuvan tallennus epäonnistui: ${genUploadError.message}`);
    }

    const { data: { publicUrl: generatedImageUrl } } = supabase.storage
      .from('generations')
      .getPublicUrl(generatedFilePath);

    // 4. Save to Database
    const insertData: Database['public']['Tables']['generated_images']['Insert'] = {
      original_image_url: originalImageUrl,
      generated_image_url: generatedImageUrl,
      prompt_settings: {
        model: selectedModel,
        background: backgroundPrompt,
      } as Json,
    };

    const { data: imageData, error: dbError } = await (supabase as any)
      .from('generated_images')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(`Tietokantamerkinnän luonti epäonnistui: ${dbError.message}`);
    }

    return {
      success: true,
      data: imageData
    };

  } catch (error) {
    console.error('Generation action error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Jotain meni vikaan prosessin aikana.'
    };
  }
}
