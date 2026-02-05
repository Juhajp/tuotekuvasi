-- Enable Row Level Security
-- Note: auth.users is managed by Supabase Auth, we don't need to create it.

-- Create generated_images table
CREATE TABLE IF NOT EXISTS public.generated_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    original_image_url TEXT NOT NULL,
    generated_image_url TEXT,
    prompt_settings JSONB DEFAULT '{}'::jsonb NOT NULL
);

-- Set up Storage for uploads and generations
-- Note: SQL storage management in Supabase is done via the storage schema.
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('generations', 'generations', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for generated_images
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;

-- Permissive policy for MVP (Allow all access)
CREATE POLICY "Allow all access for MVP" ON public.generated_images
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Hardened policy example (Uncomment and replace the above in production)
-- CREATE POLICY "Users can only see their own images" ON public.generated_images
--     FOR SELECT
--     USING (auth.uid() = user_id);
--
-- CREATE POLICY "Users can only insert their own images" ON public.generated_images
--     FOR INSERT
--     WITH CHECK (auth.uid() = user_id);

-- Storage Policies
-- uploads bucket
CREATE POLICY "Public Access for uploads" ON storage.objects
    FOR ALL
    USING (bucket_id = 'uploads');

-- generations bucket
CREATE POLICY "Public Access for generations" ON storage.objects
    FOR ALL
    USING (bucket_id = 'generations');

-- Hardened storage policies example:
-- CREATE POLICY "Individual user access" ON storage.objects
--     FOR ALL
--     USING ( bucket_id = 'uploads' AND (storage.foldername(name))[1] = auth.uid()::text );
