-- =====================================================================
-- Migration 014: High-Performance Database Indexes
-- Optimizes query performance, latency, search lookups, and sorting
-- =====================================================================

-- 1. Profiles Table Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_status_created
  ON public.profiles (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profiles_full_name
  ON public.profiles (full_name);

CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles (email);

CREATE INDEX IF NOT EXISTS idx_profiles_public_code
  ON public.profiles (public_code);

CREATE INDEX IF NOT EXISTS idx_profiles_featured
  ON public.profiles (is_featured, created_at DESC)
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_profiles_blood_donor_lookup
  ON public.profiles (blood_group, city)
  WHERE is_blood_donor = true;

CREATE INDEX IF NOT EXISTS idx_profiles_approved_dept
  ON public.profiles (department)
  WHERE status = 'approved';

-- 2. Events & RSVP Indexes
CREATE INDEX IF NOT EXISTS idx_events_active_date
  ON public.events (is_active, event_date);

CREATE INDEX IF NOT EXISTS idx_rsvps_event_status
  ON public.event_rsvps (event_id, status);

CREATE INDEX IF NOT EXISTS idx_rsvps_user_event
  ON public.event_rsvps (user_id, event_id);

-- 3. Gallery & Photos Indexes
CREATE INDEX IF NOT EXISTS idx_photos_album_created
  ON public.photos (album_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_albums_created
  ON public.albums (created_at DESC);

-- 4. Teachers & Batches Indexes
CREATE INDEX IF NOT EXISTS idx_teachers_active_name
  ON public.teachers (is_active, full_name);

CREATE INDEX IF NOT EXISTS idx_batches_year_desc
  ON public.batches (year DESC);

-- 5. Fund Ledger & Announcements
CREATE INDEX IF NOT EXISTS idx_fund_entries_status_kind
  ON public.fund_entries (status, kind, amount);

CREATE INDEX IF NOT EXISTS idx_announcements_pinned_created
  ON public.announcements (is_pinned DESC, created_at DESC);
