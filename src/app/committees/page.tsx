import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { getCommittees, getCurrentEdition } from "@/lib/edition";

export const metadata: Metadata = { title: "Committees" };

export default async function CommitteesPage() {
  const edition = await getCurrentEdition();
  const committees = edition ? await getCommittees(edition.id) : [];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10">
      <PageHeader
        title="Committees"
        description={
          edition
            ? `The committees of ${edition.name}. All committees follow BERMUN rules of procedure.`
            : undefined
        }
      />

      {committees.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
          Committees haven&apos;t been announced yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {committees.map((c) => (
            <li key={c.id} id={c.abbreviation.toLowerCase()}>
              <Card>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold">{c.name}</h2>
                  <span className="text-sm font-medium text-brand">{c.abbreviation}</span>
                </div>
                {c.topics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">Topics</p>
                    <ol className="mt-1 list-decimal pl-5 text-sm">
                      {c.topics.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ol>
                  </div>
                )}
                {c.description && (
                  <p className="mt-3 whitespace-pre-line text-sm text-muted">{c.description}</p>
                )}
                {c.study_guide_url && (
                  <a
                    href={c.study_guide_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-brand hover:underline"
                  >
                    Download study guide →
                  </a>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
