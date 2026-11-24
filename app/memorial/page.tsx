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
      const { data, error } = await supabase
        .from("memorials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Memorial[];
    },
  });

  return (
    <DashboardShell title="In Memoriam">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight mb-1">
            In Memoriam
          </h2>
          <p className="text-sm text-[#9ca3af]">
            Honoring alumni, teachers, and staff who remain an enduring part of our school legacy.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 flex items-start gap-3">
          <Heart className="w-4 h-4 text-[#c89542] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#9ca3af] leading-relaxed">
            Names, photographs, and tributes are published with family consent. To submit or update a memorial tribute, please contact the administration committee.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-52 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <Card className="p-8 text-center">
            <p className="text-xs text-red-400">Could not load memorial tributes.</p>
          </Card>
        ) : memorials && memorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {memorials.map((person) => (
              <Card key={person.id} className="p-5 h-full flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3.5">
                    <Avatar src={person.photo_url} name={person.full_name} size="xl" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-lg font-semibold text-[#f3f4f6] leading-snug">
                        {person.full_name}
                      </h3>
                      <div className="flex gap-1.5 flex-wrap mt-1.5">
                        {person.batch && <Badge>Batch {person.batch}</Badge>}
                        {person.date_of_death && (
                          <Badge variant="warning">{formatDate(person.date_of_death)}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {person.bio && (
                    <p className="text-xs text-[#9ca3af] leading-relaxed mt-4 italic">
                      "{person.bio}"
                    </p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-[#9ca3af]">
              <Flower2 className="w-5 h-5" />
            </div>
            <p className="text-sm font-semibold text-[#f3f4f6]">No memorial tributes registered yet</p>
            <p className="text-xs text-[#9ca3af] mt-1">Submitted tributes will appear here after verification.</p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
