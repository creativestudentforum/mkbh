"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import LangToggle from "@/components/atoms/LangToggle";
import { createClient } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n/client";
import { GraduationCap, Mail, Lock, User, ArrowRight, CheckCircle, Phone, Users } from "lucide-react";
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
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-4 right-4 z-20"><LangToggle /></div>
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,160,99,0.04)_0%,transparent_70%)] -translate-y-1/3 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,99,99,0.04)_0%,transparent_70%)] translate-y-1/3 translate-x-1/4" />
      </div>

      <div className="w-full max-w-[460px] relative z-10">
        <div className="text-center mb-8 slide-up stagger-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center mx-auto mb-6 pulse-glow shadow-[0_8px_32px_rgba(255,99,99,0.2)]">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#fafafa] mb-2 tracking-tight">
            {t("signup.title")}
          </h1>
          <p className="text-[#777] text-[15px]">
            {t("signup.subtitle")}
          </p>
        </div>

        <div className="glass rounded-2xl p-7 sm:p-8 slide-up stagger-2">
          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="p-3.5 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[13px] text-[#EF4444] flex items-start gap-2">
                <div className="w-4 h-4 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[10px]">!</span>
                </div>
                {error}
              </div>
            )}

            <Input
              label={t("signup.fullName")}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="batch" className="block text-[13px] font-medium text-[#a0a0a0]">
                  {t("signup.batch")}
                </label>
                <div className="relative group">
                  <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] group-focus-within:text-[#888] transition-colors" />
                  <select
                    id="batch"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    required
                    className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 pl-10 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all hover:border-[rgba(255,255,255,0.14)]"
                  >
                    <option value="">{t("signup.selectBatch")}</option>
                    {BATCH_YEARS.map((year) => <option key={year} value={year}>{year}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="department" className="block text-[13px] font-medium text-[#a0a0a0]">
                  {t("signup.group")}
                </label>
                <div className="relative group">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#555] group-focus-within:text-[#888] transition-colors" />
                  <select
                    id="department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                    className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 pl-10 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all hover:border-[rgba(255,255,255,0.14)]"
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

            {/* Password hint */}
            <p className="text-[11px] text-[#555] -mt-2">
              {t("signup.passwordHint")}
            </p>

            <label className="flex items-start gap-2.5 rounded-lg bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-3 text-[12px] text-[#888] leading-relaxed">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 accent-[#FF6363]"
                required
              />
              {t("signup.consent")}
            </label>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={loading}
            >
              {t("signup.submit")}
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Features list */}
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <p className="text-[11px] text-[#555] mb-3 font-medium uppercase tracking-wider">
              {t("signup.featuresTitle")}
            </p>
            <div className="grid grid-cols-1 gap-2">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-[13px] text-[#888]"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-[#34D399] flex-shrink-0" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-[13px] text-[#777] mt-6">
          {t("signup.haveAccount")}{" "}
          <Link
            href="/login"
            className="text-[#FF6363] font-medium hover:text-[#FF4F4F] transition-colors"
          >
            {t("signup.signIn")}
          </Link>
        </p>
        <p className="text-center text-[11px] text-[#444] mt-4">
          Review our <Link href="/privacy" className="hover:text-[#FF6363]">Privacy Policy</Link> and <Link href="/terms" className="hover:text-[#FF6363]">Terms</Link>.
        </p>
      </div>
    </div>
  );
}
