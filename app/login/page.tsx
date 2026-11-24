"use client";

import Image from "next/image";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { GraduationCap, Mail, Lock, ArrowRight, AlertCircle } from "lucide-react";
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
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center mx-auto mb-3 relative shadow-md">
          <Image
            src="/logo.png"
            alt="M.K.B.H High School"
            fill
            className="object-cover"
            sizes="56px"
            priority
          />
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
          {t("auth.welcome")}
        </h1>
        <p className="text-sm text-[#9ca3af] mt-1">
          {t("auth.loginSubtitle")}
        </p>
      </div>

      <div className="bg-[#13151b] border border-white/10 rounded-xl p-6 sm:p-7 shadow-lg">
        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
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

          <div className="flex justify-end pt-0.5">
            <Link
              href="/forgot-password"
              className="text-xs text-[#9ca3af] hover:text-white transition-colors"
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
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#13151b] px-3 text-[#6b7280]">
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

      <p className="text-center text-xs text-[#6b7280] mt-6">
        {t("auth.terms")} •{" "}
        <Link href="/privacy" className="hover:text-white underline underline-offset-2">Privacy</Link> ·{" "}
        <Link href="/terms" className="hover:text-white underline underline-offset-2">Terms</Link>
      </p>
    </AuthShell>
  );
}
