"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import LangToggle from "@/components/atoms/LangToggle";
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20"><LangToggle /></div>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,99,99,0.04)_0%,transparent_70%)] -translate-y-1/3 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,160,99,0.03)_0%,transparent_70%)] translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(255,99,99,0.02)_0%,transparent_70%)] -translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8 slide-up stagger-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center mx-auto mb-6 pulse-glow shadow-[0_8px_32px_rgba(255,99,99,0.2)]">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#fafafa] mb-2 tracking-tight">
            {t("auth.welcome")}
          </h1>
          <p className="text-[#777] text-[15px]">
            {t("auth.loginSubtitle")}
          </p>
        </div>

        <div className="glass rounded-2xl p-7 sm:p-8 slide-up stagger-2">
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
                className="text-[12px] text-[#777] hover:text-[#FF6363] transition-colors"
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
              <span className="bg-[#141414] px-3 text-[#555]">
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

        <p className="text-center text-[11px] text-[#444] mt-6">
          {t("auth.terms")} <Link href="/privacy" className="hover:text-[#FF6363]">Privacy</Link> · <Link href="/terms" className="hover:text-[#FF6363]">Terms</Link>
        </p>
      </div>
    </div>
  );
}
