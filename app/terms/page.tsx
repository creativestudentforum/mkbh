import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-[13px] text-[#FF6363] hover:text-[#FF4F4F]">Back to home</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Terms of Use</h1>
          <p className="text-[#888] text-sm">Last updated: October 2026</p>
        </div>
        <section className="space-y-4 text-sm leading-7 text-[#a0a0a0]">
          <p>AlumniHub is for verified alumni, teachers, and authorized administrators. Access may be approved, rejected, or removed by administrators.</p>
          <p>Members must submit accurate information and must not misuse directory, phone, event, fund, gallery, or roster data.</p>
          <p>Gallery and memorial content should be uploaded only when there is appropriate permission or consent.</p>
          <p>The fund ledger is a transparency tool. Payment verification is manual and completed by administrators or committee members.</p>
          <p>By using the platform, you agree to follow association rules and respect member privacy.</p>
        </section>
      </div>
    </main>
  );
}
