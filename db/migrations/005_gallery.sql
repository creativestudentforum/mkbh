-- Phase 2.3: Photo gallery.

CREATE TABLE IF NOT EXISTS public.albums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  cover_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  caption TEXT DEFAULT '',
  uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_album ON public.photos (album_id, created_at DESC);

ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read albums" ON public.albums;
DROP POLICY IF EXISTS "Admins manage albums" ON public.albums;
DROP POLICY IF EXISTS "Members read photos" ON public.photos;
DROP POLICY IF EXISTS "Admins manage photos" ON public.photos;

CREATE POLICY "Members read albums"
  ON public.albums FOR SELECT TO authenticated
  USING (public.is_member());

CREATE POLICY "Admins manage albums"
  ON public.albums FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Members read photos"
  ON public.photos FOR SELECT TO authenticated
  USING (public.is_member());

CREATE POLICY "Admins manage photos"
  ON public.photos FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('gallery', 'gallery', true, 3145728, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 3145728,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp'];

DROP POLICY IF EXISTS "Members view gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admins upload gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admins update gallery" ON storage.objects;
DROP POLICY IF EXISTS "Admins delete gallery" ON storage.objects;

CREATE POLICY "Members view gallery"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'gallery' AND public.is_member());

CREATE POLICY "Admins upload gallery"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

CREATE POLICY "Admins update gallery"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'gallery' AND public.is_admin())
  WITH CHECK (bucket_id = 'gallery' AND public.is_admin());

CREATE POLICY "Admins delete gallery"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'gallery' AND public.is_admin());

REVOKE ALL ON public.albums FROM anon;
REVOKE ALL ON public.photos FROM anon;
GRANT SELECT ON public.albums TO authenticated;
GRANT SELECT ON public.photos TO authenticated;
