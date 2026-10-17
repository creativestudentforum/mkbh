-- Phase 2.1: Blood donor finder.

CREATE OR REPLACE VIEW public.blood_donors AS
SELECT
  id,
  full_name,
  batch,
  blood_group,
  city,
  phone,
  avatar_url,
  last_donation_date,
  (
    last_donation_date IS NULL
    OR last_donation_date <= CURRENT_DATE - INTERVAL '120 days'
  ) AS available
FROM public.profiles
WHERE status = 'approved'
  AND user_type = 'alumni'
  AND is_blood_donor
  AND blood_group IS NOT NULL
  AND COALESCE(phone, '') <> ''
  AND public.is_member();

REVOKE ALL ON public.blood_donors FROM anon;
GRANT SELECT ON public.blood_donors TO authenticated;
