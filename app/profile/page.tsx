"use client";

import DashboardShell from "@/components/organisms/DashboardShell";
import Card from "@/components/atoms/Card";
import Input from "@/components/atoms/Input";
import Button from "@/components/atoms/Button";
import Avatar from "@/components/atoms/Avatar";
import { useAuth } from "@/lib/auth-context";
import { createClient } from "@/lib/supabase";
import type { Batch, Profile } from "@/lib/types";
import { compressAndUploadImage, getErrorMessage } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Camera, Save } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

type ProfileFormData = {
  full_name: string;
  bio: string;
  phone: string;
  batch: string;
  department: string;
  student_id: string;
  linkedin_url: string;
  facebook_url: string;
  twitter_url: string;
  website_url: string;
  blood_group: string;
  is_blood_donor: boolean;
  last_donation_date: string;
  profession: string;
  company: string;
  city: string;
  country: string;
  date_of_birth: string;
  show_phone: boolean;
  show_birthday: boolean;
  show_email: boolean;
  show_bio: boolean;
  show_professional_info: boolean;
  show_location: boolean;
  show_social_links: boolean;
};

function getProfileFormData(profile: Profile): ProfileFormData {
  return {
    full_name: profile.full_name || "", bio: profile.bio || "",
    phone: profile.phone || "", batch: profile.batch || "",
    department: profile.department || "", student_id: profile.student_id || "",
    linkedin_url: profile.linkedin_url || "",
    facebook_url: profile.facebook_url || "", twitter_url: profile.twitter_url || "",
    website_url: profile.website_url || "",
    blood_group: profile.blood_group || "", is_blood_donor: profile.is_blood_donor || false,
    last_donation_date: profile.last_donation_date || "", profession: profile.profession || "",
    company: profile.company || "", city: profile.city || "", country: profile.country || "Bangladesh",
    date_of_birth: profile.date_of_birth || "", show_phone: profile.show_phone || false,
    show_birthday: profile.show_birthday || false,
    show_email: profile.show_email || false, show_bio: profile.show_bio || false,
    show_professional_info: profile.show_professional_info || false,
    show_location: profile.show_location || false, show_social_links: profile.show_social_links || false,
  };
}

export default function ProfilePage() {
  const { profile, user, loading, refreshProfile } = useAuth();

  if (loading) {
    return (
      <DashboardShell title="My Profile">
        <Card className="max-w-4xl mx-auto p-8 text-center">
          <p className="text-[13px] text-[#777]">Loading profile...</p>
        </Card>
      </DashboardShell>
    );
  }

  if (!profile || !user) {
    return (
      <DashboardShell title="My Profile">
        <Card className="max-w-4xl mx-auto p-8 text-center">
          <h2 className="text-[18px] font-semibold text-[#fafafa] mb-2">Profile not found</h2>
          <p className="text-[13px] text-[#777]">Your account is signed in, but no profile row was loaded.</p>
        </Card>
      </DashboardShell>
    );
  }

  return (
    <ProfileEditor
      key={`${profile.id}-${profile.updated_at}`}
      profile={profile}
      userId={user.id}
      refreshProfile={refreshProfile}
    />
  );
}

