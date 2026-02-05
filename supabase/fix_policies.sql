-- Fix storage policies to allow public access for Fal.ai

-- 1. Ensure the bucket is public (this allows public URLs to work without signed tokens)
UPDATE storage.buckets SET public = true WHERE id = 'uploads';
UPDATE storage.buckets SET public = true WHERE id = 'generations';

-- 2. Drop existing restrictive policies to avoid conflicts
DROP POLICY IF EXISTS "Allow users to view own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access for generations" ON storage.objects;

-- 3. Create permissive policies for MVP
-- Allow ANYONE (anon + authenticated) to read files from uploads and generations
CREATE POLICY "Public Read Access" ON storage.objects
    FOR SELECT
    USING (bucket_id IN ('uploads', 'generations'));

-- Allow Authenticated users (and Service Role) to upload
CREATE POLICY "Authenticated Upload Access" ON storage.objects
    FOR INSERT
    TO authenticated, service_role
    WITH CHECK (bucket_id IN ('uploads', 'generations'));

-- Allow Service Role full access (implicit, but good to be explicit if needed, though service_role bypasses RLS)
-- Note: Service Role bypasses RLS automatically, so we don't strictly need a policy for it,
-- but we need to make sure the 'authenticated' policy doesn't accidentally block it if we were using a different role.
