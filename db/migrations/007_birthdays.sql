-- Phase 3.3: Today's birthdays widget.

CREATE OR REPLACE VIEW public.todays_birthdays AS
SELECT id, full_name, batch, avatar_url
FROM public.profiles
WHERE status = 'approved'
  AND show_birthday
  AND date_of_birth IS NOT NULL
  AND to_char(date_of_birth, 'MM-DD') = to_char(NOW() AT TIME ZONE 'Asia/Dhaka', 'MM-DD')
  AND public.is_member();

REVOKE ALL ON public.todays_birthdays FROM anon;
GRANT SELECT ON public.todays_birthdays TO authenticated;
