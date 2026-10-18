"use server";

import { approvalEmailHtml, rejectionEmailHtml, sendEmail } from "@/lib/email";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { UserStatus } from "@/lib/types";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function updateUserStatus(
  userId: string,
  status: Extract<UserStatus, "approved" | "rejected">,
  rejectionReason = ""
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin" || adminProfile?.status !== "approved") {
    throw new Error("Forbidden");
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone")
    .eq("id", userId)
    .single();

  if (targetError || !targetProfile) {
    throw new Error(targetError?.message || "User not found");
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      status,
      rejection_reason: status === "rejected" ? rejectionReason.trim() : "",
    })
    .eq("id", userId);

  if (error) throw new Error(error.message);

  if (status === "approved") {
    const clauses = [
      targetProfile.email ? `email.eq.${targetProfile.email}` : "",
      targetProfile.phone ? `phone.eq.${targetProfile.phone}` : "",
    ].filter(Boolean).join(",");

    if (clauses) {
      await supabase.from("alumni_roster").update({ claimed_by: userId }).or(clauses);
    }

    await sendEmail({
      to: targetProfile.email,
      subject: "Your AlumniHub account has been approved",
      html: approvalEmailHtml(targetProfile.full_name),
    });
  } else {
    await sendEmail({
      to: targetProfile.email,
      subject: "Your AlumniHub application update",
      html: rejectionEmailHtml(targetProfile.full_name, rejectionReason.trim()),
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

export async function deleteUserAccount(userId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");
  if (user.id === userId) throw new Error("Admins cannot delete their own account here");

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (adminProfile?.role !== "admin" || adminProfile?.status !== "approved") {
    throw new Error("Forbidden");
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (targetError || !targetProfile) {
    throw new Error(targetError?.message || "User not found");
  }

  if (targetProfile.role === "admin") {
    throw new Error("Admin accounts cannot be deleted from this screen");
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required to delete auth users");
  }

  await supabase.from("alumni_roster").update({ claimed_by: null }).eq("claimed_by", userId);

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await adminSupabase.auth.admin.deleteUser(userId);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/users");
  revalidatePath("/directory");
  revalidatePath("/dashboard");
}
