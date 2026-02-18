
-- Allow anyone to read phone number of property owners (for contact purposes)
CREATE POLICY "Public read owner phone for active properties"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.user_id = users.id
    AND properties.status = 'active'
  )
);
