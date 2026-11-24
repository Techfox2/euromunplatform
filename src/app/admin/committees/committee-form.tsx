"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Textarea } from "@/components/ui";
import type { Committee } from "@/lib/database.types";
import { saveCommittee, type ActionState } from "../actions";

export function CommitteeForm({ committee, nextSortOrder }: { committee?: Committee; nextSortOrder?: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCommittee, {});
  const key = committee?.id ?? "new";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="id" value={committee?.id ?? ""} />
      <div className="grid gap-4 sm:grid-cols-[1fr_8rem_6rem]">
        <Field label="Name" htmlFor={`${key}-name`}>
          <Input id={`${key}-name`} name="name" defaultValue={committee?.name} placeholder="Security Council" required />
        </Field>
        <Field label="Abbreviation" htmlFor={`${key}-abbr`}>
          <Input id={`${key}-abbr`} name="abbreviation" defaultValue={committee?.abbreviation} placeholder="SC" required />
        </Field>
        <Field label="Order" htmlFor={`${key}-order`}>
          <Input
            id={`${key}-order`}
            name="sort_order"
            type="number"
            min={0}
            max={999}
            defaultValue={committee?.sort_order ?? nextSortOrder ?? 0}
          />
        </Field>
      </div>
      <Field label="Topics" htmlFor={`${key}-topics`} hint="One topic per line (up to 5).">
        <Textarea id={`${key}-topics`} name="topics" defaultValue={committee?.topics.join("\n")} rows={3} />
      </Field>
      <Field label="Description (optional)" htmlFor={`${key}-desc`}>
        <Textarea id={`${key}-desc`} name="description" defaultValue={committee?.description ?? ""} rows={3} />
      </Field>
      <Field label="Study guide link (optional)" htmlFor={`${key}-guide`} hint="A link to the PDF, e.g. on Google Drive.">
        <Input
          id={`${key}-guide`}
          name="study_guide_url"
          type="url"
          defaultValue={committee?.study_guide_url ?? ""}
          placeholder="https://"
        />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : committee ? "Save committee" : "Add committee"}
      </Button>
    </form>
  );
}
