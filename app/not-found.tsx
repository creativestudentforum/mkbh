import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-14 h-14 rounded-xl bg-[rgba(255,99,99,0.08)] flex items-center justify-center mx-auto mb-5">
          <GraduationCap className="w-7 h-7 text-[#FF6363]" />
        </div>
        <h1 className="text-[22px] font-bold text-[#fafafa] mb-2">Page not found</h1>
        <p className="text-[13px] text-[#777] mb-6">The page you are looking for does not exist or has moved.</p>
        <Link href="/"><Button className="mx-auto">Go Home</Button></Link>
      </Card>
    </main>
  );
}
