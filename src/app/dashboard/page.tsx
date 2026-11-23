import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { AppRole } from "@/lib/database.types";

export const metadata: Metadata = { title: "Dashboard" };

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Secretariat",
  advisor: "Faculty advisor",
  chair: "Chair",
  delegate: "Delegate",
};

export default function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <Suspense fallback={<p className="mt-6 text-muted">Loading…</p>}>
        <DashboardContent />
      </Suspense>
    </main>
  );
}

async function DashboardContent() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/dashboard");

  return (
    <div className="mt-6 flex flex-col gap-6">
      <section className="rounded-lg border border-border bg-surface p-5">
        <p className="text-sm text-muted">Signed in as</p>
        <p className="font-medium">{user.fullName ?? user.email}</p>
        {user.fullName && <p className="text-sm text-muted">{user.email}</p>}
        {user.isSuperadmin && (
          <span className="mt-2 inline-block rounded bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
            Platform admin
          </span>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Your conferences</h2>
        {user.memberships.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-5 text-sm text-muted">
            You don&apos;t have a role in any conference yet. Once you apply or
            the secretariat adds you, it will show up here.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {user.memberships.map((m) => (
              <li
                key={m.editionId}
                className="rounded-lg border border-border bg-surface p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <p className="font-medium">{m.editionName}</p>
                  <span className="text-xs uppercase tracking-wide text-muted">
                    {m.phase.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted">
                  {m.roles.map((r) => ROLE_LABELS[r]).join(" · ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
