import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink, Card, PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { getCommittees, STATUS_LABELS } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";
import { Constants, type ApplicationStatus } from "@/lib/database.types";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminOverviewPage() {
  const { edition } = await requireAdminPage();
  const supabase = await createClient();

  const [committees, { data: apps }] = await Promise.all([
    getCommittees(edition.id),
    supabase
      .from("applications")
      .select("status, kind, application_delegates(count)")
      .eq("edition_id", edition.id),
  ]);

  const byStatus = Object.fromEntries(
    Constants.public.Enums.application_status.map((s) => [s, { apps: 0, delegates: 0 }]),
  ) as Record<ApplicationStatus, { apps: number; delegates: number }>;
  for (const a of apps ?? []) {
    byStatus[a.status].apps += 1;
    byStatus[a.status].delegates += a.application_delegates?.[0]?.count ?? 0;
  }

  const checklist = [
    { done: Boolean(edition.starts_on && edition.location), label: "Set dates and location", href: "/admin/settings" },
    { done: committees.length > 0, label: "Add committees", href: "/admin/committees" },
    { done: edition.phase !== "setup", label: "Open registration (set phase to “Registration”)", href: "/admin/settings" },
  ];

  return (
    <main>
      <PageHeader title="Overview" />

      {edition.phase === "setup" && (
        <Card className="mb-6">
          <p className="font-medium">Getting started</p>
          <p className="mt-1 text-sm text-muted">
            The public site only shows this conference once it leaves the setup phase.
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-sm">
            {checklist.map((c) => (
              <li key={c.label} className="flex items-center gap-2">
                <span aria-hidden className={c.done ? "text-emerald-600" : "text-muted"}>
                  {c.done ? "✓" : "○"}
                </span>
                <Link href={c.href} className={c.done ? "text-muted line-through" : "hover:underline"}>
                  {c.label}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">Applications</h2>
          <ButtonLink href="/admin/applications" variant="secondary">
            Review applications
          </ButtonLink>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Constants.public.Enums.application_status.map((s) => (
            <li key={s}>
              <Link href={`/admin/applications?status=${s}`}>
                <Card className="h-full transition-colors hover:border-brand">
                  <p className="text-xs uppercase tracking-wide text-muted">{STATUS_LABELS[s]}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{byStatus[s].apps}</p>
                  <p className="text-xs text-muted tabular-nums">
                    {byStatus[s].delegates} delegate{byStatus[s].delegates === 1 ? "" : "s"}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold">Committees</h2>
          <ButtonLink href="/admin/committees" variant="secondary">
            Manage committees
          </ButtonLink>
        </div>
        <p className="text-sm text-muted">
          {committees.length === 0
            ? "No committees yet."
            : committees.map((c) => c.abbreviation).join(" · ")}
        </p>
      </section>
    </main>
  );
}
