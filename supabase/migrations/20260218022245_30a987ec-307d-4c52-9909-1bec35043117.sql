
-- Fix: "Admin manage roles" policy on user_roles still has recursion
-- It queries user_roles within a policy ON user_roles = infinite loop
-- Solution: use is_admin() which is SECURITY DEFINER and bypasses RLS

DROP POLICY IF EXISTS "Admin manage roles" ON public.user_roles;

-- Use is_admin() (SECURITY DEFINER) which queries user_roles bypassing RLS = no recursion
CREATE POLICY "Admin manage roles" ON public.user_roles
FOR ALL
TO authenticated
USING (public.is_admin());

-- Also add a policy so users can read their own roles (needed for auth checks)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
