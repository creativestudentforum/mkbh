"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { parsePhotoCaption } from "@/components/organisms/ApplePhotoGallery";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { Album, Photo } from "@/lib/types";
import { uploadImage, getOptimizedImageUrl, formatDate, getErrorMessage } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Camera,
  ImagePlus,
  Images,
  Pencil,
  Plus,
  Save,
  Trash2,
  Upload,
  X,
  FileText,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

type AlbumWithCount = Album & { photo_count?: number };

interface StagedPhoto {
  id: string;
  file: File;
  preview: string;
  title: string;
  comment: string;
}

export default function AdminGalleryPage() {
  const { user } = useAuth();
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Album creation modal
  const [showAlbumModal, setShowAlbumModal] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<AlbumWithCount | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Staged photos upload modal with captions & comments
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [stagedPhotos, setStagedPhotos] = useState<StagedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  // Edit existing photo modal
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editComment, setEditComment] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

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
        .limit(120);

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
    const { error } = await supabase.from("albums").insert([
      {
        title: title.trim(),
        description: description.trim(),
        cover_url: coverUrl.trim() || null,
      },
    ]);

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

  // Step 1: Admin picks files -> opens staging modal with text/comment inputs
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.length || !selectedAlbum) return;
    const files = Array.from(event.target.files);
    const staged: StagedPhoto[] = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
      comment: "",
    }));
    setStagedPhotos(staged);
    setShowUploadModal(true);
    event.target.value = "";
  };

  const updateStagedPhoto = (id: string, updates: Partial<StagedPhoto>) => {
    setStagedPhotos((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeStagedPhoto = (id: string) => {
    setStagedPhotos((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (filtered.length === 0) setShowUploadModal(false);
      return filtered;
    });
  };

  // Step 2: Upload all staged photos with Cloudinary compression and custom comments
  const handleUploadStaged = async () => {
    if (!selectedAlbum || stagedPhotos.length === 0) return;
    setUploading(true);
    setUploadProgress(null);

    try {
      const rows: Array<Pick<Photo, "album_id" | "url" | "caption" | "uploaded_by">> = [];

      for (let index = 0; index < stagedPhotos.length; index += 1) {
        const item = stagedPhotos[index];
        setUploadProgress(`Uploading ${index + 1} of ${stagedPhotos.length}...`);

        const publicUrl = await uploadImage(item.file, {
          folder: `alumni-hub/gallery/${selectedAlbum.id}`,
        });

        if (publicUrl) {
          // Format caption with comment: "Title :: Comment"
          const compositeCaption = item.comment.trim()
            ? `${item.title.trim()} :: ${item.comment.trim()}`
            : item.title.trim();

          rows.push({
            album_id: selectedAlbum.id,
            url: publicUrl,
            caption: compositeCaption,
            uploaded_by: user?.id || null,
          });
        }
      }

      if (rows.length > 0) {
        const { error } = await supabase.from("photos").insert(rows);
        if (error) throw error;

        // Auto-set first image as cover if album has no cover
        if (!selectedAlbum.cover_url) {
          await supabase
            .from("albums")
            .update({ cover_url: rows[0].url })
            .eq("id", selectedAlbum.id);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["admin-gallery"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-gallery-photos", selectedAlbum.id] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-albums"] });
      await queryClient.invalidateQueries({ queryKey: ["gallery-album", selectedAlbum.id] });

      // Cleanup object URLs
      stagedPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
      setStagedPhotos([]);
      setShowUploadModal(false);
    } catch (err: unknown) {
      alert(getErrorMessage(err));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  };

  // Edit existing photo details
  const openEditPhoto = (photo: Photo) => {
    const { title, comment } = parsePhotoCaption(photo.caption);
    setEditingPhoto(photo);
    setEditTitle(title);
    setEditComment(comment);
  };

  const handleSavePhotoEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPhoto) return;
    setSavingEdit(true);

    const compositeCaption = editComment.trim()
      ? `${editTitle.trim()} :: ${editComment.trim()}`
      : editTitle.trim();

    const { error } = await supabase
      .from("photos")
      .update({ caption: compositeCaption })
      .eq("id", editingPhoto.id);

    if (error) {
      alert("Error updating photo: " + error.message);
    } else {
      await queryClient.invalidateQueries({
        queryKey: ["admin-gallery-photos", editingPhoto.album_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["gallery-album", editingPhoto.album_id],
      });
      setEditingPhoto(null);
    }
    setSavingEdit(false);
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
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-serif font-bold text-foreground tracking-tight">
                Manage Gallery
              </h2>
              <Images className="w-5 h-5 text-accent" />
            </div>
            <p className="text-muted text-[14px]">
              Create albums and organize high-resolution cohort photographs.
            </p>
          </div>
          <Button onClick={openCreateAlbum}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create Album
          </Button>
        </div>

        {/* Layout: Albums list on left, Photos manager on right */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">
          {/* Albums Sidebar */}
          <Card className="p-4 h-fit bg-surface border-border rounded-xl">
            <h3 className="text-sm font-semibold text-foreground mb-3 px-1">Albums</h3>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-20 bg-surface animate-pulse rounded-lg border border-border" />
                ))}
              </div>
            ) : albums.length > 0 ? (
              <div className="space-y-2">
                {albums.map((album) => {
                  const isSelected = selectedAlbum?.id === album.id;
                  return (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => setSelectedAlbum(album)}
                      className={`w-full text-left p-3.5 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-brand/10 border-brand text-foreground"
                          : "bg-canvas border-border hover:border-border-hover text-muted hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold text-foreground truncate">
                            {album.title}
                          </p>
                          <p className="text-[11px] text-muted mt-1">
                            {formatDate(album.created_at)}
                          </p>
                        </div>
                        <Badge variant="info">Album</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <Camera className="w-8 h-8 text-muted mx-auto mb-3" />
                <p className="text-[13px] text-muted mb-3">No albums yet</p>
                <Button size="sm" onClick={openCreateAlbum}>
                  <Plus className="w-4 h-4 mr-1" />
                  Create First Album
                </Button>
              </div>
            )}
          </Card>

          {/* Album Photos Section */}
          <div className="space-y-4">
            {selectedAlbum ? (
              <>
                <Card className="p-5 sm:p-6 bg-surface border-border rounded-xl">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-foreground">
                        {selectedAlbum.title}
                      </h3>
                      {selectedAlbum.description && (
                        <p className="text-[13px] text-muted mt-1 max-w-xl">
                          {selectedAlbum.description}
                        </p>
                      )}
                      <Link
                        href={`/gallery/${selectedAlbum.id}`}
                        className="inline-flex mt-2.5 text-[12px] text-brand hover:underline transition-colors"
                      >
                        View public album →
                      </Link>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <label className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-[13px] font-medium bg-brand text-white hover:bg-brand-hover cursor-pointer transition-colors shadow-sm">
                        <Upload className="w-4 h-4" /> Add Photos
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/heic"
                          multiple
                          className="hidden"
                          onChange={handleFileSelect}
                          disabled={uploading}
                        />
                      </label>

                      <Button
                        variant="danger"
                        size="md"
                        onClick={() => handleDeleteAlbum(selectedAlbum)}
                        className="rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Photos Grid */}
                {selectedPhotosLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <div key={index} className="skeleton aspect-square rounded-[20px]" />
                    ))}
                  </div>
                ) : selectedPhotos.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedPhotos.map((photo) => {
                      const { title, comment } = parsePhotoCaption(photo.caption);
                      return (
                        <Card
                          key={photo.id}
                          className="overflow-hidden group relative rounded-[20px] bg-[#18181b] border-white/5 hover:border-white/20 transition-all flex flex-col justify-between"
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-[#121214]">
                            <Image
                              src={getOptimizedImageUrl(photo.url, { width: 500, crop: "fill" })}
                              alt={title}
                              fill
                              sizes="(max-width: 768px) 50vw, 33vw"
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Action Buttons Overlay */}
                            <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={() => openEditPhoto(photo)}
                                className="p-2 rounded-lg bg-black/80 hover:bg-black text-white transition-colors border border-border"
                                title="Edit Title & Comment"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePhoto(photo)}
                                className="p-2 rounded-lg bg-black/80 hover:bg-danger text-white transition-colors border border-border"
                                title="Delete Photo"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="p-3.5 flex flex-col justify-between flex-1">
                            <div>
                              <p className="text-[13px] font-semibold text-[#fafafa] truncate">
                                {title}
                              </p>
                              {comment && (
                                <p className="text-[11px] text-[#a1a1aa] line-clamp-2 mt-1">
                                  {comment}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-[10px] text-[#71717a]">
                              <span>{formatDate(photo.created_at)}</span>
                              <button
                                type="button"
                                onClick={() => openEditPhoto(photo)}
                                className="text-white/60 hover:text-white flex items-center gap-1"
                              >
                                <Pencil className="w-3 h-3" /> Edit text
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-12 text-center rounded-xl bg-surface border-border">
                    <ImagePlus className="w-8 h-8 text-[#555] mx-auto mb-3" />
                    <p className="text-[14px] text-[#fafafa] font-medium">No photos in this album yet</p>
                    <p className="text-[12px] text-[#71717a] mt-1">
                      Click &ldquo;Add Photos&rdquo; above to upload compressed pictures with custom comments.
                    </p>
                  </Card>
                )}
              </>
            ) : (
              <Card className="p-14 text-center rounded-xl bg-surface border-border">
                <Images className="w-10 h-10 text-[#555] mx-auto mb-3" />
                <p className="text-[14px] text-[#a1a1aa]">Select an album to upload or manage photos.</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: Upload Staged Photos with Captions & Comments */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => !uploading && setShowUploadModal(false)}
        title={`Add Photos to "${selectedAlbum?.title || "Album"}"`}
        size="lg"
      >
        <div className="space-y-5">
          <p className="text-[13px] text-[#a1a1aa]">
            Add a title and optional story or comment for each photo. Each photo will be compressed
            and saved to Cloudinary.
          </p>

          <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
            {stagedPhotos.map((photo, index) => (
              <div
                key={photo.id}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-[#18181b] border border-white/10"
              >
                {/* Thumbnail Preview */}
                <div className="relative w-full sm:w-28 h-28 rounded-xl overflow-hidden bg-black flex-shrink-0">
                  <Image
                    src={photo.preview}
                    alt={photo.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/70 text-[10px] text-white">
                    #{index + 1}
                  </div>
                </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                      Title / Caption
                    </label>
                    <input
                      type="text"
                      value={photo.title}
                      onChange={(e) => updateStagedPhoto(photo.id, { title: e.target.value })}
                      placeholder="e.g. Annual Reunion Speech"
                      className="w-full rounded-lg bg-[#141414] border border-white/10 text-white px-3 py-2 text-[13px] focus:outline-none focus:border-white/30"
                      disabled={uploading}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#8e8e93] uppercase tracking-wider mb-1">
                      Comment / Story (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={photo.comment}
                      onChange={(e) => updateStagedPhoto(photo.id, { comment: e.target.value })}
                      placeholder="Add memories, notes, context, or who was in this photo..."
                      className="w-full rounded-lg bg-[#141414] border border-white/10 text-white px-3 py-2 text-[12px] focus:outline-none focus:border-white/30 resize-none"
                      disabled={uploading}
                    />
                  </div>
                </div>

                {/* Remove item button */}
                <button
                  type="button"
                  onClick={() => removeStagedPhoto(photo.id)}
                  disabled={uploading}
                  className="self-start sm:self-center p-2 rounded-lg text-[#71717a] hover:text-red-400 hover:bg-white/5 transition-colors"
                  title="Remove photo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {uploadProgress && (
            <p className="text-center text-xs text-[#a1a1aa] font-medium animate-pulse">
              {uploadProgress}
            </p>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <span className="text-xs text-[#71717a]">
              {stagedPhotos.length} photo{stagedPhotos.length === 1 ? "" : "s"} ready
            </span>
            <div className="flex gap-2.5">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowUploadModal(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleUploadStaged}
                isLoading={uploading}
              >
                <Upload className="w-4 h-4 mr-1.5" />
                Upload All Photos
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: Edit Existing Photo Title & Comment */}
      {/* ========================================================================= */}
      <Modal
        isOpen={Boolean(editingPhoto)}
        onClose={() => !savingEdit && setEditingPhoto(null)}
        title="Edit Photo Details"
        size="md"
      >
        {editingPhoto && (
          <form onSubmit={handleSavePhotoEdit} className="space-y-4">
            <div className="relative w-full h-44 rounded-2xl overflow-hidden bg-black mb-3">
              <Image
                src={getOptimizedImageUrl(editingPhoto.url, { width: 600, crop: "fill" })}
                alt={editTitle}
                fill
                className="object-cover"
              />
            </div>

            <Input
              label="Title / Caption"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              placeholder="Photo headline..."
            />

            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-[#a0a0a0]">
                Comment / Story / Description
              </label>
              <textarea
                rows={3}
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                placeholder="Write a memory or note for this photo..."
                className="w-full rounded-lg bg-[#141414] border border-white/10 text-white placeholder-[#555] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30 resize-none"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingPhoto(null)}
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={savingEdit}>
                <Save className="w-4 h-4 mr-1.5" />
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL: Create Album */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showAlbumModal}
        onClose={() => setShowAlbumModal(false)}
        title="Create Album"
        size="lg"
      >
        <form onSubmit={handleCreateAlbum} className="space-y-5">
          <Input
            label="Album Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
            placeholder="e.g. Annual Reunion 2026"
          />
          <Input
            label="Cover Photo URL (Optional)"
            type="url"
            value={coverUrl}
            onChange={(event) => setCoverUrl(event.target.value)}
            placeholder="Leave empty to auto-set from first uploaded photo"
          />
          <div className="space-y-2">
            <label htmlFor="album-description" className="block text-[13px] font-medium text-[#a0a0a0]">
              Description
            </label>
            <textarea
              id="album-description"
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg bg-[#141414] border border-white/10 text-white placeholder-[#555] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30 resize-none"
              placeholder="Short description of the event or gathering..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAlbumModal(false)}
              disabled={savingAlbum}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={savingAlbum}>
              <Save className="w-4 h-4 mr-1.5" />
              Create Album
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
