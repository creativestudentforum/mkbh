-- =====================================================================
-- Migration 015: Comprehensive Fund Management, Campaigns & Transparency
-- Adds support for campaigns, configurable payment methods, digital receipts,
-- audit logs, expense vouchers, duplicate TrxID prevention, and ledger integrity.
-- =====================================================================

-- 1. Campaigns / Funds Table
CREATE TABLE IF NOT EXISTS public.fund_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  banner_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_campaigns_status ON public.fund_campaigns (status, created_at DESC);

-- 2. Configurable Payment Methods Table
CREATE TABLE IF NOT EXISTS public.fund_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mobile_banking', 'bank', 'cash')),
  account_number TEXT,
  account_type TEXT DEFAULT 'Personal',
  bank_name TEXT,
  branch_name TEXT,
  routing_number TEXT,
  account_holder TEXT,
  instructions TEXT DEFAULT '',
  contact_person TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default payment methods if table is empty
INSERT INTO public.fund_payment_methods (name, type, account_number, account_type, account_holder, instructions, display_order)
SELECT 'bKash', 'mobile_banking', '01700000000', 'Merchant', 'Alumni Association Committee', 'Send Money বা Make Payment করুন এবং TrxID সংরক্ষণ করুন।', 1
WHERE NOT EXISTS (SELECT 1 FROM public.fund_payment_methods WHERE name = 'bKash');

INSERT INTO public.fund_payment_methods (name, type, account_number, account_type, account_holder, instructions, display_order)
SELECT 'Nagad', 'mobile_banking', '01800000000', 'Personal', 'Alumni Association Committee', 'Send Money করুন এবং TrxID সংরক্ষণ করুন।', 2
WHERE NOT EXISTS (SELECT 1 FROM public.fund_payment_methods WHERE name = 'Nagad');

INSERT INTO public.fund_payment_methods (name, type, account_number, account_type, bank_name, branch_name, routing_number, account_holder, instructions, display_order)
SELECT 'Bank Transfer', 'bank', '123-456-7890', 'Current', 'Dutch-Bangla Bank PLC', 'Dhaka Branch', '090271234', 'MKBH Alumni Association', 'ব্যাংক ডিপোজিট বা এনপিএসবি/বিএফটিএন ট্রান্সফার করে ডিপোজিট স্লিপ/রেফারেন্স সংরক্ষণ করুন।', 3
WHERE NOT EXISTS (SELECT 1 FROM public.fund_payment_methods WHERE name = 'Bank Transfer');

INSERT INTO public.fund_payment_methods (name, type, instructions, contact_person, display_order)
SELECT 'Cash', 'cash', 'অফিসে সরাসরি এসে রসিদ সংগ্রহ করুন।', 'প্রধান হিসাবরক্ষক / সাধারণ সম্পাদক (অফিস রুম ১০২, মোবাইল: 01711111111)', 4
WHERE NOT EXISTS (SELECT 1 FROM public.fund_payment_methods WHERE name = 'Cash');

-- 3. Extend Fund Entries with Campaign, Sender Info, Receipt, Voucher, and Rejection Details
ALTER TABLE public.fund_entries
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.fund_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sender_number TEXT,
  ADD COLUMN IF NOT EXISTS receipt_number TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS voucher_url TEXT,
  ADD COLUMN IF NOT EXISTS vendor_name TEXT,
  ADD COLUMN IF NOT EXISTS donor_name TEXT,
  ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_adjustment BOOLEAN DEFAULT false;

-- Add unique constraint on receipt_number when present
CREATE UNIQUE INDEX IF NOT EXISTS uq_fund_receipt_number ON public.fund_entries (receipt_number) WHERE receipt_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fund_entries_campaign ON public.fund_entries (campaign_id);
CREATE INDEX IF NOT EXISTS idx_fund_entries_verified_date ON public.fund_entries (entry_date DESC) WHERE status = 'verified';

