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
  CASE WHEN show_professional_info THEN profession END AS profession,
  CASE WHEN show_professional_info THEN company END AS company,
  CASE WHEN show_location THEN city END AS city,
  CASE WHEN show_location THEN country END AS country,
  CASE WHEN show_social_links THEN linkedin_url END AS linkedin_url,
  blood_group,
  CASE WHEN show_phone THEN phone END AS phone,
  CASE WHEN show_bio THEN bio END AS bio,
  CASE WHEN show_social_links THEN facebook_url END AS facebook_url,
  CASE WHEN show_social_links THEN website_url END AS website_url,
  created_at,
  is_featured,
  achievement,
  public_code
FROM public.profiles
WHERE status = 'approved'
  AND user_type = 'alumni'
  AND public.is_member();

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

-- =====================================================================
-- PERFORMANCE INDEXES (Optimized for low latency & fast lookups)
-- =====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_status_created ON public.profiles (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_full_name ON public.profiles (full_name);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (email);
CREATE INDEX IF NOT EXISTS idx_profiles_public_code ON public.profiles (public_code);
CREATE INDEX IF NOT EXISTS idx_profiles_featured ON public.profiles (is_featured, created_at DESC) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_profiles_blood_donor_lookup ON public.profiles (blood_group, city) WHERE is_blood_donor = true;
CREATE INDEX IF NOT EXISTS idx_profiles_approved_dept ON public.profiles (department) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_events_active_date ON public.events (is_active, event_date);
CREATE INDEX IF NOT EXISTS idx_rsvps_event_status ON public.event_rsvps (event_id, status);
CREATE INDEX IF NOT EXISTS idx_rsvps_user_event ON public.event_rsvps (user_id, event_id);
CREATE INDEX IF NOT EXISTS idx_photos_album_created ON public.photos (album_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_created ON public.albums (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_teachers_active_name ON public.teachers (is_active, full_name);
CREATE INDEX IF NOT EXISTS idx_batches_year_desc ON public.batches (year DESC);
CREATE INDEX IF NOT EXISTS idx_fund_entries_status_kind ON public.fund_entries (status, kind, amount);
CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created ON public.announcements (is_pinned DESC, created_at DESC);

-- =====================================================================
-- Migration 015: Comprehensive Fund Management, Campaigns & Transparency
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.fund_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_campaigns_status ON public.fund_campaigns (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.fund_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mobile_banking', 'bank', 'cash')),
  account_number TEXT,
  account_type TEXT DEFAULT 'Personal',
  bank_name TEXT,
  branch_name TEXT,
  routing_number TEXT,
  account_holder TEXT,
  instructions TEXT DEFAULT '',
  contact_person TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.fund_entries
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.fund_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_number TEXT,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voucher_url TEXT,
  ADD COLUMN IF NOT EXISTS vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_adjustment BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS uq_fund_receipt_number ON public.fund_entries (receipt_number) WHERE receipt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fund_entries_campaign ON public.fund_entries (campaign_id);
CREATE INDEX IF NOT EXISTS idx_fund_entries_verified_date ON public.fund_entries (entry_date DESC) WHERE status = 'verified';

CREATE TABLE IF NOT EXISTS public.fund_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entry_id UUID REFERENCES public.fund_entries(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.fund_campaigns(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_audit_created ON public.fund_audit_logs (created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_delete_verified_fund_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'verified' THEN
    RAISE EXCEPTION 'Verified fund entries cannot be deleted to protect ledger integrity. Please create an adjustment entry instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_delete_verified_fund_entry ON public.fund_entries;
CREATE TRIGGER trg_prevent_delete_verified_fund_entry
  BEFORE DELETE ON public.fund_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_verified_fund_entry();

CREATE OR REPLACE FUNCTION public.generate_fund_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') AND NEW.receipt_number IS NULL THEN
    v_year := to_char(COALESCE(NEW.entry_date, CURRENT_DATE), 'YYYY');
    SELECT COALESCE(MAX(SUBSTRING(receipt_number FROM '[0-9]+$')::INT), 0) + 1
      INTO v_seq
      FROM public.fund_entries
      WHERE receipt_number LIKE 'REC-' || v_year || '-%';
    
    NEW.receipt_number := 'REC-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_fund_receipt_number ON public.fund_entries;
CREATE TRIGGER trg_generate_fund_receipt_number
  BEFORE INSERT OR UPDATE ON public.fund_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_fund_receipt_number();

