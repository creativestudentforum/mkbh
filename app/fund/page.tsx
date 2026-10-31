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
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
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
  Sparkles,
  Upload,
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

const PRESET_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function FundPage() {
  const { profile, user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Tab navigation
  const [activeTab, setActiveTab] = useState<
    "campaigns" | "donate" | "my-donations" | "ledger"
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

  // Ledger filter
  const [ledgerFilter, setLedgerFilter] = useState<"all" | "income" | "expense">("all");

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

  // 4. Fetch public verified entries for ledger
  const { data: verifiedEntries = [], isLoading: ledgerLoading } = useQuery({
    queryKey: ["fund-verified-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_entries")
        .select("*, profiles(full_name, batch, avatar_url), fund_campaigns(title)")
        .eq("status", "verified")
        .order("entry_date", { ascending: false })
        .limit(60);

      if (error) {
        console.warn("fetch verified entries fallback:", error.message);
        // Fallback without relation joins if tables are newly added
        const { data: fallbackData } = await supabase
          .from("fund_entries")
          .select("*")
          .eq("status", "verified")
          .order("entry_date", { ascending: false })
          .limit(60);
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
      alert("অনুগ্রহ করে সঠিক অনুদানের পরিমাণ লিখুন।");
      return;
    }

    if (!user) {
      alert("অনুগ্রহ করে অনুদান জমা দেওয়ার পূর্বে লগইন করুন।");
      return;
    }

    const cleanTrx = trxId.trim();
    if (selectedMethod.type !== "cash" && !cleanTrx) {
      alert("অনুগ্রহ করে আপনার TrxID / রেফারেন্স নম্বর প্রদান করুন।");
      return;
    }

    // Check duplicate TrxID if provided
    if (cleanTrx) {
      const duplicate = await isDuplicateTrxId(supabase, cleanTrx);
      if (duplicate) {
        setTrxError(
          "এই TrxID-টি ইতিপূর্বে জমা দেওয়া হয়েছে। অনুগ্রহ করে সঠিক TrxID পরীক্ষা করে পুনরায় চেষ্টা করুন।"
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
        : `${selectedMethod.name} অনুদান`;

      // Payload matching schema
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

      // Try inserting with all fields
      let { data: inserted, error } = await supabase
        .from("fund_entries")
        .insert([payload])
        .select()
        .single();

      // Fallback if extended columns are not yet applied in Supabase
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

      // Log audit
      await logFundAction(
        supabase,
        "payment_submitted",
        { amount: numericAmount, method: selectedMethod.name, trx_id: cleanTrx },
        inserted?.id,
        selectedCampaignId || null
      );

      // Invalidate queries
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
      const msg = err instanceof Error ? err.message : "অনুদান জমা দিতে সমস্যা হয়েছে।";
      alert("Error: " + msg);
    } finally {
      setSubmitting(false);
    }
  };

  const balance = summary.income - summary.expense;
  const filteredLedger = verifiedEntries.filter((item) => {
    if (ledgerFilter === "income") return item.kind === "income";
    if (ledgerFilter === "expense") return item.kind === "expense";
    return true;
  });

  return (
    <DashboardShell title="Fund">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Portal Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)] slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[24px] font-bold text-[#fafafa] tracking-tight">
                Alumni Fund & Campaigns
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30">
                <Sparkles className="w-3 h-3" /> স্বচ্ছ তহবিল
              </span>
            </div>
            <p className="text-[#888] text-[14px]">
              চলমান ক্যাম্পেইনে অনুদান দিন, ডিজিটাল মানি রসিদ বুঝে নিন এবং তহবিলের উন্মুক্ত হিসাব দেখুন।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={activeTab === "donate" ? "primary" : "secondary"}
              onClick={() => {
                setActiveTab("donate");
                setSubmitSuccess(null);
              }}
              className="gap-2"
            >
              <Heart className="w-4 h-4 text-[#EF4444] fill-[#EF4444]" />
              ডোনেট করুন
            </Button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 slide-up stagger-2">
          <Card className="p-4 bg-[rgba(52,211,153,0.03)] border-[rgba(52,211,153,0.15)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">মোট অনুমোদিত জমা</p>
              <ArrowUpCircle className="w-4 h-4 text-[#34D399]" />
            </div>
            <p className="text-[22px] sm:text-[26px] font-bold text-[#34D399]">
              {formatCurrency(summary.income)}
            </p>
            <p className="text-[11px] text-[#666] mt-1">শুধু যাচাইকৃত প্রাপ্তি</p>
          </Card>

          <Card className="p-4 bg-[rgba(239,68,68,0.03)] border-[rgba(239,68,68,0.15)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">মোট ব্যয়</p>
              <ArrowDownCircle className="w-4 h-4 text-[#EF4444]" />
            </div>
            <p className="text-[22px] sm:text-[26px] font-bold text-[#EF4444]">
              {formatCurrency(summary.expense)}
            </p>
            <p className="text-[11px] text-[#666] mt-1">ভাউচারযুক্ত প্রাতিষ্ঠানিক খরচ</p>
          </Card>

          <Card className="p-4 bg-[rgba(20,184,166,0.04)] border-[rgba(20,184,166,0.18)]">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">বর্তমান তহবিল ব্যালেন্স</p>
              <Wallet className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <p className="text-[22px] sm:text-[26px] font-bold text-[#fafafa]">
              {formatCurrency(balance)}
            </p>
            <p className="text-[11px] text-[#14B8A6] mt-1">অবশিষ্ট ব্যালেন্স (জমা − খরচ)</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">সক্রিয় ক্যাম্পেইন</p>
              <HandCoins className="w-4 h-4 text-[#FBBF24]" />
            </div>
            <p className="text-[22px] sm:text-[26px] font-bold text-[#FBBF24]">
              {campaigns.filter((c) => c.status === "active").length} টি
            </p>
            <p className="text-[11px] text-[#666] mt-1">উন্নয়ন ও সহায়তা প্রকল্প</p>
          </Card>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto slide-up stagger-2">
          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "campaigns"
                ? "bg-[#1f1f1f] text-white shadow-sm border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <HandCoins className="w-4 h-4" />
            চলমান ক্যাম্পেইন ({campaigns.length})
          </button>

          <button
            onClick={() => {
              setActiveTab("donate");
              setSubmitSuccess(null);
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "donate"
                ? "bg-[#14B8A6] text-white shadow-[0_0_15px_rgba(20,184,166,0.3)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <Heart className="w-4 h-4" />
            অনুদান দিন
          </button>

          {user && (
            <button
              onClick={() => setActiveTab("my-donations")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                activeTab === "my-donations"
                  ? "bg-[#1f1f1f] text-white shadow-sm border border-[rgba(255,255,255,0.08)]"
                  : "text-[#888] hover:text-[#ccc]"
              }`}
            >
              <Receipt className="w-4 h-4" />
              আমার অনুদান ও রসিদ ({myEntries.length})
            </button>
          )}

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "ledger"
                ? "bg-[#1f1f1f] text-white shadow-sm border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <FileText className="w-4 h-4" />
            পাবলিক স্বচ্ছতা লেজার
          </button>
        </div>

        {/* TAB 1: RUNNING CAMPAIGNS */}
        {activeTab === "campaigns" && (
          <div className="space-y-4 slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {campaigns.map((campaign) => {
                const target = Number(campaign.target_amount) || 0;
                const raised = Number(campaign.raised_amount) || 0;
                const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;

                return (
                  <Card
                    key={campaign.id}
                    className="p-6 relative overflow-hidden flex flex-col justify-between hover:border-[rgba(20,184,166,0.4)] transition-all group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="text-[17px] font-bold text-[#fafafa] group-hover:text-[#14B8A6] transition-colors">
                          {campaign.title}
                        </h3>
                        <Badge variant={campaign.status === "active" ? "success" : "default"}>
                          {campaign.status === "active" ? "চলমান" : "সম্পন্ন"}
                        </Badge>
                      </div>

                      <p className="text-[13px] text-[#888] leading-relaxed mb-5">
                        {campaign.description}
                      </p>

                      {/* Progress bar */}
                      <div className="space-y-2 mb-5">
                        <div className="flex items-center justify-between text-[12px]">
                          <span className="text-[#a0a0a0]">
                            সংগৃহীত: <span className="text-[#34D399] font-semibold">{formatCurrency(raised)}</span>
                          </span>
                          <span className="text-[#888]">
                            লক্ষ্যমাত্রা: <span className="text-[#fafafa] font-semibold">{formatCurrency(target)}</span>
                          </span>
                        </div>

                        <div className="w-full h-2.5 bg-[#1e1e1e] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#0D9488] to-[#34D399] rounded-full transition-all duration-700"
                            style={{ width: `${percent}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-[#666]">
                          <span>{percent}% অর্জিত</span>
                          {campaign.end_date && <span>মেয়াদ: {formatDate(campaign.end_date)} পর্যন্ত</span>}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
                      <span className="text-[12px] text-[#777]">
                        {campaign.donor_count ? `${campaign.donor_count} জন অনুদান দিয়েছেন` : "প্রথম অনুদানকারী হোন"}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleSelectCampaignForDonation(campaign.id)}
                        className="gap-1.5"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#EF4444]" /> ডোনেট করুন
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: DONATION WORKFLOW */}
        {activeTab === "donate" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 slide-up">
            {/* Left: Donation Form */}
            <div className="space-y-5">
              {!user ? (
                <Card className="p-6 text-center space-y-4 bg-[rgba(20,184,166,0.04)] border-[rgba(20,184,166,0.2)]">
                  <div className="w-12 h-12 rounded-full bg-[rgba(20,184,166,0.15)] flex items-center justify-center mx-auto text-[#14B8A6]">
                    <LogIn className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-white">অনুদান দিতে অনুগ্রহ করে লগইন করুন</h3>
                    <p className="text-[13px] text-[#888] max-w-md mx-auto mt-1">
                      লগইন অবস্থায় অনুদান জমা দিলে আপনার নামে স্বয়ংক্রিয় ডিজিটাল রসিদ তৈরি হবে এবং ডোনেশন হিস্ট্রি সংরক্ষিত থাকবে।
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Link href="/login">
                      <Button>লগইন করুন</Button>
                    </Link>
                    <Link href="/signup">
                      <Button variant="secondary">অ্যালামনাই রেজিস্ট্রেশন</Button>
                    </Link>
                  </div>
                </Card>
              ) : submitSuccess ? (
                <Card className="p-6 sm:p-8 text-center space-y-5 bg-[rgba(52,211,153,0.04)] border-[rgba(52,211,153,0.25)]">
                  <div className="w-14 h-14 rounded-full bg-[rgba(52,211,153,0.15)] flex items-center justify-center mx-auto text-[#34D399]">
                    <Clock className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium bg-[#FBBF24]/15 text-[#FBBF24] border border-[#FBBF24]/30 mb-2">
                      <Clock className="w-3.5 h-3.5" /> স্ট্যাটাস: যাচাই চলছে (Pending)
                    </span>
                    <h3 className="text-[20px] font-bold text-white mt-2">
                      আপনার অনুদানের তথ্য সফলভাবে জমা হয়েছে!
                    </h3>
                    <p className="text-[13px] text-[#a0a0a0] max-w-lg mx-auto mt-2 leading-relaxed">
                      অ্যাডমিন প্যানেল থেকে আপনার প্রেরিত ট্রানজেকশন আইডি ({submitSuccess.trx_id || "ক্যাশ"}) এবং স্টেটমেন্ট যাচাই শেষে অনুদানটি অনুমোদিত হবে এবং আপনার অ্যাকাউন্টে ডিজিটাল মানি রসিদ দৃশ্যমান হবে।
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-[#141414] border border-[rgba(255,255,255,0.06)] text-left max-w-sm mx-auto space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-[#666]">পরিমাণ:</span>
                      <span className="text-[#34D399] font-bold">{formatCurrency(submitSuccess.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#666]">পেমেন্ট মাধ্যম:</span>
                      <span className="text-white">{submitSuccess.method}</span>
                    </div>
                    {submitSuccess.trx_id && (
                      <div className="flex justify-between">
                        <span className="text-[#666]">TrxID:</span>
                        <span className="text-white font-mono">{submitSuccess.trx_id}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                      onClick={() => {
                        setSubmitSuccess(null);
                        setActiveTab("my-donations");
                      }}
                    >
                      <Receipt className="w-4 h-4" /> আমার অনুদান হিস্ট্রি দেখুন
                    </Button>
                    <Button variant="secondary" onClick={() => setSubmitSuccess(null)}>
                      আরেকটি অনুদান দিন
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-6">
                  <h3 className="text-[16px] font-bold text-white mb-4 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#EF4444]" />
                    অনুদান ফর্ম পূরণ করুন
                  </h3>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Select Campaign */}
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#a0a0a0]">
                        ক্যাম্পেইন / তহবিলের খাত নির্বাচন করুন
                      </label>
                      <select
                        value={selectedCampaignId}
                        onChange={(e) => setSelectedCampaignId(e.target.value)}
                        className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                      >
                        <option value="">সাধারণ অ্যালামনাই উন্নয়ন তহবিল (General)</option>
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
                      <label className="block text-[13px] font-medium text-[#a0a0a0]">
                        টাকার পরিমাণ (BDT) *
                      </label>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {PRESET_AMOUNTS.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setAmount(String(amt))}
                            className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                              amount === String(amt)
                                ? "bg-[#14B8A6]/20 border-[#14B8A6] text-[#14B8A6]"
                                : "bg-[#141414] border-[rgba(255,255,255,0.08)] text-[#888] hover:text-white"
                            }`}
                          >
                            ৳ {amt.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <Input
                        type="number"
                        min="1"
                        placeholder="যেমন: 2000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div className="space-y-2">
                      <label className="block text-[13px] font-medium text-[#a0a0a0]">
                        পেমেন্ট মাধ্যম বেছে নিন *
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {paymentMethods.map((m) => {
                          const isSelected =
                            selectedMethodName.toLowerCase() === m.name.toLowerCase();
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setSelectedMethodName(m.name)}
                              className={`p-3 rounded-xl border text-center transition-all ${
                                isSelected
                                  ? "bg-[rgba(20,184,166,0.15)] border-[#14B8A6] text-white shadow-sm"
                                  : "bg-[#141414] border-[rgba(255,255,255,0.08)] text-[#888] hover:text-white"
                              }`}
                            >
                              <p className="text-[13px] font-bold">{m.name}</p>
                              <p className="text-[10px] text-[#666] capitalize mt-0.5">{m.type.replace("_", " ")}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Sender Details */}
                    {selectedMethod.type !== "cash" && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="যে নম্বর / অ্যাকাউন্ট থেকে পাঠিয়েছেন *"
                          placeholder="যেমন: 01712345678"
                          value={senderNumber}
                          onChange={(e) => setSenderNumber(e.target.value)}
                          required
                        />

                        <div>
                          <Input
                            label="Transaction ID (TrxID) *"
                            placeholder="যেমন: BLK93J4KL8"
                            value={trxId}
                            onChange={(e) => {
                              setTrxId(e.target.value.toUpperCase());
                              setTrxError(null);
                            }}
                            required
                          />
                          {trxError && (
                            <p className="text-[12px] text-[#EF4444] mt-1 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                              {trxError}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Screenshot / Voucher Upload */}
                    <div className="space-y-1.5">
                      <label className="block text-[13px] font-medium text-[#a0a0a0]">
                        পেমেন্ট স্ক্রিনশট / জমার স্লিপ (ঐচ্ছিক)
                      </label>
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] hover:border-[#14B8A6] cursor-pointer text-[12px] text-[#a0a0a0] transition-colors">
                          <Upload className="w-4 h-4 text-[#14B8A6]" />
                          ছবি নির্বাচন করুন
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleScreenshotChange}
                          />
                        </label>
                        {screenshotFile && (
                          <span className="text-[12px] text-[#34D399] truncate max-w-xs">
                            {screenshotFile.name}
                          </span>
                        )}
                      </div>
                      {screenshotPreview && (
                        <div className="mt-2 w-28 h-20 relative rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)]">
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
                      <label className="block text-[13px] font-medium text-[#a0a0a0]">
                        মন্তব্য বা বার্তা (ঐচ্ছিক)
                      </label>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="আপনার কোনো বিশেষ নির্দেশনা বা শুভেচ্ছা বার্তা..."
                        className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                      />
                    </div>

                    {/* Anonymous toggle */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="anonymous"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                        className="rounded border-[rgba(255,255,255,0.2)] bg-[#141414] text-[#14B8A6] focus:ring-0"
                      />
                      <label htmlFor="anonymous" className="text-[12px] text-[#888] cursor-pointer">
                        পাবলিক লেজারে আমার নাম গোপন রাখুন (Anonymous হিসেবে দেখানো হবে)
                      </label>
                    </div>

                    <Button type="submit" isLoading={submitting} className="w-full py-3 text-[14px]">
                      <HandCoins className="w-4 h-4" />
                      অনুদান জমা দিন (যাচাইয়ের জন্য পাঠান)
                    </Button>
                  </form>
                </Card>
              )}
            </div>

            {/* Right: Payment Instructions Card */}
            <div className="space-y-5">
              <Card className="p-6 bg-[rgba(20,184,166,0.05)] border-[rgba(20,184,166,0.2)] space-y-4">
                <div className="flex items-center gap-2.5 border-b border-[rgba(20,184,166,0.15)] pb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/20 flex items-center justify-center text-[#14B8A6]">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-white">
                      {selectedMethod.name} পেমেন্ট নির্দেশনা
                    </h4>
                    <p className="text-[11px] text-[#888]">অফিসিয়াল একাউন্ট তথ্য</p>
                  </div>
                </div>

                {selectedMethod.type === "cash" ? (
                  <div className="space-y-3 text-[13px] text-[#c0c0c0]">
                    <p className="leading-relaxed">{selectedMethod.instructions}</p>
                    {selectedMethod.contact_person && (
                      <div className="p-3.5 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)] space-y-1">
                        <p className="text-[11px] text-[#14B8A6] uppercase font-semibold">ক্যাশ গ্রহণকারী কর্মকর্তা</p>
                        <p className="text-white font-medium">{selectedMethod.contact_person}</p>
                      </div>
                    )}
                    <p className="text-[11px] text-[#888]">
                      সরাসরি ক্যাশ প্রদানের পর অ্যাডমিন নিজে ডাটাবেজে এন্ট্রি দিলে আপনি রসিদ পাবেন।
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 text-[13px]">
                    {/* Account number box */}
                    {selectedMethod.account_number && (
                      <div className="p-3.5 rounded-xl bg-[#141414] border border-[rgba(20,184,166,0.2)] flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] text-[#777] uppercase tracking-wider font-semibold">
                            {selectedMethod.name} নম্বর ({selectedMethod.account_type || "Account"})
                          </p>
                          <p className="text-[17px] font-mono font-bold text-white mt-0.5">
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
                              <Check className="w-3.5 h-3.5 text-[#34D399]" />
                              কপি হয়েছে
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              কপি
                            </>
                          )}
                        </Button>
                      </div>
                    )}

                    {/* Bank specific info */}
                    {selectedMethod.type === "bank" && (
                      <div className="p-3 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)] space-y-1.5 text-[12px]">
                        {selectedMethod.bank_name && (
                          <div className="flex justify-between">
                            <span className="text-[#666]">Bank:</span>
                            <span className="text-white font-medium">{selectedMethod.bank_name}</span>
                          </div>
                        )}
                        {selectedMethod.account_holder && (
                          <div className="flex justify-between">
                            <span className="text-[#666]">Account Name:</span>
                            <span className="text-white font-medium">{selectedMethod.account_holder}</span>
                          </div>
                        )}
                        {selectedMethod.branch_name && (
                          <div className="flex justify-between">
                            <span className="text-[#666]">Branch:</span>
                            <span className="text-white font-medium">{selectedMethod.branch_name}</span>
                          </div>
                        )}
                        {selectedMethod.routing_number && (
                          <div className="flex justify-between">
                            <span className="text-[#666]">Routing No:</span>
                            <span className="text-white font-mono">{selectedMethod.routing_number}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step by step */}
                    <div className="space-y-2 text-[12px] text-[#a0a0a0]">
                      <p className="font-semibold text-white">কীভাবে টাকা পাঠাবেন:</p>
                      <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed">
                        <li>আপনার {selectedMethod.name} অ্যাপ বা অনলাইন ব্যাংকিংয়ে প্রবেশ করুন।</li>
                        <li>উপরের নম্বরে টাকা Send Money বা Transfer করুন।</li>
                        <li>পেমেন্ট সফল হলে প্রাপ্ত Transaction ID (TrxID) টি কপি করুন।</li>
                        <li>পাশের ফর্মটিতে TrxID ও প্রেরক নম্বর দিয়ে সাবমিট করুন।</li>
                      </ol>
                    </div>

                    <div className="p-3 rounded-lg bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.2)] text-[12px] text-[#FBBF24] flex items-start gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        জমা দেওয়ার সাথে সাথে স্ট্যাটাস <strong>"যাচাই চলছে"</strong> দেখাবে। অ্যাডমিন স্টেটমেন্ট মিলিয়ে অনুমোদন দিলে রসিদ দেখতে পাবেন।
                      </span>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}

        {/* TAB 3: MY DONATIONS & RECEIPTS */}
        {activeTab === "my-donations" && (
          <div className="space-y-4 slide-up">
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                <div>
                  <h3 className="text-[16px] font-bold text-white">আমার অনুদান ও রসিদসমূহ</h3>
                  <p className="text-[12px] text-[#888]">আপনার জমাকৃত সকল পেমেন্টের লাইভ স্ট্যাটাস ও মানি রসিদ</p>
                </div>
              </div>

              {myEntriesLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-lg" />
                  ))}
                </div>
              ) : myEntries.length > 0 ? (
                <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {myEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-[14px] font-semibold text-white">
                            {entry.fund_campaigns?.title || entry.title}
                          </p>
                          <Badge
                            variant={
                              entry.status === "verified"
                                ? "success"
                                : entry.status === "pending"
                                ? "warning"
                                : "danger"
                            }
                          >
                            {entry.status === "verified"
                              ? "অনুমোদিত (Verified)"
                              : entry.status === "pending"
                              ? "যাচাই চলছে (Pending)"
                              : "বাতিল (Rejected)"}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-[12px] text-[#777] flex-wrap">
                          <span>তারিখ: {formatDate(entry.entry_date)}</span>
                          <span>পদ্ধতি: {entry.method || "Direct"}</span>
                          {entry.trx_id && <span className="font-mono">TrxID: {entry.trx_id}</span>}
                        </div>

                        {entry.status === "rejected" && entry.rejection_reason && (
                          <div className="mt-2 p-2.5 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-[12px] text-[#EF4444] flex items-start gap-1.5">
                            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>
                              <strong>বাতিলের কারণ:</strong> {entry.rejection_reason}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 justify-between sm:justify-end">
                        <p className="text-[17px] font-bold text-[#34D399]">
                          {formatCurrency(entry.amount)}
                        </p>

                        {entry.status === "verified" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setReceiptEntry(entry)}
                            className="gap-1.5"
                          >
                            <Receipt className="w-3.5 h-3.5 text-[#14B8A6]" />
                            মানি রসিদ
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Receipt className="w-8 h-8 text-[#444] mx-auto mb-3" />
                  <p className="text-[13px] text-[#888]">এখনও কোনো অনুদান জমা দেওয়া হয়নি।</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setActiveTab("donate");
                      setSubmitSuccess(null);
                    }}
                  >
                    এখনই অনুদান দিন
                  </Button>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 4: PUBLIC TRANSPARENCY LEDGER */}
        {activeTab === "ledger" && (
          <div className="space-y-4 slide-up">
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                    উন্মুক্ত স্বচ্ছতা লেজার (Public Transparency Ledger)
                  </h3>
                  <p className="text-[12px] text-[#888]">
                    সকল অনুমোদিত অনুদান ও খরচের সরাসরি নিরীক্ষিত তালিকা
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-[#141414] p-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
                  <button
                    onClick={() => setLedgerFilter("all")}
                    className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                      ledgerFilter === "all" ? "bg-[#252525] text-white" : "text-[#777] hover:text-white"
                    }`}
                  >
                    সব ({verifiedEntries.length})
                  </button>
                  <button
                    onClick={() => setLedgerFilter("income")}
                    className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                      ledgerFilter === "income" ? "bg-[#252525] text-[#34D399]" : "text-[#777] hover:text-white"
                    }`}
                  >
                    জমা
                  </button>
                  <button
                    onClick={() => setLedgerFilter("expense")}
                    className={`px-3 py-1 rounded text-[12px] font-medium transition-colors ${
                      ledgerFilter === "expense" ? "bg-[#252525] text-[#EF4444]" : "text-[#777] hover:text-white"
                    }`}
                  >
                    খরচ
                  </button>
                </div>
              </div>

              {ledgerLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-lg" />
                  ))}
                </div>
              ) : filteredLedger.length > 0 ? (
                <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {filteredLedger.map((entry) => {
                    const isIncome = entry.kind === "income";
                    const displayName = entry.is_anonymous
                      ? "Anonymous Alumnus (গোপন)"
                      : entry.donor_name || entry.profiles?.full_name || (isIncome ? "Alumnus" : entry.vendor_name || "Committee Expense");

                    return (
                      <div
                        key={entry.id}
                        className="p-4 sm:p-5 flex items-start justify-between gap-4 hover:bg-[rgba(255,255,255,0.015)] transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isIncome ? "bg-[#34D399]/10" : "bg-[#EF4444]/10"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowUpCircle className="w-5 h-5 text-[#34D399]" />
                            ) : (
                              <ArrowDownCircle className="w-5 h-5 text-[#EF4444]" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[14px] font-semibold text-white">
                                {entry.fund_campaigns?.title || entry.title}
                              </p>
                              <Badge variant={isIncome ? "success" : "danger"}>
                                {isIncome ? "জমা" : "ব্যয়"}
                              </Badge>
                              <Badge>{entry.category || "General"}</Badge>
                            </div>

                            <p className="text-[12px] text-[#999]">
                              {isIncome ? "প্রদানকারী: " : "গ্রহীতা/খাত: "}
                              <span className="text-[#fafafa] font-medium">{displayName}</span>
                              {entry.profiles?.batch && !entry.is_anonymous && (
                                <span className="text-[#14B8A6]"> · Batch {entry.profiles.batch}</span>
                              )}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-[#666] pt-0.5">
                              <span>তারিখ: {formatDate(entry.entry_date)}</span>
                              {entry.method && <span>পদ্ধতি: {entry.method}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 space-y-1">
                          <p
                            className={`text-[15px] font-bold ${
                              isIncome ? "text-[#34D399]" : "text-[#EF4444]"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrency(entry.amount)}
                          </p>

                          {/* Proof voucher or receipt */}
                          {(entry.voucher_url || entry.receipt_url) && (
                            <button
                              onClick={() => setVoucherUrlModal(entry.voucher_url || entry.receipt_url)}
                              className="inline-flex items-center gap-1 text-[11px] text-[#14B8A6] hover:underline"
                            >
                              <Eye className="w-3 h-3" /> বিল/ভাউচার দেখুন
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Banknote className="w-8 h-8 text-[#444] mx-auto mb-3" />
                  <p className="text-[13px] text-[#888]">এই ফিল্টারে কোনো লেনদেন নেই।</p>
                </div>
              )}
            </Card>
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
        title="বিলের ছবি / ভাউচার প্রমাণক"
        size="lg"
      >
        {voucherUrlModal && (
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-black flex items-center justify-center p-2">
              <img
                src={voucherUrlModal}
                alt="Bill Voucher"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <a href={voucherUrlModal} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> পূর্ণ আকারে খুলুন
                </Button>
              </a>
              <Button size="sm" onClick={() => setVoucherUrlModal(null)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
