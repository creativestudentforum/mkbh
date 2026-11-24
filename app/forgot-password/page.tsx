"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Mail, AlertCircle, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset instructions have been sent to your email.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
            Reset Password
          </h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Enter your registered email address to receive reset instructions.
          </p>
        </div>

        <div className="bg-[#13151b] border border-white/10 rounded-xl p-6 sm:p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
            {message && (
              <div className="p-3 rounded-lg bg-[#1a634b]/20 border border-[#22785c]/35 text-xs text-[#34d399] flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-[#34d399] flex-shrink-0 mt-0.5" />
                <span>{message}</span>
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Send Reset Link
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-white/[0.08] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs text-[#9ca3af] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
