"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DonationReceiptModal from "@/components/molecules/DonationReceiptModal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import {
  DEFAULT_CAMPAIGNS,
  DEFAULT_PAYMENT_METHODS,
  fetchCampaigns,
  fetchFundSummary,
  fetchPaymentMethods,
  isDuplicateTrxId,
  logFundAction,
  parseFundEntryMeta,
} from "@/lib/fund-service";
import { createClient } from "@/lib/supabase";
import type {
  FundCampaign,
  FundEntry,
  FundPaymentMethod,
  FundSummary,
} from "@/lib/types";
import { formatDate, uploadImage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Award,
  Building2,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  FileText,
  HandCoins,
  Heart,
  Landmark,
  LogIn,
  Receipt,
  Search,
  ShieldCheck,
  Upload,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

export default function FundPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    "campaigns" | "donate" | "honor" | "my-donations" | "ledger"
  >("campaigns");

  // Donation form state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [selectedMethodName, setSelectedMethodName] = useState<string>("bKash");
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  // Status & feedbacks
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<FundEntry | null>(null);
  const [trxError, setTrxError] = useState<string | null>(null);

  // Modals
  const [receiptEntry, setReceiptEntry] = useState<FundEntry | null>(null);
  const [voucherUrlModal, setVoucherUrlModal] = useState<string | null>(null);

  // Filter states
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "income" | "expense">("all");
  const [ledgerSearch, setLedgerSearch] = useState("");
  const [honorSearch, setHonorSearch] = useState("");

  // 1. Fetch campaigns
  const { data: campaigns = DEFAULT_CAMPAIGNS } = useQuery({
    queryKey: ["fund-campaigns"],
    queryFn: () => fetchCampaigns(supabase),
  });

  // 2. Fetch payment methods
  const { data: paymentMethods = DEFAULT_PAYMENT_METHODS } = useQuery({
    queryKey: ["fund-payment-methods"],
    queryFn: () => fetchPaymentMethods(supabase),
  });

  // 3. Fetch summary
  const { data: summary = { income: 0, expense: 0, pending_income: 0, pending_count: 0 } } =
    useQuery({
      queryKey: ["fund-summary"],
      queryFn: () => fetchFundSummary(supabase),
    });

  // 4. Fetch public verified entries for ledger & wall of honor
  const { data: verifiedEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ["fund-verified-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_entries")
        .select("*, profiles(full_name, batch, avatar_url), fund_campaigns(title)")
        .eq("status", "verified")
        .order("entry_date", { ascending: false })
        .limit(80);

      if (error) {
        console.warn("fetch verified entries fallback:", error.message);
        const { data: fallbackData } = await supabase
          .from("fund_entries")
          .select("*")
          .eq("status", "verified")
          .order("entry_date", { ascending: false })
          .limit(80);
        return (fallbackData || []) as FundEntry[];
      }
      return (data || []) as FundEntry[];
    },
  });

  // 5. Fetch user's own contributions
  const { data: myEntries = [], isLoading: myEntriesLoading } = useQuery({
    queryKey: ["my-fund-entries", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_entries")
        .select("*, fund_campaigns(title)")
        .eq("member_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("fetch my entries fallback:", error.message);
        const { data: fallbackData } = await supabase
          .from("fund_entries")
          .select("*")
          .eq("member_id", user?.id)
          .order("created_at", { ascending: false });
        return (fallbackData || []) as FundEntry[];
      }
      return (data || []) as FundEntry[];
    },
  });

  const selectedMethod =
    paymentMethods.find((m) => m.name.toLowerCase() === selectedMethodName.toLowerCase()) ||
    paymentMethods[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSelectCampaignForDonation = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
    setActiveTab("donate");
    setSubmitSuccess(null);
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setScreenshotFile(file);
      setScreenshotPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrxError(null);

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    if (!user) {
      alert("Please sign in before submitting your contribution.");
      return;
    }

    const cleanTrx = trxId.trim();
    if (selectedMethod.type !== "cash" && !cleanTrx) {
      alert("Please enter your Transaction ID (TrxID) or reference number.");
      return;
    }

    if (cleanTrx) {
      const duplicate = await isDuplicateTrxId(supabase, cleanTrx);
      if (duplicate) {
        setTrxError(
          "This Transaction ID has already been submitted. Please check the reference and try again."
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      let uploadedScreenshotUrl: string | null = null;
      if (screenshotFile) {
        uploadedScreenshotUrl = await uploadImage(screenshotFile, {
          folder: `alumni-hub/donations/${user.id}`,
        });
      }

      const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);
      const title = selectedCampaign
        ? `${selectedCampaign.title} - ${selectedMethod.name}`
        : `${selectedMethod.name} Contribution`;

      const payload: Record<string, unknown> = {
        kind: "income",
        category: selectedCampaign ? "campaign" : "donation",
        title,
        amount: numericAmount,
        entry_date: new Date().toISOString().slice(0, 10),
        member_id: user.id,
        method: selectedMethod.name,
        trx_id: cleanTrx || null,
        status: "pending",
        receipt_url: uploadedScreenshotUrl,
        note: note.trim(),
        campaign_id: selectedCampaignId || null,
        sender_number: senderNumber.trim() || null,
        donor_name: profile?.full_name || null,
        is_anonymous: isAnonymous,
      };

      let { data: inserted, error } = await supabase
        .from("fund_entries")
        .insert([payload])
        .select()
        .single();

      if (error && error.message.includes("column")) {
        console.warn("Falling back to standard columns for fund_entries:", error.message);
        const fallbackNote = [
          note.trim(),
          senderNumber ? `Sender: ${senderNumber}` : "",
          isAnonymous ? "(Anonymous)" : "",
          selectedCampaign ? `Campaign: ${selectedCampaign.title}` : "",
        ]
          .filter(Boolean)
          .join(" | ");

        const fallbackPayload = {
          kind: "income",
          category: "donation",
          title,
          amount: numericAmount,
          entry_date: new Date().toISOString().slice(0, 10),
          member_id: user.id,
          method: selectedMethod.name,
          trx_id: cleanTrx || null,
          status: "pending",
          receipt_url: uploadedScreenshotUrl,
          note: fallbackNote,
        };

        const res = await supabase
          .from("fund_entries")
          .insert([fallbackPayload])
          .select()
          .single();
        inserted = res.data;
        error = res.error;
      }

      if (error) {
        throw new Error(error.message);
      }

      await logFundAction(
        supabase,
        "payment_submitted",
        { amount: numericAmount, method: selectedMethod.name, trx_id: cleanTrx },
        inserted?.id,
        selectedCampaignId || null
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["my-fund-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-campaigns"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-verified-entries"] }),
      ]);

      setSubmitSuccess(inserted as FundEntry);
      setAmount("");
      setTrxId("");
      setSenderNumber("");
      setNote("");
      setScreenshotFile(null);
      setScreenshotPreview(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to submit contribution.";
      alert("Error: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const balance = summary.income - summary.expense;

  // Filter verified entries for ledger
  const filteredLedger = verifiedEntries.filter((item) => {
    if (ledgerFilter === "income" && item.kind !== "income") return false;
    if (ledgerFilter === "expense" && item.kind !== "expense") return false;
    if (ledgerSearch.trim()) {
      const q = ledgerSearch.toLowerCase();
      const meta = parseFundEntryMeta(item);
      const donor = meta.isAnonymous ? "anonymous" : (meta.donorName || "").toLowerCase();
      const title = (item.title || "").toLowerCase();
      const category = (item.category || "").toLowerCase();
      const method = (item.method || "").toLowerCase();
      return (
        title.includes(q) ||
        donor.includes(q) ||
        category.includes(q) ||
        method.includes(q)
      );
    }
    return true;
  });

  // Filter donor list for Wall of Honor (only verified income entries)
  const donorEntries = verifiedEntries.filter((e) => e.kind === "income");
  const filteredDonors = donorEntries.filter((item) => {
    if (!honorSearch.trim()) return true;
    const q = honorSearch.toLowerCase();
    const meta = parseFundEntryMeta(item);
    const donor = meta.isAnonymous ? "anonymous" : (meta.donorName || "").toLowerCase();
    const batch = (meta.donorBatch || "").toLowerCase();
    const camp = (meta.campaignTitle || item.title || "").toLowerCase();
    return donor.includes(q) || batch.includes(q) || camp.includes(q);
  });

  // Calculate user total contributions
  const userTotalContributed = myEntries
    .filter((e) => e.status === "verified")
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return (
    <DashboardShell title="Alumni Fund">
      <div className="max-w-6xl mx-auto space-y-7 pb-12">
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground">
                <Landmark className="w-4 h-4 text-accent" />
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-surface text-muted border border-border">
                <ShieldCheck className="w-3.5 h-3.5 text-brand" /> Verified & Audited Treasury
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              Alumni Endowment & Welfare Fund
            </h1>
            <p className="text-muted text-[14px] max-w-2xl mt-1 leading-relaxed">
              Institutional fund dedicated to school infrastructure, student merit scholarships, and emergency teacher support.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button
              variant={activeTab === "donate" ? "primary" : "secondary"}
              onClick={() => {
                setActiveTab("donate");
                setSubmitSuccess(null);
              }}
              className="gap-2 font-medium"
            >
              <Heart className="w-4 h-4 text-muted" />
              Make a Donation
            </Button>
          </div>
        </div>

        {/* Live Executive Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                Current Fund Balance
              </p>
              <Wallet className="w-4 h-4 text-accent" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              {formatCurrency(balance)}
            </p>
            <p className="text-[11px] text-muted mt-1">Net Balance (Receipts − Expenses)</p>
          </Card>

          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                Total Approved Receipts
              </p>
              <ArrowUpRight className="w-4 h-4 text-brand" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              {formatCurrency(summary.income)}
            </p>
            <p className="text-[11px] text-muted mt-1">Audited & Verified Contributions</p>
          </Card>

          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                Disbursed Expenses
              </p>
              <ArrowDownRight className="w-4 h-4 text-muted" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-muted tracking-tight">
              {formatCurrency(summary.expense)}
            </p>
            <p className="text-[11px] text-muted mt-1">Voucher-backed Institutional Costs</p>
          </Card>

          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">
                Active Projects
              </p>
              <Building2 className="w-4 h-4 text-muted" />
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight">
              {campaigns.filter((c) => c.status === "active").length} Campaigns
            </p>
            <p className="text-[11px] text-muted mt-1">Ongoing Development Initiatives</p>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-surface rounded-lg border border-border overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "campaigns"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Building2 className="w-4 h-4" />
            Campaigns ({campaigns.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("donate");
              setSubmitSuccess(null);
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "donate"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Heart className="w-4 h-4" />
            Donate Now
          </button>

          <button
            onClick={() => setActiveTab("honor")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "honor"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Award className="w-4 h-4" />
            Wall of Honor ({donorEntries.length})
          </button>

          {user && (
            <button
              onClick={() => setActiveTab("my-donations")}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                activeTab === "my-donations"
                  ? "bg-brand text-white shadow-sm"
                  : "text-muted hover:text-foreground hover:bg-white/5"
              }`}
            >
              <Receipt className="w-4 h-4" />
              My Receipts ({myEntries.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "ledger"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <FileText className="w-4 h-4" />
            Public Ledger
          </button>
        </div>

        {/* ========================================================
            TAB 1: RUNNING CAMPAIGNS
           ======================================================== */}
        {activeTab === "campaigns" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {campaigns.map((campaign) => {
                const target = Number(campaign.target_amount) || 0;
                const raised = Number(campaign.raised_amount) || 0;
                const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;

                return (
                  <div
                    key={campaign.id}
                    className="p-6 rounded-xl bg-surface border border-border hover:border-border-hover transition-colors flex flex-col justify-between"
                  >
                    <div>
                      {/* Overline & Status */}
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-[11px] font-semibold tracking-wider text-muted uppercase">
                          Project Fund
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-canvas text-foreground border border-border">
                          {campaign.status === "active" ? "Active" : "Completed"}
                        </span>
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-lg font-serif font-bold text-foreground tracking-tight mb-2">
                        {campaign.title}
                      </h3>
                      <p className="text-[13px] text-muted leading-relaxed mb-6">
                        {campaign.description}
                      </p>

                      {/* Progress Metrics */}
                      <div className="space-y-2.5 mb-6 p-4 rounded-lg bg-canvas border border-border">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-muted">
                            Raised: <span className="text-foreground font-semibold font-mono">{formatCurrency(raised)}</span>
                          </span>
                          <span className="text-muted">
                            Goal: <span className="text-foreground font-semibold font-mono">{formatCurrency(target)}</span>
                          </span>
                        </div>

                        {/* Progress track */}
                        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand rounded-full transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-muted">
                          <span className="font-medium text-foreground">{percent}% Funded</span>
                          {campaign.end_date && <span>Deadline: {formatDate(campaign.end_date)}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                      <span className="text-[12px] text-muted">
                        {campaign.donor_count
                          ? `${campaign.donor_count} donors contributed`
                          : "Be the first donor"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleSelectCampaignForDonation(campaign.id)}
                        className="gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-muted" /> Donate Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: DONATION WORKFLOW (2-Step Single-Page Checkout)
           ======================================================== */}
        {activeTab === "donate" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
            {/* Left: Donation Form */}
            <div className="space-y-5">
              {!user ? (
                <Card className="p-8 text-center space-y-4 bg-surface border-border">
                  <div className="w-12 h-12 rounded-xl bg-canvas border border-border flex items-center justify-center mx-auto text-foreground">
                    <LogIn className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif font-bold text-foreground">Sign in to Make a Contribution</h3>
                    <p className="text-[13px] text-muted max-w-md mx-auto mt-1 leading-relaxed">
                      Contributions from verified alumni accounts receive automated official money receipts and live audit tracking.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Link href="/login">
                      <Button>Sign In</Button>
                    </Link>
                    <Link href="/signup">
                      <Button variant="secondary">Register Account</Button>
                    </Link>
                  </div>
                </Card>
              ) : submitSuccess ? (
                <Card className="p-8 text-center space-y-6 bg-surface border-border">
                  <div className="w-14 h-14 rounded-xl bg-canvas border border-border flex items-center justify-center mx-auto text-foreground">
                    <Clock className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-canvas text-foreground border border-border mb-3">
                      <Clock className="w-3.5 h-3.5 text-accent" /> Status: Pending Verification
                    </span>
                    <h3 className="text-xl font-serif font-bold text-foreground tracking-tight">
                      Contribution Submitted Successfully!
                    </h3>
                    <p className="text-[13px] text-muted max-w-md mx-auto mt-2 leading-relaxed">
                      Your transaction ID ({submitSuccess.trx_id || "Cash"}) has been recorded. Once verified against bank/mobile banking statements, an official verified receipt will be issued to your account.
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-canvas border border-border text-left max-w-sm mx-auto space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-muted">Amount:</span>
                      <span className="text-foreground font-semibold font-mono">{formatCurrency(submitSuccess.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted">Payment Method:</span>
                      <span className="text-foreground">{submitSuccess.method}</span>
                    </div>
                    {submitSuccess.trx_id && (
                      <div className="flex justify-between">
                        <span className="text-muted">TrxID:</span>
                        <span className="text-foreground font-mono">{submitSuccess.trx_id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setSubmitSuccess(null);
                        setActiveTab("my-donations");
                      }}
                      className="gap-2"
                    >
                      <Receipt className="w-4 h-4" /> View My Receipts
                    </Button>
                    <Button variant="secondary" onClick={() => setSubmitSuccess(null)}>
                      Submit Another Contribution
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="p-6 rounded-xl bg-surface border border-border space-y-5">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <h3 className="text-base font-serif font-bold text-foreground tracking-tight">
                        Enter Contribution Details
                      </h3>
                      <p className="text-[12px] text-muted">
                        Send contribution via mobile banking or direct bank transfer, then submit details below
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Select Campaign */}
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-medium text-muted uppercase tracking-wider">
                        Select Campaign / Fund Allocation
                      </label>
                      <select
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="w-full rounded-md bg-[#0e1015] border border-border text-foreground px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-brand"
                      >
                        <option value="">General Alumni Welfare Fund</option>
                        {campaigns
                          .filter((c) => c.status === "active")
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Amount & Presets */}
                    <div className="space-y-2">
                      <label className="block text-[12px] font-medium text-muted uppercase tracking-wider">
                        Contribution Amount (BDT) *
                      </label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {PRESET_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(String(amt))}
                            className={`px-3 py-1.5 rounded-md text-[12px] font-medium border transition-colors ${
                              amount === String(amt)
                                ? "bg-brand text-white border-brand font-semibold"
                                : "bg-canvas border-border text-muted hover:text-foreground"
                            }`}
                          >
                            ৳ {amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g. 2500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="block text-[12px] font-medium text-muted uppercase tracking-wider">
                        Select Payment Method *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {paymentMethods.map((m) => {
                          const isSelected =
                            selectedMethodName.toLowerCase() === m.name.toLowerCase();
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedMethodName(m.name)}
                              className={`p-3 rounded-lg border text-center transition-colors ${
                                isSelected
                                  ? "bg-brand/10 border-brand text-foreground font-semibold"
                                  : "bg-canvas border-border text-muted hover:text-foreground"
                              }`}
                            >
                              <p className="text-[13px]">{m.name}</p>
                              <p className="text-[10px] text-muted capitalize mt-0.5 font-mono">
                                {m.type.replace("_", " ")}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sender Details */}
                    {selectedMethod.type !== "cash" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Sender Account / Phone Number *"
                          placeholder="e.g. 01712345678"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          required
                        />

                        <div>
                          <Input
                            label="Transaction ID (TrxID) *"
                            placeholder="e.g. BLK93J4KL8"
                            value={trxId}
                            onChange={(e) => {
                              setTrxId(e.target.value.toUpperCase());
                              setTrxError(null);
                            }}
                            required
                          />
                          {trxError && (
                            <p className="text-[12px] text-danger mt-1 flex items-center gap-1 font-medium">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {trxError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Screenshot / Voucher Upload */}
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-medium text-muted uppercase tracking-wider">
                        Payment Screenshot / Deposit Slip (Optional)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-3.5 py-2 rounded-md bg-[#0e1015] border border-border hover:border-border-hover cursor-pointer text-[12px] text-muted transition-colors">
                          <Upload className="w-4 h-4 text-muted" />
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleScreenshotChange}
                          />
                        </label>
                        {screenshotFile && (
                          <span className="text-[12px] text-muted truncate max-w-xs font-mono">
                            {screenshotFile.name}
                          </span>
                        )}
                      </div>
                      {screenshotPreview && (
                        <div className="mt-2 w-28 h-20 relative rounded-md overflow-hidden border border-border">
                          <img
                            src={screenshotPreview}
                            alt="Screenshot Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* Optional Note */}
                    <div className="space-y-1.5">
                      <label className="block text-[12px] font-medium text-muted uppercase tracking-wider">
                        Notes or Message (Optional)
                      </label>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Any special note or dedication message..."
                        className="w-full rounded-md bg-[#0e1015] border border-border text-foreground placeholder-muted px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-brand transition-colors"
                      />
                    </div>

                    {/* Anonymous toggle */}
                    <div className="flex items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-border bg-[#0e1015] text-brand focus:ring-0"
                      />
                      <label htmlFor="anonymous" className="text-[12px] text-muted cursor-pointer">
                        Keep my identity private in public lists (Display as Anonymous Alumnus)
                      </label>
                    </div>

                    <Button type="submit" isLoading={submitting} className="w-full py-3 text-[14px] mt-2">
                      <HandCoins className="w-4 h-4" />
                      Submit Contribution
                    </Button>
                  </form>
                </div>
              )}
            </div>

            {/* Right: Payment Instructions Card */}
            <div className="space-y-5">
              <div className="p-6 rounded-xl bg-surface border border-border space-y-4">
                <div className="flex items-center gap-3 border-b border-border pb-4">
                  <div className="w-9 h-9 rounded-lg bg-canvas border border-border flex items-center justify-center text-foreground">
                    <Landmark className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h4 className="text-base font-serif font-bold text-foreground tracking-tight">
                      {selectedMethod.name} Payment Instructions
                    </h4>
                    <p className="text-[11px] text-muted">Official Account Details</p>
                  </div>
                </div>

                {selectedMethod.type === "cash" ? (
                  <div className="space-y-3.5 text-[13px] text-muted">
                    <p className="leading-relaxed">{selectedMethod.instructions}</p>
                    {selectedMethod.contact_person && (
                      <div className="p-4 rounded-lg bg-canvas border border-border space-y-1">
                        <p className="text-[11px] text-muted uppercase font-semibold">Cash Receiving Officer</p>
                        <p className="text-foreground font-medium">{selectedMethod.contact_person}</p>
                      </div>
                    )}
                    <p className="text-[11px] text-muted">
                      An official money receipt will be issued immediately upon cash payment at the office.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-[13px]">
                    {/* Account number box */}
                    {selectedMethod.account_number && (
                      <div className="p-4 rounded-lg bg-canvas border border-border flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                            {selectedMethod.name} Number ({selectedMethod.account_type || "Account"})
                          </p>
                          <p className="text-base font-mono font-bold text-foreground mt-0.5">
                            {selectedMethod.account_number}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleCopy(selectedMethod.account_number || "", "acc_num")}
                          className="h-8 gap-1.5"
                        >
                          {copiedKey === "acc_num" ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-brand" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Bank specific info */}
                    {selectedMethod.type === "bank" && (
                      <div className="p-3.5 rounded-lg bg-canvas border border-border space-y-2 text-[12px]">
                        {selectedMethod.bank_name && (
                          <div className="flex justify-between">
                            <span className="text-muted">Bank:</span>
                            <span className="text-foreground font-medium">{selectedMethod.bank_name}</span>
                          </div>
                        )}
                        {selectedMethod.account_holder && (
                          <div className="flex justify-between">
                            <span className="text-muted">Account Name:</span>
                            <span className="text-foreground font-medium">{selectedMethod.account_holder}</span>
                          </div>
                        )}
                        {selectedMethod.branch_name && (
                          <div className="flex justify-between">
                            <span className="text-muted">Branch:</span>
                            <span className="text-foreground font-medium">{selectedMethod.branch_name}</span>
                          </div>
                        )}
                        {selectedMethod.routing_number && (
                          <div className="flex justify-between">
                            <span className="text-muted">Routing No:</span>
                            <span className="text-foreground font-mono">{selectedMethod.routing_number}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step by step */}
                    <div className="space-y-2 text-[12px] text-muted">
                      <p className="font-semibold text-foreground">How to send contribution:</p>
                      <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                        <li>Open your {selectedMethod.name} app or online banking.</li>
                        <li>Send Money or Transfer the amount to the official account shown above.</li>
                        <li>Copy the Transaction ID (TrxID) upon successful transfer and paste it into the form.</li>
                        <li>Submit the form. The treasury audit committee will verify and issue your digital receipt.</li>
                      </ol>
                    </div>

                    <div className="p-3.5 rounded-lg bg-canvas border border-border text-[12px] text-muted flex items-start gap-2.5">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-brand" />
                      <span>
                        Every contribution is audited and an official digital money receipt is recorded upon verification.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: DONORS WALL OF HONOR (Recognition List)
           ======================================================== */}
        {activeTab === "honor" && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-border">
              <div>
                <h3 className="text-base font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
                  <Award className="w-4 h-4 text-accent" />
                  Donors Wall of Honor
                </h3>
                <p className="text-[12px] text-muted mt-0.5">
                  Recognizing alumni whose contributions support our school community
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search by name or batch..."
                  value={honorSearch}
                  onChange={(e) => setHonorSearch(e.target.value)}
                  className="w-full bg-[#0e1015] border border-border text-foreground rounded-md pl-9 pr-3.5 py-2 text-[12px] placeholder-muted focus:outline-none focus:border-brand"
                />
              </div>
            </div>

            {filteredDonors.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredDonors.map((item) => {
                  const meta = parseFundEntryMeta(item);
                  const isAnon = meta.isAnonymous;
                  const name = isAnon ? "Anonymous Alumnus" : meta.donorName || "Alumni Member";
                  const batch = meta.donorBatch;

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-xl bg-surface border border-border hover:border-border-hover transition-colors flex items-start justify-between gap-3.5"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-canvas border border-border flex items-center justify-center flex-shrink-0 text-foreground font-serif font-bold text-sm">
                          {isAnon ? "?" : name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-foreground truncate">{name}</p>
                          <div className="flex items-center gap-2 text-[11px] text-muted mt-0.5 flex-wrap">
                            {batch && !isAnon && (
                              <span className="px-2 py-0.2 rounded-md bg-canvas border border-border text-foreground font-mono">
                                Batch {batch}
                              </span>
                            )}
                            <span>{formatDate(item.entry_date)}</span>
                          </div>
                          <p className="text-[11px] text-muted truncate mt-1">
                            {meta.campaignTitle || item.title}
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="text-[15px] font-semibold text-foreground font-mono">
                          {formatCurrency(item.amount)}
                        </p>
                        <span className="text-[10px] text-muted uppercase tracking-wider">Contributed</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-surface border border-border">
                <Users className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-[13px] text-muted">No donor records found.</p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 4: MY DONATIONS & RECEIPTS
           ======================================================== */}
        {activeTab === "my-donations" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-bold text-foreground tracking-tight">My Contributions & Receipts</h3>
                <p className="text-[12px] text-muted mt-0.5">Live tracking and official digital money receipts for all your contributions</p>
              </div>

              <div className="flex items-center gap-2 bg-canvas px-4 py-2 rounded-lg border border-border">
                <span className="text-[12px] text-muted">Total Contributed:</span>
                <span className="text-base font-serif font-bold text-foreground">
                  {formatCurrency(userTotalContributed)}
                </span>
              </div>
            </div>

            {myEntriesLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 bg-surface animate-pulse rounded-lg" />
                ))}
              </div>
            ) : myEntries.length > 0 ? (
              <div className="divide-y divide-border rounded-xl bg-surface border border-border overflow-hidden">
                {myEntries.map((entry) => {
                  const meta = parseFundEntryMeta(entry);

                  return (
                    <div
                      key={entry.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <p className="text-[14px] font-semibold text-foreground">
                            {meta.campaignTitle || entry.title}
                          </p>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                              entry.status === "verified"
                                ? "bg-brand/10 text-brand border border-brand/20"
                                : entry.status === "pending"
                                ? "bg-accent/10 text-accent border border-accent/20"
                                : "bg-danger/10 text-danger border border-danger/20"
                            }`}
                          >
                            {entry.status === "verified" && <CheckCircle2 className="w-3 h-3 text-brand" />}
                            {entry.status === "pending" && <Clock className="w-3 h-3 text-accent" />}
                            {entry.status === "rejected" && <XCircle className="w-3 h-3 text-danger" />}
                            {entry.status === "verified"
                              ? "Verified"
                              : entry.status === "pending"
                              ? "Pending Verification"
                              : "Rejected"}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[12px] text-muted flex-wrap">
                          <span>Date: {formatDate(entry.entry_date)}</span>
                          <span>Method: {entry.method || "Direct"}</span>
                          {entry.trx_id && <span className="font-mono">TrxID: {entry.trx_id}</span>}
                        </div>

                        {entry.status === "rejected" && meta.rejectionReason && (
                          <div className="mt-2 p-3 rounded-lg bg-canvas border border-border text-[12px] text-muted flex items-start gap-2">
                            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-danger" />
                            <span>
                              <strong className="text-foreground">Rejection Reason:</strong> {meta.rejectionReason}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <p className="text-lg font-mono font-bold text-foreground">
                          {formatCurrency(entry.amount)}
                        </p>

                        {entry.status === "verified" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setReceiptEntry(entry)}
                            className="gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-muted" />
                            Money Receipt
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-surface border border-border">
                <Receipt className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-[13px] text-muted">No contributions submitted yet.</p>
                <Button
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setActiveTab("donate");
                    setSubmitSuccess(null);
                  }}
                >
                  Make a Contribution
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================
            TAB 5: PUBLIC TRANSPARENCY LEDGER
           ======================================================== */}
        {activeTab === "ledger" && (
          <div className="space-y-4">
            <div className="p-5 rounded-xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-serif font-bold text-foreground tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-accent" />
                  Public Audited Ledger
                </h3>
                <p className="text-[12px] text-muted mt-0.5">
                  Transparent public audit ledger of all approved contributions and school expenses
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="Search ledger..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="bg-[#0e1015] border border-border text-foreground rounded-md pl-9 pr-3.5 py-1.5 text-[12px] placeholder-muted focus:outline-none focus:border-brand w-44 sm:w-56"
                  />
                </div>

                <div className="flex items-center gap-1 bg-canvas p-1 rounded-lg border border-border">
                  <button
                    onClick={() => setLedgerFilter("all")}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                      ledgerFilter === "all" ? "bg-brand text-white font-semibold" : "text-muted hover:text-foreground"
                    }`}
                  >
                    All ({verifiedEntries.length})
                  </button>
                  <button
                    onClick={() => setLedgerFilter("income")}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                      ledgerFilter === "income" ? "bg-brand text-white font-semibold" : "text-muted hover:text-foreground"
                    }`}
                  >
                    Receipts
                  </button>
                  <button
                    onClick={() => setLedgerFilter("expense")}
                    className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                      ledgerFilter === "expense" ? "bg-brand text-white font-semibold" : "text-muted hover:text-foreground"
                    }`}
                  >
                    Disbursements
                  </button>
                </div>
              </div>
            </div>

            {ledgerLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-surface animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredLedger.length > 0 ? (
              <div className="divide-y divide-border rounded-xl bg-surface border border-border overflow-hidden">
                {filteredLedger.map((entry) => {
                  const isIncome = entry.kind === "income";
                  const meta = parseFundEntryMeta(entry);
                  const displayName = meta.isAnonymous
                    ? "Anonymous Alumnus (Private)"
                    : meta.donorName || (isIncome ? "Alumnus" : entry.vendor_name || "Committee Expense");

                  return (
                    <div
                      key={entry.id}
                      className="p-5 flex items-start justify-between gap-4 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-canvas border border-border flex items-center justify-center flex-shrink-0">
                          {isIncome ? (
                            <ArrowUpRight className="w-5 h-5 text-brand" />
                          ) : (
                            <ArrowDownRight className="w-5 h-5 text-muted" />
                          )}
                        </div>

                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-[14px] font-semibold text-foreground">
                              {meta.campaignTitle || entry.title}
                            </p>
                            <span className="px-2 py-0.2 rounded-md bg-canvas border border-border text-[11px] font-medium text-foreground">
                              {isIncome ? "Receipt" : "Disbursement"}
                            </span>
                            <span className="px-2 py-0.2 rounded-md bg-white/[0.03] text-[11px] text-muted">
                              {entry.category || "General"}
                            </span>
                          </div>

                          <p className="text-[12px] text-muted">
                            {isIncome ? "Contributor: " : "Payee / Account: "}
                            <span className="text-foreground font-medium">{displayName}</span>
                            {meta.donorBatch && !meta.isAnonymous && (
                              <span className="text-muted font-mono"> · Batch {meta.donorBatch}</span>
                            )}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-muted pt-0.5">
                            <span>Date: {formatDate(entry.entry_date)}</span>
                            {entry.method && <span>Method: {entry.method}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0 space-y-1">
                        <p className="text-[16px] font-mono font-bold text-foreground">
                          {isIncome ? "+" : "-"}
                          {formatCurrency(entry.amount)}
                        </p>

                        {(entry.voucher_url || entry.receipt_url) && (
                          <button
                            onClick={() => setVoucherUrlModal(entry.voucher_url || entry.receipt_url)}
                            className="inline-flex items-center gap-1 text-[11px] text-muted hover:text-foreground underline underline-offset-2"
                          >
                            <Eye className="w-3 h-3" /> View Voucher
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center rounded-xl bg-surface border border-border">
                <FileText className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-[13px] text-muted">No ledger records found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Official Money Receipt Modal */}
      <DonationReceiptModal
        isOpen={Boolean(receiptEntry)}
        onClose={() => setReceiptEntry(null)}
        entry={receiptEntry}
      />

      {/* Voucher/Bill Image Preview Modal */}
      <Modal
        isOpen={Boolean(voucherUrlModal)}
        onClose={() => setVoucherUrlModal(null)}
        title="Expense Voucher / Receipt Document"
        size="lg"
      >
        {voucherUrlModal && (
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-black flex items-center justify-center p-2">
              <img
                src={voucherUrlModal}
                alt="Bill Voucher"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <a href={voucherUrlModal} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Size
                </Button>
              </a>
              <Button size="sm" onClick={() => setVoucherUrlModal(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
