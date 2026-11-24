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
    instructions: "Send Money or Make Payment from the bKash app. Include your name or batch in the reference, and submit the TrxID below.",
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
    instructions: "Send Money via Nagad app or USSD, and retain the TrxID from the confirmation SMS.",
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
    instructions: "Transfer via online banking, NPSB, or direct deposit. Attach deposit slip or enter transaction reference number.",
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
    instructions: "Pay direct cash at the school alumni office or to the authorized committee representative to receive an immediate receipt.",
    contact_person: "Chief Accountant / General Secretary (Office Room 102, Phone: 01711-223344)",
    is_active: true,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_CAMPAIGNS: FundCampaign[] = [
  {
    id: "default-science-lab",
    title: "Science Laboratory Modernization",
    slug: "science-lab",
    description:
      "Procuring physics, chemistry, and biology laboratory equipment for hands-on student experiments and STEM excellence.",
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
    title: "Alumni Welfare & Merit Scholarship Fund",
    slug: "general-welfare",
    description:
      "Merit-based scholarships for underprivileged students, emergency teacher medical aid, and community welfare programs.",
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
  {
    id: "default-library-archive",
    title: "Digital Library & Book Bank Project",
    slug: "digital-library",
    description:
      "Adding modern reference books, international academic journals, and a computerized student reading corner to the school library.",
    target_amount: 200000,
    start_date: "2026-02-01",
    end_date: "2026-11-30",
    banner_url: null,
    status: "active",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raised_amount: 0,
    donor_count: 0,
  },
  {
    id: "default-campus-green",
    title: "Green Campus & Solar Power Initiative",
    slug: "green-campus",
    description:
      "Installing solar power systems on classroom rooftops to reduce utility costs, alongside a campus afforestation initiative.",
    target_amount: 400000,
    start_date: "2026-03-01",
    end_date: "2026-12-31",
    banner_url: null,
    status: "active",
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    raised_amount: 0,
    donor_count: 0,
  },
];

export interface ParsedFundMeta {
  cleanNote: string;
  senderNumber: string | null;
  campaignTitle: string | null;
  donorName: string | null;
  donorBatch: string | null;
  isAnonymous: boolean;
  rejectionReason: string | null;
  receiptNumber: string | null;
  collectorName: string | null;
}

/**
 * Robust parser to extract metadata whether stored in dedicated columns or encoded in note
 */
export function parseFundEntryMeta(entry: Partial<FundEntry> | null | undefined): ParsedFundMeta {
  if (!entry) {
    return {
      cleanNote: "",
      senderNumber: null,
      campaignTitle: null,
      donorName: null,
      donorBatch: null,
      isAnonymous: false,
      rejectionReason: null,
      receiptNumber: null,
      collectorName: null,
    };
  }

  let cleanNote = entry.note || "";
  let senderNumber = entry.sender_number || null;
  let campaignTitle = entry.fund_campaigns?.title || null;
  let donorName = entry.donor_name || entry.profiles?.full_name || null;
  let donorBatch = entry.profiles?.batch || null;
  let isAnonymous = Boolean(entry.is_anonymous);
  let rejectionReason = entry.rejection_reason || null;
  let receiptNumber = entry.receipt_number || null;
  let collectorName: string | null = null;

  if (entry.note) {
    const rawNote = entry.note;

    const rejectMatch = rawNote.match(/\[Rejected:\s*([^\]]+)\]/i);
    if (rejectMatch && !rejectionReason) {
      rejectionReason = rejectMatch[1].trim();
    }

    if (rawNote.includes("(Anonymous)") || rawNote.includes("Anonymous: true")) {
      isAnonymous = true;
    }

    const senderMatch = rawNote.match(/Sender:\s*([^|]+)/i);
    if (senderMatch && !senderNumber) {
      senderNumber = senderMatch[1].trim();
    }

    const campMatch = rawNote.match(/Campaign:\s*([^|]+)/i);
    if (campMatch && !campaignTitle) {
      campaignTitle = campMatch[1].trim();
    }

    const donorMatch = rawNote.match(/Donor:\s*([^|]+)/i);
    if (donorMatch && !donorName) {
      donorName = donorMatch[1].trim();
    }

    const batchMatch = rawNote.match(/Batch:\s*([^|]+)/i);
    if (batchMatch && !donorBatch) {
      donorBatch = batchMatch[1].trim();
    }

    const recMatch = rawNote.match(/Receipt:\s*([^|]+)/i);
    if (recMatch && !receiptNumber) {
      receiptNumber = recMatch[1].trim();
    }

    const colMatch = rawNote.match(/Received by:\s*([^|]+)/i);
    if (colMatch) {
      collectorName = colMatch[1].trim();
    }

    cleanNote = rawNote
      .replace(/\[Rejected:[^\]]*\]/gi, "")
      .replace(/\(Anonymous\)/gi, "")
      .replace(/Anonymous:\s*(true|false)/gi, "")
      .replace(/Sender:\s*[^|]+/gi, "")
      .replace(/Campaign:\s*[^|]+/gi, "")
      .replace(/Donor:\s*[^|]+/gi, "")
      .replace(/Batch:\s*[^|]+/gi, "")
      .replace(/Receipt:\s*[^|]+/gi, "")
      .replace(/Received by:\s*[^|]+/gi, "")
      .replace(/Category:\s*[^|]+/gi, "")
      .replace(/Vendor:\s*[^|]+/gi, "")
      .replace(/\|\s*\|/g, "|")
      .replace(/^\|\s*/, "")
      .replace(/\s*\|$/, "")
      .trim();
  }

  if (!receiptNumber && entry.entry_date && entry.id) {
    const year = new Date(entry.entry_date).getFullYear() || 2026;
    receiptNumber = `REC-${year}-${entry.id.slice(0, 6).toUpperCase()}`;
  }

  return {
    cleanNote,
    senderNumber,
    campaignTitle,
    donorName,
    donorBatch,
    isAnonymous,
    rejectionReason,
    receiptNumber,
    collectorName,
  };
}

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
