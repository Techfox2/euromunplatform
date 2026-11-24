import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, PageHeader, StatusBadge, cn } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { formatDate, STATUS_LABELS } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";
import { Constants, type ApplicationStatus } from "@/lib/database.types";

export const metadata: Metadata = { title: "Applications · Admin" };

function isStatus(v: unknown): v is ApplicationStatus {
  return typeof v === "string" && (Constants.public.Enums.application_status as readonly string[]).includes(v);
}

export default async function AdminApplicationsPage({ searchParams }: PageProps<"/admin/applications">) {
  const { edition } = await requireAdminPage();
  const { status } = await searchParams;
  const filter = isStatus(status) ? status : null;

  const supabase = await createClient();
  let query = supabase
    .from("applications")
    .select("id, kind, status, contact_name, school_name, school_country, submitted_at, application_delegates(count)")
    .eq("edition_id", edition.id)
    .order("submitted_at", { ascending: false });
  if (filter) query = query.eq("status", filter);
  const { data: apps, error } = await query;

  const filters: { label: string; value: ApplicationStatus | null }[] = [
    { label: "All", value: null },
    ...Constants.public.Enums.application_status.map((s) => ({ label: STATUS_LABELS[s], value: s })),
  ];

  return (
    <main>
      <PageHeader
        title="Applications"
        actions={
          <ButtonLink href="/admin/applications/export" variant="secondary" prefetch={false}>
            Export CSV
          </ButtonLink>
        }
      />

      <nav className="-mx-1 mb-4 flex gap-1 overflow-x-auto text-sm" aria-label="Filter by status">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/applications?status=${f.value}` : "/admin/applications"}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1",
              filter === f.value ? "border-brand bg-brand/10 text-brand" : "border-border hover:bg-surface",
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {error && <p className="text-sm text-danger">Couldn&apos;t load applications.</p>}

      {apps && apps.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">No applications here yet.</p>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {apps?.map((a) => {
            const count = a.application_delegates?.[0]?.count ?? 0;
            return (
              <li key={a.id}>
                <Link
                  href={`/admin/applications/${a.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 hover:bg-surface"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {a.kind === "school" ? a.school_name : a.contact_name}
                    </p>
                    <p className="text-sm text-muted">
                      {a.kind === "school" ? `School · ${count} delegate${count === 1 ? "" : "s"} · ${a.contact_name}` : "Individual"}
                      {a.school_country ? ` · ${a.school_country}` : ""} · {formatDate(a.submitted_at)}
                    </p>
                  </div>
                  <StatusBadge status={a.status} label={STATUS_LABELS[a.status]} />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
