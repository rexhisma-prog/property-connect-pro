CREATE TABLE IF NOT EXISTS public.otp_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '10 minutes'),
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- No user access needed — only service role (edge functions) will read/write
CREATE POLICY "Service role only" ON public.otp_codes
  USING (false);

-- Auto-delete expired codes (cleanup)
CREATE INDEX idx_otp_codes_email ON public.otp_codes(email);
CREATE INDEX idx_otp_codes_expires_at ON public.otp_codes(expires_at);
