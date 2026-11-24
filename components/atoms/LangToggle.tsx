"use client";

import { useI18n } from "@/lib/i18n/client";

export default function LangToggle() {
  const { lang, setLang } = useI18n();
  const nextLang = lang === "en" ? "bn" : "en";

  return (
    <button
      type="button"
      onClick={() => setLang(nextLang)}
      className="px-2.5 py-1 rounded-md text-xs font-medium border border-white/10 bg-[#181b22] text-[#9ca3af] hover:text-[#f3f4f6] hover:bg-[#20242e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      aria-label="Change language"
    >
      {lang === "en" ? "বাংলা" : "EN"}
    </button>
  );
}
