-- Phase 3.1: Bulk import alumni roster.

CREATE TABLE IF NOT EXISTS public.alumni_roster (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  batch TEXT NOT NULL,
  department TEXT DEFAULT '',
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  claimed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.alumni_roster ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage roster" ON public.alumni_roster;
CREATE POLICY "Admins manage roster"
  ON public.alumni_roster FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE INDEX IF NOT EXISTS idx_roster_batch ON public.alumni_roster (batch);
CREATE INDEX IF NOT EXISTS idx_roster_phone ON public.alumni_roster (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_roster_email ON public.alumni_roster (email) WHERE email IS NOT NULL;

REVOKE ALL ON public.alumni_roster FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alumni_roster TO authenticated;
