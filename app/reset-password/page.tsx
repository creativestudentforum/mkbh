"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { Lock } from "lucide-react";
import { useState } from "react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      await supabase.auth.signOut();
      window.location.href = "/login";
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-[520px] h-[520px] bg-[radial-gradient(circle,rgba(255,160,99,0.04)_0%,transparent_70%)] translate-y-1/3 -translate-x-1/4" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8 slide-up stagger-1">
          <h1 className="text-[28px] font-bold text-[#fafafa] mb-2 tracking-tight">Create new password</h1>
          <p className="text-[#777] text-[15px]">Use a strong password you do not use elsewhere.</p>
        </div>

        <div className="glass rounded-2xl p-7 sm:p-8 slide-up stagger-2">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <div className="p-3.5 rounded-lg bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] text-[13px] text-[#EF4444]">{error}</div>}

            <Input
              label="New Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />
            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="w-4 h-4" />}
              required
              minLength={6}
            />

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
