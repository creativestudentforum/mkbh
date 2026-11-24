"use client";

import Image from "next/image";
import AuthShell from "@/components/auth/AuthShell";
import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { GraduationCap, Mail, Lock, User, ArrowRight, CheckCircle, Phone, Users, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const GROUPS = ["Science", "Commerce", "Arts"];
const BATCH_YEARS = Array.from(
  { length: new Date().getFullYear() - 1985 + 1 },
  (_, index) => String(new Date().getFullYear() - index)
);

export default function SignUpPage() {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [batch, setBatch] = useState("");
  const [department, setDepartment] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = phone.trim();

    if (normalizedPhone && !/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      setError("Phone number must be a valid Bangladesh number, for example 01712345678.");
      return;
    }

    if (!consent) {
      setError("Please confirm that the submitted information is correct.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          batch: batch.trim(),
          department,
          phone: normalizedPhone,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = data.session ? "/pending" : "/login";
    }
  };

  const features = [
    t("signup.featureConnect"),
    t("signup.featureDirectory"),
    t("signup.featureId"),
    t("signup.featureUpdates"),
  ];

  return (
    <AuthShell widthClass="max-w-[460px]">
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
          {t("signup.title")}
        </h1>
        <p className="text-sm text-[#9ca3af] mt-1">
          {t("signup.subtitle")}
        </p>
      </div>

      <div className="bg-[#13151b] border border-white/10 rounded-xl p-6 sm:p-7 shadow-lg">
        <form onSubmit={handleSignUp} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label={t("signup.fullName")}
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Mohammad Rahman"
            icon={<User className="w-4 h-4" />}
            required
          />

          <Input
            label={t("auth.email")}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label htmlFor="batch" className="block text-xs font-medium text-[#9ca3af]">
                {t("signup.batch")}
              </label>
              <div className="relative group">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280] pointer-events-none" />
                <select
                  id="batch"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  required
                  className="w-full rounded-lg bg-[#0e1015] border border-white/10 text-[#f3f4f6] px-3 py-2 pl-9 text-sm focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c] hover:border-white/20 transition-colors"
                >
                  <option value="">{t("signup.selectBatch")}</option>
                  {BATCH_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="department" className="block text-xs font-medium text-[#9ca3af]">
                {t("signup.group")}
              </label>
              <div className="relative group">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280] pointer-events-none" />
                <select
                  id="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  required
                  className="w-full rounded-lg bg-[#0e1015] border border-white/10 text-[#f3f4f6] px-3 py-2 pl-9 text-sm focus:outline-none focus:border-[#22785c] focus:ring-1 focus:ring-[#22785c] hover:border-white/20 transition-colors"
                >
                  <option value="">{t("signup.selectGroup")}</option>
                  {GROUPS.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <Input
            label={t("signup.phone")}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01712345678"
            icon={<Phone className="w-4 h-4" />}
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
            minLength={6}
          />

          <p className="text-[11px] text-[#6b7280] -mt-1.5">
            {t("signup.passwordHint")}
          </p>

          <label className="flex items-start gap-2.5 rounded-lg bg-white/[0.03] border border-white/[0.08] p-3 text-xs text-[#9ca3af] leading-relaxed cursor-pointer hover:border-white/15 transition-colors">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#1a634b]"
              required
            />
            <span>{t("signup.consent")}</span>
          </label>

          <Button
            type="submit"
            className="w-full mt-2"
            size="lg"
            isLoading={loading}
          >
            {t("signup.submit")}
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="mt-5 pt-4 border-t border-white/[0.08] hidden sm:block">
          <p className="text-[10px] text-[#6b7280] mb-2.5 font-medium uppercase tracking-wider">
            {t("signup.featuresTitle")}
          </p>
          <div className="space-y-1.5">
            {features.map((feature) => (
              <div
                key={feature}
                className="flex items-center gap-2 text-xs text-[#9ca3af]"
              >
                <CheckCircle className="w-3.5 h-3.5 text-[#34d399] flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-[#9ca3af] mt-5">
        {t("signup.haveAccount")}{" "}
        <Link
          href="/login"
          className="text-white font-medium hover:underline underline-offset-2"
        >
          {t("signup.signIn")}
        </Link>
      </p>
      <p className="text-center text-[11px] text-[#6b7280] mt-3">
        Review our <Link href="/privacy" className="hover:text-white underline underline-offset-2">Privacy Policy</Link> and <Link href="/terms" className="hover:text-white underline underline-offset-2">Terms</Link>.
      </p>
    </AuthShell>
  );
}
