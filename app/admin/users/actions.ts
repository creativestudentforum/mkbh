"use server";

import { approvalEmailHtml, rejectionEmailHtml, sendEmail } from "@/lib/email";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import type { UserStatus } from "@/lib/types";
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
