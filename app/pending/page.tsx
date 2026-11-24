"use client";

import Image from "next/image";
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
    <div className="min-h-screen bg-[#0c0d11] text-[#f3f4f6] flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="bg-[#13151b] border border-white/10 rounded-xl p-7 sm:p-9 shadow-xl">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 rounded-full overflow-hidden bg-white border border-white/20 flex items-center justify-center relative shadow-md">
              <Image
                src="/logo.png"
                alt="M.K.B.H High School"
                fill
                className="object-cover"
                sizes="56px"
                priority
              />
            </div>
          </div>

          {/* Status Indicator */}
          <div
            className={`w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-5 ${
              isRejected
                ? "bg-red-500/10 border border-red-500/20 text-red-400"
                : "bg-[#c89542]/15 border border-[#c89542]/30 text-[#e5b869]"
            }`}
          >
            {isRejected ? (
              <XCircle className="w-7 h-7 text-red-400" />
            ) : (
              <Clock className="w-7 h-7 text-[#c89542]" />
            )}
          </div>

          <h1 className="font-serif text-2xl font-semibold text-[#f3f4f6] mb-2 tracking-tight">
            {isRejected ? "Application Declined" : "Verification In Progress"}
          </h1>

          <p className="text-sm text-[#9ca3af] mb-6 leading-relaxed max-w-sm mx-auto">
            {isRejected
              ? "Your application could not be verified by the school administration committee."
              : "Your application has been received. An administrator will verify your graduation details against school records before granting access."}
          </p>

          {/* User info card */}
          {profile && (
            <div className="bg-[#0e1015] rounded-lg p-4 mb-6 border border-white/[0.08] text-left">
              <div className="flex items-center gap-2 text-xs text-[#9ca3af]">
                <Mail className="w-3.5 h-3.5 flex-shrink-0 text-[#6b7280]" />
                <span className="truncate">{profile.email}</span>
              </div>
              {profile.full_name && (
                <p className="text-sm font-medium text-[#f3f4f6] mt-1">
                  {profile.full_name}
                </p>
              )}
              <div className="mt-3 grid grid-cols-3 gap-2 text-left pt-3 border-t border-white/[0.06]">
                {profile.batch && (
                  <div>
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Batch</p>
                    <p className="text-xs text-[#d1d5db] font-medium">{profile.batch}</p>
                  </div>
                )}
                {profile.department && (
                  <div>
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Group</p>
                    <p className="text-xs text-[#d1d5db] font-medium">{profile.department}</p>
                  </div>
                )}
                {profile.phone && (
                  <div>
                    <p className="text-[10px] text-[#6b7280] uppercase tracking-wider">Phone</p>
                    <p className="text-xs text-[#d1d5db] font-medium truncate">{profile.phone}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="space-y-2">
            {!isRejected && (
              <Button
                onClick={handleRefresh}
                className="w-full"
                size="lg"
                isLoading={loading}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Check Approval Status
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => signOut()}
              className="w-full"
              size="lg"
            >
              <LogOut className="w-4 h-4 mr-2 text-[#9ca3af]" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
