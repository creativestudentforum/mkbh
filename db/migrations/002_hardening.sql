-- Phase 0 hardening after initial schema + Phase 1 columns.

-- ===== Helpers =====
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_member()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (status = 'approved' OR role = 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ===== Signup: copy safe fields from metadata =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, batch, department, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'batch', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== Privilege trigger: allow SQL Editor / service role =====
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND (
    NEW.email     IS DISTINCT FROM OLD.email OR
    NEW.role      IS DISTINCT FROM OLD.role OR
    NEW.user_type IS DISTINCT FROM OLD.user_type OR
    NEW.status    IS DISTINCT FROM OLD.status
  ) THEN
    RAISE EXCEPTION 'You cannot update protected profile fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===== Profile reads: own row or admin only =====
DROP POLICY IF EXISTS "Users can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "read own or admin" ON public.profiles;

CREATE POLICY "read own or admin"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_admin());

-- ===== Members-only reads =====
DROP POLICY IF EXISTS "Anyone authenticated can view active teachers" ON public.teachers;
DROP POLICY IF EXISTS "Members can view active teachers" ON public.teachers;
CREATE POLICY "Members can view active teachers"
  ON public.teachers FOR SELECT TO authenticated
  USING (is_active = true AND public.is_member());

DROP POLICY IF EXISTS "Anyone authenticated can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Members can view announcements" ON public.announcements;
CREATE POLICY "Members can view announcements"
  ON public.announcements FOR SELECT TO authenticated
  USING (public.is_member());

DROP POLICY IF EXISTS "Anyone authenticated can view active events" ON public.events;
DROP POLICY IF EXISTS "Members can view active events" ON public.events;
CREATE POLICY "Members can view active events"
  ON public.events FOR SELECT TO authenticated
  USING (is_active = true AND public.is_member());

-- ===== Directory view: gated + extra columns appended =====
CREATE OR REPLACE VIEW public.alumni_directory AS
SELECT
  id, full_name, batch, department, avatar_url, profession, company,
  city, country, linkedin_url, blood_group,
  CASE WHEN show_phone THEN phone END AS phone,
  bio, facebook_url, website_url, created_at
FROM public.profiles
WHERE status = 'approved'
  AND user_type = 'alumni'
  AND public.is_member();

REVOKE ALL ON public.alumni_directory FROM anon;
GRANT SELECT ON public.alumni_directory TO authenticated;

-- ===== Dashboard counts without opening up profiles =====
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM public.profiles WHERE status = 'approved' AND user_type = 'alumni') AS alumni_count,
  (SELECT COUNT(*) FROM public.teachers WHERE is_active) AS teacher_count
WHERE public.is_member();

REVOKE ALL ON public.dashboard_stats FROM anon;
GRANT SELECT ON public.dashboard_stats TO authenticated;

-- ===== RSVP only for approved members, on active upcoming events =====
DROP POLICY IF EXISTS "own rsvp" ON public.event_rsvps;
CREATE POLICY "own rsvp"
  ON public.event_rsvps FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_member()
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id
        AND e.is_active
        AND e.event_date >= (NOW() AT TIME ZONE 'Asia/Dhaka')::date
    )
  );

CREATE OR REPLACE VIEW public.event_rsvp_counts AS
SELECT
  event_id,
  COUNT(*) FILTER (WHERE status = 'going') AS going,
  COALESCE(SUM(guests) FILTER (WHERE status = 'going'), 0) AS guests
FROM public.event_rsvps
WHERE public.is_member()
GROUP BY event_id;

REVOKE ALL ON public.event_rsvp_counts FROM anon;
GRANT SELECT ON public.event_rsvp_counts TO authenticated;

-- ===== Merge duplicate columns. Stop using the old ones in the UI, drop later =====
UPDATE public.profiles SET profession = job_title
  WHERE COALESCE(profession, '') = '' AND COALESCE(job_title, '') <> '';
UPDATE public.profiles SET company = current_company
  WHERE COALESCE(company, '') = '' AND COALESCE(current_company, '') <> '';
UPDATE public.profiles SET city = location
  WHERE COALESCE(city, '') = '' AND COALESCE(location, '') <> '';

-- ===== Indexes =====
CREATE INDEX IF NOT EXISTS idx_profiles_status       ON public.profiles (status);
CREATE INDEX IF NOT EXISTS idx_profiles_batch        ON public.profiles (batch) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_profiles_blood        ON public.profiles (blood_group) WHERE is_blood_donor;
CREATE INDEX IF NOT EXISTS idx_events_date           ON public.events (event_date);
CREATE INDEX IF NOT EXISTS idx_rsvps_user            ON public.event_rsvps (user_id);
CREATE INDEX IF NOT EXISTS idx_announcements_order   ON public.announcements (is_pinned DESC, created_at DESC);

-- ===== Avatar bucket limits =====
UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp']
WHERE id = 'avatars';
