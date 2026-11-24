"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { Lock, AlertCircle } from "lucide-react";
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
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-[#9ca3af] mt-1">
            Choose a strong password containing at least 6 characters.
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

            <Button type="submit" className="w-full mt-2" size="lg" isLoading={loading}>
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
