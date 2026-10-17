"use client";

import Avatar from "@/components/atoms/Avatar";
import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Modal from "@/components/atoms/Modal";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { Memorial } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit3, Flower2, Plus, Save, Trash2 } from "lucide-react";
import { useState } from "react";

export default function AdminMemorialPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Memorial | null>(null);
  const [fullName, setFullName] = useState("");
  const [batch, setBatch] = useState("");
  const [dateOfDeath, setDateOfDeath] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: memorials, isLoading } = useQuery({
    queryKey: ["admin-memorials"],
    queryFn: async () => {
      const { data, error } = await supabase.from("memorials").select("*").order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Memorial[];
    },
  });

  const resetForm = () => {
    setEditing(null);
    setFullName("");
    setBatch("");
    setDateOfDeath("");
    setPhotoUrl("");
    setBio("");
  };

  const openEdit = (person: Memorial) => {
    setEditing(person);
    setFullName(person.full_name);
    setBatch(person.batch || "");
    setDateOfDeath(person.date_of_death || "");
    setPhotoUrl(person.photo_url || "");
    setBio(person.bio || "");
    setShowModal(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const payload = { full_name: fullName.trim(), batch: batch.trim(), date_of_death: dateOfDeath || null, photo_url: photoUrl.trim() || null, bio: bio.trim() };
    const { error } = editing
      ? await supabase.from("memorials").update(payload).eq("id", editing.id)
      : await supabase.from("memorials").insert([payload]);

    if (error) alert("Error saving memorial: " + error.message);
    else {
      await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-memorials"] }), queryClient.invalidateQueries({ queryKey: ["memorials"] })]);
      setShowModal(false);
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (person: Memorial) => {
    if (!confirm(`Delete memorial for ${person.full_name}?`)) return;
    const { error } = await supabase.from("memorials").delete().eq("id", person.id);
    if (error) alert("Error deleting memorial: " + error.message);
    else await Promise.all([queryClient.invalidateQueries({ queryKey: ["admin-memorials"] }), queryClient.invalidateQueries({ queryKey: ["memorials"] })]);
  };

  return (
    <DashboardShell title="Manage Memorials">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div><div className="flex items-center gap-2 mb-1"><h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Manage Memorials</h2><Flower2 className="w-5 h-5 text-[#FBBF24]" /></div><p className="text-[#777] text-[14px]">Add respectful memorial entries after family consent.</p></div>
          <Button onClick={() => { resetForm(); setShowModal(true); }}><Plus className="w-4 h-4" />Add Memorial</Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton h-24 rounded-xl" />)}</div>
        ) : memorials && memorials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 slide-up stagger-2">
            {memorials.map((person) => (
              <Card key={person.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0"><Avatar src={person.photo_url} name={person.full_name} size="lg" /><div><h3 className="text-[15px] font-bold text-[#fafafa]">{person.full_name}</h3><div className="flex gap-2 mt-2 flex-wrap">{person.batch && <Badge>Batch {person.batch}</Badge>}{person.date_of_death && <Badge variant="warning">{formatDate(person.date_of_death)}</Badge>}</div></div></div>
                  <div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(person)}><Edit3 className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-[#EF4444]" onClick={() => handleDelete(person)}><Trash2 className="w-4 h-4" /></Button></div>
                </div>
                {person.bio && <p className="text-[12px] text-[#777] line-clamp-2 mt-4">{person.bio}</p>}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center"><Flower2 className="w-8 h-8 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666] mb-4">No memorials yet.</p><Button onClick={() => { resetForm(); setShowModal(true); }}><Plus className="w-4 h-4" />Add First Memorial</Button></Card>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? "Edit Memorial" : "Add Memorial"} size="lg">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Input label="Full Name" value={fullName} onChange={(event) => setFullName(event.target.value)} required /><Input label="Batch" value={batch} onChange={(event) => setBatch(event.target.value)} /><Input label="Date of Death" type="date" value={dateOfDeath} onChange={(event) => setDateOfDeath(event.target.value)} /><Input label="Photo URL" type="url" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} /></div>
          <div className="space-y-2"><label htmlFor="memorial-bio" className="block text-[13px] font-medium text-[#a0a0a0]">Bio</label><textarea id="memorial-bio" rows={4} value={bio} onChange={(event) => setBio(event.target.value)} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)]" /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[rgba(255,255,255,0.06)]"><Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button type="submit" isLoading={saving}><Save className="w-4 h-4" />Save</Button></div>
        </form>
      </Modal>
    </DashboardShell>
  );
}
