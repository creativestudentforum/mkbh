"use client";

import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { GraduationCap, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LoginPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <AuthShell widthClass="max-w-[400px]">
      <div className="text-center mb-7 sm:mb-8 slide-up stagger-1">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D9488] to-[#14B8A6] flex items-center justify-center mx-auto mb-5 sm:mb-6 pulse-glow shadow-[0_8px_32px_rgba(20,184,166,0.25)]">
          <GraduationCap className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-[28px] font-bold text-[#fafafa] mb-2 tracking-tight">
          {t("auth.welcome")}
        </h1>
        <p className="text-[#999] text-[15px]">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8 slide-up stagger-2">
        <form onSubmit={handleLogin} className="space-y-5">
          {error && (
            <div className="p-3.5 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[13px] text-[#EF4444] flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px]">!</span>
              </div>
              {error}
            </div>
          )}

          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <Input
            label={t("auth.password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            required
          />

          <div className="flex justify-end -mt-2">
            <Link
              href="/forgot-password"
              className="py-1 text-[13px] text-[#999] hover:text-[#14B8A6] transition-colors"
            >
              {t("auth.forgot")}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
          >
            {t("auth.signIn")}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[rgba(255,255,255,0.06)]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#141414] px-3 text-[#777]">
              {t("auth.new")}
            </span>
          </div>
        </div>

        <Link href="/signup" className="block">
          <Button variant="secondary" className="w-full" size="lg">
            {t("auth.create")}
          </Button>
        </Link>
      </div>

      <p className="text-center text-[11px] text-[#777] mt-6">
        {t("auth.terms")} <Link href="/privacy" className="hover:text-[#14B8A6]">Privacy</Link> · <Link href="/terms" className="hover:text-[#14B8A6]">Terms</Link>
      </p>
    </AuthShell>
  );
}