-- Phase 3.2: Approval/rejection email support.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT '';

CREATE OR REPLACE FUNCTION public.prevent_profile_privilege_escalation()
RETURNS TRIGGER AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() AND (
    NEW.email            IS DISTINCT FROM OLD.email OR
    NEW.role             IS DISTINCT FROM OLD.role OR
    NEW.user_type        IS DISTINCT FROM OLD.user_type OR
    NEW.status           IS DISTINCT FROM OLD.status OR
    NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
  ) THEN
    RAISE EXCEPTION 'You cannot update protected profile fields';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
