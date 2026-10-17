-- Public ID verification should expose only member-approved fields.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_bio BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_professional_info BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_location BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN NOT NULL DEFAULT false;

DROP FUNCTION IF EXISTS public.verify_member(TEXT);

CREATE OR REPLACE FUNCTION public.verify_member(p_code TEXT)
RETURNS TABLE (
  full_name TEXT,
  avatar_url TEXT,
  batch TEXT,
  department TEXT,
  verified BOOLEAN,
  email TEXT,
  phone TEXT,
  bio TEXT,
  date_of_birth DATE,
  profession TEXT,
  company TEXT,
  city TEXT,
  country TEXT,
  linkedin_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  website_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.full_name,
    p.avatar_url,
    p.batch,
    p.department,
    true AS verified,
    CASE WHEN p.show_email THEN p.email END,
    CASE WHEN p.show_phone THEN p.phone END,
    CASE WHEN p.show_bio THEN p.bio END,
    CASE WHEN p.show_birthday THEN p.date_of_birth END,
    CASE WHEN p.show_professional_info THEN p.profession END,
    CASE WHEN p.show_professional_info THEN p.company END,
    CASE WHEN p.show_location THEN p.city END,
    CASE WHEN p.show_location THEN p.country END,
    CASE WHEN p.show_social_links THEN p.linkedin_url END,
    CASE WHEN p.show_social_links THEN p.facebook_url END,
    CASE WHEN p.show_social_links THEN p.twitter_url END,
    CASE WHEN p.show_social_links THEN p.website_url END
  FROM public.profiles p
  WHERE p.public_code = p_code
    AND p.status = 'approved'
    AND p.user_type = 'alumni'
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

REVOKE ALL ON FUNCTION public.verify_member(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_member(TEXT) TO anon, authenticated;
