import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-[#e5e5e5] px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <Link href="/" className="text-[13px] text-[#FF6363] hover:text-[#FF4F4F]">Back to home</Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-3">Privacy Policy</h1>
          <p className="text-[#888] text-sm">Last updated: October 2026</p>
        </div>
        <section className="space-y-4 text-sm leading-7 text-[#a0a0a0]">
          <p>AlumniHub is a private alumni platform. Member information is visible only to approved members and administrators, except public ID verification which shows only name, batch, and verified status.</p>
          <p>We collect signup details, profile information, event RSVPs, gallery content, fund submissions, and admin-managed records needed to run the alumni association.</p>
          <p>Phone numbers and birthdays are hidden from the directory unless the member chooses to show them. Blood donor participation separately shows the donor phone number to approved members.</p>
          <p>Administrators may use roster data to verify membership. Exported CSV files should be handled carefully and shared only with authorized committee members.</p>
          <p>Contact the site administrator to correct or remove your information.</p>
        </section>
      </div>
    </main>
  );
}
