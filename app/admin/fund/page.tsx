"use client";

import Avatar from "@/components/atoms/Avatar";
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
  CampaignStatus,
  FundAuditLog,
  FundCampaign,
  FundEntry,
  FundPaymentMethod,
  FundSummary,
  PaymentMethodType,
} from "@/lib/types";
import { formatDate, uploadImage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  HandCoins,
  History,
  Layers,
  Plus,
  Receipt,
  Save,
  Settings,
  ShieldCheck,
  Upload,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const EXPENSE_CATEGORIES = [
  "সায়েন্স ল্যাব যন্ত্রপাতি",
  "স্কুল সংস্কার ও অবকাঠামো",
  "শিক্ষা উপকরণ ও বই",
  "অনুদান ও ছাত্রবৃত্তি",
  "পুনর্মিলনী ও অনুষ্ঠান",
  "আপ্যায়ন ও খাবার",
  "প্রিন্টিং ও প্রকাশনা",
  "চিকিৎসা সহায়তা",
  "অফিস ও প্রশাসনিক",
  "অন্যান্য",
];

export default function AdminFundPage() {
  const { user, profile } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Admin tabs
  const [activeTab, setActiveTab] = useState<
    "pending" | "campaigns" | "expense" | "cash-entry" | "methods" | "ledger" | "audit"
  >("pending");

  // Rejection modal
  const [rejectEntry, setRejectEntry] = useState<FundEntry | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejecting, setRejecting] = useState(false);

  // Receipt modal
  const [receiptEntry, setReceiptEntry] = useState<FundEntry | null>(null);

  // Voucher preview modal
  const [voucherPreviewUrl, setVoucherPreviewUrl] = useState<string | null>(null);

  // Action loading indicator for verification
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Campaign modal
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState("");
  const [campaignDesc, setCampaignDesc] = useState("");
  const [campaignTarget, setCampaignTarget] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState("");
  const [savingCampaign, setSavingCampaign] = useState(false);

  // Expense modal / form
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [expenseCampaignId, setExpenseCampaignId] = useState("");
  const [expenseVendor, setExpenseVendor] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [expenseNote, setExpenseNote] = useState("");
  const [expenseVoucherFile, setExpenseVoucherFile] = useState<File | null>(null);
  const [expenseVoucherPreview, setExpenseVoucherPreview] = useState<string | null>(null);
  const [savingExpense, setSavingExpense] = useState(false);

  // Manual Cash Donation form
  const [cashDonorName, setCashDonorName] = useState("");
  const [cashDonorBatch, setCashDonorBatch] = useState("");
  const [cashDonorPhone, setCashDonorPhone] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashCampaignId, setCashCampaignId] = useState("");
  const [cashCollector, setCashCollector] = useState(profile?.full_name || "School Office");
  const [cashDate, setCashDate] = useState(new Date().toISOString().slice(0, 10));
  const [cashNote, setCashNote] = useState("");
  const [savingCash, setSavingCash] = useState(false);

  // Payment Method edit modal
  const [showMethodModal, setShowMethodModal] = useState(false);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [methodName, setMethodName] = useState("");
  const [methodType, setMethodType] = useState<PaymentMethodType>("mobile_banking");
  const [methodNumber, setMethodNumber] = useState("");
  const [methodAccountType, setMethodAccountType] = useState("Personal");
  const [methodBankName, setMethodBankName] = useState("");
  const [methodBranchName, setMethodBranchName] = useState("");
  const [methodRouting, setMethodRouting] = useState("");
  const [methodHolder, setMethodHolder] = useState("");
  const [methodInstructions, setMethodInstructions] = useState("");
  const [methodContactPerson, setMethodContactPerson] = useState("");
  const [methodIsActive, setMethodIsActive] = useState(true);
  const [savingMethod, setSavingMethod] = useState(false);

  // Adjustment entry modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjKind, setAdjKind] = useState<"income" | "expense">("expense");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjTitle, setAdjTitle] = useState("");
  const [adjReason, setAdjReason] = useState("");
  const [savingAdjustment, setSavingAdjustment] = useState(false);

  // 1. Fetch campaigns
  const { data: campaigns = DEFAULT_CAMPAIGNS } = useQuery({
    queryKey: ["admin-fund-campaigns"],
    queryFn: () => fetchCampaigns(supabase),
  });

  // 2. Fetch payment methods
  const { data: paymentMethods = DEFAULT_PAYMENT_METHODS } = useQuery({
    queryKey: ["admin-fund-payment-methods"],
    queryFn: () => fetchPaymentMethods(supabase),
  });

  // 3. Fetch summary
  const { data: summary = { income: 0, expense: 0, pending_income: 0, pending_count: 0 } } =
    useQuery({
      queryKey: ["admin-fund-summary"],
      queryFn: () => fetchFundSummary(supabase),
    });

  // 4. Fetch all entries
  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["admin-fund-entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_entries")
        .select("*, profiles(full_name, batch, phone, avatar_url), fund_campaigns(title)")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("fetch admin entries fallback:", error.message);
        const { data: fallbackData } = await supabase
          .from("fund_entries")
          .select("*")
          .order("created_at", { ascending: false });
        return (fallbackData || []) as FundEntry[];
      }
      return (data || []) as FundEntry[];
    },
  });

  // 5. Fetch audit logs
  const { data: auditLogs = [], isLoading: auditLoading } = useQuery({
    queryKey: ["admin-fund-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fund_audit_logs")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.warn("fetch audit logs fallback:", error.message);
        return [] as FundAuditLog[];
      }
      return (data || []) as FundAuditLog[];
    },
  });

  const pendingEntries = entries.filter((e) => e.status === "pending");
  const balance = summary.income - summary.expense;

  // Handle Approve
  const handleApprove = async (entry: FundEntry) => {
    setActionLoading(entry.id);
    try {
      const receiptNo =
        entry.receipt_number ||
        `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const { error } = await supabase
        .from("fund_entries")
        .update({
          status: "verified",
          receipt_number: receiptNo,
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", entry.id);

      if (error) {
        // Fallback if receipt_number column not available
        const { error: fallbackErr } = await supabase
          .from("fund_entries")
          .update({ status: "verified" })
          .eq("id", entry.id);
        if (fallbackErr) throw new Error(fallbackErr.message);
      }

      await logFundAction(
        supabase,
        "payment_verified",
        {
          amount: entry.amount,
          donor_name: entry.donor_name || entry.profiles?.full_name,
          trx_id: entry.trx_id,
          receipt_number: receiptNo,
        },
        entry.id,
        entry.campaign_id
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-verified-entries"] }),
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "অনুমোদন ব্যর্থ হয়েছে";
      alert("Error: " + msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectEntry) return;
    if (!rejectionReason.trim()) {
      alert("অনুগ্রহ করে বাতিলের সুনির্দিষ্ট কারণ উল্লেখ করুন।");
      return;
    }

    setRejecting(true);
    try {
      const { error } = await supabase
        .from("fund_entries")
        .update({
          status: "rejected",
          rejection_reason: rejectionReason.trim(),
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", rejectEntry.id);

      if (error) {
        // Fallback
        const fallbackNote = `${rejectEntry.note || ""} [Rejected: ${rejectionReason.trim()}]`;
        const { error: fallbackErr } = await supabase
          .from("fund_entries")
          .update({ status: "rejected", note: fallbackNote })
          .eq("id", rejectEntry.id);
        if (fallbackErr) throw new Error(fallbackErr.message);
      }

      await logFundAction(
        supabase,
        "payment_rejected",
        {
          reason: rejectionReason.trim(),
          amount: rejectEntry.amount,
          donor: rejectEntry.profiles?.full_name,
          trx_id: rejectEntry.trx_id,
        },
        rejectEntry.id,
        rejectEntry.campaign_id
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-verified-entries"] }),
      ]);

      setRejectEntry(null);
      setRejectionReason("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "বাতিলকরণে ত্রুটি হয়েছে";
      alert("Error: " + msg);
    } finally {
      setRejecting(false);
    }
  };

  // Create Campaign
  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle.trim()) return;

    setSavingCampaign(true);
    try {
      const slug =
        campaignTitle
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .slice(0, 40) + `-${Date.now().toString().slice(-4)}`;

      const { data: newCamp, error } = await supabase
        .from("fund_campaigns")
        .insert([
          {
            title: campaignTitle.trim(),
            slug,
            description: campaignDesc.trim(),
            target_amount: Number(campaignTarget) || 0,
            end_date: campaignEndDate || null,
            status: "active",
            created_by: user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw new Error(error.message);

      await logFundAction(
        supabase,
        "campaign_created",
        { title: campaignTitle.trim(), target: Number(campaignTarget) || 0 },
        null,
        newCamp?.id
      );

      await queryClient.invalidateQueries({ queryKey: ["admin-fund-campaigns"] });
      await queryClient.invalidateQueries({ queryKey: ["fund-campaigns"] });

      setShowCampaignModal(false);
      setCampaignTitle("");
      setCampaignDesc("");
      setCampaignTarget("");
      setCampaignEndDate("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ক্যাম্পেইন তৈরি ব্যর্থ হয়েছে";
      alert("Error: " + msg);
    } finally {
      setSavingCampaign(false);
    }
  };

  // Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(expenseAmount);
    if (!numAmt || numAmt <= 0) {
      alert("সঠিক খরচের পরিমাণ প্রদান করুন।");
      return;
    }

    setSavingExpense(true);
    try {
      let uploadedVoucherUrl: string | null = null;
      if (expenseVoucherFile) {
        uploadedVoucherUrl = await uploadImage(expenseVoucherFile, {
          folder: "alumni-hub/vouchers",
        });
      }

      const payload: Record<string, unknown> = {
        kind: "expense",
        category: expenseCategory,
        title: expenseTitle.trim(),
        amount: numAmt,
        entry_date: expenseDate,
        status: "verified",
        voucher_url: uploadedVoucherUrl,
        receipt_url: uploadedVoucherUrl,
        vendor_name: expenseVendor.trim() || null,
        campaign_id: expenseCampaignId || null,
        note: expenseNote.trim(),
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      };

      let { data: newEntry, error } = await supabase
        .from("fund_entries")
        .insert([payload])
        .select()
        .single();

      // Fallback
      if (error && error.message.includes("column")) {
        const fallbackNote = [
          expenseNote.trim(),
          expenseVendor ? `Vendor: ${expenseVendor}` : "",
          `Category: ${expenseCategory}`,
        ]
          .filter(Boolean)
          .join(" | ");

        const fallbackPayload = {
          kind: "expense",
          category: expenseCategory,
          title: expenseTitle.trim(),
          amount: numAmt,
          entry_date: expenseDate,
          status: "verified",
          receipt_url: uploadedVoucherUrl,
          note: fallbackNote,
        };

        const res = await supabase
          .from("fund_entries")
          .insert([fallbackPayload])
          .select()
          .single();
        newEntry = res.data;
        error = res.error;
      }

      if (error) throw new Error(error.message);

      await logFundAction(
        supabase,
        "expense_added",
        {
          title: expenseTitle.trim(),
          amount: numAmt,
          category: expenseCategory,
          vendor: expenseVendor.trim(),
        },
        newEntry?.id,
        expenseCampaignId || null
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-verified-entries"] }),
      ]);

      setExpenseTitle("");
      setExpenseAmount("");
      setExpenseVendor("");
      setExpenseNote("");
      setExpenseVoucherFile(null);
      setExpenseVoucherPreview(null);
      alert("খরচ এন্ট্রি সফলভাবে যুক্ত হয়েছে।");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "খরচ সংরক্ষণ ব্যর্থ হয়েছে";
      alert("Error: " + msg);
    } finally {
      setSavingExpense(false);
    }
  };

  // Save Manual Cash Entry
  const handleSaveCashEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(cashAmount);
    if (!numAmt || numAmt <= 0) {
      alert("সঠিক টাকার পরিমাণ দিন।");
      return;
    }
    if (!cashDonorName.trim()) {
      alert("অনুদানকারীর নাম প্রদান করুন।");
      return;
    }

    setSavingCash(true);
    try {
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload: Record<string, unknown> = {
        kind: "income",
        category: "cash_donation",
        title: `ক্যাশ অনুদান - ${cashDonorName.trim()}`,
        amount: numAmt,
        entry_date: cashDate,
        method: "Cash",
        status: "verified",
        receipt_number: receiptNo,
        donor_name: cashDonorName.trim(),
        campaign_id: cashCampaignId || null,
        note: [
          cashNote.trim(),
          cashDonorBatch ? `Batch: ${cashDonorBatch}` : "",
          cashDonorPhone ? `Phone: ${cashDonorPhone}` : "",
          `Received by: ${cashCollector}`,
        ]
          .filter(Boolean)
          .join(" | "),
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      };

      let { data: newEntry, error } = await supabase
        .from("fund_entries")
        .insert([payload])
        .select()
        .single();

      // Fallback
      if (error && error.message.includes("column")) {
        const fallbackPayload = {
          kind: "income",
          category: "cash_donation",
          title: `ক্যাশ অনুদান - ${cashDonorName.trim()}`,
          amount: numAmt,
          entry_date: cashDate,
          method: "Cash",
          status: "verified",
          note: [
            cashNote.trim(),
            `Donor: ${cashDonorName}`,
            cashDonorBatch ? `Batch: ${cashDonorBatch}` : "",
            `Receipt: ${receiptNo}`,
            `Received by: ${cashCollector}`,
          ]
            .filter(Boolean)
            .join(" | "),
        };

        const res = await supabase
          .from("fund_entries")
          .insert([fallbackPayload])
          .select()
          .single();
        newEntry = res.data;
        error = res.error;
      }

      if (error) throw new Error(error.message);

      await logFundAction(
        supabase,
        "manual_cash_entry",
        {
          donor: cashDonorName.trim(),
          amount: numAmt,
          receipt: receiptNo,
          collector: cashCollector,
        },
        newEntry?.id,
        cashCampaignId || null
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-verified-entries"] }),
      ]);

      setCashDonorName("");
      setCashDonorBatch("");
      setCashDonorPhone("");
      setCashAmount("");
      setCashNote("");

      // Open receipt immediately
      if (newEntry) {
        setReceiptEntry(newEntry as FundEntry);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ক্যাশ এন্ট্রি ব্যর্থ হয়েছে";
      alert("Error: " + msg);
    } finally {
      setSavingCash(false);
    }
  };

  // Save Payment Method
  const handleSavePaymentMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingMethod(true);
    try {
      const payload = {
        name: methodName.trim(),
        type: methodType,
        account_number: methodNumber.trim() || null,
        account_type: methodAccountType.trim() || null,
        bank_name: methodBankName.trim() || null,
        branch_name: methodBranchName.trim() || null,
        routing_number: methodRouting.trim() || null,
        account_holder: methodHolder.trim() || null,
        instructions: methodInstructions.trim(),
        contact_person: methodContactPerson.trim() || null,
        is_active: methodIsActive,
      };

      let error;
      if (methodId && !methodId.startsWith("default-")) {
        const res = await supabase
          .from("fund_payment_methods")
          .update(payload)
          .eq("id", methodId);
        error = res.error;
      } else {
        const res = await supabase.from("fund_payment_methods").insert([payload]);
        error = res.error;
      }

      if (error) throw new Error(error.message);

      await logFundAction(supabase, "payment_method_saved", { name: methodName });
      await queryClient.invalidateQueries({ queryKey: ["admin-fund-payment-methods"] });
      await queryClient.invalidateQueries({ queryKey: ["fund-payment-methods"] });

      setShowMethodModal(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "পেমেন্ট মাধ্যম সেভ করা যায়নি";
      alert("Error: " + msg);
    } finally {
      setSavingMethod(false);
    }
  };

  // Save Adjustment Entry (Since verified entries cannot be deleted!)
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(adjAmount);
    if (!numAmt || numAmt <= 0) {
      alert("সঠিক পরিমাণ প্রদান করুন।");
      return;
    }
    if (!adjReason.trim()) {
      alert("সংশোধনের কারণ স্পষ্টভাবে উল্লেখ করুন।");
      return;
    }

    setSavingAdjustment(true);
    try {
      const payload: Record<string, unknown> = {
        kind: adjKind,
        category: "adjustment",
        title: `[হিসাব সমন্বয় / Adjustment] ${adjTitle.trim()}`,
        amount: numAmt,
        entry_date: new Date().toISOString().slice(0, 10),
        status: "verified",
        is_adjustment: true,
        note: `সংশোধনের কারণ: ${adjReason.trim()} (কর্তৃক: ${profile?.full_name || "Admin"})`,
        verified_by: user?.id,
        verified_at: new Date().toISOString(),
      };

      const { data: newAdj, error } = await supabase
        .from("fund_entries")
        .insert([payload])
        .select()
        .single();

      if (error) throw new Error(error.message);

      await logFundAction(
        supabase,
        "adjustment_added",
        { title: adjTitle.trim(), kind: adjKind, amount: numAmt, reason: adjReason.trim() },
        newAdj?.id
      );

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin-fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["admin-fund-audit-logs"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-summary"] }),
        queryClient.invalidateQueries({ queryKey: ["fund-verified-entries"] }),
      ]);

      setShowAdjustmentModal(false);
      setAdjTitle("");
      setAdjAmount("");
      setAdjReason("");
      alert("সংশোধনী এন্ট্রি সফলভাবে যুক্ত হয়েছে।");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "সংশোধনী যোগ করা ব্যর্থ হয়েছে";
      alert("Error: " + msg);
    } finally {
      setSavingAdjustment(false);
    }
  };

  // CSV Report Export
  const exportCsvReport = () => {
    const verified = entries.filter((e) => e.status === "verified");
    const headers = [
      "Receipt No",
      "Date",
      "Type",
      "Category",
      "Title",
      "Donor / Vendor",
      "Method",
      "TrxID",
      "Amount (BDT)",
      "Note",
    ];

    const rows = verified.map((e) => [
      e.receipt_number || "",
      e.entry_date,
      e.kind === "income" ? "Income (জমা)" : "Expense (ব্যয়)",
      e.category || "",
      `"${(e.title || "").replace(/"/g, '""')}"`,
      `"${(e.donor_name || e.profiles?.full_name || e.vendor_name || "").replace(/"/g, '""')}"`,
      e.method || "",
      e.trx_id || "",
      e.amount,
      `"${(e.note || "").replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `alumni_fund_ledger_report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DashboardShell title="Manage Fund">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Admin Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[rgba(255,255,255,0.06)] slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[24px] font-bold text-[#fafafa] tracking-tight">
                Fund Control & Ledger Management
              </h2>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/30">
                <ShieldCheck className="w-3.5 h-3.5" /> অ্যাডমিন পোর্টাল
              </span>
            </div>
            <p className="text-[#888] text-[14px]">
              ইউজারের পেমেন্ট যাচাই ও অনুমোদন করুন, খরচ ও ক্যাশ এন্ট্রি লিখুন এবং তহবিল অডিট নিয়ন্ত্রণ করুন।
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="secondary" onClick={exportCsvReport} className="gap-1.5">
              <Download className="w-4 h-4" /> রিপোর্ট ডাউনলোড (CSV)
            </Button>
            <Button onClick={() => setShowCampaignModal(true)} className="gap-1.5">
              <Plus className="w-4 h-4" /> নতুন ক্যাম্পেইন
            </Button>
          </div>
        </div>

        {/* Live Admin Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 slide-up stagger-2">
          <Card className="p-4 bg-[rgba(52,211,153,0.03)] border-[rgba(52,211,153,0.15)]">
            <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">মোট অনুমোদিত জমা</p>
            <p className="text-[22px] sm:text-[24px] font-bold text-[#34D399] mt-1">
              {formatCurrency(summary.income)}
            </p>
            <p className="text-[11px] text-[#666] mt-0.5">অ্যাকাউন্টে যোগকৃত</p>
          </Card>

          <Card className="p-4 bg-[rgba(239,68,68,0.03)] border-[rgba(239,68,68,0.15)]">
            <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">মোট ব্যয়</p>
            <p className="text-[22px] sm:text-[24px] font-bold text-[#EF4444] mt-1">
              {formatCurrency(summary.expense)}
            </p>
            <p className="text-[11px] text-[#666] mt-0.5">ভাউচারভিত্তিক খরচ</p>
          </Card>

          <Card className="p-4 bg-[rgba(20,184,166,0.04)] border-[rgba(20,184,166,0.18)]">
            <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">অবশিষ্ট ব্যালেন্স</p>
            <p className="text-[22px] sm:text-[24px] font-bold text-[#fafafa] mt-1">
              {formatCurrency(balance)}
            </p>
            <p className="text-[11px] text-[#14B8A6] mt-0.5">জমা − খরচ = বাকি টাকা</p>
          </Card>

          <Card
            className={`p-4 cursor-pointer transition-all ${
              pendingEntries.length > 0
                ? "bg-[rgba(251,191,36,0.08)] border-[rgba(251,191,36,0.3)] shadow-[0_0_15px_rgba(251,191,36,0.1)]"
                : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-[#888] uppercase tracking-wider font-medium">অপেক্ষমান যাচাই</p>
              {pendingEntries.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#FBBF24] animate-pulse" />
              )}
            </div>
            <p className="text-[22px] sm:text-[24px] font-bold text-[#FBBF24] mt-1">
              {pendingEntries.length} টি
            </p>
            <p className="text-[11px] text-[#888] mt-0.5">
              {formatCurrency(summary.pending_income || 0)} অপেক্ষমান
            </p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-[#121212] rounded-xl border border-[rgba(255,255,255,0.06)] overflow-x-auto slide-up stagger-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap relative ${
              activeTab === "pending"
                ? "bg-[#FBBF24]/20 text-[#FBBF24] border border-[#FBBF24]/30"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <Clock className="w-4 h-4" />
            অপেক্ষমান যাচাই ({pendingEntries.length})
            {pendingEntries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-[#FBBF24] text-black text-[10px] font-bold rounded-full">
                {pendingEntries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "campaigns"
                ? "bg-[#1f1f1f] text-white border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <Layers className="w-4 h-4" />
            ক্যাম্পেইনসমূহ ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "expense"
                ? "bg-[#1f1f1f] text-white border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4 text-[#EF4444]" />
            খরচ এন্ট্রি লিখুন
          </button>

          <button
            onClick={() => setActiveTab("cash-entry")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "cash-entry"
                ? "bg-[#1f1f1f] text-white border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <HandCoins className="w-4 h-4 text-[#34D399]" />
            ক্যাশ অনুদান এন্ট্রি
          </button>

          <button
            onClick={() => setActiveTab("methods")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "methods"
                ? "bg-[#1f1f1f] text-white border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <Settings className="w-4 h-4" />
            পেমেন্ট মাধ্যম
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "ledger"
                ? "bg-[#1f1f1f] text-white border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            সম্পূর্ণ লেজার ({entries.length})
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-[#1f1f1f] text-white border border-[rgba(255,255,255,0.08)]"
                : "text-[#888] hover:text-[#ccc]"
            }`}
          >
            <History className="w-4 h-4" />
            অডিট হিস্ট্রি
          </button>
        </div>

        {/* TAB 1: PENDING VERIFICATION */}
        {activeTab === "pending" && (
          <Card className="p-0 overflow-hidden slide-up">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FBBF24]" />
                  অপেক্ষমান অনুদান যাচাই তালিকা
                </h3>
                <p className="text-[12px] text-[#888]">
                  ইউজারের প্রেরিত TrxID ও নম্বর আপনার bKash/Nagad/ব্যাংক হিসাবের সাথে মিলিয়ে অনুমোদন বা বাতিল করুন।
                </p>
              </div>
            </div>

            {pendingEntries.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                {pendingEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    <div className="space-y-2 min-w-0 flex-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-[15px] font-bold text-white">
                          {entry.fund_campaigns?.title || entry.title}
                        </span>
                        <Badge variant="warning">যাচাই চলছে (Pending)</Badge>
                        <Badge>{entry.method}</Badge>
                      </div>

                      {/* Donor profile info */}
                      <div className="flex items-center gap-3 text-[12px] text-[#a0a0a0] flex-wrap">
                        {entry.profiles && (
                          <div className="flex items-center gap-2">
                            <Avatar src={entry.profiles.avatar_url} name={entry.profiles.full_name} size="sm" />
                            <span className="text-white font-medium">
                              {entry.profiles.full_name}
                            </span>
                            {entry.profiles.batch && (
                              <span className="text-[#14B8A6]">({entry.profiles.batch} Batch)</span>
                            )}
                          </div>
                        )}
                        <span>তারিখ: {formatDate(entry.entry_date)}</span>
                      </div>

                      {/* Payment Verification Info */}
                      <div className="p-3 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)] grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[12px]">
                        <div>
                          <span className="text-[#666] block text-[10px] uppercase">প্রেরক নম্বর:</span>
                          <span className="text-[#fafafa] font-mono font-medium">
                            {entry.sender_number || "প্রদত্ত নয়"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#666] block text-[10px] uppercase">Transaction ID (TrxID):</span>
                          <span className="text-[#FBBF24] font-mono font-bold select-all">
                            {entry.trx_id || "প্রদত্ত নয়"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#666] block text-[10px] uppercase">স্ক্রিনশট / রসিদ:</span>
                          {entry.receipt_url ? (
                            <button
                              onClick={() => setVoucherPreviewUrl(entry.receipt_url)}
                              className="text-[#14B8A6] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <Eye className="w-3.5 h-3.5" /> স্ক্রিনশট দেখুন
                            </button>
                          ) : (
                            <span className="text-[#555]">কোনো ফাইল নেই</span>
                          )}
                        </div>
                      </div>

                      {entry.note && (
                        <p className="text-[12px] text-[#888] italic">
                          <span className="text-[#666]">মন্তব্য:</span> {entry.note}
                        </p>
                      )}
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-[11px] text-[#888] uppercase">অনুদানের পরিমাণ</p>
                        <p className="text-[22px] font-bold text-[#34D399]">
                          {formatCurrency(entry.amount)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setRejectEntry(entry);
                            setRejectionReason("");
                          }}
                          className="text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] gap-1.5"
                        >
                          <XCircle className="w-4 h-4" /> বাতিল
                        </Button>

                        <Button
                          size="sm"
                          isLoading={actionLoading === entry.id}
                          onClick={() => handleApprove(entry)}
                          className="bg-[#10B981] hover:bg-[#059669] text-white gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" /> অনুমোদন করুন
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle className="w-9 h-9 text-[#34D399] mx-auto mb-3" />
                <h4 className="text-[15px] font-semibold text-white">কোনো অপেক্ষমান পেমেন্ট নেই</h4>
                <p className="text-[12px] text-[#777] mt-1">সব পেমেন্ট যাচাই সম্পন্ন হয়েছে।</p>
              </div>
            )}
          </Card>
        )}

        {/* TAB 2: CAMPAIGNS MANAGEMENT */}
        {activeTab === "campaigns" && (
          <div className="space-y-4 slide-up">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[16px] font-bold text-white">ক্যাম্পেইন ও ফান্ড ব্যবস্থাপনা</h3>
                <p className="text-[12px] text-[#888]">বিশেষ উদ্দেশ্যমূলক ফান্ড তৈরি ও লক্ষ্যমাত্রা নিয়ন্ত্রণ করুন</p>
              </div>
              <Button onClick={() => setShowCampaignModal(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> নতুন ফান্ড যোগ করুন
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const target = Number(camp.target_amount) || 0;
                const raised = Number(camp.raised_amount) || 0;
                const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;

                return (
                  <Card key={camp.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[16px] font-bold text-white">{camp.title}</h4>
                        <p className="text-[12px] text-[#888] mt-1">{camp.description}</p>
                      </div>
                      <Badge variant={camp.status === "active" ? "success" : "default"}>
                        {camp.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-[#a0a0a0]">উত্তোলিত: {formatCurrency(raised)}</span>
                        <span className="text-white font-medium">লক্ষ্য: {formatCurrency(target)}</span>
                      </div>
                      <div className="w-full h-2 bg-[#1e1e1e] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#0D9488] to-[#34D399] rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[#666]">
                        <span>{percent}% সম্পন্ন</span>
                        {camp.end_date && <span>মেয়াদ: {formatDate(camp.end_date)}</span>}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RECORD EXPENSE */}
        {activeTab === "expense" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 slide-up">
            <Card className="p-6">
              <h3 className="text-[16px] font-bold text-white mb-2 flex items-center gap-2">
                <ArrowDownCircle className="w-5 h-5 text-[#EF4444]" />
                নতুন খরচ / ব্যয় এন্ট্রি করুন
              </h3>
              <p className="text-[12px] text-[#888] mb-5">
                কোথায় কত টাকা ব্যয় হলো, কারণ, কাকে প্রদান করা হলো এবং বিলের ছবি সংযুক্ত করুন।
              </p>

              <form onSubmit={handleSaveExpense} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="খরচের বিবরণ / টাইটেল *"
                    placeholder="যেমন: সায়েন্স ল্যাব মাইক্রোস্কোপ ক্রয়"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    required
                  />

                  <Input
                    label="টাকার পরিমাণ (BDT) *"
                    type="number"
                    min="1"
                    placeholder="যেমন: 45000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a0a0a0]">
                      ব্যয়ের খাত / ক্যাটাগরি *
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a0a0a0]">
                      ক্যাম্পেইন নির্ধারণ (ঐচ্ছিক)
                    </label>
                    <select
                      value={expenseCampaignId}
                      onChange={(e) => setExpenseCampaignId(e.target.value)}
                      className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                    >
                      <option value="">সাধারণ তহবিল (General Fund)</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="প্রাপক / ভেন্ডর এর নাম"
                    placeholder="যেমন: বায়োল্যাব সায়েন্টিফিক লি."
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                  />

                  <Input
                    label="খরচের তারিখ *"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>

                {/* Voucher Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#a0a0a0]">
                    বিলের ছবি / ভাউচার প্রমাণক (Voucher)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] hover:border-[#14B8A6] cursor-pointer text-[12px] text-[#a0a0a0]">
                      <Upload className="w-4 h-4 text-[#14B8A6]" />
                      বিলের ছবি আপলোড করুন
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            setExpenseVoucherFile(file);
                            setExpenseVoucherPreview(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </label>
                    {expenseVoucherFile && (
                      <span className="text-[12px] text-[#34D399] truncate max-w-xs">
                        {expenseVoucherFile.name}
                      </span>
                    )}
                  </div>
                  {expenseVoucherPreview && (
                    <div className="mt-2 w-28 h-20 rounded-lg overflow-hidden border border-[rgba(255,255,255,0.1)]">
                      <img
                        src={expenseVoucherPreview}
                        alt="Voucher Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#a0a0a0]">
                    অতিরিক্ত বিবরণ বা নোট
                  </label>
                  <textarea
                    rows={2}
                    value={expenseNote}
                    onChange={(e) => setExpenseNote(e.target.value)}
                    placeholder="অনুমোদনের রেজুলেশন নম্বর বা অতিরিক্ত ব্যাখ্যা..."
                    className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <Button type="submit" isLoading={savingExpense} className="w-full">
                  <Save className="w-4 h-4" />
                  খরচ এন্ট্রি সংরক্ষণ করুন
                </Button>
              </form>
            </Card>

            <div className="space-y-4">
              <Card className="p-5 bg-[rgba(239,68,68,0.04)] border-[rgba(239,68,68,0.2)] space-y-3">
                <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#EF4444]" />
                  স্বচ্ছ ব্যয়ের মূলনীতি
                </h4>
                <ul className="text-[12px] text-[#a0a0a0] space-y-2 list-disc list-inside leading-relaxed">
                  <li>প্রতিটি ব্যয়ের বিপরীতে স্পষ্ট ভাউচার/রসিদের ছবি আপলোড করা আবশ্যক।</li>
                  <li>সঠিক ক্যাটাগরি এবং কোন ফান্ডের আওতায় খরচ হচ্ছে তা সুনির্দিষ্ট করুন।</li>
                  <li>ব্যয় অনুমোদিত হলে তা তাৎক্ষণিকভাবে মোট ব্যয়ের সাথে যুক্ত হয় এবং পাবলিক লেজারে দৃশ্যমান হয়।</li>
                  <li>অনুমোদিত ব্যয়ের এন্ট্রি মুছে ফেলা যাবে না; প্রয়োজনে সংশোধনী দিতে হবে।</li>
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* TAB 4: MANUAL CASH ENTRY */}
        {activeTab === "cash-entry" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 slide-up">
            <Card className="p-6">
              <h3 className="text-[16px] font-bold text-white mb-2 flex items-center gap-2">
                <HandCoins className="w-5 h-5 text-[#34D399]" />
                সরাসরি ক্যাশ অনুদান এন্ট্রি ও রসিদ তৈরি
              </h3>
              <p className="text-[12px] text-[#888] mb-5">
                অফিসে বা প্রতিনিধির কাছে নগদ ক্যাশ টাকা জমা দিলে এই ফর্ম পূরণ করে তাৎক্ষণিক মানি রসিদ তৈরি করুন।
              </p>

              <form onSubmit={handleSaveCashEntry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="অনুদানকারীর নাম *"
                    placeholder="যেমন: মো: আরিফুল ইসলাম"
                    value={cashDonorName}
                    onChange={(e) => setCashDonorName(e.target.value)}
                    required
                  />

                  <Input
                    label="ব্যাচ / এসএসসি বছর"
                    placeholder="যেমন: 2012"
                    value={cashDonorBatch}
                    onChange={(e) => setCashDonorBatch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="মোবাইল নম্বর"
                    placeholder="যেমন: 01711223344"
                    value={cashDonorPhone}
                    onChange={(e) => setCashDonorPhone(e.target.value)}
                  />

                  <Input
                    label="নগদ টাকার পরিমাণ (BDT) *"
                    type="number"
                    min="1"
                    placeholder="যেমন: 5000"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[13px] font-medium text-[#a0a0a0]">
                      ক্যাম্পেইন / খাতের নাম
                    </label>
                    <select
                      value={cashCampaignId}
                      onChange={(e) => setCashCampaignId(e.target.value)}
                      className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                    >
                      <option value="">সাধারণ অ্যালামনাই উন্নয়ন তহবিল</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="ক্যাশ গ্রহণকারী কর্মকর্তা *"
                    value={cashCollector}
                    onChange={(e) => setCashCollector(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="জমার তারিখ *"
                  type="date"
                  value={cashDate}
                  onChange={(e) => setCashDate(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-[#a0a0a0]">
                    মন্তব্য
                  </label>
                  <textarea
                    rows={2}
                    value={cashNote}
                    onChange={(e) => setCashNote(e.target.value)}
                    placeholder="রসিদের বিশেষ কোনো দ্রষ্টব্য..."
                    className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
                  />
                </div>

                <Button type="submit" isLoading={savingCash} className="w-full">
                  <Receipt className="w-4 h-4" />
                  ক্যাশ এন্ট্রি সংরক্ষণ ও রসিদ তৈরি করুন
                </Button>
              </form>
            </Card>

            <Card className="p-5 bg-[rgba(52,211,153,0.04)] border-[rgba(52,211,153,0.2)] space-y-3">
              <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#34D399]" />
                তাৎক্ষণিক রসিদ হস্তান্তর
              </h4>
              <p className="text-[12px] text-[#a0a0a0] leading-relaxed">
                ক্যাশ জমা সেভ করার সাথে সাথে স্বয়ংক্রিয় রসিদ নম্বর সহ ডিজিটাল মানি রসিদ স্ক্রিনে খুলে যাবে।
                আপনি চাইলে সরাসরি প্রিন্ট করে বা পিডিএফ সংরক্ষণ করে ডোনারকে হস্তান্তর করতে পারবেন।
              </p>
            </Card>
          </div>
        )}

        {/* TAB 5: PAYMENT METHODS CONFIGURATION */}
        {activeTab === "methods" && (
          <div className="space-y-4 slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[16px] font-bold text-white">পেমেন্ট মাধ্যম কনফিগারেশন</h3>
                <p className="text-[12px] text-[#888]">
                  bKash, Nagad, ব্যাংক অ্যাকাউন্ট নম্বর এবং ক্যাশ অফিস বিবরণ নির্ধারণ করুন
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setMethodId(null);
                  setMethodName("");
                  setMethodType("mobile_banking");
                  setMethodNumber("");
                  setMethodAccountType("Personal");
                  setMethodBankName("");
                  setMethodBranchName("");
                  setMethodRouting("");
                  setMethodHolder("Alumni Association Committee");
                  setMethodInstructions("");
                  setMethodContactPerson("");
                  setMethodIsActive(true);
                  setShowMethodModal(true);
                }}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" /> নতুন মাধ্যম যোগ করুন
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((m) => (
                <Card key={m.id} className="p-5 space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[16px] font-bold text-white flex items-center gap-2">
                        {m.name}
                        <Badge variant={m.is_active ? "success" : "default"}>
                          {m.is_active ? "সক্রিয় (Active)" : "নিষ্ক্রিয়"}
                        </Badge>
                      </h4>
                      <p className="text-[11px] text-[#777] uppercase font-medium mt-0.5">
                        {m.type.replace("_", " ")} {m.account_type && `• ${m.account_type}`}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setMethodId(m.id);
                        setMethodName(m.name);
                        setMethodType(m.type);
                        setMethodNumber(m.account_number || "");
                        setMethodAccountType(m.account_type || "Personal");
                        setMethodBankName(m.bank_name || "");
                        setMethodBranchName(m.branch_name || "");
                        setMethodRouting(m.routing_number || "");
                        setMethodHolder(m.account_holder || "");
                        setMethodInstructions(m.instructions || "");
                        setMethodContactPerson(m.contact_person || "");
                        setMethodIsActive(m.is_active);
                        setShowMethodModal(true);
                      }}
                    >
                      সম্পাদনা
                    </Button>
                  </div>

                  <div className="p-3 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)] space-y-1.5 text-[12px]">
                    {m.account_number && (
                      <div className="flex justify-between">
                        <span className="text-[#666]">অ্যাকাউন্ট নং:</span>
                        <span className="text-white font-mono font-medium">{m.account_number}</span>
                      </div>
                    )}
                    {m.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-[#666]">ব্যাংক:</span>
                        <span className="text-white">{m.bank_name}</span>
                      </div>
                    )}
                    {m.contact_person && (
                      <div className="flex justify-between">
                        <span className="text-[#666]">দায়িত্বপ্রাপ্ত:</span>
                        <span className="text-white">{m.contact_person}</span>
                      </div>
                    )}
                    {m.instructions && (
                      <p className="text-[11px] text-[#888] pt-1 border-t border-[rgba(255,255,255,0.06)]">
                        {m.instructions}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: COMPLETE LEDGER */}
        {activeTab === "ledger" && (
          <div className="space-y-4 slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-[16px] font-bold text-white">সম্পূর্ণ অডিট লেজার</h3>
                <p className="text-[12px] text-[#888]">
                  অনুমোদিত এন্ট্রি মুছে ফেলা নিষিদ্ধ। ভুল সংশোধন করতে "সংশোধনী এন্ট্রি" ব্যবহার করুন।
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAdjustmentModal(true)}
                  className="gap-1.5 text-[#FBBF24]"
                >
                  <AlertTriangle className="w-3.5 h-3.5" /> সংশোধনী এন্ট্রি দিন
                </Button>
              </div>
            </div>

            <Card className="p-0 overflow-hidden">
              {entriesLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-lg" />
                  ))}
                </div>
              ) : entries.length > 0 ? (
                <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                  {entries.map((entry) => {
                    const isIncome = entry.kind === "income";
                    return (
                      <div
                        key={entry.id}
                        className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
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
                              <p className="text-[14px] font-semibold text-white">{entry.title}</p>
                              <Badge
                                variant={
                                  entry.status === "verified"
                                    ? "success"
                                    : entry.status === "pending"
                                    ? "warning"
                                    : "danger"
                                }
                              >
                                {entry.status}
                              </Badge>
                              <Badge>{entry.category}</Badge>
                            </div>

                            <div className="flex items-center gap-3 text-[12px] text-[#777] flex-wrap">
                              <span>তারিখ: {formatDate(entry.entry_date)}</span>
                              {entry.method && <span>পদ্ধতি: {entry.method}</span>}
                              {entry.trx_id && <span className="font-mono">TrxID: {entry.trx_id}</span>}
                              {entry.receipt_number && (
                                <span className="text-[#14B8A6] font-mono">
                                  রসিদ: {entry.receipt_number}
                                </span>
                              )}
                            </div>

                            {entry.note && (
                              <p className="text-[11px] text-[#666] line-clamp-1">{entry.note}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between lg:justify-end">
                          <p
                            className={`text-[16px] font-bold ${
                              isIncome ? "text-[#34D399]" : "text-[#EF4444]"
                            }`}
                          >
                            {isIncome ? "+" : "-"}
                            {formatCurrency(entry.amount)}
                          </p>

                          {entry.status === "verified" && isIncome && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => setReceiptEntry(entry)}
                              className="h-8 gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" /> রসিদ
                            </Button>
                          )}

                          {(entry.voucher_url || entry.receipt_url) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setVoucherPreviewUrl(entry.voucher_url || entry.receipt_url)}
                              className="h-8 gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" /> ভাউচার
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Wallet className="w-8 h-8 text-[#444] mx-auto mb-3" />
                  <p className="text-[13px] text-[#888]">এখনও কোনো এন্ট্রি নেই।</p>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === "audit" && (
          <Card className="p-0 overflow-hidden slide-up">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]">
              <h3 className="text-[16px] font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-[#14B8A6]" />
                অ্যাডমিন অ্যাক্টিভিটি ও অডিট হিস্ট্রি
              </h3>
              <p className="text-[12px] text-[#888]">
                কে কখন কোন এন্ট্রি অনুমোদন বা সংশোধন করেছে তার অবিকৃত লগ
              </p>
            </div>

            {auditLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 skeleton rounded-lg" />
                ))}
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 text-[13px] flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-[#666]">
                          দ্বারা: {log.profiles?.full_name || "অ্যাডমিন"}
                        </span>
                      </div>
                      <p className="text-[12px] text-[#888] font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    </div>
                    <span className="text-[11px] text-[#555] whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-[#777] text-[13px]">
                এখনও কোনো অডিট লগ নেই।
              </div>
            )}
          </Card>
        )}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={Boolean(rejectEntry)}
        onClose={() => setRejectEntry(null)}
        title="পেমেন্ট বাতিলের কারণ উল্লেখ করুন"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-[#a0a0a0]">
            বাতিল করলে ডোনার তার প্রোফাইলে এই কারণটি দেখতে পারবেন এবং এটি মোট জমার হিসাবে অন্তর্ভুক্ত হবে না।
          </p>

          <div className="p-3 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.06)] text-[12px] space-y-1">
            <p className="text-white font-medium">
              পরিমাণ: {formatCurrency(rejectEntry?.amount || 0)}
            </p>
            <p className="text-[#888]">পেমেন্ট মেথড: {rejectEntry?.method}</p>
            <p className="text-[#888] font-mono">TrxID: {rejectEntry?.trx_id || "N/A"}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-white">
              বাতিল করার কারণ *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="যেমন: প্রদত্ত TrxID এর বিপরীতে কোনো টাকা জমা পাওয়া যায়নি, অনুগ্রহ করে সঠিক TrxID দিন..."
              className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.1)] text-white p-3 text-[13px] focus:outline-none focus:border-[#EF4444]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setRejectEntry(null)}>
              বাতিল করুন
            </Button>
            <Button
              isLoading={rejecting}
              onClick={handleRejectConfirm}
              className="bg-[#EF4444] hover:bg-[#DC2626] text-white"
            >
              বাতিলকরণ নিশ্চিত করুন
            </Button>
          </div>
        </div>
      </Modal>

      {/* Campaign Creation Modal */}
      <Modal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title="নতুন ফান্ড বা ক্যাম্পেইন তৈরি করুন"
        size="md"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-4">
          <Input
            label="ক্যাম্পেইনের নাম *"
            placeholder="যেমন: নতুন সায়েন্স ল্যাব নির্মাণ"
            value={campaignTitle}
            onChange={(e) => setCampaignTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#a0a0a0]">
              কেন টাকা লাগবে / উদ্দেশ্যের বিবরণ *
            </label>
            <textarea
              rows={3}
              value={campaignDesc}
              onChange={(e) => setCampaignDesc(e.target.value)}
              placeholder="শিক্ষার্থীদের বাস্তবমুখী পরীক্ষা-নিরীক্ষার জন্য প্রয়োজনীয় আধুনিক সামগ্রী সংগ্রহ..."
              required
              className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white p-3 text-[13px] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="লক্ষ্যমাত্রা (BDT) *"
              type="number"
              min="0"
              placeholder="500000"
              value={campaignTarget}
              onChange={(e) => setCampaignTarget(e.target.value)}
              required
            />

            <Input
              label="শেষ তারিখ (ঐচ্ছিক)"
              type="date"
              value={campaignEndDate}
              onChange={(e) => setCampaignEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <Button type="button" variant="secondary" onClick={() => setShowCampaignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingCampaign}>
              ক্যাম্পেইন তৈরি করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Method Edit Modal */}
      <Modal
        isOpen={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        title={methodId ? "পেমেন্ট মাধ্যম সম্পাদনা" : "নতুন পেমেন্ট মাধ্যম যোগ"}
        size="md"
      >
        <form onSubmit={handleSavePaymentMethod} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="মাধ্যমের নাম *"
              placeholder="যেমন: bKash / Nagad / Bank"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#a0a0a0]">ধরণ *</label>
              <select
                value={methodType}
                onChange={(e) => setMethodType(e.target.value as PaymentMethodType)}
                className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white p-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
              >
                <option value="mobile_banking">মোবাইল ব্যাংকিং (bKash/Nagad/Rocket)</option>
                <option value="bank">ব্যাংক একাউন্ট</option>
                <option value="cash">সরাসরি ক্যাশ</option>
              </select>
            </div>
          </div>

          {methodType !== "cash" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="অ্যাকাউন্ট / মোবাইল নম্বর"
                  placeholder="01700000000"
                  value={methodNumber}
                  onChange={(e) => setMethodNumber(e.target.value)}
                />

                <Input
                  label="অ্যাকাউন্টের ধরণ"
                  placeholder="Personal / Merchant / Current"
                  value={methodAccountType}
                  onChange={(e) => setMethodAccountType(e.target.value)}
                />
              </div>

              {methodType === "bank" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="ব্যাংকের নাম"
                    placeholder="Dutch-Bangla Bank"
                    value={methodBankName}
                    onChange={(e) => setMethodBankName(e.target.value)}
                  />
                  <Input
                    label="শাখা (Branch)"
                    placeholder="Dhaka Main"
                    value={methodBranchName}
                    onChange={(e) => setMethodBranchName(e.target.value)}
                  />
                  <Input
                    label="রাউটিং নম্বর"
                    placeholder="090271234"
                    value={methodRouting}
                    onChange={(e) => setMethodRouting(e.target.value)}
                  />
                </div>
              )}

              <Input
                label="অ্যাকাউন্ট হোল্ডারের নাম"
                placeholder="MKBH Alumni Association"
                value={methodHolder}
                onChange={(e) => setMethodHolder(e.target.value)}
              />
            </div>
          ) : (
            <Input
              label="ক্যাশ গ্রহণকারী ব্যক্তি ও ঠিকানা *"
              placeholder="প্রধান হিসাবরক্ষক (রুম ১০২, মোবাইল: 01711223344)"
              value={methodContactPerson}
              onChange={(e) => setMethodContactPerson(e.target.value)}
              required
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#a0a0a0]">পেমেন্ট নির্দেশনা</label>
            <textarea
              rows={2}
              value={methodInstructions}
              onChange={(e) => setMethodInstructions(e.target.value)}
              placeholder="Send Money করুন এবং TrxID প্রদান করুন..."
              className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white p-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="method-active"
              checked={methodIsActive}
              onChange={(e) => setMethodIsActive(e.target.checked)}
              className="rounded border-[rgba(255,255,255,0.2)] bg-[#141414] text-[#14B8A6]"
            />
            <label htmlFor="method-active" className="text-[13px] text-white cursor-pointer">
              এই মাধ্যমটি চালু রাখুন (Active)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <Button type="button" variant="secondary" onClick={() => setShowMethodModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingMethod}>
              সংরক্ষণ করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Entry Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title="সংশোধনী এন্ট্রি যোগ করুন (Adjustment)"
        size="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <p className="text-[12px] text-[#FBBF24] leading-relaxed">
            অনুমোদিত এন্ট্রি ডাটাবেজ থেকে মুছে ফেলা যায় না। কোনো ভুল হলে বিপরীত সংশোধনী এন্ট্রি দিন।
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#a0a0a0]">ধরণ *</label>
              <select
                value={adjKind}
                onChange={(e) => setAdjKind(e.target.value as "income" | "expense")}
                className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white p-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
              >
                <option value="expense">ব্যয় সমন্বয় (ব্যালেন্স কমাতে)</option>
                <option value="income">আয় সমন্বয় (ব্যালেন্স বাড়াতে)</option>
              </select>
            </div>

            <Input
              label="সমন্বয়ের পরিমাণ (BDT) *"
              type="number"
              min="1"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              required
            />
          </div>

          <Input
            label="সমন্বয় শিরোনাম *"
            placeholder="যেমন: ভুল এন্ট্রি সংশোধন বা ব্যাংক চার্জ"
            value={adjTitle}
            onChange={(e) => setAdjTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-[#a0a0a0]">
              সংশোধনের সুস্পষ্ট কারণ ও অডিট ব্যাখ্যা *
            </label>
            <textarea
              rows={3}
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="পূর্ববর্তী এন্ট্রি আইডি #... এর অতিরিক্ত টাকার বিপরীতে হিসাব সমন্বয়..."
              required
              className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-white p-2.5 text-[13px] focus:outline-none focus:border-[#14B8A6]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.06)]">
            <Button type="button" variant="secondary" onClick={() => setShowAdjustmentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingAdjustment}>
              সংশোধনী নিশ্চিত করুন
            </Button>
          </div>
        </form>
      </Modal>

      {/* Official Receipt Modal */}
      <DonationReceiptModal
        isOpen={Boolean(receiptEntry)}
        onClose={() => setReceiptEntry(null)}
        entry={receiptEntry}
      />

      {/* Voucher Modal */}
      <Modal
        isOpen={Boolean(voucherPreviewUrl)}
        onClose={() => setVoucherPreviewUrl(null)}
        title="বিলের ছবি / ভাউচার"
        size="lg"
      >
        {voucherPreviewUrl && (
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-[rgba(255,255,255,0.08)] bg-black flex items-center justify-center p-2">
              <img
                src={voucherPreviewUrl}
                alt="Voucher"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <a href={voucherPreviewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> পূর্ণ আকারে দেখুন
                </Button>
              </a>
              <Button size="sm" onClick={() => setVoucherPreviewUrl(null)}>
                বন্ধ করুন
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
