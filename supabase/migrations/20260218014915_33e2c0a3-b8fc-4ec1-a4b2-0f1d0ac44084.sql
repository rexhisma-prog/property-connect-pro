
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- ENUMS
-- =====================
CREATE TYPE public.user_role AS ENUM ('user', 'admin');
CREATE TYPE public.user_status AS ENUM ('active', 'blocked', 'suspended');
CREATE TYPE public.property_type AS ENUM ('apartment', 'house', 'land', 'commercial');
CREATE TYPE public.listing_type AS ENUM ('shitje', 'qira');
CREATE TYPE public.property_status AS ENUM ('draft', 'active', 'blocked', 'sold', 'rented', 'archived');
CREATE TYPE public.transaction_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
CREATE TYPE public.media_type AS ENUM ('image', 'video');
CREATE TYPE public.ad_status AS ENUM ('pending', 'active', 'expired', 'rejected');
CREATE TYPE public.event_type AS ENUM ('view', 'contact_click', 'phone_click', 'whatsapp_click', 'email_click');
CREATE TYPE public.ad_event_type AS ENUM ('impression', 'click');
CREATE TYPE public.extra_type AS ENUM ('featured', 'boost', 'urgent');

-- =====================
-- USERS (profiles)
-- =====================
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role public.user_role NOT NULL DEFAULT 'user',
  status public.user_status NOT NULL DEFAULT 'active',
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'user');

CREATE POLICY "Admin full access users" ON public.users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- =====================
-- USER ROLES TABLE (separate for security)
-- =====================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'user',
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role, status, credits_remaining)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user',
    'active',
    0
  );
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================
-- BLOCKED KEYWORDS
-- =====================
CREATE TABLE public.blocked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active keywords" ON public.blocked_keywords
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage keywords" ON public.blocked_keywords
  FOR ALL USING (public.is_admin());

-- Default keywords
INSERT INTO public.blocked_keywords (keyword) VALUES
  ('agjension'), ('agency'), ('patundshmeri'), ('real estate'),
  ('immobiliare'), ('shpk'), ('l.l.c'), ('broker'), ('realtor'),
  ('property company'), ('zyre'), ('office'), ('kompani');

-- =====================
-- AGENCY FLAGS
-- =====================
CREATE TABLE public.agency_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID,
  reason TEXT,
  matched_keyword TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agency_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage flags" ON public.agency_flags
  FOR ALL USING (public.is_admin());

-- =====================
-- CREDIT PACKAGES
-- =====================
CREATE TABLE public.credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  price_eur NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active packages" ON public.credit_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage packages" ON public.credit_packages
  FOR ALL USING (public.is_admin());

INSERT INTO public.credit_packages (name, credits_amount, price_eur) VALUES
  ('1 Kredit', 1, 25.00),
  ('2 Kredite', 2, 45.00),
  ('3 Kredite', 3, 70.00),
  ('4 Kredite', 4, 85.00),
  ('5 Kredite', 5, 100.00);

-- =====================
-- CREDIT TRANSACTIONS
-- =====================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.credit_packages(id),
  credits_added INTEGER NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own credit transactions" ON public.credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credit transactions" ON public.credit_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin manage credit transactions" ON public.credit_transactions
  FOR ALL USING (public.is_admin());

