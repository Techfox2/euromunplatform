import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isEditionAdmin } from "@/lib/admin";
import { getCommittees, getCurrentEdition } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";

/** One row per delegate, with their application's details. */
export async function GET() {
  const [user, edition] = await Promise.all([getCurrentUser(), getCurrentEdition()]);
  if (!user || !edition || !isEditionAdmin(user, edition.id)) {
    return new NextResponse("Not authorized", { status: 403 });
  }

  const supabase = await createClient();
  const [{ data: apps, error }, committees] = await Promise.all([
    supabase
      .from("applications")
      .select("*, application_delegates(*), applicant:profiles!applications_applicant_id_fkey(email)")
      .eq("edition_id", edition.id)
      .order("submitted_at"),
    getCommittees(edition.id),
  ]);
  if (error) return new NextResponse("Couldn't load applications", { status: 500 });

  const committee = new Map(committees.map((c) => [c.id, c.abbreviation]));
  const header = [
    "application_id", "status", "kind", "school", "school_city", "school_country",
    "contact_name", "contact_email", "contact_phone", "submitted_at",
    "delegate_position", "delegate_name", "delegate_email", "grade", "mun_experience",
    "committee_1", "committee_2", "committee_3", "country_1", "country_2", "country_3", "needs",
  ];

  const rows: (string | number | null | undefined)[][] = [];
  for (const a of apps ?? []) {
    const delegates = [...a.application_delegates].sort((x, y) => x.position - y.position);
    for (const d of delegates) {
      rows.push([
        a.id, a.status, a.kind, a.school_name, a.school_city, a.school_country,
        a.contact_name, a.applicant?.email, a.contact_phone, a.submitted_at,
        d.position, d.full_name, d.email, d.grade, d.mun_experience,
        ...[0, 1, 2].map((i) => (d.committee_preferences[i] ? committee.get(d.committee_preferences[i]) ?? "" : "")),
        ...[0, 1, 2].map((i) => d.country_preferences[i] ?? ""),
        d.notes,
      ]);
    }
  }

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const filename = `${edition.slug}-applications-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  // Prevent spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
