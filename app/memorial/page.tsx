"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Memorial } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Flower2, Heart } from "lucide-react";

export default function MemorialPage() {
  const supabase = createClient();

  const { data: memorials, isLoading, error } = useQuery({
    queryKey: ["memorials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("memorials").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Memorial[];
    },
  });

  return (
    <DashboardShell title="In Memoriam">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">In Memoriam</h2>
            <Flower2 className="w-5 h-5 text-[#FBBF24]" />
          </div>
          <p className="text-[#777] text-[14px]">Remembering alumni and teachers who remain part of our school family.</p>
        </div>

        <Card className="p-5 bg-[rgba(251,191,36,0.04)] border-[rgba(251,191,36,0.12)] slide-up stagger-2">
          <div className="flex items-start gap-3">
            <Heart className="w-5 h-5 text-[#FBBF24] flex-shrink-0 mt-0.5" />
            <p className="text-[13px] text-[#a0a0a0] leading-relaxed">Names and photos should be published only with family consent.</p>
          </div>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-56 rounded-xl" />)}</div>
        ) : error ? (
          <Card className="p-8 text-center"><p className="text-[13px] text-[#EF4444]">Could not load memorials.</p></Card>
        ) : memorials && memorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 slide-up stagger-3">
            {memorials.map((person) => (
              <Card key={person.id} className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar src={person.photo_url} name={person.full_name} size="xl" />
                  <div className="min-w-0">
                    <h3 className="text-[16px] font-bold text-[#fafafa] leading-tight">{person.full_name}</h3>
                    <div className="flex gap-2 flex-wrap mt-2">
                      {person.batch && <Badge>Batch {person.batch}</Badge>}
                      {person.date_of_death && <Badge variant="warning">{formatDate(person.date_of_death)}</Badge>}
                    </div>
                  </div>
                </div>
                {person.bio && <p className="text-[13px] text-[#888] leading-relaxed mt-4">{person.bio}</p>}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center"><Flower2 className="w-8 h-8 text-[#444] mb-3" /><p className="text-[13px] text-[#666]">No memorials have been added yet.</p></Card>
        )}
      </div>
    </DashboardShell>
  );
}
