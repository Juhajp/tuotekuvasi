-- Migration: Add status tracking for async generation
-- Run this in Supabase SQL Editor after the initial schema.sql

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
