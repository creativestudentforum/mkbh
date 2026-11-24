-- =====================================================================
-- Migration 016: Batch Photo Gallery & Coordinator Permissions
-- =====================================================================

-- 1. Create batch_photos table
CREATE TABLE IF NOT EXISTS public.batch_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_year TEXT NOT NULL REFERENCES public.batches(year) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Performance index
CREATE INDEX IF NOT EXISTS idx_batch_photos_year_created 
  ON public.batch_photos (batch_year, created_at DESC);

-- 3. Row Level Security
ALTER TABLE public.batch_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read batch photos" ON public.batch_photos;
DROP POLICY IF EXISTS "Admins manage batch photos" ON public.batch_photos;
DROP POLICY IF EXISTS "Coordinators insert batch photos" ON public.batch_photos;
DROP POLICY IF EXISTS "Coordinators update batch photos" ON public.batch_photos;
DROP POLICY IF EXISTS "Coordinators delete batch photos" ON public.batch_photos;

-- Read: Approved alumni and admins can view photos of any batch
CREATE POLICY "Members read batch photos"
  ON public.batch_photos FOR SELECT TO authenticated
  USING (public.is_member());

-- Admin: Admins can do everything
CREATE POLICY "Admins manage batch photos"
  ON public.batch_photos FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Coordinator Insert: Coordinators can upload photos to their assigned batch
CREATE POLICY "Coordinators insert batch photos"
  ON public.batch_photos FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.batches
      WHERE year = batch_photos.batch_year
        AND coordinator_id = auth.uid()
    )
  );

-- Coordinator Update: Coordinators can edit captions/info for their batch photos
CREATE POLICY "Coordinators update batch photos"
  ON public.batch_photos FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.batches
      WHERE year = batch_photos.batch_year
        AND coordinator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.batches
      WHERE year = batch_photos.batch_year
        AND coordinator_id = auth.uid()
    )
  );

-- Coordinator / Uploader Delete: Coordinators or the uploader can delete photos
CREATE POLICY "Coordinators delete batch photos"
  ON public.batch_photos FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.batches
      WHERE year = batch_photos.batch_year
        AND coordinator_id = auth.uid()
    )
    OR uploaded_by = auth.uid()
  );

-- 4. View for batch photos with uploader info from alumni_directory
CREATE OR REPLACE VIEW public.batch_photos_view AS
SELECT
  bp.id,
  bp.batch_year,
  bp.url,
  bp.caption,
  bp.uploaded_by,
  bp.created_at,
  ad.full_name AS uploader_name,
  ad.avatar_url AS uploader_avatar
FROM public.batch_photos bp
LEFT JOIN public.alumni_directory ad ON ad.id = bp.uploaded_by;

-- 5. Enhanced batch_stats view including both members and photo count
CREATE OR REPLACE VIEW public.batch_stats AS
SELECT
  y.year,
  COALESCE(m.members, 0)::BIGINT AS members,
  COALESCE(p.photos, 0)::BIGINT AS photos
FROM (
  SELECT year FROM public.batches
  UNION
  SELECT batch AS year FROM public.alumni_directory WHERE COALESCE(batch, '') <> ''
) y
LEFT JOIN (
  SELECT batch AS year, COUNT(*) AS members
  FROM public.alumni_directory
  WHERE COALESCE(batch, '') <> ''
  GROUP BY batch
) m ON m.year = y.year
LEFT JOIN (
  SELECT batch_year AS year, COUNT(*) AS photos
  FROM public.batch_photos
  GROUP BY batch_year
) p ON p.year = y.year;

-- 6. Permissions
REVOKE ALL ON public.batch_photos FROM anon;
REVOKE ALL ON public.batch_photos_view FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batch_photos TO authenticated;
GRANT SELECT ON public.batch_photos_view TO authenticated;
GRANT SELECT ON public.batch_stats TO authenticated;
