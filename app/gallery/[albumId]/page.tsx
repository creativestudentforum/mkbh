"use client";

import Badge from "@/components/atoms/Badge";
import Card from "@/components/atoms/Card";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Album, Photo } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ImageIcon, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { use, useState } from "react";

export default function AlbumPage({ params }: { params: Promise<{ albumId: string }> }) {
  const { albumId } = use(params);
  const supabase = createClient();
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["gallery-album", albumId],
    queryFn: async () => {
      const [albumResponse, photosResponse] = await Promise.all([
        supabase.from("albums").select("*").eq("id", albumId).maybeSingle(),
        supabase.from("photos").select("*").eq("album_id", albumId).order("created_at", { ascending: false }).limit(24),
      ]);

      if (albumResponse.error) throw new Error(albumResponse.error.message);
      if (photosResponse.error) throw new Error(photosResponse.error.message);

      return {
        album: albumResponse.data as Album | null,
        photos: (photosResponse.data || []) as Photo[],
      };
    },
  });

  const album = data?.album;
  const photos = data?.photos || [];

  return (
    <DashboardShell title={album?.title || "Album"}>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <Link href="/gallery" className="inline-flex items-center gap-2 text-[12px] text-[#777] hover:text-[#FF6363] transition-colors mb-3"><ArrowLeft className="w-4 h-4" />Back to gallery</Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-[24px] font-bold text-[#fafafa] tracking-tight">{album?.title || "Album"}</h2>
              {album?.description && <p className="text-[#777] text-[14px] mt-1 max-w-2xl">{album.description}</p>}
              {album?.created_at && <p className="text-[11px] text-[#555] mt-2">Created {formatDate(album.created_at)}</p>}
            </div>
            <Badge variant="info">{photos.length} photo{photos.length === 1 ? "" : "s"}</Badge>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{Array.from({ length: 12 }).map((_, index) => <div key={index} className="skeleton aspect-square rounded-xl" />)}</div>
        ) : error ? (
          <Card className="p-8 text-center"><p className="text-[13px] text-[#EF4444]">Could not load this album.</p></Card>
        ) : photos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 slide-up stagger-2">
            {photos.map((photo) => (
              <button key={photo.id} type="button" onClick={() => setSelectedPhoto(photo)} className="group relative aspect-square rounded-xl overflow-hidden bg-[#141414] border border-[rgba(255,255,255,0.06)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6363]">
                <Image src={photo.url} alt={photo.caption || "Gallery photo"} fill sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover transition-transform duration-300 group-hover:scale-105" />
                {photo.caption && <div className="absolute inset-x-0 bottom-0 bg-black/60 p-2 text-left text-[11px] text-white line-clamp-2">{photo.caption}</div>}
              </button>
            ))}
          </div>
        ) : (
          <Card className="p-12 flex flex-col items-center justify-center text-center"><ImageIcon className="w-8 h-8 text-[#444] mb-3" /><p className="text-[13px] text-[#666]">No photos in this album yet.</p></Card>
        )}
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-[90] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
          <div className="max-w-5xl w-full" onClick={(event) => event.stopPropagation()}>
            <div className="relative w-full h-[75vh]">
              <Image src={selectedPhoto.url} alt={selectedPhoto.caption || "Gallery photo"} fill sizes="100vw" className="object-contain" />
            </div>
            {selectedPhoto.caption && <p className="text-center text-[13px] text-[#e5e5e5] mt-3">{selectedPhoto.caption}</p>}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
