"use client";

import Button from "@/components/atoms/Button";
import { useAuth } from "@/lib/auth-context";
import { Clock, RefreshCw, LogOut, XCircle, GraduationCap, Mail, Phone, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PendingPage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRefresh = async () => {
    setLoading(true);
    const latestProfile = await refreshProfile();
    if (latestProfile?.status === "approved") {
      router.push("/dashboard");
    }
    setLoading(false);
  };

  const isRejected = profile?.status === "rejected";

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,99,99,0.03)_0%,transparent_70%)]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[radial-gradient(circle,rgba(255,160,99,0.03)_0%,transparent_70%)]" />
      </div>

      <div className="w-full max-w-md text-center relative z-10">
        <div className="glass rounded-2xl p-8 sm:p-10 slide-up">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#FF6363] to-[#FF9A63] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Status Icon */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              isRejected
                ? "bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)]"
                : "bg-[rgba(251,191,36,0.08)] border border-[rgba(251,191,36,0.15)]"
            }`}
          >
            {isRejected ? (
              <XCircle className="w-10 h-10 text-[#EF4444]" />
            ) : (
              <div className="relative">
                <Clock className="w-10 h-10 text-[#FBBF24]" />
                {/* Pulsing ring for pending state */}
                <div className="absolute inset-0 rounded-full border-2 border-[rgba(251,191,36,0.25)] animate-ping" />
              </div>
            )}
          </div>

          <h1 className="text-[22px] font-bold text-[#fafafa] mb-3">
            {isRejected ? "Application Rejected" : "Verification Pending"}
          </h1>

          <p className="text-[#888] mb-2 leading-relaxed text-[13px]">
            {isRejected
              ? "We're sorry, but your application has been declined by the administrator."
              : "Your account has been created successfully! An administrator needs to verify and approve your account."}
          </p>

          {/* User info card */}
          {profile && (
            <div className="bg-[rgba(255,255,255,0.03)] rounded-xl p-4 mb-6 border border-[rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-center gap-2 text-[13px] text-[#888]">
                <Mail className="w-4 h-4" />
                <span className="truncate">{profile.email}</span>
              </div>
              {profile.full_name && (
                <p className="text-[11px] text-[#555] mt-1">
                  Signed up as {profile.full_name}
                </p>
              )}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-left">
                {profile.batch && (
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider">Batch</p>
                    <p className="text-[12px] text-[#a0a0a0]">{profile.batch}</p>
                  </div>
                )}
                {profile.department && (
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider flex items-center gap-1"><Users className="w-3 h-3" /> Group</p>
                    <p className="text-[12px] text-[#a0a0a0]">{profile.department}</p>
                  </div>
                )}
                {profile.phone && (
                  <div className="rounded-lg bg-[rgba(255,255,255,0.03)] px-3 py-2">
                    <p className="text-[10px] text-[#555] uppercase tracking-wider flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                    <p className="text-[12px] text-[#a0a0a0]">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!isRejected && (
            <div className="bg-[rgba(255,99,99,0.04)] rounded-xl p-4 mb-6 border border-[rgba(255,99,99,0.08)]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(255,99,99,0.08)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <RefreshCw className="w-4 h-4 text-[#FF6363]" />
                </div>
                <div className="text-left">
                  <p className="text-[12px] font-medium text-[#FF8A63] mb-0.5">
                    What happens next?
                  </p>
                  <p className="text-[12px] text-[#777] leading-relaxed">
                    The admin will review your application. Once approved, you&apos;ll have full access to the alumni network.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {!isRejected && (
              <Button
                onClick={handleRefresh}
                variant="primary"
                className="w-full"
                size="lg"
                isLoading={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Status
              </Button>
            )}

            <Button
              onClick={signOut}
              variant="secondary"
              className="w-full"
              size="lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-[#444] mt-6">
          Need help? Contact the administrator
        </p>
      </div>
    </div>
  );
}
