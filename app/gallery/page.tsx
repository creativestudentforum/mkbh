"use client";

import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Album } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Camera, ImageIcon, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function GalleryPage() {
  const supabase = createClient();

  const { data: albums, isLoading, error } = useQuery({
    queryKey: ["gallery-albums"],
    queryFn: async () => {
      const albumsResponse = await supabase
        .from("albums")
        .select("id, title, description, event_id, cover_url, created_at")
        .order("created_at", { ascending: false })
        .limit(60);

      if (albumsResponse.error) throw new Error(albumsResponse.error.message);

      return (albumsResponse.data || []) as Album[];
    },
  });

  return (
    <DashboardShell title="Gallery">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Gallery</h2>
            <Images className="w-5 h-5 text-[#FF6363]" />
          </div>
          <p className="text-[#777] text-[14px]">Browse alumni event albums and school memories.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton h-72 rounded-xl" />)}
          </div>
        ) : error ? (
          <Card className="p-8 text-center"><p className="text-[13px] text-[#EF4444]">Could not load albums. Make sure the gallery migration has been run.</p></Card>
        ) : albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 slide-up stagger-2">
            {albums.map((album) => (
              <Link key={album.id} href={`/gallery/${album.id}`}>
                <Card hover className="overflow-hidden h-full">
                  {album.cover_url ? (
                    <div className="relative h-48">
                      <Image src={album.cover_url} alt={album.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    </div>
                  ) : (
                    <div className="h-48 bg-[rgba(255,255,255,0.03)] flex items-center justify-center"><ImageIcon className="w-10 h-10 text-[#444]" /></div>
                  )}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="text-[15px] font-semibold text-[#fafafa] leading-tight">{album.title}</h3>
                      <Badge variant="info">Album</Badge>
                    </div>
                    {album.description && <p className="text-[12px] text-[#777] line-clamp-2 mb-4">{album.description}</p>}
                    <div className="flex items-center justify-between text-[11px] text-[#555] pt-4 border-t border-[rgba(255,255,255,0.06)]">
                      <span>{formatDate(album.created_at)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mb-3"><Camera className="w-7 h-7 text-[#444]" /></div>
            <p className="text-[13px] text-[#666] mb-1">No albums yet</p>
            <p className="text-[11px] text-[#444]">Admins can create albums from the admin gallery page.</p>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
