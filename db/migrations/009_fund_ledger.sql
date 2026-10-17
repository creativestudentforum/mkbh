-- Phase 4.1: Manual fund ledger.

CREATE TABLE IF NOT EXISTS public.fund_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kind TEXT NOT NULL CHECK (kind IN ('income','expense')),
  category TEXT DEFAULT 'other',
  title TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  member_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  method TEXT,
  trx_id TEXT,
  status TEXT NOT NULL DEFAULT 'verified' CHECK (status IN ('pending','verified','rejected')),
  receipt_url TEXT,
  note TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fund_trx ON public.fund_entries (trx_id) WHERE trx_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fund_entries_order ON public.fund_entries (entry_date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fund_entries_status ON public.fund_entries (status);

ALTER TABLE public.fund_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read verified or own" ON public.fund_entries;
DROP POLICY IF EXISTS "Member submits payment" ON public.fund_entries;
DROP POLICY IF EXISTS "Admins manage fund" ON public.fund_entries;

CREATE POLICY "Read verified or own"
  ON public.fund_entries FOR SELECT TO authenticated
  USING ((status = 'verified' AND public.is_member()) OR member_id = auth.uid() OR public.is_admin());

CREATE POLICY "Member submits payment"
  ON public.fund_entries FOR INSERT TO authenticated
  WITH CHECK (member_id = auth.uid() AND kind = 'income' AND status = 'pending' AND public.is_member());

CREATE POLICY "Admins manage fund"
  ON public.fund_entries FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE OR REPLACE VIEW public.fund_summary AS
SELECT
  COALESCE(SUM(amount) FILTER (WHERE kind = 'income'), 0) AS income,
  COALESCE(SUM(amount) FILTER (WHERE kind = 'expense'), 0) AS expense
FROM public.fund_entries
WHERE status = 'verified'
  AND public.is_member();

REVOKE ALL ON public.fund_entries FROM anon;
REVOKE ALL ON public.fund_summary FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fund_entries TO authenticated;
GRANT SELECT ON public.fund_summary TO authenticated;
