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
  parseFundEntryMeta,
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
  ArrowDownRight,
  ArrowUpRight,
  Check,
  CheckCircle,
  CheckCircle2,
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
  Search,
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
  "Science Lab Equipment",
  "School Renovation & Infrastructure",
  "Educational Supplies & Books",
  "Scholarships & Student Aid",
  "Reunion & Institutional Events",
  "Hospitality & Catering",
  "Printing & Publications",
  "Medical & Welfare Assistance",
  "Office & Administrative",
  "Other Expenses",
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

  // Search filter for complete ledger
  const [ledgerSearch, setLedgerSearch] = useState("");

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
      const msg = err instanceof Error ? err.message : "Failed to approve contribution";
      alert("Error: " + msg);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleRejectConfirm = async () => {
    if (!rejectEntry) return;
    if (!rejectionReason.trim()) {
      alert("Please specify the reason for rejection.");
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
      const msg = err instanceof Error ? err.message : "Error rejecting contribution";
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
      const msg = err instanceof Error ? err.message : "Failed to create campaign";
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
      alert("Please enter a valid expense amount.");
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
      alert("Expense entry recorded successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record expense";
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
      alert("Please enter a valid amount.");
      return;
    }
    if (!cashDonorName.trim()) {
      alert("Please enter the contributor's name.");
      return;
    }

    setSavingCash(true);
    try {
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const payload: Record<string, unknown> = {
        kind: "income",
        category: "cash_donation",
        title: `Cash Contribution - ${cashDonorName.trim()}`,
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

      if (error && error.message.includes("column")) {
        const fallbackPayload = {
          kind: "income",
          category: "cash_donation",
          title: `Cash Contribution - ${cashDonorName.trim()}`,
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

      if (newEntry) {
        setReceiptEntry(newEntry as FundEntry);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record cash contribution";
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
      const msg = err instanceof Error ? err.message : "Failed to save payment method";
      alert("Error: " + msg);
    } finally {
      setSavingMethod(false);
    }
  };

  // Save Adjustment Entry
  const handleSaveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = Number(adjAmount);
    if (!numAmt || numAmt <= 0) {
      alert("Please enter a valid adjustment amount.");
      return;
    }
    if (!adjReason.trim()) {
      alert("Please clearly state the reason for adjustment.");
      return;
    }

    setSavingAdjustment(true);
    try {
      const payload: Record<string, unknown> = {
        kind: adjKind,
        category: "adjustment",
        title: `[Audit Adjustment] ${adjTitle.trim()}`,
        amount: numAmt,
        entry_date: new Date().toISOString().slice(0, 10),
        status: "verified",
        is_adjustment: true,
        note: `Reason for adjustment: ${adjReason.trim()} (By: ${profile?.full_name || "Admin"})`,
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
        {
          title: adjTitle.trim(),
          amount: numAmt,
          kind: adjKind,
          reason: adjReason.trim(),
        },
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
      alert("Adjustment entry recorded successfully.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record adjustment";
      alert("Error: " + msg);
    } finally {
      setSavingAdjustment(false);
    }
  };

  // Export Full CSV Report
  const exportCsvReport = () => {
    if (!entries || entries.length === 0) {
      alert("No ledger data available to export.");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Type",
      "Category",
      "Title",
      "Donor/Vendor",
      "Status",
      "Method",
      "TrxID",
      "Amount (BDT)",
      "Note",
    ];

    const rows = entries.map((e) => {
      const meta = parseFundEntryMeta(e);
      const donor = meta.donorName || e.profiles?.full_name || e.vendor_name || "";
      return [
        e.id,
        e.entry_date,
        e.kind,
        e.category,
        `"${(e.title || "").replace(/"/g, '""')}"`,
        `"${donor.replace(/"/g, '""')}"`,
        e.status,
        e.method || "",
        e.trx_id || "",
        e.amount,
        `"${(e.note || "").replace(/"/g, '""')}"`,
      ];
    });

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

  const filteredEntries = entries.filter((e) => {
    if (!ledgerSearch.trim()) return true;
    const q = ledgerSearch.toLowerCase();
    const meta = parseFundEntryMeta(e);
    const donor = (meta.donorName || e.profiles?.full_name || e.vendor_name || "").toLowerCase();
    const title = (e.title || "").toLowerCase();
    const trx = (e.trx_id || "").toLowerCase();
    const cat = (e.category || "").toLowerCase();
    return donor.includes(q) || title.includes(q) || trx.includes(q) || cat.includes(q);
  });

  return (
    <DashboardShell title="Manage Fund">
      <div className="max-w-6xl mx-auto space-y-7 pb-12">
        {/* Executive Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-border">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <span className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground">
                <ShieldCheck className="w-4 h-4 text-accent" />
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[11px] font-medium bg-surface text-muted border border-border">
                Treasury & Audit Control Desk
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
              Fund Control & Treasury Desk
            </h1>
            <p className="text-muted text-[14px] max-w-2xl mt-1 leading-relaxed">
              Verify contribution transactions, issue digital receipts, record voucher-backed institutional expenses, and oversee treasury audit.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Button variant="secondary" onClick={exportCsvReport} className="gap-2">
              <Download className="w-4 h-4" /> Export Ledger (CSV)
            </Button>
            <Button onClick={() => setShowCampaignModal(true)} className="gap-2">
              <Plus className="w-4 h-4" /> New Project Campaign
            </Button>
          </div>
        </div>

        {/* Live Admin Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Total Approved Receipts</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight mt-1">
              {formatCurrency(summary.income)}
            </p>
            <p className="text-[11px] text-muted mt-1">Confirmed Bank & Mobile Receipts</p>
          </Card>

          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Total Disbursed Expenses</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-muted tracking-tight mt-1">
              {formatCurrency(summary.expense)}
            </p>
            <p className="text-[11px] text-muted mt-1">Voucher-backed Institutional Costs</p>
          </Card>

          <Card className="p-5 bg-surface border-border hover:border-border-hover transition-colors">
            <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Reserve Fund Balance</p>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-foreground tracking-tight mt-1">
              {formatCurrency(balance)}
            </p>
            <p className="text-[11px] text-muted mt-1">Net Surplus (Receipts − Expenses)</p>
          </Card>

          <Card
            className={`p-5 cursor-pointer transition-colors bg-surface border-border hover:border-border-hover ${
              pendingEntries.length > 0 ? "border-accent/40" : ""
            }`}
            onClick={() => setActiveTab("pending")}
          >
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted uppercase tracking-wider font-semibold">Pending Review</p>
              {pendingEntries.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-accent" />
              )}
            </div>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-accent tracking-tight mt-1">
              {pendingEntries.length} Items
            </p>
            <p className="text-[11px] text-muted mt-1">
              {formatCurrency(summary.pending_income || 0)} Pending
            </p>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 p-1 bg-surface rounded-lg border border-border overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Clock className="w-4 h-4" />
            Pending Review ({pendingEntries.length})
            {pendingEntries.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-white text-[10px] font-mono font-bold rounded-full">
                {pendingEntries.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "campaigns"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Layers className="w-4 h-4" />
            Campaigns ({campaigns.length})
          </button>

          <button
            onClick={() => setActiveTab("expense")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "expense"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            Record Expense
          </button>

          <button
            onClick={() => setActiveTab("cash-entry")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "cash-entry"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <HandCoins className="w-4 h-4" />
            Direct Cash Entry
          </button>

          <button
            onClick={() => setActiveTab("methods")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "methods"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            Payment Channels
          </button>

          <button
            onClick={() => setActiveTab("ledger")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "ledger"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Full Audit Ledger ({entries.length})
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
              activeTab === "audit"
                ? "bg-brand text-white shadow-sm"
                : "text-muted hover:text-foreground hover:bg-white/5"
            }`}
          >
            <History className="w-4 h-4" />
            Audit Trail
          </button>
        </div>

        {/* TAB 1: PENDING VERIFICATION */}
        {activeTab === "pending" && (
          <div className="rounded-xl bg-surface border border-border overflow-hidden slide-up">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-zinc-300" />
                  Pending Contribution Verification Queue
                </h3>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Match contributor TrxID and phone numbers against your official statements before approving or rejecting.
                </p>
              </div>
            </div>

            {pendingEntries.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {pendingEntries.map((entry) => {
                  const meta = parseFundEntryMeta(entry);

                  return (
                    <div
                      key={entry.id}
                      className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 hover:bg-white/[0.015] transition-colors"
                    >
                      <div className="space-y-2.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-[15px] font-bold text-white">
                            {meta.campaignTitle || entry.title}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-zinc-300 border border-white/10">
                            Pending Review
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[11px] font-mono text-zinc-400">
                            {entry.method}
                          </span>
                        </div>

                        {/* Donor profile info */}
                        <div className="flex items-center gap-3 text-[12px] text-zinc-400 flex-wrap">
                          {entry.profiles && (
                            <div className="flex items-center gap-2">
                              <Avatar src={entry.profiles.avatar_url} name={entry.profiles.full_name} size="sm" />
                              <span className="text-white font-medium">
                                {entry.profiles.full_name}
                              </span>
                              {entry.profiles.batch && (
                                <span className="text-zinc-400 font-mono">({entry.profiles.batch} Batch)</span>
                              )}
                            </div>
                          )}
                          <span>Date: {formatDate(entry.entry_date)}</span>
                        </div>

                        {/* Payment Verification Info Box */}
                        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[12px]">
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Sender Number:</span>
                            <span className="text-white font-mono font-medium">
                              {meta.senderNumber || "Not provided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Transaction ID (TrxID):</span>
                            <span className="text-white font-mono font-bold select-all">
                              {entry.trx_id || "Not provided"}
                            </span>
                          </div>
                          <div>
                            <span className="text-zinc-500 block text-[10px] uppercase font-semibold">Screenshot / Slip:</span>
                            {entry.receipt_url ? (
                              <button
                                onClick={() => setVoucherPreviewUrl(entry.receipt_url)}
                                className="text-zinc-300 hover:text-white underline underline-offset-2 inline-flex items-center gap-1 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5" /> View Screenshot
                              </button>
                            ) : (
                              <span className="text-zinc-600">No attachment</span>
                            )}
                          </div>
                        </div>

                        {meta.cleanNote && (
                          <p className="text-[12px] text-zinc-400 italic">
                            <span className="text-zinc-500 not-italic">Note:</span> {meta.cleanNote}
                          </p>
                        )}
                      </div>

                      {/* Amount & Action Buttons */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-end justify-between gap-3.5 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Contribution Amount</p>
                          <p className="text-[24px] font-bold text-white font-mono">
                            {formatCurrency(entry.amount)}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setRejectEntry(entry);
                              setRejectionReason("");
                            }}
                            className="gap-1.5 text-zinc-400 hover:text-white"
                          >
                            <XCircle className="w-4 h-4" /> Reject
                          </Button>

                          <Button
                            size="sm"
                            isLoading={actionLoading === entry.id}
                            onClick={() => handleApprove(entry)}
                            className="gap-1.5"
                          >
                            <CheckCircle className="w-4 h-4" /> Approve & Issue Receipt
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-12 text-center">
                <CheckCircle2 className="w-9 h-9 text-zinc-500 mx-auto mb-3" />
                <h4 className="text-[16px] font-bold text-white">No Pending Contributions</h4>
                <p className="text-[12px] text-zinc-500 mt-1">All submitted contributions have been reviewed and audited.</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CAMPAIGNS MANAGEMENT */}
        {activeTab === "campaigns" && (
          <div className="space-y-4 slide-up">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight">Campaign & Endowment Management</h3>
                <p className="text-[12px] text-zinc-400 mt-0.5">Create special-purpose capital campaigns and track milestone funding</p>
              </div>
              <Button onClick={() => setShowCampaignModal(true)} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> New Project Campaign
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaigns.map((camp) => {
                const target = Number(camp.target_amount) || 0;
                const raised = Number(camp.raised_amount) || 0;
                const percent = target > 0 ? Math.min(Math.round((raised / target) * 100), 100) : 0;

                return (
                  <div key={camp.id} className="p-6 rounded-xl bg-surface border border-border space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-[16px] font-bold text-white">{camp.title}</h4>
                        <p className="text-[12px] text-zinc-400 mt-1 leading-relaxed">{camp.description}</p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.06] text-zinc-300 border border-white/10 flex-shrink-0">
                        {camp.status}
                      </span>
                    </div>

                    <div className="space-y-2 p-3.5 rounded-xl bg-black/40 border border-white/[0.06]">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-zinc-400">Raised: <strong className="text-white font-mono">{formatCurrency(raised)}</strong></span>
                        <span className="text-zinc-400">Goal: <strong className="text-white font-mono">{formatCurrency(target)}</strong></span>
                      </div>
                      <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-500">
                        <span>{percent}% Funded</span>
                        {camp.end_date && <span>Deadline: {formatDate(camp.end_date)}</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: RECORD EXPENSE */}
        {activeTab === "expense" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 slide-up">
            <div className="p-6 sm:p-7 rounded-xl bg-surface border border-border space-y-5">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                  <ArrowDownRight className="w-5 h-5 text-zinc-300" />
                  Record Institutional Expense / Disbursement
                </h3>
                <p className="text-[12px] text-zinc-400 mt-1">
                  Log disbursement details, expense category, recipient payee, and upload voucher receipts.
                </p>
              </div>

              <form onSubmit={handleSaveExpense} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Expense Title / Allocation *"
                    placeholder="e.g. Science Laboratory Microscopes Purchase"
                    value={expenseTitle}
                    onChange={(e) => setExpenseTitle(e.target.value)}
                    required
                  />

                  <Input
                    label="Disbursed Amount (BDT) *"
                    type="number"
                    min="1"
                    placeholder="e.g. 45000"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
                      Expense Category *
                    </label>
                    <select
                      value={expenseCategory}
                      onChange={(e) => setExpenseCategory(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30"
                    >
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
                      Allocate to Campaign (Optional)
                    </label>
                    <select
                      value={expenseCampaignId}
                      onChange={(e) => setExpenseCampaignId(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30"
                    >
                      <option value="">General Welfare Fund</option>
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
                    label="Payee / Vendor Name"
                    placeholder="e.g. BioLab Scientific Ltd."
                    value={expenseVendor}
                    onChange={(e) => setExpenseVendor(e.target.value)}
                  />

                  <Input
                    label="Disbursement Date *"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>

                {/* Voucher Upload */}
                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
                    Expense Voucher / Invoice Receipt (Attachment)
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 cursor-pointer text-[12px] text-zinc-300">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      Upload Voucher Image
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
                      <span className="text-[12px] text-zinc-300 truncate max-w-xs font-mono">
                        {expenseVoucherFile.name}
                      </span>
                    )}
                  </div>
                  {expenseVoucherPreview && (
                    <div className="mt-2 w-28 h-20 rounded-xl overflow-hidden border border-white/15">
                      <img
                        src={expenseVoucherPreview}
                        alt="Voucher Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
                    Audit Notes & Reference Details
                  </label>
                  <textarea
                    rows={2}
                    value={expenseNote}
                    onChange={(e) => setExpenseNote(e.target.value)}
                    placeholder="Committee approval resolution number or audit notes..."
                    className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30"
                  />
                </div>

                <Button type="submit" isLoading={savingExpense} className="w-full py-3">
                  <Save className="w-4 h-4" />
                  Record Expense Entry
                </Button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="p-6 rounded-xl bg-surface border border-border space-y-3.5">
                <h4 className="text-[15px] font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-zinc-300" />
                  Institutional Transparency Guidelines
                </h4>
                <ul className="text-[12px] text-zinc-400 space-y-2 list-disc list-inside leading-relaxed">
                  <li>Clear supporting receipts/vouchers must be uploaded for every institutional disbursement.</li>
                  <li>Proper allocation category and campaign source must be specified.</li>
                  <li>Approved disbursements immediately update the ledger and become visible on the public audit ledger.</li>
                  <li>Recorded ledger entries are immutable; use contra adjusting entries if adjustments are required.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MANUAL CASH ENTRY */}
        {activeTab === "cash-entry" && (
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 slide-up">
            <div className="p-6 sm:p-7 rounded-xl bg-surface border border-border space-y-5">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-zinc-300" />
                  Direct Cash Receipt & Verification
                </h3>
                <p className="text-[12px] text-zinc-400 mt-1">
                  Issue an official digital money receipt immediately upon direct cash payment received at the alumni office.
                </p>
              </div>

              <form onSubmit={handleSaveCashEntry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Contributor Name *"
                    placeholder="e.g. Md. Ariful Islam"
                    value={cashDonorName}
                    onChange={(e) => setCashDonorName(e.target.value)}
                    required
                  />

                  <Input
                    label="Batch / SSC Year"
                    placeholder="e.g. 2012"
                    value={cashDonorBatch}
                    onChange={(e) => setCashDonorBatch(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    placeholder="e.g. 01711223344"
                    value={cashDonorPhone}
                    onChange={(e) => setCashDonorPhone(e.target.value)}
                  />

                  <Input
                    label="Cash Amount (BDT) *"
                    type="number"
                    min="1"
                    placeholder="e.g. 5000"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
                      Campaign / Allocation
                    </label>
                    <select
                      value={cashCampaignId}
                      onChange={(e) => setCashCampaignId(e.target.value)}
                      className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30"
                    >
                      <option value="">General Alumni Welfare Fund</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Cash Receiving Officer *"
                    value={cashCollector}
                    onChange={(e) => setCashCollector(e.target.value)}
                    required
                  />
                </div>

                <Input
                  label="Receipt Date *"
                  type="date"
                  value={cashDate}
                  onChange={(e) => setCashDate(e.target.value)}
                  required
                />

                <div className="space-y-1.5">
                  <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={cashNote}
                    onChange={(e) => setCashNote(e.target.value)}
                    placeholder="Any special notes for the receipt..."
                    className="w-full rounded-xl bg-black/40 border border-white/10 text-white px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30"
                  />
                </div>

                <Button type="submit" isLoading={savingCash} className="w-full py-3">
                  <Receipt className="w-4 h-4" />
                  Save Cash Entry & Generate Receipt
                </Button>
              </form>
            </div>

            <div className="p-6 rounded-xl bg-surface border border-border space-y-3.5">
              <h4 className="text-[15px] font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-zinc-300" />
                Instant Money Receipt Generation
              </h4>
              <p className="text-[12px] text-zinc-400 leading-relaxed">
                Saving the direct cash entry immediately generates an official digitized money receipt with a unique serial number on screen.
                You can print it directly or download a PDF copy to deliver to the alumnus.
              </p>
            </div>
          </div>
        )}

        {/* TAB 5: PAYMENT METHODS CONFIGURATION */}
        {activeTab === "methods" && (
          <div className="space-y-4 slide-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight">Payment Channels Configuration</h3>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Configure official bKash, Nagad, Bank accounts, and Cash desk details
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
                <Plus className="w-4 h-4" /> Add Payment Channel
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {paymentMethods.map((m) => (
                <div key={m.id} className="p-5 rounded-xl bg-surface border border-border space-y-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[16px] font-bold text-white flex items-center gap-2">
                        {m.name}
                        <span className="px-2 py-0.2 rounded-full text-[10px] font-medium bg-white/[0.06] text-zinc-300 border border-white/10">
                          {m.is_active ? "Active" : "Inactive"}
                        </span>
                      </h4>
                      <p className="text-[11px] text-zinc-500 uppercase font-medium mt-0.5 font-mono">
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
                      Edit
                    </Button>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5 text-[12px]">
                    {m.account_number && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Account No:</span>
                        <span className="text-white font-mono font-medium">{m.account_number}</span>
                      </div>
                    )}
                    {m.bank_name && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Bank:</span>
                        <span className="text-white">{m.bank_name}</span>
                      </div>
                    )}
                    {m.contact_person && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500">Contact Officer:</span>
                        <span className="text-white">{m.contact_person}</span>
                      </div>
                    )}
                    {m.instructions && (
                      <p className="text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
                        {m.instructions}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: COMPLETE LEDGER */}
        {activeTab === "ledger" && (
          <div className="space-y-4 slide-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl bg-surface border border-border">
              <div>
                <h3 className="text-[17px] font-bold text-white tracking-tight">Complete Audit Ledger</h3>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Approved entries are immutable. To correct errors, submit an official contra Adjustment Entry.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search ledger entries..."
                    value={ledgerSearch}
                    onChange={(e) => setLedgerSearch(e.target.value)}
                    className="bg-black/40 border border-white/10 text-white rounded-xl pl-9 pr-3.5 py-1.5 text-[12px] placeholder-zinc-500 focus:outline-none focus:border-white/20 w-44 sm:w-56"
                  />
                </div>

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowAdjustmentModal(true)}
                  className="gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-zinc-400" /> Adjustment Entry
                </Button>
              </div>
            </div>

            <div className="rounded-xl bg-surface border border-border overflow-hidden">
              {entriesLoading ? (
                <div className="p-8 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-16 skeleton rounded-xl" />
                  ))}
                </div>
              ) : filteredEntries.length > 0 ? (
                <div className="divide-y divide-white/[0.06]">
                  {filteredEntries.map((entry) => {
                    const isIncome = entry.kind === "income";
                    const meta = parseFundEntryMeta(entry);

                    return (
                      <div
                        key={entry.id}
                        className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-white/[0.015] transition-colors"
                      >
                        <div className="flex items-start gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center flex-shrink-0">
                            {isIncome ? (
                              <ArrowUpRight className="w-5 h-5 text-zinc-200" />
                            ) : (
                              <ArrowDownRight className="w-5 h-5 text-zinc-400" />
                            )}
                          </div>

                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[14px] font-bold text-white">{entry.title}</p>
                              <span className="px-2 py-0.2 rounded-md bg-white/[0.06] border border-white/10 text-[11px] font-medium text-zinc-300">
                                {entry.status}
                              </span>
                              <span className="px-2 py-0.2 rounded-md bg-white/[0.03] text-[11px] text-zinc-400">
                                {entry.category}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[12px] text-zinc-400 flex-wrap">
                              <span>Date: {formatDate(entry.entry_date)}</span>
                              {entry.method && <span>Method: {entry.method}</span>}
                              {entry.trx_id && <span className="font-mono">TrxID: {entry.trx_id}</span>}
                              {meta.receiptNumber && (
                                <span className="text-zinc-300 font-mono">
                                  Receipt: {meta.receiptNumber}
                                </span>
                              )}
                            </div>

                            {meta.cleanNote && (
                              <p className="text-[11px] text-zinc-500 line-clamp-1">{meta.cleanNote}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 justify-between lg:justify-end">
                          <p className="text-[16px] font-bold text-white font-mono">
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
                              <Receipt className="w-3.5 h-3.5 text-zinc-300" /> Receipt
                            </Button>
                          )}

                          {(entry.voucher_url || entry.receipt_url) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setVoucherPreviewUrl(entry.voucher_url || entry.receipt_url)}
                              className="h-8 gap-1 text-zinc-400 hover:text-white"
                            >
                              <Eye className="w-3.5 h-3.5" /> Voucher
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Wallet className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-[13px] text-zinc-400">No ledger entries found.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === "audit" && (
          <div className="rounded-xl bg-surface border border-border overflow-hidden slide-up">
            <div className="p-5 border-b border-white/[0.08]">
              <h3 className="text-[17px] font-bold text-white tracking-tight flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-300" />
                Admin Activity & Audit Trail
              </h3>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                Immutable chronological digital audit log of all verifications, disbursements, and adjustments
              </p>
            </div>

            {auditLoading ? (
              <div className="p-8 space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-12 skeleton rounded-xl" />
                ))}
              </div>
            ) : auditLogs.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {auditLogs.map((log) => (
                  <div key={log.id} className="p-4 text-[13px] flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[11px] text-zinc-500">
                          By: {log.profiles?.full_name || "Admin"}
                        </span>
                      </div>
                      <p className="text-[12px] text-zinc-400 font-mono">
                        {JSON.stringify(log.details)}
                      </p>
                    </div>
                    <span className="text-[11px] text-zinc-500 whitespace-nowrap">
                      {formatDate(log.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 text-[13px]">
                No audit trail records found.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      <Modal
        isOpen={Boolean(rejectEntry)}
        onClose={() => setRejectEntry(null)}
        title="Reject Contribution & Provide Reason"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-[13px] text-zinc-400 leading-relaxed">
            Rejecting this contribution will notify the donor in their account with this reason, and it will be excluded from official receipts and ledger balances.
          </p>

          <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-[12px] space-y-1">
            <p className="text-white font-medium">
              Amount: {formatCurrency(rejectEntry?.amount || 0)}
            </p>
            <p className="text-zinc-400">Payment Channel: {rejectEntry?.method}</p>
            <p className="text-zinc-400 font-mono">TrxID: {rejectEntry?.trx_id || "N/A"}</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-zinc-300 uppercase tracking-wider">
              Reason for Rejection *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Transaction ID could not be verified in the bank statement. Please check and re-submit with the correct TrxID..."
              className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-3 text-[13px] focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setRejectEntry(null)}>
              Cancel
            </Button>
            <Button
              isLoading={rejecting}
              onClick={handleRejectConfirm}
              className="gap-2"
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>

      {/* Campaign Creation Modal */}
      <Modal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        title="Create Project Campaign"
        size="md"
      >
        <form onSubmit={handleSaveCampaign} className="space-y-4">
          <Input
            label="Campaign Title *"
            placeholder="e.g. Science Laboratory Modernization"
            value={campaignTitle}
            onChange={(e) => setCampaignTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
              Purpose & Project Description *
            </label>
            <textarea
              rows={3}
              value={campaignDesc}
              onChange={(e) => setCampaignDesc(e.target.value)}
              placeholder="Acquiring modern laboratory equipment and tools for student practical experiments..."
              required
              className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-3 text-[13px] focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fundraising Goal (BDT) *"
              type="number"
              min="0"
              placeholder="500000"
              value={campaignTarget}
              onChange={(e) => setCampaignTarget(e.target.value)}
              required
            />

            <Input
              label="Target Deadline (Optional)"
              type="date"
              value={campaignEndDate}
              onChange={(e) => setCampaignEndDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button type="button" variant="secondary" onClick={() => setShowCampaignModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingCampaign}>
              Create Campaign
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Method Edit Modal */}
      <Modal
        isOpen={showMethodModal}
        onClose={() => setShowMethodModal(false)}
        title={methodId ? "Edit Payment Channel" : "Add Payment Channel"}
        size="md"
      >
        <form onSubmit={handleSavePaymentMethod} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Channel Name *"
              placeholder="e.g. bKash / Nagad / Bank"
              value={methodName}
              onChange={(e) => setMethodName(e.target.value)}
              required
            />

            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Type *</label>
              <select
                value={methodType}
                onChange={(e) => setMethodType(e.target.value as PaymentMethodType)}
                className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-2.5 text-[13px] focus:outline-none focus:border-white/30"
              >
                <option value="mobile_banking">Mobile Banking (bKash/Nagad/Rocket)</option>
                <option value="bank">Bank Account</option>
                <option value="cash">Direct Cash Desk</option>
              </select>
            </div>
          </div>

          {methodType !== "cash" ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Account / Phone Number"
                  placeholder="01700000000"
                  value={methodNumber}
                  onChange={(e) => setMethodNumber(e.target.value)}
                />

                <Input
                  label="Account Type"
                  placeholder="Personal / Merchant / Current"
                  value={methodAccountType}
                  onChange={(e) => setMethodAccountType(e.target.value)}
                />
              </div>

              {methodType === "bank" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Bank Name"
                    placeholder="Dutch-Bangla Bank"
                    value={methodBankName}
                    onChange={(e) => setMethodBankName(e.target.value)}
                  />
                  <Input
                    label="Branch Name"
                    placeholder="Dhaka Main"
                    value={methodBranchName}
                    onChange={(e) => setMethodBranchName(e.target.value)}
                  />
                  <Input
                    label="Routing Number"
                    placeholder="090271234"
                    value={methodRouting}
                    onChange={(e) => setMethodRouting(e.target.value)}
                  />
                </div>
              )}

              <Input
                label="Account Holder Name"
                placeholder="MKBH Alumni Association"
                value={methodHolder}
                onChange={(e) => setMethodHolder(e.target.value)}
              />
            </div>
          ) : (
            <Input
              label="Contact Officer & Location *"
              placeholder="Chief Accountant (Room 102, Mobile: 01711223344)"
              value={methodContactPerson}
              onChange={(e) => setMethodContactPerson(e.target.value)}
              required
            />
          )}

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Payment Instructions</label>
            <textarea
              rows={2}
              value={methodInstructions}
              onChange={(e) => setMethodInstructions(e.target.value)}
              placeholder="Send Money and submit TrxID..."
              className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-2.5 text-[13px] focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="method-active"
              checked={methodIsActive}
              onChange={(e) => setMethodIsActive(e.target.checked)}
              className="rounded border-white/20 bg-black/40 text-white focus:ring-0"
            />
            <label htmlFor="method-active" className="text-[13px] text-zinc-300 cursor-pointer">
              Keep this channel active
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button type="button" variant="secondary" onClick={() => setShowMethodModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingMethod}>
              Save Channel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjustment Entry Modal */}
      <Modal
        isOpen={showAdjustmentModal}
        onClose={() => setShowAdjustmentModal(false)}
        title="Create Contra Adjustment Entry"
        size="md"
      >
        <form onSubmit={handleSaveAdjustment} className="space-y-4">
          <p className="text-[12px] text-zinc-400 leading-relaxed">
            Approved ledger records are immutable and cannot be deleted. Create an audited contra entry to adjust balances or ledger discrepancies.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">Type *</label>
              <select
                value={adjKind}
                onChange={(e) => setAdjKind(e.target.value as "income" | "expense")}
                className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-2.5 text-[13px] focus:outline-none focus:border-white/30"
              >
                <option value="expense">Expense Adjustment (Reduces Balance)</option>
                <option value="income">Income Adjustment (Increases Balance)</option>
              </select>
            </div>

            <Input
              label="Adjustment Amount (BDT) *"
              type="number"
              min="1"
              value={adjAmount}
              onChange={(e) => setAdjAmount(e.target.value)}
              required
            />
          </div>

          <Input
            label="Adjustment Title *"
            placeholder="e.g. Bank reconciliation fee adjustment or correction"
            value={adjTitle}
            onChange={(e) => setAdjTitle(e.target.value)}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-[12px] font-medium text-zinc-400 uppercase tracking-wider">
              Audit Explanation & Reason *
            </label>
            <textarea
              rows={3}
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder="Adjustment against entry #... for discrepancy in statement..."
              required
              className="w-full rounded-xl bg-black/40 border border-white/10 text-white p-2.5 text-[13px] focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button type="button" variant="secondary" onClick={() => setShowAdjustmentModal(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={savingAdjustment}>
              Confirm Adjustment
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
        title="Expense Voucher / Receipt Document"
        size="lg"
      >
        {voucherPreviewUrl && (
          <div className="space-y-4">
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-white/10 bg-black flex items-center justify-center p-2">
              <img
                src={voucherPreviewUrl}
                alt="Voucher"
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <a href={voucherPreviewUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5" /> Open Full Size
                </Button>
              </a>
              <Button size="sm" onClick={() => setVoucherPreviewUrl(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
