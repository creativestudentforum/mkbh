import { createServerSupabaseClient } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

function csvValue(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" || profile?.status !== "approved") {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("full_name,email,phone,batch,department,status,role,profession,company,city,country,created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return new NextResponse(error.message, { status: 500 });
  }

  console.info(`Admin ${user.id} exported ${data?.length || 0} users`);

  const rows = [
    ["Full Name", "Email", "Phone", "Batch", "Group", "Status", "Role", "Profession", "Company", "City", "Country", "Created At"],
    ...((data || []).map((row) => [
      row.full_name,
      row.email,
      row.phone,
      row.batch,
      row.department,
      row.status,
      row.role,
      row.profession,
      row.company,
      row.city,
      row.country,
      row.created_at,
    ])),
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(csvValue).join(",")).join("\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="alumni-users-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
