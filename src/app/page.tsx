import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";
import {
  formatDate,
  formatDateRange,
  getCommittees,
  getCurrentEdition,
  isRegistrationOpen,
  PHASE_LABELS,
} from "@/lib/edition";

export default async function Home() {
  const edition = await getCurrentEdition();

  if (!edition) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-20">
        <p className="text-sm font-medium uppercase tracking-widest text-brand">EUROMUN</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          The next conference is being prepared.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Details and registration will appear here once they are announced.
        </p>
      </main>
    );
  }

  const committees = await getCommittees(edition.id);
  const dates = formatDateRange(edition.starts_on, edition.ends_on);
  const open = isRegistrationOpen(edition);
  const closes = formatDate(edition.registration_closes_on);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-14 sm:py-20">
      <section>
        <p className="text-sm font-medium uppercase tracking-widest text-brand">
          {PHASE_LABELS[edition.phase]}
        </p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
          {edition.name}
        </h1>
        {edition.tagline && (
          <p className="mt-4 max-w-2xl text-lg text-muted">{edition.tagline}</p>
        )}
        <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm">
          {dates && (
            <div>
              <dt className="text-muted">Dates</dt>
              <dd className="font-medium">{dates}</dd>
            </div>
          )}
          {edition.location && (
            <div>
              <dt className="text-muted">Location</dt>
              <dd className="font-medium">{edition.location}</dd>
            </div>
          )}
          {open && closes && (
            <div>
              <dt className="text-muted">Registration closes</dt>
              <dd className="font-medium">{closes}</dd>
            </div>
          )}
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          {open ? (
            <ButtonLink href="/apply" className="h-11 px-5">
              Apply now
            </ButtonLink>
          ) : (
            <ButtonLink href="/dashboard" className="h-11 px-5">
              Go to dashboard
            </ButtonLink>
          )}
          <ButtonLink href="/committees" variant="secondary" className="h-11 px-5">
            See committees
          </ButtonLink>
        </div>
      </section>

      {edition.description && (
        <section className="mt-14 max-w-3xl">
          <h2 className="text-xl font-semibold">About the conference</h2>
          <p className="mt-3 whitespace-pre-line text-muted">{edition.description}</p>
        </section>
      )}

      {committees.length > 0 && (
        <section className="mt-14">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-xl font-semibold">Committees</h2>
            <Link href="/committees" className="text-sm font-medium text-brand hover:underline">
              All committees →
            </Link>
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {committees.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Card className="h-full">
                  <p className="text-xs font-medium uppercase tracking-wide text-brand">
                    {c.abbreviation}
                  </p>
                  <p className="mt-1 font-medium">{c.name}</p>
                  {c.topics.length > 0 && (
                    <p className="mt-2 line-clamp-2 text-sm text-muted">{c.topics.join(" · ")}</p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