-- 4. Audit Log Table for Financial Transactions
CREATE TABLE IF NOT EXISTS public.fund_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  entry_id UUID REFERENCES public.fund_entries(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.fund_campaigns(id) ON DELETE SET NULL,
  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fund_audit_created ON public.fund_audit_logs (created_at DESC);

-- 5. Trigger: Protect verified entries from deletion (Ledger Integrity)
CREATE OR REPLACE FUNCTION public.prevent_delete_verified_fund_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'verified' THEN
    RAISE EXCEPTION 'Verified fund entries cannot be deleted to protect ledger integrity. Please create an adjustment entry instead.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_delete_verified_fund_entry ON public.fund_entries;
CREATE TRIGGER trg_prevent_delete_verified_fund_entry
  BEFORE DELETE ON public.fund_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_verified_fund_entry();

-- 6. Trigger: Automatic Receipt Number Assignment on Verification
CREATE OR REPLACE FUNCTION public.generate_fund_receipt_number()
RETURNS TRIGGER AS $$
DECLARE
  v_year TEXT;
  v_seq INT;
BEGIN
  IF NEW.status = 'verified' AND (OLD.status IS NULL OR OLD.status != 'verified') AND NEW.receipt_number IS NULL THEN
    v_year := to_char(COALESCE(NEW.entry_date, CURRENT_DATE), 'YYYY');
    SELECT COALESCE(MAX(SUBSTRING(receipt_number FROM '[0-9]+$')::INT), 0) + 1
      INTO v_seq
      FROM public.fund_entries
      WHERE receipt_number LIKE 'REC-' || v_year || '-%';
    
    NEW.receipt_number := 'REC-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');
    IF NEW.verified_at IS NULL THEN
      NEW.verified_at := NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_generate_fund_receipt_number ON public.fund_entries;
CREATE TRIGGER trg_generate_fund_receipt_number
  BEFORE INSERT OR UPDATE ON public.fund_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_fund_receipt_number();

-- 7. RLS Configuration
ALTER TABLE public.fund_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fund_audit_logs ENABLE ROW LEVEL SECURITY;

-- Campaigns: Public viewable, admin writable
DROP POLICY IF EXISTS "Public can view active campaigns" ON public.fund_campaigns;
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.fund_campaigns;

CREATE POLICY "Public can view active campaigns"
  ON public.fund_campaigns FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins manage campaigns"
  ON public.fund_campaigns FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Payment Methods: Public viewable active methods, admin writable
DROP POLICY IF EXISTS "Public can view active payment methods" ON public.fund_payment_methods;
DROP POLICY IF EXISTS "Admins manage payment methods" ON public.fund_payment_methods;

CREATE POLICY "Public can view active payment methods"
  ON public.fund_payment_methods FOR SELECT
  TO public
  USING (is_active = true OR public.is_admin());

CREATE POLICY "Admins manage payment methods"
  ON public.fund_payment_methods FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Fund Entries: Public can view verified entries for transparency
DROP POLICY IF EXISTS "Read verified or own" ON public.fund_entries;
CREATE POLICY "Read verified or own"
  ON public.fund_entries FOR SELECT
  TO public
  USING (status = 'verified' OR member_id = auth.uid() OR public.is_admin());

-- Audit Logs: Admin only
DROP POLICY IF EXISTS "Admins read audit logs" ON public.fund_audit_logs;
DROP POLICY IF EXISTS "Admins write audit logs" ON public.fund_audit_logs;

CREATE POLICY "Admins read audit logs"
  ON public.fund_audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins write audit logs"
  ON public.fund_audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- 8. Enhanced Fund Summary View
CREATE OR REPLACE VIEW public.fund_summary AS
SELECT
  COALESCE(SUM(amount) FILTER (WHERE kind = 'income' AND status = 'verified'), 0) AS income,
  COALESCE(SUM(amount) FILTER (WHERE kind = 'expense' AND status = 'verified'), 0) AS expense,
  COALESCE(SUM(amount) FILTER (WHERE kind = 'income' AND status = 'pending'), 0) AS pending_income,
  COALESCE(COUNT(*) FILTER (WHERE status = 'pending'), 0)::INT AS pending_count
FROM public.fund_entries;

GRANT SELECT ON public.fund_summary TO public;
GRANT SELECT ON public.fund_campaigns TO public;
GRANT SELECT ON public.fund_payment_methods TO public;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fund_campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fund_payment_methods TO authenticated;
GRANT SELECT, INSERT ON public.fund_audit_logs TO authenticated;
