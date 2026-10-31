"use client";

import Button from "@/components/atoms/Button";
import Modal from "@/components/atoms/Modal";
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

  const donorName =
    entry.donor_name ||
    (entry.is_anonymous
      ? "Anonymous Alumnus (নাম প্রকাশে অনিচ্ছুক)"
      : entry.profiles?.full_name || "Alumni Contributor");

  const donorBatch = entry.profiles?.batch ? `Batch ${entry.profiles.batch}` : "";
  const campaignTitle = entry.fund_campaigns?.title || entry.title || "Alumni General Welfare Fund";
  const receiptNumber = entry.receipt_number || `REC-${new Date(entry.entry_date).getFullYear()}-${entry.id.slice(0, 6).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Donation Receipt / মানি রসিদ" size="lg">
      <div className="space-y-4">
        {/* Printable Receipt Card */}
        <div
          ref={receiptRef}
          className="bg-[#121212] text-[#fafafa] border border-[rgba(255,255,255,0.12)] rounded-xl p-6 sm:p-8 relative overflow-hidden shadow-2xl print:border-black print:bg-white print:text-black"
        >
          {/* Subtle watermark background */}
          <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none select-none text-[90px] font-bold uppercase tracking-widest text-[#14B8A6] rotate-[-15deg]">
            PAID
          </div>

          {/* Receipt Header */}
          <div className="border-b border-[rgba(255,255,255,0.1)] pb-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-7 h-7 rounded-lg bg-[#14B8A6]/20 text-[#14B8A6] flex items-center justify-center font-bold text-xs">
                  AH
                </span>
                <h3 className="text-[17px] font-bold text-white tracking-tight">
                  {siteConfig.name}
                </h3>
              </div>
              <p className="text-[12px] text-[#888]">
                Alumni Welfare & Development Fund • Official Money Receipt
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30">
                <CheckCircle2 className="w-3.5 h-3.5" />
                অনুমোদিত / Verified
              </span>
              <p className="text-[12px] font-mono text-[#a0a0a0] mt-1.5">
                Receipt: <span className="text-white font-semibold">{receiptNumber}</span>
              </p>
              <p className="text-[11px] text-[#777]">
                Date: {formatDate(entry.entry_date)}
              </p>
            </div>
          </div>

          {/* Donor & Contribution Details */}
          <div className="space-y-4 text-[13px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]">
              <div>
                <p className="text-[11px] text-[#666] uppercase tracking-wider">Received With Thanks From</p>
                <p className="font-semibold text-white text-[15px] mt-0.5">{donorName}</p>
                {donorBatch && <p className="text-[12px] text-[#14B8A6] font-medium">{donorBatch}</p>}
              </div>

              <div>
                <p className="text-[11px] text-[#666] uppercase tracking-wider">Purpose / Campaign</p>
                <p className="font-semibold text-[#fafafa] mt-0.5">{campaignTitle}</p>
                <p className="text-[11px] text-[#888] capitalize">Category: {entry.category || "Donation"}</p>
              </div>
            </div>

            {/* Payment specifics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <p className="text-[11px] text-[#666] uppercase">Payment Method</p>
                <p className="font-medium text-[#e5e5e5] mt-0.5">{entry.method || "Cash / Direct"}</p>
              </div>

              {entry.trx_id && (
                <div>
                  <p className="text-[11px] text-[#666] uppercase">Transaction ID (TrxID)</p>
                  <p className="font-mono text-[#e5e5e5] text-[12px] mt-0.5">{entry.trx_id}</p>
                </div>
              )}

              {entry.sender_number && (
                <div>
                  <p className="text-[11px] text-[#666] uppercase">Sender Account</p>
                  <p className="font-mono text-[#e5e5e5] text-[12px] mt-0.5">{entry.sender_number}</p>
                </div>
              )}
            </div>

            {/* Amount Box */}
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-[rgba(20,184,166,0.12)] to-[rgba(16,185,129,0.08)] border border-[rgba(20,184,166,0.25)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-[#14B8A6] uppercase tracking-wider font-medium">
                  Amount Contributed (টাকার পরিমাণ)
                </p>
                <p className="text-[12px] text-[#a0a0a0] mt-0.5 italic">
                  In Words: {amountInWords(Number(entry.amount))}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[26px] font-bold text-[#34D399]">
                  {formatCurrency(Number(entry.amount))}
                </span>
              </div>
            </div>

            {entry.note && (
              <div className="pt-2 text-[12px] text-[#888] border-t border-[rgba(255,255,255,0.06)]">
                <span className="text-[#666]">Note:</span> {entry.note}
              </div>
            )}

            {/* Verification Footer Seal */}
            <div className="pt-6 mt-4 border-t border-[rgba(255,255,255,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-[11px] text-[#666]">
                <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
                <span>Verified by Alumni Association Accounts Desk</span>
              </div>

              <div className="text-right border-t border-dashed border-[#555] sm:border-0 pt-2 sm:pt-0 w-full sm:w-auto">
                <p className="text-[12px] font-medium text-[#c0c0c0]">Authorized Signatory</p>
                <p className="text-[10px] text-[#666]">Alumni Fund Committee</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <p className="text-[12px] text-[#666]">
            এই রসিদটি আপনার অ্যাকাউন্ট ও ডোনেশন হিস্ট্রিতে সংরক্ষিত থাকবে।
          </p>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              Print / Save PDF
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
