"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import type { Edition, EditionPhase } from "@/lib/database.types";
import { updateEdition, type ActionState } from "../actions";

const PHASES: { value: EditionPhase; label: string; hint: string }[] = [
  { value: "setup", label: "Setup", hint: "Hidden from the public." },
  { value: "registration", label: "Registration", hint: "Public, and people can apply." },
  { value: "allocation", label: "Allocation", hint: "Applications closed; countries are being assigned." },
  { value: "preparation", label: "Preparation", hint: "Delegates prepare position papers." },
  { value: "conference", label: "Conference", hint: "The conference is running." },
  { value: "wrap_up", label: "Wrap-up", hint: "After the conference." },
  { value: "archived", label: "Archived", hint: "Read-only archive." },
];

export function SettingsForm({ edition }: { edition: Edition }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateEdition, {});

  return (
    <form action={action} className="flex max-w-2xl flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Conference name" htmlFor="name">
          <Input id="name" name="name" defaultValue={edition.name} required />
        </Field>
        <Field label="Phase" htmlFor="phase" hint={PHASES.map((p) => `${p.label}: ${p.hint}`).join(" ")}>
          <Select id="phase" name="phase" defaultValue={edition.phase}>
            {PHASES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Tagline" htmlFor="tagline" hint="One sentence shown under the name on the home page.">
        <Input id="tagline" name="tagline" defaultValue={edition.tagline ?? ""} maxLength={200} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Starts on" htmlFor="starts_on">
          <Input id="starts_on" name="starts_on" type="date" defaultValue={edition.starts_on ?? ""} />
        </Field>
        <Field label="Ends on" htmlFor="ends_on">
          <Input id="ends_on" name="ends_on" type="date" defaultValue={edition.ends_on ?? ""} />
        </Field>
        <Field label="Registration closes" htmlFor="registration_closes_on" hint="Shown to applicants.">
          <Input
            id="registration_closes_on"
            name="registration_closes_on"
            type="date"
            defaultValue={edition.registration_closes_on ?? ""}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" htmlFor="location">
          <Input id="location" name="location" defaultValue={edition.location ?? ""} maxLength={200} />
        </Field>
        <Field label="Max delegates per school" htmlFor="max_delegates_per_school">
          <Input
            id="max_delegates_per_school"
            name="max_delegates_per_school"
            type="number"
            min={1}
            max={200}
            defaultValue={edition.max_delegates_per_school}
          />
        </Field>
      </div>

      <Field
        label="About the conference"
        htmlFor="description"
        hint="Shown on the home page: fees, venue details, schedule overview, contact…"
      >
        <Textarea id="description" name="description" defaultValue={edition.description ?? ""} rows={8} maxLength={5000} />
      </Field>

      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save settings"}
      </Button>
    </form>
  );
}
