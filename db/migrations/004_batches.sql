-- Phase 2.2: Batch pages.

CREATE TABLE IF NOT EXISTS public.batches (
  year TEXT PRIMARY KEY,
  coordinator_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  group_photo_url TEXT,
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read batches" ON public.batches;
DROP POLICY IF EXISTS "Admins manage batches" ON public.batches;
DROP POLICY IF EXISTS "Coordinator edits own batch" ON public.batches;

CREATE POLICY "Members read batches"
  ON public.batches FOR SELECT TO authenticated
  USING (public.is_member());

CREATE POLICY "Admins manage batches"
  ON public.batches FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Coordinator edits own batch"
  ON public.batches FOR UPDATE TO authenticated
  USING (coordinator_id = auth.uid())
  WITH CHECK (coordinator_id = auth.uid());

-- Change 1985 if your school has an earlier first SSC batch.
INSERT INTO public.batches (year)
SELECT generate_series(1985, EXTRACT(YEAR FROM NOW())::int)::text
ON CONFLICT DO NOTHING;

CREATE OR REPLACE VIEW public.batch_stats AS
SELECT batch AS year, COUNT(*) AS members
FROM public.alumni_directory
WHERE COALESCE(batch, '') <> ''
GROUP BY batch;

REVOKE ALL ON public.batches FROM anon;
REVOKE ALL ON public.batch_stats FROM anon;
GRANT SELECT ON public.batches TO authenticated;
GRANT SELECT ON public.batch_stats TO authenticated;
