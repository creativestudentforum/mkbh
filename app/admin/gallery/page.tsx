"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { Album, Photo } from "@/lib/types";
import { compressAndUploadGalleryImage, formatDate, getErrorMessage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImagePlus, Images, Plus, Save, Trash2, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type AlbumWithCount = Album & { photo_count?: number };

export default function AdminGalleryPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithCount | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [savingAlbum, setSavingAlbum] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const albumsResponse = await supabase
        .from("albums")
        .select("id, title, description, event_id, cover_url, created_at")
        .order("created_at", { ascending: false })
        .limit(100);

      if (albumsResponse.error) throw new Error(albumsResponse.error.message);

      return { albums: (albumsResponse.data || []) as AlbumWithCount[] };
    },
  });

  const albums = data?.albums || [];
  const { data: selectedPhotos = [], isLoading: selectedPhotosLoading } = useQuery({
    queryKey: ["admin-gallery-photos", selectedAlbum?.id],
    enabled: Boolean(selectedAlbum?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("photos")
        .select("id, album_id, url, caption, uploaded_by, created_at")
        .eq("album_id", selectedAlbum!.id)
        .order("created_at", { ascending: false })
        .limit(80);

      if (error) throw new Error(error.message);
      return (data || []) as Photo[];
    },
  });

  const openCreateAlbum = () => {
    setTitle("");
    setDescription("");
    setCoverUrl("");
    setShowAlbumModal(true);
  };

  const handleCreateAlbum = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingAlbum(true);
    const { error } = await supabase.from("albums").insert([{
      title: title.trim(),
      description: description.trim(),
      cover_url: coverUrl.trim() || null,
    }]);

    if (error) {
      alert("Error creating album: " + error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-albums"] });
      setShowAlbumModal(false);
    }
    setSavingAlbum(false);
  };

  const handleDeleteAlbum = async (album: AlbumWithCount) => {
    if (!confirm(`Delete album "${album.title}"? Photos in the database will be deleted too.`)) return;
    const { error } = await supabase.from("albums").delete().eq("id", album.id);
    if (error) {
      alert("Error deleting album: " + error.message);
    } else {
      if (selectedAlbum?.id === album.id) setSelectedAlbum(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery-photos", album.id] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-albums"] });
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedAlbum || !event.target.files?.length) return;
    setUploading(true);
    setUploadStatus(null);
    const files = Array.from(event.target.files);

    try {
      const rows: Array<Pick<Photo, "album_id" | "url" | "caption" | "uploaded_by">> = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        setUploadStatus(`Uploading ${index + 1} of ${files.length}`);
        const path = `${selectedAlbum.id}/${crypto.randomUUID()}.webp`;
        const publicUrl = await compressAndUploadGalleryImage(file, path);
        if (publicUrl) {
          rows.push({
            album_id: selectedAlbum.id,
            url: publicUrl,
            caption: file.name.replace(/\.[^.]+$/, ""),
            uploaded_by: user?.id || null,
          });
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase.from("photos").insert(rows);
        if (error) throw error;

        if (!selectedAlbum.cover_url) {
          await supabase.from("albums").update({ cover_url: rows[0].url }).eq("id", selectedAlbum.id);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery-photos", selectedAlbum.id] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-albums"] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-album", selectedAlbum.id] });
      setUploadStatus(`Uploaded ${rows.length} photo${rows.length === 1 ? "" : "s"}`);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
      setUploadStatus(null);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleDeletePhoto = async (photo: Photo) => {
    if (!confirm("Delete this photo from the album?")) return;
    const { error } = await supabase.from("photos").delete().eq("id", photo.id);
    if (error) {
      alert("Error deleting photo: " + error.message);
    } else {
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery-photos", photo.album_id] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-album", photo.album_id] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-albums"] });
    }
  };

  return (
    <DashboardShell title="Manage Gallery">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Manage Gallery</h2>
              <Images className="w-5 h-5 text-[#FF6363]" />
            </div>
            <p className="text-[#777] text-[14px]">Create albums and upload compressed photos.</p>
          </div>
          <Button onClick={openCreateAlbum}><Plus className="w-4 h-4" />Create Album</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          <Card className="p-4 h-fit slide-up stagger-2">
            <h3 className="text-[14px] font-semibold text-[#fafafa] mb-4">Albums</h3>
            {isLoading ? (
              <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <div key={index} className="skeleton h-20 rounded-lg" />)}</div>
            ) : albums.length > 0 ? (
              <div className="space-y-2">
                {albums.map((album) => (
                  <button key={album.id} type="button" onClick={() => setSelectedAlbum(album)} className={`w-full text-left p-3 rounded-lg border transition-all ${selectedAlbum?.id === album.id ? "bg-[rgba(255,99,99,0.08)] border-[rgba(255,99,99,0.18)]" : "bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-[#fafafa] truncate">{album.title}</p>
                        <p className="text-[11px] text-[#666] mt-1">{formatDate(album.created_at)}</p>
                      </div>
                      <Badge variant="info">Album</Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-10"><Camera className="w-8 h-8 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666] mb-3">No albums yet</p><Button size="sm" onClick={openCreateAlbum}><Plus className="w-4 h-4" />Create First Album</Button></div>
            )}
          </Card>

          <div className="space-y-4 slide-up stagger-3">
            {selectedAlbum ? (
              <>
                <Card className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-[18px] font-bold text-[#fafafa]">{selectedAlbum.title}</h3>
                      {selectedAlbum.description && <p className="text-[13px] text-[#777] mt-1">{selectedAlbum.description}</p>}
                      <Link href={`/gallery/${selectedAlbum.id}`} className="inline-flex mt-2 text-[12px] text-[#FF6363] hover:text-[#FF4F4F]">View public album</Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium bg-[#FF6363] text-white hover:bg-[#FF4F4F] cursor-pointer transition-all">
                        <Upload className="w-4 h-4" /> Upload Photos
                        <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handleUpload} disabled={uploading} />
                      </label>
                      <Button variant="danger" onClick={() => handleDeleteAlbum(selectedAlbum)}><Trash2 className="w-4 h-4" />Delete</Button>
                    </div>
                  </div>
                  {uploadStatus && <p className="text-[12px] text-[#777] mt-3">{uploadStatus}</p>}
                </Card>

                {selectedPhotosLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="skeleton aspect-square rounded-xl" />)}</div>
                ) : selectedPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedPhotos.map((photo) => (
                      <Card key={photo.id} className="overflow-hidden group relative">
                        <div className="relative aspect-square">
                          <Image src={photo.url} alt={photo.caption || "Gallery photo"} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover" />
                        </div>
                        <button type="button" onClick={() => handleDeletePhoto(photo)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-4 h-4" /></button>
                        {photo.caption && <p className="p-2 text-[11px] text-[#777] truncate">{photo.caption}</p>}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 text-center"><ImagePlus className="w-8 h-8 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666]">No photos in this album yet.</p></Card>
                )}
              </>
            ) : (
              <Card className="p-12 text-center"><Images className="w-9 h-9 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666]">Select an album to upload or manage photos.</p></Card>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showAlbumModal} onClose={() => setShowAlbumModal(false)} title="Create Album" size="lg">
        <form onSubmit={handleCreateAlbum} className="space-y-5">
          <Input label="Album Title" value={title} onChange={(event) => setTitle(event.target.value)} required placeholder="Annual Reunion 2026" />
          <Input label="Cover Photo URL" type="url" value={coverUrl} onChange={(event) => setCoverUrl(event.target.value)} placeholder="Optional" />
          <div className="space-y-2">
            <label htmlFor="album-description" className="block text-[13px] font-medium text-[#a0a0a0]">Description</label>
            <textarea id="album-description" rows={4} value={description} onChange={(event) => setDescription(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" placeholder="Short description..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <Button type="button" variant="secondary" onClick={() => setShowAlbumModal(false)}>Cancel</Button>
            <Button type="submit" isLoading={savingAlbum}><Save className="w-4 h-4" />Create Album</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
