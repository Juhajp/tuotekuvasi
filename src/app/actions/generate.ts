'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { fal } from '@fal-ai/client';
import { v4 as uuidv4 } from 'uuid';
import { Database, Json } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Server Action: startGeneration
 * Uploads image and initiates async generation (Vercel-compatible, returns quickly)
 */
export async function startGeneration(formData: FormData) {
  try {
    const file = formData.get('image') as File;
    const backgroundPrompt = formData.get('backgroundPrompt') as string;
    const selectedModel = formData.get('model') as string || 'gpt-image-1.5/edit';
    const clientId = formData.get('clientId') as string | null; // Optional client ID for multi-tenant tracking
    
    if (!file || !backgroundPrompt) {
      throw new Error('Kuva tai prompt puuttuu.');
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
      throw new Error(`Kuvan lataus epäonnistui: ${uploadError.message}`);
    }

    const { data: { publicUrl: originalImageUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    // 2. Create database entry with 'pending' status
    const insertData: Database['public']['Tables']['generated_images']['Insert'] = {
      original_image_url: originalImageUrl,
      status: 'pending',
      client_id: clientId, // Track which client generated this image
      prompt_settings: {
        model: selectedModel,
        prompt: backgroundPrompt,
      } as Json,
    };

    const { data: imageData, error: dbError } = await (supabase as any)
      .from('generated_images')
      .insert(insertData)
      .select()
      .single();

    if (dbError) {
      throw new Error(`Tietokantamerkinnän luonti epäonnistui: ${dbError.message}`);
    }

    // 3. Start async generation (don't wait for result)
    processGenerationAsync(imageData.id, originalImageUrl, backgroundPrompt, selectedModel).catch(err => {
      console.error('Background generation error:', err);
    });

    return {
      success: true,
      generationId: imageData.id,
    };

  } catch (error) {
    console.error('Start generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Jotain meni vikaan.'
    };
  }
}

/**
 * Background process: Handle Fal.ai generation (runs async, not blocking Server Action)
 */
async function processGenerationAsync(
  generationId: string, 
  imageUrl: string, 
  prompt: string, 
  selectedModel: string
) {
  const supabase: SupabaseClient<Database> = createAdminClient();

  try {
    // Update status to processing
    await (supabase as any)
      .from('generated_images')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', generationId);

    let input: any = { prompt };
    let falModel = selectedModel;

    // Model-specific settings
    if (selectedModel === 'gpt-image-1.5/edit') {
      input.image_urls = [imageUrl];
      input.quality = 'high';
      input.input_fidelity = 'high';
      falModel = 'gpt-image-1.5/edit';
    } else if (selectedModel === 'gpt-image-1.5/edit-medium') {
      input.image_urls = [imageUrl];
      input.quality = 'medium';
      input.input_fidelity = 'high';
      falModel = 'gpt-image-1.5/edit'; // Sama malli, eri quality
    } else if (selectedModel === 'gemini-25-flash-image/edit') {
      input.image_urls = [imageUrl];
      falModel = 'gemini-25-flash-image/edit';
    } else {
      input.image_url = imageUrl;
    }

    const result = await fal.subscribe(`fal-ai/${falModel}`, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs.map((log) => console.log(`[Fal.ai Log]: ${log.message}`));
        }
      },
    });

    const data = result.data as any;
    const falImageUrl = data.images?.[0]?.url || data.image?.url;

    if (!falImageUrl) {
      throw new Error('AI ei palauttanut kuvan osoitetta.');
    }

    // Download and save to our storage
    const response = await fetch(falImageUrl);
    const imageBlob = await response.blob();
    const generatedFileName = `gen-${uuidv4()}.png`;
    const generatedFilePath = generatedFileName;

    const { error: genUploadError } = await supabase.storage
      .from('generations')
      .upload(generatedFilePath, imageBlob, {
        contentType: 'image/png',
        upsert: false
      });

    if (genUploadError) {
      throw new Error(`Generoidun kuvan tallennus epäonnistui: ${genUploadError.message}`);
    }

    const { data: { publicUrl: generatedImageUrl } } = supabase.storage
      .from('generations')
      .getPublicUrl(generatedFilePath);

    // Update database with completed status
    await (supabase as any)
      .from('generated_images')
      .update({ 
        generated_image_url: generatedImageUrl,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId);

  } catch (error) {
    console.error('Async generation error:', error);
    // Update database with failed status
    await (supabase as any)
      .from('generated_images')
      .update({ 
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Tuntematon virhe',
        updated_at: new Date().toISOString()
      })
      .eq('id', generationId);
  }
}

/**
 * Server Action: getGenerationStatus
 * Poll generation status by ID
 */
export async function getGenerationStatus(generationId: string) {
  try {
    const supabase: SupabaseClient<Database> = createAdminClient();
    
    const { data, error } = await (supabase as any)
      .from('generated_images')
      .select('*')
      .eq('id', generationId)
      .single();

    if (error) {
      throw new Error(`Status-haku epäonnistui: ${error.message}`);
    }

    return {
      success: true,
      data,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Jotain meni vikaan.'
    };
  }
}

/**
 * Legacy function for backwards compatibility
 * @deprecated Use startGeneration + getGenerationStatus instead
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
    let falModel = selectedModel;

    // Mallikohtaiset asetukset
    if (selectedModel === 'gpt-image-1.5/edit') {
      input.image_urls = [originalImageUrl];
      input.quality = 'high'; // Vaihdettu medium -> high paremman laadun saavuttamiseksi
      input.input_fidelity = 'high';
      falModel = 'gpt-image-1.5/edit';
    } else if (selectedModel === 'gpt-image-1.5/edit-medium') {
      input.image_urls = [originalImageUrl];
      input.quality = 'medium';
      input.input_fidelity = 'high';
      falModel = 'gpt-image-1.5/edit'; // Sama malli, eri quality
    } else if (selectedModel === 'gemini-25-flash-image/edit') {
      input.image_urls = [originalImageUrl];
      falModel = 'gemini-25-flash-image/edit';
    } else {
      // Oletus: background-change malli tai muut
      input.image_url = originalImageUrl;
    }

    const result = await fal.subscribe(`fal-ai/${falModel}`, {
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
