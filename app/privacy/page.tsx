import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-xs text-[#6b7280]">Last updated: October 2026</p>
        </div>
        <div className="space-y-4 text-sm leading-relaxed text-[#9ca3af] border-t border-white/[0.08] pt-6">
          <p>
            AlumniHub is a private, members-only platform for verified alumni and faculty. Member information is visible solely to approved members and authorized school administrators, with the exception of the public digital ID verification URL which exposes only member name, batch, and verification status.
          </p>
          <p>
            We collect signup credentials, biographical profile fields, reunion RSVPs, gallery photos, and fund donation transaction records needed to maintain the association registry.
          </p>
          <p>
            Contact details, including phone numbers and dates of birth, are private by default and hidden from the alumni directory unless an individual explicitly chooses to make them visible in their privacy settings. Blood donor listings are separate and display donor contact info only to approved alumni.
          </p>
          <p>
            Administrators cross-reference submissions with historical school records. Exported membership lists are strictly confidential and limited to committee use.
          </p>
          <p>
            Members may request data corrections or account removal at any time by contacting the school administration.
          </p>
        </div>
      </div>
    </main>
  );
}