function ProfileEditor({
  profile,
  userId,
  refreshProfile,
}: {
  profile: Profile;
  userId: string;
  refreshProfile: () => Promise<Profile | null>;
}) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();
  const [formData, setFormData] = useState(() => getProfileFormData(profile));

  const { data: batches } = useQuery({
    queryKey: ["profile-batches"],
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("year").order("year", { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Pick<Batch, "year">[];
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target instanceof HTMLInputElement && e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.id]: value }));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPhone = formData.phone.trim();

    if (normalizedPhone && !/^01[3-9]\d{8}$/.test(normalizedPhone)) {
      alert("Phone number must be a valid Bangladesh number, for example 01712345678.");
      return;
    }

    if (formData.is_blood_donor && (!formData.blood_group || !normalizedPhone)) {
      alert("Blood donor consent requires both blood group and phone number.");
      return;
    }

    setLoading(true);
    const payload = {
      ...formData,
      phone: normalizedPhone,
      blood_group: formData.blood_group || null,
      last_donation_date: formData.last_donation_date || null,
      date_of_birth: formData.date_of_birth || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
    if (error) { alert("Error updating profile: " + error.message); }
    else { await refreshProfile(); alert("Profile updated successfully!"); }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/${crypto.randomUUID()}.${fileExt}`;
      const publicUrl = await compressAndUploadImage(file, 'avatars', filePath);
      if (publicUrl) {
        const { error: updateError } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", userId);
        if (updateError) { console.error("Supabase Update Error:", updateError); throw new Error(updateError.message || "Failed to update profile"); }
        await refreshProfile();
      } else { throw new Error("Image upload failed, returned null URL."); }
    } catch (error: unknown) { console.error("Upload Error:", error); alert(getErrorMessage(error));
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
                  <Input id="date_of_birth" label="Date of Birth" type="date" value={formData.date_of_birth} onChange={handleChange} />
                  <div className="space-y-2">
                    <label htmlFor="blood_group" className="block text-[13px] font-medium text-[#a0a0a0]">Blood Group</label>
                    <select id="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all hover:border-[rgba(255,255,255,0.14)]">
                      <option value="">Select blood group</option>
                      {BLOOD_GROUPS.map((group) => <option key={group} value={group}>{group}</option>)}
                    </select>
                  </div>
                  <Input id="last_donation_date" label="Last Donation Date" type="date" value={formData.last_donation_date} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                    <input id="show_email" type="checkbox" checked={formData.show_email} onChange={handleChange} className="accent-[#FF6363]" />
                    Show email on public QR page
                  </label>
                  <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                    <input id="is_blood_donor" type="checkbox" checked={formData.is_blood_donor} onChange={handleChange} className="accent-[#FF6363]" />
                    <span>
                      Available as blood donor
                      <span className="block text-[11px] text-[#555]">My phone number will be visible to members in Blood Finder.</span>
                    </span>
                  </label>
                  <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                    <input id="show_phone" type="checkbox" checked={formData.show_phone} onChange={handleChange} className="accent-[#FF6363]" />
                    Show phone in directory
                  </label>
                  <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                    <input id="show_birthday" type="checkbox" checked={formData.show_birthday} onChange={handleChange} className="accent-[#FF6363]" />
                    Show birthday on public QR page
                  </label>
                </div>
                <div className="space-y-2">
                  <label htmlFor="bio" className="block text-[13px] font-medium text-[#a0a0a0]">Bio</label>
                  <textarea id="bio" rows={3} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] placeholder-[#444] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all duration-200 hover:border-[rgba(255,255,255,0.14)]" placeholder="Tell us a little about yourself..." value={formData.bio} onChange={handleChange} />
                  <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                    <input id="show_bio" type="checkbox" checked={formData.show_bio} onChange={handleChange} className="accent-[#FF6363]" />
                    Show bio on public QR page
                  </label>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Academic Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="batch" className="block text-[13px] font-medium text-[#a0a0a0]">Batch</label>
                    <select id="batch" value={formData.batch} onChange={handleChange} className="w-full rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] text-[#fafafa] px-3.5 py-2.5 text-[13px] focus:outline-none focus:border-[rgba(255,99,99,0.5)] focus:ring-1 focus:ring-[rgba(255,99,99,0.2)] transition-all hover:border-[rgba(255,255,255,0.14)]">
                      <option value="">Select batch</option>
                      {formData.batch && !batches?.some((batch) => batch.year === formData.batch) && <option value={formData.batch}>{formData.batch}</option>}
                      {batches?.map((batch) => <option key={batch.year} value={batch.year}>{batch.year}</option>)}
                    </select>
                  </div>
                  <Input id="department" label="Group" value={formData.department} onChange={handleChange} placeholder="Science / Commerce / Arts" />
                  <Input id="student_id" label="Student ID" value={formData.student_id} onChange={handleChange} />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Professional Information</h3>
                <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                  <input id="show_professional_info" type="checkbox" checked={formData.show_professional_info} onChange={handleChange} className="accent-[#FF6363]" />
                  Show profession and company on public QR page
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input id="profession" label="Profession" value={formData.profession} onChange={handleChange} placeholder="Software Engineer" />
                  <Input id="company" label="Company" value={formData.company} onChange={handleChange} />
                  <Input id="city" label="City" value={formData.city} onChange={handleChange} />
                  <Input id="country" label="Country" value={formData.country} onChange={handleChange} />
                </div>
                <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                  <input id="show_location" type="checkbox" checked={formData.show_location} onChange={handleChange} className="accent-[#FF6363]" />
                  Show city and country on public QR page
                </label>
              </div>

              <div className="space-y-4">
                <h3 className="text-[15px] font-semibold text-[#fafafa] border-b border-[rgba(255,255,255,0.06)] pb-2">Social Links</h3>
                <label className="flex items-center gap-2 rounded-lg bg-[#141414] border border-[rgba(255,255,255,0.08)] px-3.5 py-2.5 text-[13px] text-[#a0a0a0]">
                  <input id="show_social_links" type="checkbox" checked={formData.show_social_links} onChange={handleChange} className="accent-[#FF6363]" />
                  Show social links on public QR page
                </label>
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
