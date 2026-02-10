-- Migration: Client credit system (1 credit = 1 generation)
-- Run this in Supabase SQL Editor

-- Add credits balance to clients (pilot: simple balance, no monthly reset yet)
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 0;

-- Optional: Set initial pilot credits for existing clients
-- UPDATE public.clients SET credits_balance = 50 WHERE slug = 'nettihattu';

COMMENT ON COLUMN public.clients.credits_balance IS 'Remaining generation credits for this client. Decremented on each generation. 1 credit = 1 image generation.';

-- === How to add/remove credits (run in Supabase SQL Editor) ===
-- Add 50 credits to a client:
--   UPDATE public.clients SET credits_balance = credits_balance + 50 WHERE slug = 'nettihattu';
-- Set absolute balance (e.g. reset to 100):
--   UPDATE public.clients SET credits_balance = 100 WHERE slug = 'nettihattu';
-- Subtract 10 credits:
--   UPDATE public.clients SET credits_balance = GREATEST(0, credits_balance - 10) WHERE slug = 'nettihattu';
