"use client";

import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
import { parseFundEntryMeta } from "@/lib/fund-service";
import { amountInWords } from "@/lib/numberToWords";
import { siteConfig } from "@/lib/site";
import type { FundEntry } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { CheckCircle2, Download, Printer, ShieldCheck } from "lucide-react";
import { useRef } from "react";

interface DonationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: FundEntry | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-BD", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export default function DonationReceiptModal({
  isOpen,
  onClose,
  entry,
}: DonationReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!entry) return null;

  const meta = parseFundEntryMeta(entry);

  const donorName = meta.isAnonymous
    ? "Anonymous Alumnus (Private)"
    : meta.donorName || "Alumni Contributor";

  const donorBatch = meta.donorBatch ? `Batch ${meta.donorBatch}` : "";
  const campaignTitle = meta.campaignTitle || entry.title || "Alumni General Welfare Fund";
  const receiptNumber = meta.receiptNumber || `REC-${new Date(entry.entry_date).getFullYear()}-${entry.id.slice(0, 6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Official Money Receipt" size="lg">
      <div className="space-y-4">
        {/* Printable Official Receipt Card */}
        <div
          ref={receiptRef}
          className="bg-surface text-foreground border border-border rounded-xl p-6 sm:p-8 relative overflow-hidden print:border-black print:bg-white print:text-black"
        >
          {/* Watermark */}
          <div className="absolute right-4 bottom-4 opacity-[0.03] pointer-events-none select-none text-[84px] font-serif font-black uppercase tracking-widest text-foreground rotate-[-12deg]">
            VERIFIED
          </div>

          {/* Receipt Top Header */}
          <div className="border-b border-border pb-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <span className="w-8 h-8 rounded-lg bg-canvas border border-border text-foreground flex items-center justify-center font-serif font-bold text-xs tracking-wider">
                  AH
                </span>
                <div>
                  <h3 className="text-base font-serif font-bold text-foreground tracking-tight">
                    {siteConfig.name}
                  </h3>
                  <p className="text-[11px] text-muted">
                    Alumni Welfare & Development Fund • Official Money Receipt
                  </p>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-brand/10 text-brand border border-brand/20">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified & Audited Record
              </span>
              <p className="text-[12px] font-mono text-muted mt-2">
                Receipt No: <span className="text-foreground font-semibold">{receiptNumber}</span>
              </p>
              <p className="text-[11px] text-muted mt-0.5">
                Date: {formatDate(entry.entry_date)}
              </p>
            </div>
          </div>

          {/* Donor & Contribution Details */}
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                  Received With Thanks From
                </p>
                <p className="font-bold text-white text-[16px] mt-1">{donorName}</p>
                {donorBatch && !meta.isAnonymous && (
                  <p className="text-[12px] text-zinc-300 font-medium mt-0.5">{donorBatch}</p>
                )}
              </div>

              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">
                  Purpose / Project Allocation
                </p>
                <p className="font-semibold text-white mt-1">{campaignTitle}</p>
                <p className="text-[11px] text-zinc-400 mt-0.5 capitalize">
                  Category: {entry.category || "General Donation"}
                </p>
              </div>
            </div>

            {/* Payment specifics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Payment Channel</p>
                <p className="font-medium text-white mt-0.5">{entry.method || "Cash / Direct"}</p>
              </div>

              {entry.trx_id && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Transaction ID</p>
                  <p className="font-mono text-white text-[12px] mt-0.5">{entry.trx_id}</p>
                </div>
              )}

              {meta.senderNumber && (
                <div>
                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">Sender Account</p>
                  <p className="font-mono text-white text-[12px] mt-0.5">{meta.senderNumber}</p>
                </div>
              )}
            </div>

            {/* Amount Box */}
            <div className="mt-4 p-5 rounded-xl bg-white/[0.04] border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-[11px] text-zinc-400 uppercase tracking-wider font-semibold">
                  Amount Contributed
                </p>
                <p className="text-[12px] text-zinc-300 mt-1 italic font-serif">
                  In Words: {amountInWords(Number(entry.amount))}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[30px] font-black tracking-tight text-white font-mono">
                  {formatCurrency(Number(entry.amount))}
                </span>
              </div>
            </div>

            {meta.cleanNote && (
              <div className="pt-2 text-[12px] text-zinc-400 border-t border-white/[0.06]">
                <span className="text-zinc-500 font-medium">Personal Note:</span> {meta.cleanNote}
              </div>
            )}

            {/* Verification Footer Seal */}
            <div className="pt-6 mt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 text-[11px] text-zinc-400">
                <div className="w-6 h-6 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center">
                  <ShieldCheck className="w-3.5 h-3.5 text-zinc-200" />
                </div>
                <div>
                  <p className="font-medium text-zinc-300">Audited & Verified</p>
                  <p className="text-[10px] text-zinc-500">Alumni Association Treasury & Accounts Desk</p>
                </div>
              </div>

              <div className="text-left sm:text-right border-t border-dashed border-zinc-700 sm:border-0 pt-3 sm:pt-0 w-full sm:w-auto">
                <p className="text-[12px] font-medium text-white">Authorized Signatory</p>
                <p className="text-[10px] text-zinc-400">Finance & Fund Management Committee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-[12px] text-zinc-500">
            This official receipt is permanently archived in your alumni account ledger.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
