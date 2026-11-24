import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, PageHeader, StatusBadge } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { formatDate, getCommittees, STATUS_LABELS } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";
import { ReviewForm } from "./review-form";

export const metadata: Metadata = { title: "Application · Admin" };

export default async function AdminApplicationPage({ params }: PageProps<"/admin/applications/[id]">) {
  const { edition } = await requireAdminPage();
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: app }, committees] = await Promise.all([
    supabase
      .from("applications")
      .select(
        "*, application_delegates(*), applicant:profiles!applications_applicant_id_fkey(email), reviewer:profiles!applications_reviewed_by_fkey(email, full_name)",
      )
      .eq("id", id)
      .eq("edition_id", edition.id)
      .maybeSingle(),
    getCommittees(edition.id),
  ]);
  if (!app) notFound();

  const committeeName = new Map(committees.map((c) => [c.id, c.abbreviation]));
  const delegates = [...app.application_delegates].sort((a, b) => a.position - b.position);
  const title = app.kind === "school" ? (app.school_name ?? "School delegation") : app.contact_name;

  return (
    <main>
      <Link href="/admin/applications" className="text-sm text-muted hover:underline">
        ← All applications
      </Link>
      <div className="mt-3">
        <PageHeader
          title={title}
          description={app.kind === "school" ? "School delegation" : "Individual delegate"}
          actions={<StatusBadge status={app.status} label={STATUS_LABELS[app.status]} />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="mb-3 font-semibold">Contact</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Name</dt>
                <dd>{app.contact_name}</dd>
              </div>
              <div>
                <dt className="text-muted">Email</dt>
                <dd className="break-all">
                  {app.applicant?.email ? (
                    <a href={`mailto:${app.applicant.email}`} className="text-brand hover:underline">
                      {app.applicant.email}
                    </a>
                  ) : (
                    "–"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Phone</dt>
                <dd>{app.contact_phone ?? "–"}</dd>
              </div>
              <div>
                <dt className="text-muted">School</dt>
                <dd>
                  {[app.school_name, app.school_city, app.school_country].filter(Boolean).join(", ") || "–"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Submitted</dt>
                <dd>{formatDate(app.submitted_at)}</dd>
              </div>
              <div>
                <dt className="text-muted">Last updated</dt>
                <dd>{formatDate(app.updated_at)}</dd>
              </div>
            </dl>
            {app.motivation && (
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-sm text-muted">Notes from the applicant</p>
                <p className="mt-1 whitespace-pre-line text-sm">{app.motivation}</p>
              </div>
            )}
          </Card>

          <section>
            <h2 className="mb-3 font-semibold">
              Delegates <span className="font-normal text-muted">({delegates.length})</span>
            </h2>
            <ul className="flex flex-col gap-3">
              {delegates.map((d) => (
                <li key={d.id}>
                  <Card>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="font-medium">{d.full_name}</p>
                      <a href={`mailto:${d.email}`} className="break-all text-sm text-brand hover:underline">
                        {d.email}
                      </a>
                    </div>
                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                      <div className="flex gap-2">
                        <dt className="text-muted">Grade:</dt>
                        <dd>{d.grade ?? "–"}</dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted">MUN experience:</dt>
                        <dd>
                          {d.mun_experience} conference{d.mun_experience === 1 ? "" : "s"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted">Committees:</dt>
                        <dd>
                          {d.committee_preferences.length
                            ? d.committee_preferences.map((c) => committeeName.get(c) ?? "(deleted)").join(" › ")
                            : "–"}
                        </dd>
                      </div>
                      <div className="flex gap-2">
                        <dt className="text-muted">Countries:</dt>
                        <dd>{d.country_preferences.length ? d.country_preferences.join(" › ") : "–"}</dd>
                      </div>
                    </dl>
                    {d.notes && <p className="mt-2 text-sm">Needs: {d.notes}</p>}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside>
          <Card className="lg:sticky lg:top-4">
            <h2 className="mb-3 font-semibold">Decision</h2>
            <ReviewForm applicationId={app.id} status={app.status} message={app.decision_message} />
            {app.reviewed_at && (
              <p className="mt-4 text-xs text-muted">
                Last decided {formatDate(app.reviewed_at)}
                {app.reviewer ? ` by ${app.reviewer.full_name ?? app.reviewer.email}` : ""}.
              </p>
            )}
          </Card>
        </aside>
      </div>
    </main>
  );
}
