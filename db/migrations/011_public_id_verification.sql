-- Phase 4.5: Public ID-card verification.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_code TEXT UNIQUE DEFAULT substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10);

UPDATE public.profiles
SET public_code = substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10)
WHERE public_code IS NULL OR public_code = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_code ON public.profiles (public_code);

CREATE OR REPLACE FUNCTION public.verify_member(p_code TEXT)
RETURNS TABLE (
  full_name TEXT,
  batch TEXT,
  verified BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.full_name, p.batch, true AS verified
  FROM public.profiles p
  WHERE p.public_code = p_code
    AND p.status = 'approved'
    AND p.user_type = 'alumni'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.verify_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_member(TEXT) TO anon, authenticated;
