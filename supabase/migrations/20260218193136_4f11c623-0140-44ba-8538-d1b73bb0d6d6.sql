-- Add country column to ads table (null = show everywhere)
ALTER TABLE public.ads 
ADD COLUMN country text DEFAULT NULL 
CHECK (country IS NULL OR country IN ('kosovo', 'albania'));
