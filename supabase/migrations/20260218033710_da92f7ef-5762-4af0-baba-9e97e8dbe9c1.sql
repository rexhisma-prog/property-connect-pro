ALTER TABLE public.properties 
  ADD COLUMN IF NOT EXISTS is_parcele boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_leje_ndertimi boolean NOT NULL DEFAULT false;