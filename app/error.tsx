"use client";

import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-[rgba(239,68,68,0.08)] flex items-center justify-center mx-auto mb-5">
          <AlertTriangle className="w-7 h-7 text-[#EF4444]" />
        </div>
        <h1 className="text-[22px] font-bold text-[#fafafa] mb-2">Something went wrong</h1>
        <p className="text-[13px] text-[#777] mb-6">Please try again. If this continues, contact an administrator.</p>
        <Button onClick={reset} className="mx-auto"><RotateCcw className="w-4 h-4" />Try Again</Button>
      </Card>
    </main>
  );
}
