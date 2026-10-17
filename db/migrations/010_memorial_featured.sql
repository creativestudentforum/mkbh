-- Phase 4.2 and 4.3: Memorials and featured alumni.

CREATE TABLE IF NOT EXISTS public.memorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  batch TEXT DEFAULT '',
  date_of_death DATE,
  bio TEXT DEFAULT '',
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.memorials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read memorials" ON public.memorials;
DROP POLICY IF EXISTS "Admins manage memorials" ON public.memorials;

CREATE POLICY "Members read memorials"
  ON public.memorials FOR SELECT TO authenticated
  USING (public.is_member());

CREATE POLICY "Admins manage memorials"
  ON public.memorials FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS achievement TEXT DEFAULT '';

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND (
    NEW.email            IS DISTINCT FROM OLD.email OR
    NEW.role             IS DISTINCT FROM OLD.role OR
    NEW.user_type        IS DISTINCT FROM OLD.user_type OR
    NEW.status           IS DISTINCT FROM OLD.status OR
    NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason OR
    NEW.is_featured      IS DISTINCT FROM OLD.is_featured OR
    NEW.achievement      IS DISTINCT FROM OLD.achievement
  ) THEN
    RAISE EXCEPTION 'You cannot update protected profile fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE VIEW public.alumni_directory AS
SELECT
  id, full_name, batch, department, avatar_url, profession, company,
  city, country, linkedin_url, blood_group,
  CASE WHEN show_phone THEN phone END AS phone,
  bio, facebook_url, website_url, created_at,
  is_featured, achievement
FROM public.profiles
WHERE status = 'approved'
  AND user_type = 'alumni'
  AND public.is_member();

REVOKE ALL ON public.memorials FROM anon;
REVOKE ALL ON public.alumni_directory FROM anon;
GRANT SELECT ON public.memorials TO authenticated;
GRANT SELECT ON public.alumni_directory TO authenticated;
