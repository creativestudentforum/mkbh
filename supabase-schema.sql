-- ============================================
-- Alumni Management System - Supabase SQL Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  
  -- Role & Status
  role TEXT NOT NULL DEFAULT 'alumni' CHECK (role IN ('alumni', 'admin')),
  user_type TEXT NOT NULL DEFAULT 'alumni' CHECK (user_type IN ('alumni', 'teacher')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Alumni-specific fields
  batch TEXT DEFAULT '',
  department TEXT DEFAULT '',
  student_id TEXT DEFAULT '',
  current_company TEXT DEFAULT '',
  job_title TEXT DEFAULT '',
  location TEXT DEFAULT '',
  
  -- Social Links
  linkedin_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  twitter_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 2. TEACHERS TABLE (Admin-managed)
-- ============================================
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT DEFAULT '',
  avatar_url TEXT,
  department TEXT DEFAULT '',
  designation TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  linkedin_url TEXT DEFAULT '',
  website_url TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3. ANNOUNCEMENTS TABLE
-- ============================================
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 3b. EVENTS TABLE
-- ============================================
CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_date DATE NOT NULL,
  event_time TEXT DEFAULT '',
  location TEXT DEFAULT '',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
DROP POLICY IF EXISTS "Users can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;

CREATE POLICY "Users can view approved profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (status = 'approved' OR id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Teachers policies
DROP POLICY IF EXISTS "Anyone authenticated can view active teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;

CREATE POLICY "Anyone authenticated can view active teachers"
  ON public.teachers FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Announcements policies
DROP POLICY IF EXISTS "Anyone authenticated can view announcements" ON public.announcements;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

CREATE POLICY "Anyone authenticated can view announcements"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Prevent normal users from approving themselves or becoming admin via direct API calls.
CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_admin() AND (
    NEW.email IS DISTINCT FROM OLD.email OR
    NEW.role IS DISTINCT FROM OLD.role OR
    NEW.user_type IS DISTINCT FROM OLD.user_type OR
    NEW.status IS DISTINCT FROM OLD.status
  ) THEN
    RAISE EXCEPTION 'You cannot update protected profile fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_profile_privilege_escalation_trigger ON public.profiles;
CREATE TRIGGER prevent_profile_privilege_escalation_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_profile_privilege_escalation();

CREATE TRIGGER set_teachers_updated_at
  BEFORE UPDATE ON public.teachers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 6. STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatars" ON storage.objects;

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR ((storage.foldername(name))[1] = 'teachers' AND public.is_admin())
    )
  );

CREATE POLICY "Users can update own avatars"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR ((storage.foldername(name))[1] = 'teachers' AND public.is_admin())
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR ((storage.foldername(name))[1] = 'teachers' AND public.is_admin())
    )
  );

CREATE POLICY "Users can delete own avatars"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR ((storage.foldername(name))[1] = 'teachers' AND public.is_admin())
    )
  );


--- for the profile information update gemeni latest sql quesry
-- Drop old recursive policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Create new non-recursive policies
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update any profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage teachers"
  ON public.teachers FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can manage announcements"
  ON public.announcements FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Events policies
DROP POLICY IF EXISTS "Anyone authenticated can view active events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage events" ON public.events;

CREATE POLICY "Anyone authenticated can view active events"
  ON public.events FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage events"
  ON public.events FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. PHASE 1: PASSWORD RESET, PROFILE PRIVACY, EVENT RSVP
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS blood_group TEXT CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
  ADD COLUMN IF NOT EXISTS is_blood_donor BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_donation_date DATE,
  ADD COLUMN IF NOT EXISTS profession TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS company TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS city TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Bangladesh',
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS show_phone BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_birthday BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_email BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_bio BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_professional_info BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_location BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_social_links BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_code TEXT UNIQUE DEFAULT substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10),
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles
SET public_code = substr(replace(uuid_generate_v4()::text, '-', ''), 1, 10)
WHERE public_code IS NULL OR public_code = '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_public_code ON public.profiles (public_code);

UPDATE public.profiles
SET email = auth_users.email
FROM auth.users AS auth_users
WHERE profiles.id = auth_users.id AND profiles.email IS NULL;

CREATE OR REPLACE VIEW public.alumni_directory AS
SELECT
  id,
  full_name,
  batch,
  department,
  avatar_url,
  profession,
  company,
  city,
  country,
  linkedin_url,
  blood_group,
  CASE WHEN show_phone THEN phone END AS phone
FROM public.profiles
WHERE status = 'approved';

REVOKE ALL ON public.alumni_directory FROM anon;
GRANT SELECT ON public.alumni_directory TO authenticated;

DROP POLICY IF EXISTS "Users can view approved profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "read own or admin" ON public.profiles;

CREATE POLICY "read own or admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'going' CHECK (status IN ('going','maybe','not_going')),
  guests INT NOT NULL DEFAULT 0 CHECK (guests BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own rsvp" ON public.event_rsvps;
DROP POLICY IF EXISTS "admin read rsvp" ON public.event_rsvps;

CREATE POLICY "own rsvp"
  ON public.event_rsvps FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin read rsvp"
  ON public.event_rsvps FOR SELECT
  TO authenticated
  USING (public.is_admin());

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

CREATE OR REPLACE VIEW public.event_rsvp_counts AS
SELECT
  event_id,
  COUNT(*) FILTER (WHERE status = 'going') AS going,
  COALESCE(SUM(guests) FILTER (WHERE status = 'going'), 0) AS guests
FROM public.event_rsvps
GROUP BY event_id;

REVOKE ALL ON public.event_rsvp_counts FROM anon;
GRANT SELECT ON public.event_rsvp_counts TO authenticated;
