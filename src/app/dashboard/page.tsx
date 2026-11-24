import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { withdrawApplication } from "@/app/apply/actions";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { ButtonLink, Card, StatusBadge } from "@/components/ui";
import { isEditionAdmin } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, getCurrentEdition, isRegistrationOpen, PHASE_LABELS, STATUS_LABELS } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Secretariat",
  advisor: "Faculty advisor",
  chair: "Chair",
  delegate: "Delegate",
};

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { saved } = await searchParams;
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      {saved && (
        <p role="status" className="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400">
          Your application has been saved.
        </p>
      )}
      <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  const edition = await getCurrentEdition();
  const supabase = await createClient();
  const { data: application } = edition
    ? await supabase
        .from("applications")
        .select("id, kind, status, school_name, decision_message, submitted_at, updated_at, application_delegates(count)")
        .eq("edition_id", edition.id)
        .eq("applicant_id", user.id)
        .maybeSingle()
    : { data: null };

  const open = isRegistrationOpen(edition);
  const delegateCount = application?.application_delegates?.[0]?.count ?? 0;

  return (
    <div className="mt-6 flex flex-col gap-6">
      <Card>
        <p className="text-sm text-muted">Signed in as</p>
        <p className="font-medium">{user.fullName ?? user.email}</p>
        {user.fullName && <p className="text-sm text-muted">{user.email}</p>}
        {user.isSuperadmin && (
          <span className="mt-2 inline-block rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Platform admin
          </span>
        )}
      </Card>

      {edition && isEditionAdmin(user, edition.id) && (
        <Card className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Secretariat</p>
            <p className="text-sm text-muted">Manage {edition.name}: settings, committees and applications.</p>
          </div>
          <ButtonLink href="/admin">Open admin</ButtonLink>
        </Card>
      )}

      {edition && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Your application for {edition.name}</h2>
          {!application ? (
            <Card className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {open ? "You haven't applied yet." : "Registration isn't open right now."}
              </p>
              {open && <ButtonLink href="/apply">Apply now</ButtonLink>}
            </Card>
          ) : (
            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {application.kind === "school"
                      ? `School delegation${application.school_name ? `: ${application.school_name}` : ""}`
                      : "Individual delegate"}
                  </p>
                  <p className="text-sm text-muted">
                    {application.kind === "school" && `${delegateCount} delegate${delegateCount === 1 ? "" : "s"} · `}
                    Submitted {formatDate(application.submitted_at)}
                  </p>
                </div>
                <StatusBadge status={application.status} label={STATUS_LABELS[application.status]} />
              </div>

              {application.decision_message && (
                <div className="rounded-md border border-border bg-background p-3 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">Message from the secretariat</p>
                  <p className="mt-1 whitespace-pre-line">{application.decision_message}</p>
                </div>
              )}

              {application.status === "submitted" && (
                <p className="text-sm text-muted">
                  The secretariat will review your application. You&apos;ll see the decision here.
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {application.status === "submitted" && open && (
                  <ButtonLink href="/apply" variant="secondary">
                    Edit application
                  </ButtonLink>
                )}
                {["submitted", "waitlisted", "accepted"].includes(application.status) && (
                  <form action={withdrawApplication}>
                    <input type="hidden" name="application_id" value={application.id} />
                    <ConfirmSubmit
                      variant="danger"
                      message="Withdraw your application? You won't be able to apply again for this conference."
                    >
                      Withdraw
                    </ConfirmSubmit>
                  </form>
                )}
              </div>
            </Card>
          )}
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your roles</h2>
        {user.memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
            You don&apos;t have a role in any conference yet. Once your application is accepted or the secretariat adds
            you, it will show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {user.memberships.map((m) => (
              <li key={m.editionId}>
                <Card>
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-medium">{m.editionName}</p>
                    <span className="text-xs uppercase tracking-wide text-muted">{PHASE_LABELS[m.phase]}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted">{m.roles.map((r) => ROLE_LABELS[r]).join(" · ")}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
