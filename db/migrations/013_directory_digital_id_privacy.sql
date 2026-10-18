-- Directory profile cards should only expose alumni-approved public fields,
-- while still providing the public verification code for digital ID QR links.

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
