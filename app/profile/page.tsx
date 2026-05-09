"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Avatar from "@/components/atoms/Avatar";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import { compressAndUploadImage } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Camera, Save } from "lucide-react";

export default function ProfilePage() {
  const { profile, user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  const [formData, setFormData] = useState({
    full_name: "", bio: "", phone: "", batch: "", department: "",
    student_id: "", current_company: "", job_title: "", location: "",
    linkedin_url: "", facebook_url: "", twitter_url: "", website_url: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "", bio: profile.bio || "",
        phone: profile.phone || "", batch: profile.batch || "",
        department: profile.department || "", student_id: profile.student_id || "",
        current_company: profile.current_company || "", job_title: profile.job_title || "",
        location: profile.location || "", linkedin_url: profile.linkedin_url || "",
        facebook_url: profile.facebook_url || "", twitter_url: profile.twitter_url || "",
        website_url: profile.website_url || "",
      });
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("profiles").update(formData).eq("id", user.id);
    if (error) { alert("Error updating profile: " + error.message); }
    else { await refreshProfile(); alert("Profile updated successfully!"); }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0 || !user) return;
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Math.random()}.${fileExt}`;
      const publicUrl = await compressAndUploadImage(file, 'avatars', filePath);
      if (publicUrl) {
        const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
        if (updateError) { console.error("Supabase Update Error:", updateError); throw new Error(updateError.message || "Failed to update profile"); }
        await refreshProfile();
      } else { throw new Error("Image upload failed, returned null URL."); }
    } catch (error: any) { console.error("Upload Error:", error); alert(error?.message || "Error uploading image");
    } finally { setUploading(false); }
  };

  return (
    <DashboardShell title="My Profile">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="slide-up stagger-1">
          <h2 className="text-[22px] font-bold text-[#fafafa] mb-1 tracking-tight">Edit Profile</h2>
          <p className="text-[#777] text-[14px]">Update your personal and professional information</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-up stagger-2">
          <Card className="p-6 md:col-span-1 h-fit flex flex-col items-center text-center">
            <div className="relative group mb-4">
              <Avatar src={profile?.avatar_url} name={profile?.full_name || "User"} size="xl" className="w-32 h-32" />
              <label htmlFor="avatar-upload" className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                {uploading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <><Camera className="w-6 h-6 text-white mb-1" /><span className="text-xs text-white font-medium">Change</span></>
                )}
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
            </div>
            <h3 className="text-[16px] font-bold text-[#fafafa]">{profile?.full_name}</h3>
            <p className="text-[13px] text-[#777] mb-4">{profile?.email}</p>
            <div className="w-full text-left bg-[rgba(255,255,255,0.03)] rounded-lg p-4 border border-[rgba(255,255,255,0.06)]">
              <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold mb-2">Account Status</p>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${profile?.status === 'approved' ? 'bg-[#34D399]' : 'bg-[#FBBF24]'}`} />
                <span className="text-[13px] font-medium capitalize text-[#a0a0a0]">{profile?.status}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 md:col-span-2">
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Basic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="full_name" label="Full Name" value={formData.full_name} onChange={handleChange} required />
                  <Input id="phone" label="Phone Number" value={formData.phone} onChange={handleChange} />
                </div>
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-[13px] font-medium text-[#a0a0a0]">Bio</label>
                  <textarea id="bio" rows={3} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" placeholder="Tell us a little about yourself..." value={formData.bio} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="batch" label="Batch" value={formData.batch} onChange={handleChange} placeholder="e.g. 2024" />
                  <Input id="department" label="Department" value={formData.department} onChange={handleChange} placeholder="Computer Science" />
                  <Input id="student_id" label="Student ID" value={formData.student_id} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Professional Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="current_company" label="Current Company" value={formData.current_company} onChange={handleChange} />
                  <Input id="job_title" label="Job Title" value={formData.job_title} onChange={handleChange} />
                  <Input id="location" label="Location" value={formData.location} onChange={handleChange} placeholder="City, Country" />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Social Links</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="linkedin_url" label="LinkedIn URL" type="url" value={formData.linkedin_url} onChange={handleChange} />
                  <Input id="facebook_url" label="Facebook URL" type="url" value={formData.facebook_url} onChange={handleChange} />
                  <Input id="twitter_url" label="Twitter URL" type="url" value={formData.twitter_url} onChange={handleChange} />
                  <Input id="website_url" label="Personal Website" type="url" value={formData.website_url} onChange={handleChange} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[rgba(255,255,255,0.06)]">
                <Button type="submit" isLoading={loading} size="lg"><Save className="w-4 h-4 mr-2" />Save Changes</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
