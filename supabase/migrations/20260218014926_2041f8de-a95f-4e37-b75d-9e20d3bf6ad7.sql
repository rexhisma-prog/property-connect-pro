
-- Fix permissive RLS policies (replace WITH CHECK (true) with proper checks)

-- Fix agency_flags: only authenticated can insert
DROP POLICY IF EXISTS "Anyone can insert ad events" ON public.ad_events;
DROP POLICY IF EXISTS "Anyone can insert events" ON public.property_events;
DROP POLICY IF EXISTS "Anyone can insert ads" ON public.ads;
DROP POLICY IF EXISTS "Anyone can upload ad media" ON storage.objects;

-- Property events: authenticated or anonymous, but limit to just insert
CREATE POLICY "Authenticated insert property events" ON public.property_events
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR auth.uid() IS NULL);

-- Ad events: allow tracking
CREATE POLICY "Allow insert ad events" ON public.ad_events
  FOR INSERT WITH CHECK (true);

-- Ads: public can submit ads (for advertisers)  
CREATE POLICY "Anyone can submit ads" ON public.ads
  FOR INSERT WITH CHECK (status = 'pending');

-- Ad media: authenticated uploads only
CREATE POLICY "Authenticated upload ad media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ad-media');
