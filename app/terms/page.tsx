import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] px-4 sm:px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to home
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#f3f4f6] mb-2">
            Terms of Use
          </h1>
          <p className="text-xs text-[#6b7280]">Last updated: October 2026</p>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-[#9ca3af] border-t border-white/[0.08] pt-6">
          <p>
            AlumniHub is an official community service reserved for verified alumni, current and former faculty members, and authorized school leaders. Membership applications are subject to administrative approval.
          </p>
          <p>
            Members agree to provide accurate and truthful educational credentials. Misuse of directory contact information, automated scraping, or unauthorized sharing of peer data is strictly prohibited and subject to immediate account revocation.
          </p>
          <p>
            Media uploaded to the school gallery or in memoriam sections must respect the privacy and dignity of depicted alumni and faculty, and must have appropriate familial or personal consent.
          </p>
          <p>
            The transparency fund ledger is maintained for open community accounting. Financial contributions submitted via mobile banking or direct deposit are manually audited and reconciled by committee treasurers.
          </p>
          <p>
            By participating in the network, you commit to upholding the values and mutual respect of our school community.
          </p>
        </div>
      </div>
    </main>
  );
}
