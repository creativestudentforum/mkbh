"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { FundEntry, FundSummary } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDownCircle, ArrowUpCircle, CheckCircle, Plus, Save, Wallet, XCircle } from "lucide-react";
import { useState } from "react";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(value || 0);
}

export default function AdminFundPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [kind, setKind] = useState<"income" | "expense">("expense");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("other");
  const [method, setMethod] = useState("");
  const [trxId, setTrxId] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-fund"],
    queryFn: async () => {
      const [summaryResponse, entriesResponse] = await Promise.all([
        supabase.from("fund_summary").select("income, expense").maybeSingle(),
        supabase
          .from("fund_entries")
          .select("*, profiles(full_name, batch, phone, avatar_url)")
          .order("created_at", { ascending: false }),
      ]);

      if (summaryResponse.error) throw new Error(summaryResponse.error.message);
      if (entriesResponse.error) throw new Error(entriesResponse.error.message);

      return {
        summary: (summaryResponse.data || { income: 0, expense: 0 }) as FundSummary,
        entries: (entriesResponse.data || []) as FundEntry[],
      };
    },
  });

  const resetForm = () => {
    setKind("expense");
    setTitle("");
    setAmount("");
    setCategory("other");
    setMethod("");
    setTrxId("");
    setEntryDate(new Date().toISOString().slice(0, 10));
    setNote("");
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      alert("Enter a valid amount.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("fund_entries").insert([{
      kind,
      title: title.trim(),
      amount: numericAmount,
      category: category.trim() || "other",
      method: method.trim() || null,
      trx_id: trxId.trim() || null,
      entry_date: entryDate,
      status: "verified",
      note: note.trim(),
    }]);

    if (error) {
      alert("Error saving entry: " + error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["admin-fund"] });
      await queryClient.invalidateQueries({ queryKey: ["fund"] });
      setShowModal(false);
      resetForm();
    }
    setSaving(false);
  };

  const updateStatus = async (entryId: string, status: "verified" | "rejected") => {
    setActionLoading(entryId);
    const { error } = await supabase.from("fund_entries").update({ status }).eq("id", entryId);
    if (error) {
      alert("Error updating entry: " + error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["admin-fund"] });
      await queryClient.invalidateQueries({ queryKey: ["fund"] });
    }
    setActionLoading(null);
  };

  const summary = data?.summary || { income: 0, expense: 0 };
  const entries = data?.entries || [];
  const pendingEntries = entries.filter((entry) => entry.status === "pending");
  const balance = summary.income - summary.expense;

  return (
    <DashboardShell title="Manage Fund">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1"><h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Manage Fund</h2><Wallet className="w-5 h-5 text-[#FF6363]" /></div>
            <p className="text-[#777] text-[14px]">Verify member payments and add manual fund entries.</p>
          </div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}><Plus className="w-4 h-4" />Add Entry</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 slide-up stagger-2">
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Income</p><p className="text-[24px] font-bold text-[#34D399]">{formatCurrency(summary.income)}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Expense</p><p className="text-[24px] font-bold text-[#EF4444]">{formatCurrency(summary.expense)}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Balance</p><p className="text-[24px] font-bold text-[#fafafa]">{formatCurrency(balance)}</p></Card>
          <Card className="p-5"><p className="text-[11px] text-[#555] uppercase tracking-wider mb-2">Pending</p><p className="text-[24px] font-bold text-[#FBBF24]">{pendingEntries.length}</p></Card>
        </div>

        <Card className="p-0 overflow-hidden slide-up stagger-3">
          <div className="p-5 border-b border-[rgba(255,255,255,0.06)]"><h3 className="text-[15px] font-semibold text-[#fafafa]">Fund entries</h3></div>
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-16 rounded-lg" />)}</div>
          ) : entries.length > 0 ? (
            <div className="divide-y divide-[rgba(255,255,255,0.06)]">
              {entries.map((entry) => (
                <div key={entry.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${entry.kind === "income" ? "bg-[rgba(52,211,153,0.08)]" : "bg-[rgba(239,68,68,0.08)]"}`}>{entry.kind === "income" ? <ArrowUpCircle className="w-5 h-5 text-[#34D399]" /> : <ArrowDownCircle className="w-5 h-5 text-[#EF4444]" />}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap"><p className="text-[13px] font-semibold text-[#fafafa]">{entry.title}</p><Badge variant={entry.status === "verified" ? "success" : entry.status === "pending" ? "warning" : "danger"}>{entry.status}</Badge><Badge>{entry.category}</Badge></div>
                      <div className="flex items-center gap-3 flex-wrap mt-1 text-[11px] text-[#666]">
                        <span>{formatDate(entry.entry_date)}</span>
                        {entry.method && <span>{entry.method}</span>}
                        {entry.trx_id && <span>TrxID: {entry.trx_id}</span>}
                      </div>
                      {entry.profiles && (
                        <div className="flex items-center gap-2 mt-2">
                          <Avatar src={null} name={entry.profiles.full_name} size="sm" />
                          <span className="text-[12px] text-[#888]">{entry.profiles.full_name} · Batch {entry.profiles.batch || "N/A"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 justify-between lg:justify-end">
                    <p className={`text-[14px] font-semibold ${entry.kind === "income" ? "text-[#34D399]" : "text-[#EF4444]"}`}>{entry.kind === "income" ? "+" : "-"}{formatCurrency(entry.amount)}</p>
                    {entry.status === "pending" && (
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" isLoading={actionLoading === entry.id} onClick={() => updateStatus(entry.id, "verified")}><CheckCircle className="w-4 h-4 text-[#34D399]" />Verify</Button>
                        <Button size="sm" variant="ghost" isLoading={actionLoading === entry.id} onClick={() => updateStatus(entry.id, "rejected")}><XCircle className="w-4 h-4 text-[#EF4444]" />Reject</Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center"><Wallet className="w-8 h-8 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666]">No fund entries yet.</p></div>
          )}
        </Card>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Fund Entry" size="lg">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><label htmlFor="kind" className="block text-[13px] font-medium text-[#a0a0a0]">Kind</label><select id="kind" value={kind} onChange={(event) => setKind(event.target.value as "income" | "expense")} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]"><option value="income">Income</option><option value="expense">Expense</option></select></div>
            <Input label="Amount" type="number" min="1" value={amount} onChange={(event) => setAmount(event.target.value)} required />
            <Input label="Title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Event expense" />
            <Input label="Category" value={category} onChange={(event) => setCategory(event.target.value)} placeholder="donation / event / scholarship" />
            <Input label="Entry Date" type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} required />
            <Input label="Method" value={method} onChange={(event) => setMethod(event.target.value)} placeholder="bKash / Cash / Bank" />
            <Input label="TrxID" value={trxId} onChange={(event) => setTrxId(event.target.value)} />
          </div>
          <div className="space-y-2"><label htmlFor="admin-note" className="block text-[13px] font-medium text-[#a0a0a0]">Note</label><textarea id="admin-note" rows={3} value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" isLoading={saving}><Save className="w-4 h-4" />Save Entry</Button></div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
