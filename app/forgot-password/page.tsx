"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { ArrowLeft, Mail } from "lucide-react";
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
      setMessage("Password reset link sent. Please check your email.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,99,99,0.04)_0%,transparent_70%)] -translate-y-1/3 translate-x-1/4" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8 slide-up stagger-1">
          <h1 className="text-[28px] font-bold text-[#fafafa] mb-2 tracking-tight">Reset password</h1>
          <p className="text-[#777] text-[15px]">Enter your email and we will send a reset link.</p>
        </div>

        <div className="glass rounded-2xl p-7 sm:p-8 slide-up stagger-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3.5 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[13px] text-[#EF4444]">{error}</div>}
            {message && <div className="p-3.5 rounded-lg bg-[rgba(52,211,153,0.08)] border border-[rgba(52,211,153,0.15)] text-[13px] text-[#34D399]">{message}</div>}

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

          <Link href="/login" className="mt-6 flex items-center justify-center gap-2 text-[13px] text-[#777] hover:text-[#FF6363] transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
