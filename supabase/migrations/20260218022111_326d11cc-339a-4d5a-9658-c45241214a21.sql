
-- Fix infinite recursion in users RLS policies
-- The "Admin full access users" policy queries users table from within users policy = infinite loop

-- 1. Fix is_admin() to use user_roles instead of users table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- 2. Drop and recreate "Admin full access users" policy (was causing recursion)
DROP POLICY IF EXISTS "Admin full access users" ON public.users;
CREATE POLICY "Admin full access users" ON public.users
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- 3. Fix "Admin manage roles" policy on user_roles (also queried users table = recursion)
DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;
CREATE POLICY "Admin manage roles" ON public.user_roles
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- 4. Add missing INSERT policy on users (profile creation was failing!)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);
