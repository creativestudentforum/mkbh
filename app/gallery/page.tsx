"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Album } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import { useQuery } from "@tanstack/react-query";
import { Camera, ImageIcon, Plus } from "lucide-react";
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
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#f3f4f6] tracking-tight mb-1">
            Photo Archives & Albums
          </h2>
          <p className="text-sm text-[#86868b]">
            Historical school photographs, annual reunion albums, and campus memories.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="skeleton h-[420px] rounded-[28px]" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-[28px] bg-[#13151b] border border-white/[0.08] text-center">
            <p className="text-xs text-red-400">Could not load gallery albums.</p>
          </div>
        ) : albums && albums.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {albums.map((album) => (
              <Link
                key={album.id}
                href={`/gallery/${album.id}`}
                className="group block h-full outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded-[28px]"
              >
                <div className="rounded-[28px] bg-[#13151b] border border-white/[0.08] hover:border-white/20 hover:bg-[#161922] transition-all duration-300 ease-out p-6 sm:p-7 h-[440px] sm:h-[460px] flex flex-col justify-between shadow-sm hover:shadow-xl">
                  {/* Top Text Header */}
                  <div>
                    <div className="flex items-center justify-between text-xs text-[#86868b] mb-1.5">
                      <span className="font-semibold uppercase tracking-tight">
                        Photo Archive
                      </span>
                      <span>{formatDate(album.created_at)}</span>
                    </div>

                    <h3 className="text-[22px] font-semibold text-[#f3f4f6] tracking-tight leading-[1.2] group-hover:text-white transition-colors line-clamp-1">
                      {album.title}
                    </h3>

                    {album.description && (
                      <p className="text-[13px] text-[#86868b] mt-2 line-clamp-2 leading-relaxed">
                        {album.description}
                      </p>
                    )}
                  </div>

                  {/* Bottom Photo Presentation with Apple Floating Plus Button */}
                  <div className="relative w-full h-56 rounded-2xl overflow-hidden bg-[#0e1015] border border-white/[0.08] mt-4 flex items-center justify-center">
                    {album.cover_url ? (
                      <Image
                        src={getOptimizedImageUrl(album.cover_url, { width: 700, crop: "fill" })}
                        alt={album.title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
                        <ImageIcon className="w-10 h-10 text-[#6b7280]" />
                      </div>
                    )}

                    {/* Apple Floating Plus Icon */}
                    <div
                      aria-label="View album"
                      className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 text-white flex items-center justify-center transition-all duration-200 group-hover:scale-110 shadow-lg"
                    >
                      <Plus className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-[28px] bg-[#13151b] border border-white/[0.08] flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 rounded-full bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-[#9ca3af]">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-base font-semibold text-[#f3f4f6]">No albums recorded yet</p>
            <p className="text-xs text-[#86868b] mt-1 max-w-sm">
              School photo albums will appear here once added by administrators.
            </p>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
