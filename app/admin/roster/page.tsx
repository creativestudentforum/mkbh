"use client";

import Badge from "@/components/atoms/Badge";
import Button from "@/components/atoms/Button";
import Card from "@/components/atoms/Card";
import DashboardShell from "@/components/organisms/DashboardShell";
import { createClient } from "@/lib/supabase";
import type { AlumniRosterEntry } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileUp, ListChecks, Upload, Users, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

type RosterInput = Pick<AlumniRosterEntry, "full_name" | "batch" | "department" | "phone" | "email">;
type PreviewRow = RosterInput & { rowNumber: number; error?: string };

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("880")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  return email || null;
}

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function parseRosterCsv(text: string): PreviewRow[] {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]).map((header) => header.toLowerCase().trim());
  const indexOf = (name: string) => headers.indexOf(name);

  return lines.slice(1).map((line, index) => {
    const cells = parseCsvLine(line);
    const row: PreviewRow = {
      rowNumber: index + 2,
      full_name: cells[indexOf("full_name")]?.trim() || "",
      batch: cells[indexOf("batch")]?.trim() || "",
      department: cells[indexOf("department")]?.trim() || "",
      phone: normalizePhone(cells[indexOf("phone")] || ""),
      email: normalizeEmail(cells[indexOf("email")] || ""),
    };

    if (!row.full_name) row.error = "Missing full_name";
    else if (!row.batch) row.error = "Missing batch";
    else if (row.phone && !/^01[3-9]\d{8}$/.test(row.phone)) row.error = "Invalid BD phone";
    else if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) row.error = "Invalid email";

    return row;
  });
}

export default function AdminRosterPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { data: roster, isLoading } = useQuery({
    queryKey: ["alumni-roster"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alumni_roster")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw new Error(error.message);
      return (data || []) as AlumniRosterEntry[];
    },
  });

  const validRows = useMemo(() => previewRows.filter((row) => !row.error), [previewRows]);
  const invalidRows = previewRows.length - validRows.length;

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setResult(null);
    if (!file) return;
    const text = await file.text();
    setPreviewRows(parseRosterCsv(text));
  };

  const importRows = async () => {
    setImporting(true);
    let added = 0;
    let skipped = 0;

    for (const row of validRows) {
      const { full_name, batch, department, phone, email } = row;
      const { error } = await supabase.from("alumni_roster").insert([{ full_name, batch, department, phone, email }]);
      if (error) {
        skipped += 1;
      } else {
        added += 1;
      }
    }

    setResult(`${added} added, ${skipped + invalidRows} skipped`);
    setPreviewRows([]);
    await queryClient.invalidateQueries({ queryKey: ["alumni-roster"] });
    await queryClient.invalidateQueries({ queryKey: ["admin-roster-matches"] });
    setImporting(false);
  };

  return (
    <DashboardShell title="Alumni Roster">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4 slide-up stagger-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[22px] font-bold text-[#fafafa] tracking-tight">Alumni Roster</h2>
              <ListChecks className="w-5 h-5 text-[#FF6363]" />
            </div>
            <p className="text-[#777] text-[14px]">Import old alumni lists and use them to verify pending signups.</p>
          </div>
          <label className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-medium bg-[#FF6363] text-white hover:bg-[#FF4F4F] cursor-pointer transition-all">
            <FileUp className="w-4 h-4" /> Upload CSV
            <input type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          </label>
        </div>

        <Card className="p-5 slide-up stagger-2">
          <h3 className="text-[14px] font-semibold text-[#fafafa] mb-2">CSV format</h3>
          <p className="text-[13px] text-[#777] leading-relaxed">Use UTF-8 CSV with headers: <span className="text-[#fafafa]">full_name,batch,department,phone,email</span>. Phone numbers are normalized to local BD format.</p>
        </Card>

        {previewRows.length > 0 && (
          <Card className="p-0 overflow-hidden slide-up stagger-3">
            <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h3 className="text-[14px] font-semibold text-[#fafafa]">Preview</h3>
                <p className="text-[12px] text-[#777]">{validRows.length} valid, {invalidRows} invalid</p>
              </div>
              <Button onClick={importRows} isLoading={importing} disabled={validRows.length === 0}><Upload className="w-4 h-4" />Import Valid Rows</Button>
            </div>
            <RosterTable rows={previewRows.slice(0, 50)} />
          </Card>
        )}

        {result && <Card className="p-4"><p className="text-[13px] text-[#34D399]">{result}</p></Card>}

        <Card className="p-0 overflow-hidden slide-up stagger-4">
          <div className="p-4 border-b border-[rgba(255,255,255,0.06)] flex items-center justify-between gap-3">
            <h3 className="text-[14px] font-semibold text-[#fafafa]">Recent roster entries</h3>
            <Badge variant="info">{roster?.length || 0} shown</Badge>
          </div>
          {isLoading ? (
            <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="skeleton h-10 rounded-lg" />)}</div>
          ) : roster && roster.length > 0 ? (
            <RosterTable rows={roster.map((entry, index) => ({ ...entry, rowNumber: index + 1 }))} />
          ) : (
            <div className="p-12 text-center"><Users className="w-8 h-8 text-[#444] mx-auto mb-3" /><p className="text-[13px] text-[#666]">No roster entries imported yet.</p></div>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}

function RosterTable({ rows }: { rows: PreviewRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-[rgba(255,255,255,0.03)] border-b border-[rgba(255,255,255,0.06)]">
          <tr className="text-[11px] text-[#555] uppercase tracking-wider">
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Batch</th>
            <th className="px-4 py-3 font-semibold">Group</th>
            <th className="px-4 py-3 font-semibold">Phone</th>
            <th className="px-4 py-3 font-semibold">Email</th>
            <th className="px-4 py-3 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[rgba(255,255,255,0.06)]">
          {rows.map((row) => (
            <tr key={`${row.rowNumber}-${row.full_name}-${row.phone || row.email || "empty"}`} className="text-[13px] text-[#a0a0a0]">
              <td className="px-4 py-3 text-[#fafafa] font-medium">{row.full_name || "N/A"}</td>
              <td className="px-4 py-3">{row.batch || "N/A"}</td>
              <td className="px-4 py-3">{row.department || "N/A"}</td>
              <td className="px-4 py-3">{row.phone || "N/A"}</td>
              <td className="px-4 py-3">{row.email || "N/A"}</td>
              <td className="px-4 py-3">{row.error ? <Badge variant="danger"><XCircle className="w-3 h-3 mr-1" />{row.error}</Badge> : <Badge variant="success">Valid</Badge>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
