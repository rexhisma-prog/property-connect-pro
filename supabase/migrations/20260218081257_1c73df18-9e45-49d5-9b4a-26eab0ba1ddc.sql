
CREATE TABLE public.social_photos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url text NOT NULL,
  caption text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.social_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active social photos"
  ON public.social_photos FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin manage social photos"
  ON public.social_photos FOR ALL
  USING (is_admin());
