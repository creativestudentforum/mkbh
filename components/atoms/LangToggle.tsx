"use client";

import { useI18n } from "@/lib/i18n/client";

export default function LangToggle() {
  const { lang, setLang } = useI18n();
  const nextLang = lang === "en" ? "bn" : "en";

  return (
    <button
      type="button"
      onClick={() => setLang(nextLang)}
      className="px-2.5 py-1.5 rounded-lg text-[12px] font-semibold bg-[rgba(255,255,255,0.04)] text-[#a0a0a0] hover:text-[#fafafa] hover:bg-[rgba(255,255,255,0.08)] transition-colors"
      aria-label="Change language"
    >
      {lang === "en" ? "বাংলা" : "EN"}
    </button>
  );
}
