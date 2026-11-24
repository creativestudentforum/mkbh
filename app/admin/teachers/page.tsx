"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import SearchBar from "@/components/molecules/SearchBar";
import { createClient } from "@/lib/supabase";
import { uploadImage, getErrorMessage, sanitizeSearchQuery } from "@/lib/utils";
import { getOptimizedImageUrl } from "@/lib/cloudinary";
import type { Teacher } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import Image from "next/image";
import {
  Plus,
  Pencil,
  Trash2,
  GraduationCap,
  BookOpen,
  Mail,
  Phone,
  Camera,
  Save,
  X,
  Users,
  ToggleLeft,
  ToggleRight,
  Upload,
} from "lucide-react";

const emptyTeacher = {
  full_name: "",
  email: "",
  department: "",
  designation: "",
  phone: "",
  bio: "",
  specialization: "",
  linkedin_url: "",
  website_url: "",
};

export default function AdminTeachersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState(emptyTeacher);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ["admin-teachers", searchQuery],
    queryFn: async () => {
      let query = supabase.from("teachers").select("*").order("full_name");
      const sanitizedSearch = sanitizeSearchQuery(searchQuery);
      if (sanitizedSearch) {
        query = query.or(
          `full_name.ilike.%${sanitizedSearch}%,department.ilike.%${sanitizedSearch}%,designation.ilike.%${sanitizedSearch}%`
        );
      }
      const { data } = await query;
      return data as Teacher[];
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    try {
      const publicUrl = await uploadImage(file, {
        folder: "alumni-hub/teachers",
      });
      if (publicUrl) {
        setAvatarPreview(publicUrl);
      } else {
        alert("Image upload failed. Please try again.");
      }
    } catch (err: unknown) {
      console.error(err);
      alert(getErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { ...formData, avatar_url: avatarPreview };
    if (editingTeacher) {
      const { error } = await supabase
        .from("teachers")
        .update(payload)
        .eq("id", editingTeacher.id);
      if (error) {
        alert("Error updating teacher: " + error.message);
      }
    } else {
      const { error } = await supabase.from("teachers").insert([payload]);
      if (error) {
        alert("Error adding teacher: " + error.message);
      }
    }
    queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
    queryClient.invalidateQueries({ queryKey: ["teachers"] });
    setShowModal(false);
    setEditingTeacher(null);
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) {
      alert("Error deleting teacher: " + error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    }
    setDeleting(null);
    setDeleteConfirm(null);
  };

  const toggleActive = async (teacher: Teacher) => {
    const { error } = await supabase
      .from("teachers")
      .update({ is_active: !teacher.is_active })
      .eq("id", teacher.id);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["admin-teachers"] });
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    }
  };

  const openCreate = () => {
    setEditingTeacher(null);
    setFormData(emptyTeacher);
    setAvatarPreview(null);
    setShowModal(true);
  };

  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      full_name: teacher.full_name || "",
      email: teacher.email || "",
      department: teacher.department || "",
      designation: teacher.designation || "",
      phone: teacher.phone || "",
      bio: teacher.bio || "",
      specialization: teacher.specialization || "",
      linkedin_url: teacher.linkedin_url || "",
      website_url: teacher.website_url || "",
    });
    setAvatarPreview(teacher.avatar_url);
    setShowModal(true);
  };

  const totalCount = teachers?.length || 0;
  const activeCount = teachers?.filter((t) => t.is_active).length || 0;

  return (
    <DashboardShell title="Teacher Management">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div>
            <h2 className="text-2xl font-serif font-bold text-foreground mb-1 tracking-tight">
              Faculty Management
            </h2>
            <p className="text-muted text-[14px]">
              Add, edit, and upload portrait pictures for respected faculty members.
            </p>
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            Add Faculty
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-surface border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-canvas border border-border">
                <GraduationCap className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-serif font-bold text-foreground">{totalCount}</p>
                <p className="text-[11px] text-muted">Total Faculty</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 bg-surface border-border rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-canvas border border-border">
                <Users className="w-5 h-5 text-brand" />
              </div>
              <div>
                <p className="text-2xl font-serif font-bold text-foreground">{activeCount}</p>
                <p className="text-[11px] text-muted">Active</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="w-full sm:w-72">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search teachers..."
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {teachers?.map((teacher) => (
              <Card
                key={teacher.id}
                className={`overflow-hidden flex flex-col justify-between rounded-xl bg-surface border-border hover:border-border-hover transition-colors ${
                  !teacher.is_active ? "opacity-60" : ""
                }`}
              >
                {/* Portrait Header */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#121214]">
                  {teacher.avatar_url ? (
                    <Image
                      src={getOptimizedImageUrl(teacher.avatar_url, {
                        width: 500,
                        crop: "fill",
                      })}
                      alt={teacher.full_name}
                      fill
                      className="object-cover object-top"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-canvas text-muted">
                      <GraduationCap className="w-12 h-12 mb-1" />
                      <span className="text-xs">No picture added</span>
                    </div>
                  )}

                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    <Badge variant={teacher.is_active ? "success" : "danger"}>
                      {teacher.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 flex flex-col flex-1 justify-between">
                  <div>
                    <span className="text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">
                      {teacher.department || "Faculty"}
                    </span>
                    <h3 className="text-[17px] font-bold text-[#fafafa] leading-snug line-clamp-1 mt-0.5">
                      {teacher.full_name}
                    </h3>
                    <p className="text-[13px] font-medium text-[#a1a1aa]">
                      {teacher.designation}
                    </p>

                    {teacher.bio && (
                      <p className="text-[12px] text-[#71717a] mt-2 line-clamp-2">
                        {teacher.bio}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5 text-xs text-[#71717a]">
                    {teacher.email && (
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{teacher.email}</span>
                      </div>
                    )}
                    {teacher.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>{teacher.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/5">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleActive(teacher)}
                      title={teacher.is_active ? "Deactivate" : "Activate"}
                    >
                      {teacher.is_active ? (
                        <ToggleRight className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-[#666]" />
                      )}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(teacher)}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      Edit
                    </Button>

                    {deleteConfirm === teacher.id ? (
                      <div className="flex items-center gap-1 ml-auto">
                        <Button
                          variant="danger"
                          size="sm"
                          isLoading={deleting === teacher.id}
                          onClick={() => handleDelete(teacher.id)}
                        >
                          Confirm
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(null)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-[#EF4444] hover:text-[#DC2626]"
                        onClick={() => setDeleteConfirm(teacher.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {teachers?.length === 0 && (
              <div className="col-span-full text-center py-20 rounded-xl bg-surface border border-border">
                <GraduationCap className="w-12 h-12 text-[#555] mx-auto mb-3" />
                <p className="text-white text-[15px] font-semibold">No teachers found</p>
                <p className="text-[#71717a] text-xs mt-1 mb-4">Add your first faculty member</p>
                <Button onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add First Teacher
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* ADD / EDIT TEACHER MODAL WITH PORTRAIT PICTURE UPLOADER */}
      {/* ========================================================================= */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingTeacher(null);
        }}
        title={editingTeacher ? "Edit Faculty Member" : "Add New Faculty Member"}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-5">
          {/* Portrait Photo Uploader */}
          <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-white/[0.03] border border-white/5">
            <div className="relative w-32 h-40 rounded-2xl overflow-hidden bg-[#121214] border border-white/10 flex items-center justify-center flex-shrink-0 group">
              {avatarPreview ? (
                <>
                  <Image
                    src={getOptimizedImageUrl(avatarPreview, { width: 400, crop: "fill" })}
                    alt={formData.full_name || "Faculty Photo"}
                    fill
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity gap-1">
                    <Camera className="w-5 h-5 text-white" />
                    <span className="text-[10px] text-white">Change Photo</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-center p-3 text-[#71717a]">
                  <Camera className="w-6 h-6 mb-1 text-white/40" />
                  <span className="text-[11px]">Add Portrait</span>
                </div>
              )}
              <input
                id="teacher-avatar"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </div>

            <div className="space-y-2 flex-1 text-center sm:text-left">
              <h4 className="text-sm font-semibold text-white">Portrait Picture</h4>
              <p className="text-xs text-[#a1a1aa] leading-relaxed">
                Upload a clear portrait picture of the teacher. It will be compressed to WebP and
                displayed in the Apple-style card.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                <label
                  htmlFor="teacher-avatar"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/15 text-white text-xs font-medium cursor-pointer transition-colors border border-white/10"
                >
                  <Upload className="w-3.5 h-3.5" />
                  {avatarPreview ? "Replace Picture" : "Upload Picture"}
                </label>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => setAvatarPreview(null)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1.5 transition-colors"
                  >
                    Remove
                  </button>
                )}
                {uploading && (
                  <span className="text-xs text-white/70 animate-pulse ml-2">
                    Uploading to Cloudinary...
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="full_name"
              label="Full Name *"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="e.g. Dr. Rafiqul Islam"
            />
            <Input
              id="designation"
              label="Designation *"
              value={formData.designation}
              onChange={handleChange}
              placeholder="e.g. Headmaster / Senior Teacher"
              required
            />
            <Input
              id="department"
              label="Department / Subject"
              value={formData.department}
              onChange={handleChange}
              placeholder="e.g. Mathematics & Science"
            />
            <Input
              id="phone"
              label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              placeholder="017XXXXXXXX"
            />
            <Input
              id="email"
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="teacher@school.edu"
            />
            <Input
              id="specialization"
              label="Specialization / Topics"
              value={formData.specialization}
              onChange={handleChange}
              placeholder="e.g. Higher Math, Physics"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="bio" className="block text-[13px] font-medium text-[#a0a0a0]">
              Biography / Message
            </label>
            <textarea
              id="bio"
              rows={3}
              className="w-full rounded-lg bg-[#141414] border border-white/10 text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-white/30 transition-all resize-none"
              placeholder="Brief introduction, teaching philosophy, or memories..."
              value={formData.bio}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              id="linkedin_url"
              label="LinkedIn URL"
              type="url"
              value={formData.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/..."
            />
            <Input
              id="website_url"
              label="Website URL"
              type="url"
              value={formData.website_url}
              onChange={handleChange}
              placeholder="https://..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setShowModal(false);
                setEditingTeacher(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              <Save className="w-4 h-4 mr-1.5" />
              {editingTeacher ? "Update Faculty" : "Add Faculty"}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
