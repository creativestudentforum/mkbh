"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Button from "@/components/atoms/Button";
import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import SearchBar from "@/components/molecules/SearchBar";
import { createClient } from "@/lib/supabase";
import { compressAndUploadImage, getErrorMessage, sanitizeSearchQuery } from "@/lib/utils";
import type { Teacher } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap, BookOpen, Mail, Phone, Camera, Save, X, Users, ToggleLeft, ToggleRight } from "lucide-react";

const emptyTeacher = { full_name: "", email: "", department: "", designation: "", phone: "", bio: "", specialization: "", linkedin_url: "", website_url: "" };

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
      if (sanitizedSearch) { query = query.or(`full_name.ilike.%${sanitizedSearch}%,department.ilike.%${sanitizedSearch}%,designation.ilike.%${sanitizedSearch}%`); }
      const { data } = await query;
      return data as Teacher[];
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value })); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `teachers/${crypto.randomUUID()}.${fileExt}`;
    try {
      const publicUrl = await compressAndUploadImage(file, "avatars", filePath);
      if (publicUrl) { setAvatarPreview(publicUrl); } else { alert("Image upload failed. Please try again."); }
    } catch (err: unknown) { console.error(err); alert(getErrorMessage(err)); } finally { setUploading(false); }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    const payload = { ...formData, avatar_url: avatarPreview };
    if (editingTeacher) { const { error } = await supabase.from("teachers").update(payload).eq("id", editingTeacher.id); if (error) { alert("Error updating teacher: " + error.message); } }
    else { const { error } = await supabase.from("teachers").insert([payload]); if (error) { alert("Error adding teacher: " + error.message); } }
    queryClient.invalidateQueries({ queryKey: ["admin-teachers"] }); setShowModal(false); setEditingTeacher(null); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    setDeleting(id);
    const { error } = await supabase.from("teachers").delete().eq("id", id);
    if (error) { alert("Error deleting teacher: " + error.message); } else { queryClient.invalidateQueries({ queryKey: ["admin-teachers"] }); }
    setDeleting(null); setDeleteConfirm(null);
  };

  const toggleActive = async (teacher: Teacher) => {
    const { error } = await supabase.from("teachers").update({ is_active: !teacher.is_active }).eq("id", teacher.id);
    if (!error) { queryClient.invalidateQueries({ queryKey: ["admin-teachers"] }); }
  };

  const openCreate = () => { setEditingTeacher(null); setFormData(emptyTeacher); setAvatarPreview(null); setShowModal(true); };
  const openEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setFormData({ full_name: teacher.full_name || "", email: teacher.email || "", department: teacher.department || "", designation: teacher.designation || "", phone: teacher.phone || "", bio: teacher.bio || "", specialization: teacher.specialization || "", linkedin_url: teacher.linkedin_url || "", website_url: teacher.website_url || "" });
    setAvatarPreview(teacher.avatar_url);
    setShowModal(true);
  };

  const activeCount = teachers?.filter((t) => t.is_active).length || 0;
  const totalCount = teachers?.length || 0;

  return (
    <DashboardShell title="Manage Teachers">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center slide-up stagger-1">
          <div>
            <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">Teacher Management</h2>
            <p className="text-[#777] text-[14px]">Add, edit, and manage faculty members</p>
          </div>
          <Button onClick={openCreate}><Plus className="w-4 h-4" />Add Teacher</Button>
        </div>

        <div className="grid grid-cols-2 gap-3 slide-up stagger-2">
          <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2.5 rounded-lg bg-[rgba(255,99,99,0.08)]"><GraduationCap className="w-5 h-5 text-[#FF6363]" /></div><div><p className="text-2xl font-bold text-[#fafafa]">{totalCount}</p><p className="text-[11px] text-[#666]">Total Teachers</p></div></div></Card>
          <Card className="p-4"><div className="flex items-center gap-3"><div className="p-2.5 rounded-lg bg-[rgba(52,211,153,0.08)]"><Users className="w-5 h-5 text-[#34D399]" /></div><div><p className="text-2xl font-bold text-[#fafafa]">{activeCount}</p><p className="text-[11px] text-[#666]">Active</p></div></div></Card>
        </div>

        <div className="w-full sm:w-72 slide-up stagger-3"><SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search teachers..." /></div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20"><div className="w-8 h-8 border-2 border-[#FF6363] border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 slide-up stagger-4">
            {teachers?.map((teacher) => (
              <Card key={teacher.id} className={`p-5 flex flex-col h-full relative ${!teacher.is_active ? "opacity-50" : ""}`}>
                <div className="absolute top-4 right-4 flex items-center gap-2"><Badge variant={teacher.is_active ? "success" : "danger"}>{teacher.is_active ? "Active" : "Inactive"}</Badge></div>
                <div className="flex items-start gap-3 mb-4 pr-20">
                  <Avatar src={teacher.avatar_url} name={teacher.full_name} size="lg" />
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-bold text-[#fafafa] leading-tight truncate">{teacher.full_name}</h3>
                    <p className="text-[13px] font-medium text-[#FF6363] truncate">{teacher.designation}</p>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#666]"><BookOpen className="w-3 h-3" /><span className="truncate">{teacher.department}</span></div>
                  </div>
                </div>
                {teacher.bio && (<p className="text-[13px] text-[#888] mb-3 line-clamp-2 flex-grow">{teacher.bio}</p>)}
                {teacher.specialization && (
                  <div className="mb-4"><div className="flex flex-wrap gap-1.5">
                    {teacher.specialization.split(",").slice(0, 3).map((spec, i) => (<span key={i} className="px-2 py-0.5 rounded-md bg-[rgba(255,255,255,0.04)] text-[11px] text-[#a0a0a0] border border-[rgba(255,255,255,0.06)]">{spec.trim()}</span>))}
                  </div></div>
                )}
                <div className="pt-3 border-t border-[rgba(255,255,255,0.06)] mt-auto space-y-1.5">
                  {teacher.email && (<div className="flex items-center gap-2 text-[11px] text-[#666]"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{teacher.email}</span></div>)}
                  {teacher.phone && (<div className="flex items-center gap-2 text-[11px] text-[#666]"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><span>{teacher.phone}</span></div>)}
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[rgba(255,255,255,0.06)]">
                  <Button variant="ghost" size="sm" onClick={() => toggleActive(teacher)} title={teacher.is_active ? "Deactivate" : "Activate"}>
                    {teacher.is_active ? (<ToggleRight className="w-4 h-4 text-[#34D399]" />) : (<ToggleLeft className="w-4 h-4 text-[#666]" />)}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(teacher)}><Pencil className="w-4 h-4" />Edit</Button>
                  {deleteConfirm === teacher.id ? (
                    <div className="flex items-center gap-1 ml-auto">
                      <Button variant="danger" size="sm" isLoading={deleting === teacher.id} onClick={() => handleDelete(teacher.id)}>Confirm</Button>
                      <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}><X className="w-4 h-4" /></Button>
                    </div>
                  ) : (<Button variant="ghost" size="sm" className="ml-auto text-[#EF4444] hover:text-[#DC2626]" onClick={() => setDeleteConfirm(teacher.id)}><Trash2 className="w-4 h-4" /></Button>)}
                </div>
              </Card>
            ))}
            {teachers?.length === 0 && (
              <div className="col-span-full text-center py-20">
                <div className="w-16 h-16 rounded-xl bg-[rgba(255,255,255,0.03)] flex items-center justify-center mx-auto mb-4"><GraduationCap className="w-8 h-8 text-[#444]" /></div>
                <p className="text-[#666] text-[13px] mb-4">No teachers found</p>
                <Button onClick={openCreate}><Plus className="w-4 h-4" />Add First Teacher</Button>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setEditingTeacher(null); }} title={editingTeacher ? "Edit Teacher" : "Add New Teacher"} size="lg">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex justify-center">
            <div className="relative group">
              <Avatar src={avatarPreview} name={formData.full_name || "T"} size="xl" className="w-24 h-24" />
              <label htmlFor="teacher-avatar" className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                {uploading ? (<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<><Camera className="w-5 h-5 text-white mb-1" /><span className="text-[11px] text-white">Photo</span></>)}
              </label>
              <input id="teacher-avatar" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="full_name" label="Full Name *" value={formData.full_name} onChange={handleChange} required placeholder="Dr. John Doe" />
            <Input id="email" label="Email" type="email" value={formData.email} onChange={handleChange} placeholder="john@university.edu" />
            <Input id="designation" label="Designation" value={formData.designation} onChange={handleChange} placeholder="Professor" />
            <Input id="department" label="Department" value={formData.department} onChange={handleChange} placeholder="Computer Science" />
            <Input id="phone" label="Phone" value={formData.phone} onChange={handleChange} placeholder="+880 1234567890" />
            <Input id="specialization" label="Specialization" value={formData.specialization} onChange={handleChange} placeholder="AI, Machine Learning, Data Science" />
          </div>
          <div className="space-y-2">
            <label htmlFor="bio" className="block text-[13px] font-medium text-[#a0a0a0]">Bio</label>
            <textarea id="bio" rows={3} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" placeholder="Brief bio about the teacher..." value={formData.bio} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input id="linkedin_url" label="LinkedIn URL" type="url" value={formData.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            <Input id="website_url" label="Website" type="url" value={formData.website_url} onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]">
            <Button variant="secondary" type="button" onClick={() => { setShowModal(false); setEditingTeacher(null); }}>Cancel</Button>
            <Button type="submit" isLoading={saving}><Save className="w-4 h-4" />{editingTeacher ? "Update Teacher" : "Add Teacher"}</Button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