-- =====================
-- PROPERTIES
-- =====================
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC(15,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  city TEXT NOT NULL,
  address TEXT,
  property_type public.property_type NOT NULL,
  listing_type public.listing_type NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area_m2 NUMERIC(10,2),
  images TEXT[] DEFAULT '{}',
  status public.property_status NOT NULL DEFAULT 'draft',
  expires_at TIMESTAMPTZ,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  featured_until TIMESTAMPTZ,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  urgent_until TIMESTAMPTZ,
  last_boosted_at TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  contacts_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active properties" ON public.properties
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users CRUD own properties" ON public.properties
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin manage all properties" ON public.properties
  FOR ALL USING (public.is_admin());

-- =====================
-- EXTRA PACKAGES
-- =====================
CREATE TABLE public.extra_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.extra_type NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 0,
  price_eur NUMERIC(10,2) NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active extras" ON public.extra_packages
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage extras" ON public.extra_packages
  FOR ALL USING (public.is_admin());

INSERT INTO public.extra_packages (type, duration_days, price_eur, name) VALUES
  ('featured', 7, 5.00, 'Featured 7 ditë'),
  ('featured', 30, 10.00, 'Featured 30 ditë'),
  ('boost', 0, 2.00, 'Boost (ngrit tani)'),
  ('urgent', 7, 1.00, 'Urgent 7 ditë'),
  ('urgent', 30, 3.00, 'Urgent 30 ditë');

-- =====================
-- EXTRA TRANSACTIONS
-- =====================
CREATE TABLE public.extra_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  extra_package_id UUID REFERENCES public.extra_packages(id),
  amount_paid NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own extra transactions" ON public.extra_transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own extra transactions" ON public.extra_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin manage extra transactions" ON public.extra_transactions
  FOR ALL USING (public.is_admin());

-- =====================
-- PROPERTY EVENTS
-- =====================
CREATE TABLE public.property_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  event_type public.event_type NOT NULL,
  user_id UUID,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.property_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events" ON public.property_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read events" ON public.property_events
  FOR SELECT USING (public.is_admin());

-- Trigger to increment counters
CREATE OR REPLACE FUNCTION public.increment_property_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'view' THEN
    UPDATE public.properties SET views_count = views_count + 1 WHERE id = NEW.property_id;
  ELSIF NEW.event_type IN ('contact_click', 'phone_click', 'whatsapp_click', 'email_click') THEN
    UPDATE public.properties SET contacts_count = contacts_count + 1 WHERE id = NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_property_event_insert
  AFTER INSERT ON public.property_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_property_counters();

-- =====================
-- AD POSITIONS
-- =====================
CREATE TABLE public.ad_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  price_month_eur NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active positions" ON public.ad_positions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin manage positions" ON public.ad_positions
  FOR ALL USING (public.is_admin());

INSERT INTO public.ad_positions (name, display_name, price_month_eur) VALUES
  ('homepage_top', 'Homepage Top Banner', 79.00),
  ('homepage_middle', 'Homepage Middle Banner', 49.00),
  ('sidebar', 'Sidebar Banner', 29.00),
  ('property_list_top', 'Lista e Pronave - Top', 59.00),
  ('property_details_sidebar', 'Detajet e Pronës - Sidebar', 39.00);

-- =====================
-- ADS
-- =====================
CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertiser_name TEXT NOT NULL,
  advertiser_email TEXT NOT NULL,
  title TEXT NOT NULL,
  media_type public.media_type NOT NULL DEFAULT 'image',
  media_url TEXT,
  link_url TEXT,
  position_id UUID REFERENCES public.ad_positions(id),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  status public.ad_status NOT NULL DEFAULT 'pending',
  stripe_payment_intent_id TEXT,
  amount_paid NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active ads" ON public.ads
  FOR SELECT USING (status = 'active' AND start_date <= now() AND end_date >= now());

CREATE POLICY "Admin manage ads" ON public.ads
  FOR ALL USING (public.is_admin());

CREATE POLICY "Anyone can insert ads" ON public.ads
  FOR INSERT WITH CHECK (true);

-- =====================
-- AD TRANSACTIONS
-- =====================
CREATE TABLE public.ad_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  amount_paid NUMERIC(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage ad transactions" ON public.ad_transactions
  FOR ALL USING (public.is_admin());

-- =====================
-- AD EVENTS
-- =====================
CREATE TABLE public.ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES public.ads(id) ON DELETE CASCADE,
  event_type public.ad_event_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert ad events" ON public.ad_events
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admin read ad events" ON public.ad_events
  FOR SELECT USING (public.is_admin());

-- =====================
-- PLATFORM SETTINGS
-- =====================
CREATE TABLE public.platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.platform_settings
  FOR SELECT USING (true);

CREATE POLICY "Admin manage settings" ON public.platform_settings
  FOR ALL USING (public.is_admin());

INSERT INTO public.platform_settings (key, value) VALUES
  ('listing_expiry_days', '90'),
  ('max_images_per_property', '10'),
  ('platform_name', 'ShitëPronen.com');

-- =====================
-- UPDATE TIMESTAMP TRIGGER
-- =====================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================
-- STORAGE BUCKETS
-- =====================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('property-images', 'property-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('ad-media', 'ad-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);

CREATE POLICY "Anyone can read property images" ON storage.objects
  FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users upload property images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'property-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users delete own property images" ON storage.objects
  FOR DELETE USING (bucket_id = 'property-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can read ad media" ON storage.objects
  FOR SELECT USING (bucket_id = 'ad-media');

CREATE POLICY "Anyone can upload ad media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'ad-media');
