import { siteConfig } from "@/lib/site";
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FundAuditLog,
  FundCampaign,
  FundEntry,
  FundPaymentMethod,
  FundSummary,
} from "./types";

export const DEFAULT_PAYMENT_METHODS: FundPaymentMethod[] = [
  {
    id: "default-bkash",
    name: "bKash",
    type: "mobile_banking",
    account_number: siteConfig.payment.bkash || "01700-000000",
    account_type: "Merchant / Personal",
    bank_name: null,
    branch_name: null,
    routing_number: null,
    account_holder: siteConfig.payment.accountName,
    instructions: "bKash অ্যাপ থেকে Send Money বা Make Payment করুন। রেফারেন্সে আপনার নাম বা ব্যাচ লিখুন এবং প্রাপ্ত TrxID নিচে প্রদান করুন।",
    contact_person: null,
    is_active: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-nagad",
    name: "Nagad",
    type: "mobile_banking",
    account_number: siteConfig.payment.nagad || "01800-000000",
    account_type: "Personal",
    bank_name: null,
    branch_name: null,
    routing_number: null,
    account_holder: siteConfig.payment.accountName,
    instructions: "Nagad অ্যাপ বা ইউএসএসডি থেকে Send Money করুন এবং ফিরতি মেসেজের TrxID সংরক্ষণ করুন।",
    contact_person: null,
    is_active: true,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-bank",
    name: "Bank Transfer",
    type: "bank",
    account_number: siteConfig.payment.bank || "123-456-7890",
    account_type: "Current",
    bank_name: "Dutch-Bangla Bank PLC",
    branch_name: "School Branch / Main Branch",
    routing_number: "090271234",
    account_holder: siteConfig.payment.accountName,
    instructions: "ব্যাংক জমা, অনলাইন ব্যাংকিং বা NPSB/BEFTN ট্রান্সফার করুন। জমার স্লিপের ছবি বা রেফারেন্স নম্বর ফর্মটিতে দিন।",
    contact_person: null,
    is_active: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "default-cash",
    name: "Cash in Person",
    type: "cash",
    account_number: null,
    account_type: null,
    bank_name: null,
    branch_name: null,
    routing_number: null,
    account_holder: null,
    instructions: "স্কুল অফিসে বা নির্ধারিত কমিটির প্রতিনিধির কাছে সরাসরি ক্যাশ জমা দিয়ে রসিদ বুঝে নিন।",
    contact_person: "হিসাবরক্ষক / সাধারণ সম্পাদক (অফিস রুম ১০২, ফোন: 01711-223344)",
    is_active: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_CAMPAIGNS: FundCampaign[] = [
  {
    id: "default-science-lab",
    title: "নতুন সায়েন্স ল্যাব নির্মাণ ও আধুনিকায়ন",
    slug: "science-lab",
    description:
      "বিদ্যালয়ের বর্তমান শিক্ষার্থীদের বাস্তবমুখী ও আধুনিক বিজ্ঞানের পরীক্ষা-নিরীক্ষার জন্য নতুন পদার্থ, রসায়ন ও জীববিদ্যা ল্যাব সামগ্রী সংগ্রহ।",
    target_amount: 500000,
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    banner_url: null,
    status: "active",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raised_amount: 0,
    donor_count: 0,
  },
  {
    id: "default-general-welfare",
    title: "অ্যালামনাই সাধারণ কল্যাণ ও ছাত্রবৃত্তি তহবিল",
    slug: "general-welfare",
    description:
      "মেধাবী ও অসচ্ছল শিক্ষার্থীদের শিক্ষা সহায়তা, প্রাক্তন শিক্ষকদের চিকিৎসা সহায়তা এবং সার্বিক কল্যাণ কার্যক্রম।",
    target_amount: 300000,
    start_date: "2026-01-01",
    end_date: null,
    banner_url: null,
    status: "active",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raised_amount: 0,
    donor_count: 0,
  },
];

/**
 * Fetch active campaigns with computed raised amounts
 */
export async function fetchCampaigns(supabase: SupabaseClient): Promise<FundCampaign[]> {
  try {
    const { data, error } = await supabase
      .from("fund_campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return DEFAULT_CAMPAIGNS;
    }

    // Calculate raised amount for each campaign from verified entries
    const { data: entries } = await supabase
      .from("fund_entries")
      .select("campaign_id, amount")
      .eq("status", "verified")
      .eq("kind", "income");

    const campaignStats: Record<string, { raised: number; donors: number }> = {};
    if (entries) {
      for (const entry of entries) {
        if (!entry.campaign_id) continue;
        if (!campaignStats[entry.campaign_id]) {
          campaignStats[entry.campaign_id] = { raised: 0, donors: 0 };
        }
        campaignStats[entry.campaign_id].raised += Number(entry.amount) || 0;
        campaignStats[entry.campaign_id].donors += 1;
      }
    }

    return (data as FundCampaign[]).map((c) => ({
      ...c,
      raised_amount: campaignStats[c.id]?.raised || 0,
      donor_count: campaignStats[c.id]?.donors || 0,
    }));
  } catch (err) {
    console.warn("fetchCampaigns fallback:", err);
    return DEFAULT_CAMPAIGNS;
  }
}

/**
 * Fetch payment methods
 */
export async function fetchPaymentMethods(
  supabase: SupabaseClient
): Promise<FundPaymentMethod[]> {
  try {
    const { data, error } = await supabase
      .from("fund_payment_methods")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_PAYMENT_METHODS;
    }
    return data as FundPaymentMethod[];
  } catch (err) {
    console.warn("fetchPaymentMethods fallback:", err);
    return DEFAULT_PAYMENT_METHODS;
  }
}

/**
 * Fetch fund ledger summary
 */
export async function fetchFundSummary(supabase: SupabaseClient): Promise<FundSummary> {
  try {
    const { data, error } = await supabase
      .from("fund_summary")
      .select("*")
      .maybeSingle();

    if (!error && data) {
      return {
        income: Number(data.income) || 0,
        expense: Number(data.expense) || 0,
        pending_income: Number(data.pending_income) || 0,
        pending_count: Number(data.pending_count) || 0,
      };
    }
  } catch (err) {
    console.warn("fetchFundSummary fallback:", err);
  }

  // Fallback calculation directly from fund_entries
  try {
    const { data: entries } = await supabase
      .from("fund_entries")
      .select("kind, status, amount");

    let income = 0;
    let expense = 0;
    let pending_income = 0;
    let pending_count = 0;

    if (entries) {
      for (const e of entries) {
        const amt = Number(e.amount) || 0;
        if (e.status === "verified") {
          if (e.kind === "income") income += amt;
          if (e.kind === "expense") expense += amt;
        } else if (e.status === "pending") {
          if (e.kind === "income") {
            pending_income += amt;
            pending_count += 1;
          }
        }
      }
    }

    return { income, expense, pending_income, pending_count };
  } catch {
    return { income: 0, expense: 0, pending_income: 0, pending_count: 0 };
  }
}

/**
 * Check if a TrxID has already been submitted
 */
export async function isDuplicateTrxId(
  supabase: SupabaseClient,
  trxId: string
): Promise<boolean> {
  const cleanTrx = trxId.trim();
  if (!cleanTrx) return false;

  try {
    const { data, error } = await supabase
      .from("fund_entries")
      .select("id")
      .ilike("trx_id", cleanTrx)
      .limit(1);

    if (error) return false;
    return Boolean(data && data.length > 0);
  } catch {
    return false;
  }
}

/**
 * Record an audit log entry
 */
export async function logFundAction(
  supabase: SupabaseClient,
  action: string,
  details: Record<string, unknown>,
  entryId?: string | null,
  campaignId?: string | null
) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.from("fund_audit_logs").insert([
      {
        action,
        entry_id: entryId || null,
        campaign_id: campaignId || null,
        performed_by: user?.id || null,
        details,
      },
    ]);
  } catch (err) {
    console.warn("Audit log insert skipped:", err);
  }
}
