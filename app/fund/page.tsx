"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import DashboardShell from "@/components/organisms/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { siteConfig } from "@/lib/site";
import { createClient } from "@/lib/supabase";
import type { FundEntry, FundSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, Banknote, HandCoins, Landmark, Wallet } from "lucide-react";
import { useState } from "react";

const PAYMENT_METHODS = ["bKash", "Nagad", "Rocket", "Bank", "Cash"];
const configuredPayments = [
  { label: "bKash", value: siteConfig.payment.bkash },
  { label: "Nagad", value: siteConfig.payment.nagad },
  { label: "Bank", value: siteConfig.payment.bank },
].filter((item) => item.value);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value || 0);
}

export default function FundPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("bKash");
  const [trxId, setTrxId] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data } = useQuery({
    queryKey: ["fund"],
    queryFn: async () => {
      const [summaryResponse, entriesResponse] = await Promise.all([
        supabase.from("fund_summary").select("income, expense").maybeSingle(),
        supabase.from("fund_entries").select("*").order("entry_date", { ascending: false }).limit(30),
      ]);

      if (summaryResponse.error) throw new Error(summaryResponse.error.message);
      if (entriesResponse.error) throw new Error(entriesResponse.error.message);

      return {
        summary: (summaryResponse.data || { income: 0, expense: 0 }) as FundSummary,
        entries: (entriesResponse.data || []) as FundEntry[],
      };
    },
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!profile) return;

    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("fund_entries").insert([{
      kind: "income",
      category: "donation",
      title: `${method} payment submitted`,
      amount: numericAmount,
      member_id: profile.id,
      method,
      trx_id: trxId.trim() || null,
      status: "pending",
      note: note.trim(),
    }]);

    if (error) {
      alert("Error submitting payment: " + error.message);
    } else {
      setAmount("");
      setTrxId("");
      setNote("");
      await queryClient.invalidateQueries({ queryKey: ["fund"] });
    }
    setSubmitting(false);
  };

  const summary = data?.summary || { income: 0, expense: 0 };
  const balance = summary.income - summary.expense;
  const entries = data?.entries || [];

  return (
    <DashboardShell title="Fund">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Fund Ledger</h2>
            <Wallet className="w-5 h-5 text-[#FF6363]" />
          </div>
          <p className="text-[#777] text-[14px]">Transparent manual ledger for alumni fund income and expenses.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 slide-up stagger-2">
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Income</p><p className="text-[26px] font-bold text-[#34D399]">{formatCurrency(summary.income)}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Expense</p><p className="text-[26px] font-bold text-[#EF4444]">{formatCurrency(summary.expense)}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Balance</p><p className="text-[26px] font-bold text-[#fafafa]">{formatCurrency(balance)}</p></Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5">
          <div className="space-y-5 slide-up stagger-3">
            <Card className="p-5 bg-[rgba(255,99,99,0.04)] border-[rgba(255,99,99,0.12)]">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[rgba(255,99,99,0.08)] flex items-center justify-center"><Landmark className="w-5 h-5 text-[#FF6363]" /></div>
                <div>
                  <p className="text-[13px] font-semibold text-[#fafafa] mb-1">Payment details</p>
                  <p className="text-[12px] text-[#888] leading-relaxed">Send money to the official committee account, then submit your TrxID here.</p>
                  <div className="mt-3 space-y-1.5">
                    <p className="text-[11px] text-[#555]">Account holder: {siteConfig.payment.accountName}</p>
                    {configuredPayments.length > 0 ? configuredPayments.map((item) => (
                      <p key={item.label} className="text-[12px] text-[#a0a0a0]"><span className="text-[#fafafa]">{item.label}:</span> {item.value}</p>
                    )) : (
                      <p className="text-[12px] text-[#FBBF24]">Payment numbers are not configured yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-[15px] font-semibold text-[#fafafa] mb-4">I sent money</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input label="Amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} required placeholder="1000" />
                <div className="space-y-2">
                  <label htmlFor="method" className="block text-[13px] font-medium text-[#a0a0a0]">Method</label>
                  <select id="method" value={method} onChange={(event) => setMethod(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]">
                    {PAYMENT_METHODS.map((item) => <option key={item} value={item}>{item}</option>)}
                  </select>
                </div>
                <Input label="TrxID / Reference" value={trxId} onChange={(event) => setTrxId(event.target.value)} placeholder="Transaction ID" />
                <div className="space-y-2">
                  <label htmlFor="note" className="block text-[13px] font-medium text-[#a0a0a0]">Note</label>
                  <textarea id="note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]" placeholder="Optional note" />
                </div>
                <Button type="submit" isLoading={submitting} className="w-full"><HandCoins className="w-4 h-4" />Submit Payment</Button>
              </form>
            </Card>
          </div>

          <Card className="p-0 overflow-hidden slide-up stagger-4">
            <div className="p-5 border-b border-[rgba(255,255,255,0.06)]"><h3 className="text-[15px] font-semibold text-[#fafafa]">Recent entries</h3></div>
            {entries.length > 0 ? (
              <div className="divide-y divide-[rgba(255,255,255,0.06)]">
                {entries.map((entry) => <FundEntryRow key={entry.id} entry={entry} />)}
              </div>
            ) : (
              <div className="p-12 text-center"><Banknote className="w-8 h-8 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666]">No fund entries yet.</p></div>
            )}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function FundEntryRow({ entry }: { entry: FundEntry }) {
  const isIncome = entry.kind === "income";
  return (
    <div className="p-4 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isIncome ? "bg-[rgba(52,211,153,0.08)]" : "bg-[rgba(239,68,68,0.08)]"}`}>{isIncome ? <ArrowUpCircle className="w-5 h-5 text-[#34D399]" /> : <ArrowDownCircle className="w-5 h-5 text-[#EF4444]" />}</div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><p className="text-[13px] font-semibold text-[#fafafa] truncate">{entry.title}</p><Badge variant={entry.status === "verified" ? "success" : entry.status === "pending" ? "warning" : "danger"}>{entry.status}</Badge></div>
          <p className="text-[11px] text-[#666] mt-1">{formatDate(entry.entry_date)} · {entry.category}</p>
        </div>
      </div>
      <p className={`text-[13px] font-semibold ${isIncome ? "text-[#34D399]" : "text-[#EF4444]"}`}>{isIncome ? "+" : "-"}{formatCurrency(entry.amount)}</p>
    </div>
  );
}
