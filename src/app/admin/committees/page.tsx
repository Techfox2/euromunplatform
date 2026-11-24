import type { Metadata } from "next";
import { ConfirmSubmit } from "@/components/confirm-submit";
import { Card, PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { getCommittees } from "@/lib/edition";
import { deleteCommittee } from "../actions";
import { CommitteeForm } from "./committee-form";

export const metadata: Metadata = { title: "Committees · Admin" };

export default async function AdminCommitteesPage() {
  const { edition } = await requireAdminPage();
  const committees = await getCommittees(edition.id);
  const nextSortOrder = (committees.at(-1)?.sort_order ?? 0) + 10;

  return (
    <main>
      <PageHeader
        title="Committees"
        description="Applicants pick from these committees. They appear on the public site once the conference leaves setup."
      />

      <ul className="flex flex-col gap-3">
        {committees.map((c) => (
          <li key={c.id}>
            <Card className="p-0">
              <details>
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 p-4">
                  <span>
                    <span className="font-medium">{c.name}</span>{" "}
                    <span className="text-sm text-brand">{c.abbreviation}</span>
                    {c.topics.length > 0 && (
                      <span className="block text-sm text-muted">{c.topics.join(" · ")}</span>
                    )}
                  </span>
                  <span className="text-sm text-muted">Edit ▾</span>
                </summary>
                <div className="border-t border-border p-4">
                  <CommitteeForm committee={c} />
                  <form action={deleteCommittee} className="mt-4 border-t border-border pt-4">
                    <input type="hidden" name="id" value={c.id} />
                    <ConfirmSubmit
                      variant="danger"
                      message={`Delete ${c.name}? Delegates who picked it as a preference keep their other choices.`}
                    >
                      Delete committee
                    </ConfirmSubmit>
                  </form>
                </div>
              </details>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="mt-6">
        <h2 className="mb-4 font-semibold">Add a committee</h2>
        <CommitteeForm key={committees.length} nextSortOrder={nextSortOrder} />
      </Card>
    </main>
  );
}
