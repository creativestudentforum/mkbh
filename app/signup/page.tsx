"use client";

import Button from "@/components/atoms/Button";
import Input from "@/components/atoms/Input";
import { createClient } from "@/lib/supabase";
import { GraduationCap, Mail, Lock, User, ArrowRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignUpPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = "/login";
    }
  };

  const features = [
    "Connect with fellow alumni",
    "Access the alumni directory",
    "Get a digital ID card",
    "Stay updated with announcements",
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(255,160,99,0.04)_0%,transparent_70%)] -translate-y-1/3 -translate-x-1/4" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,99,99,0.04)_0%,transparent_70%)] translate-y-1/3 translate-x-1/4" />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        <div className="text-center mb-8 slide-up stagger-1">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center mx-auto mb-6 pulse-glow shadow-[0_8px_32px_rgba(255,99,99,0.2)]">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-[28px] font-bold text-[#fafafa] mb-2 tracking-tight">
            Join the Network
          </h1>
          <p className="text-[#777] text-[15px]">
            Apply for alumni access to connect with peers
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
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              icon={<User className="w-4 h-4" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              icon={<Mail className="w-4 h-4" />}
              required
            />

            <Input
              label="Password"
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
              Must be at least 6 characters
            </p>

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={loading}
            >
              Submit Application
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Features list */}
          <div className="mt-6 pt-6 border-t border-[rgba(255,255,255,0.06)]">
            <p className="text-[11px] text-[#555] mb-3 font-medium uppercase tracking-wider">
              What you get with AlumniHub:
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
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[#FF6363] font-medium hover:text-[#FF4F4F] transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
