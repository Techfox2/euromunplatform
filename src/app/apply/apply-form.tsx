"use client";

import { useActionState, useState } from "react";
import { Button, Card, Field, FormMessage, Input, Select, Textarea, cn } from "@/components/ui";
import { saveApplication } from "./actions";
import type { ApplicationInput, ApplyState, DelegateInput } from "./schema";

type CommitteeOption = { id: string; name: string; abbreviation: string };

const PREF_SLOTS = [0, 1, 2] as const;

function emptyDelegate(defaults?: Partial<DelegateInput>): DelegateInput {
  return {
    full_name: "",
    email: "",
    grade: "",
    mun_experience: 0,
    committee_preferences: [],
    country_preferences: [],
    notes: "",
    ...defaults,
  };
}

export function ApplyForm({
  committees,
  initial,
  maxDelegates,
  userEmail,
  isEditing,
}: {
  committees: CommitteeOption[];
  initial: ApplicationInput | null;
  maxDelegates: number;
  userEmail: string;
  isEditing: boolean;
}) {
  const [state, formAction, pending] = useActionState<ApplyState, FormData>(saveApplication, {});
  const [form, setForm] = useState<ApplicationInput>(
    initial ?? {
      kind: "school",
      contact_name: "",
      contact_phone: "",
      school_name: "",
      school_city: "",
      school_country: "",
      motivation: "",
      delegates: [emptyDelegate()],
    },
  );

  const errors = state.fieldErrors ?? {};
  const isSchool = form.kind === "school";

  const set = <K extends keyof ApplicationInput>(key: K, value: ApplicationInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setDelegate = (i: number, patch: Partial<DelegateInput>) =>
    setForm((f) => ({
      ...f,
      delegates: f.delegates.map((d, j) => (j === i ? { ...d, ...patch } : d)),
    }));

  const setKind = (kind: ApplicationInput["kind"]) =>
    setForm((f) => ({
      ...f,
      kind,
      // An individual applies for themselves: keep only the first delegate
      // and prefill their email.
      delegates:
        kind === "individual"
          ? [{ ...(f.delegates[0] ?? emptyDelegate()), email: f.delegates[0]?.email || userEmail }]
          : f.delegates,
    }));

  const setPref = (i: number, field: "committee_preferences" | "country_preferences", slot: number, value: string) => {
    const current = [...(form.delegates[i][field] ?? [])];
    while (current.length < 3) current.push("");
    current[slot] = value;
    // Store without trailing empties; the server drops blanks.
    const trimmed = current.slice(0, 3);
    while (trimmed.length && !trimmed[trimmed.length - 1]) trimmed.pop();
    setDelegate(i, { [field]: trimmed });
  };

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <input type="hidden" name="payload" value={JSON.stringify(form)} />

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-2 text-lg font-semibold">Who is applying?</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["school", "School delegation", "I'm a faculty advisor registering students from my school."],
              ["individual", "Individual delegate", "I'm a student applying for myself."],
            ] as const
          ).map(([value, title, text]) => (
            <label
              key={value}
              className={cn(
                "cursor-pointer rounded-lg border p-4 transition-colors",
                form.kind === value ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-border hover:bg-surface",
              )}
            >
              <input
                type="radio"
                name="kind_choice"
                value={value}
                checked={form.kind === value}
                onChange={() => setKind(value)}
                className="sr-only"
              />
              <span className="font-medium">{title}</span>
              <span className="mt-1 block text-sm text-muted">{text}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">{isSchool ? "Advisor and school" : "Contact details"}</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={isSchool ? "Your full name (advisor)" : "Your full name"} htmlFor="contact_name" error={errors.contact_name}>
            <Input
              id="contact_name"
              value={form.contact_name}
              onChange={(e) => set("contact_name", e.target.value)}
              autoComplete="name"
              required
            />
          </Field>
          <Field label="Phone (optional)" htmlFor="contact_phone" error={errors.contact_phone}>
            <Input
              id="contact_phone"
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set("contact_phone", e.target.value)}
              autoComplete="tel"
            />
          </Field>
          <Field
            label={isSchool ? "School name" : "School (optional)"}
            htmlFor="school_name"
            error={errors.school_name}
            className="sm:col-span-2"
          >
            <Input
              id="school_name"
              value={form.school_name}
              onChange={(e) => set("school_name", e.target.value)}
              autoComplete="organization"
              required={isSchool}
            />
          </Field>
          <Field label="City" htmlFor="school_city" error={errors.school_city}>
            <Input id="school_city" value={form.school_city} onChange={(e) => set("school_city", e.target.value)} />
          </Field>
          <Field label="Country" htmlFor="school_country" error={errors.school_country}>
            <Input
              id="school_country"
              value={form.school_country}
              onChange={(e) => set("school_country", e.target.value)}
              autoComplete="country-name"
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-2 text-lg font-semibold">
          {isSchool ? `Delegates (${form.delegates.length}/${maxDelegates})` : "About you"}
        </legend>
        {errors.delegates && (
          <p role="alert" className="text-sm text-danger">
            {errors.delegates}
          </p>
        )}

        {form.delegates.map((d, i) => {
          const err = (field: string) => errors[`delegates.${i}.${field}`];
          return (
            <Card key={i} className="flex flex-col gap-4">
              {isSchool && (
                <div className="flex items-center justify-between">
                  <p className="font-medium">Delegate {i + 1}</p>
                  {form.delegates.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => set("delegates", form.delegates.filter((_, j) => j !== i))}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label={isSchool ? "Full name" : "Name on your badge"}
                  htmlFor={`d${i}-name`}
                  error={err("full_name")}
                >
                  <Input
                    id={`d${i}-name`}
                    value={d.full_name}
                    onChange={(e) => setDelegate(i, { full_name: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Email" htmlFor={`d${i}-email`} error={err("email")}>
                  <Input
                    id={`d${i}-email`}
                    type="email"
                    value={d.email}
                    onChange={(e) => setDelegate(i, { email: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Grade / year (optional)" htmlFor={`d${i}-grade`} error={err("grade")}>
                  <Input id={`d${i}-grade`} value={d.grade} onChange={(e) => setDelegate(i, { grade: e.target.value })} />
                </Field>
                <Field
                  label="MUN conferences attended"
                  htmlFor={`d${i}-exp`}
                  error={err("mun_experience")}
                >
                  <Input
                    id={`d${i}-exp`}
                    type="number"
                    min={0}
                    max={100}
                    inputMode="numeric"
                    value={String(d.mun_experience ?? 0)}
                    onChange={(e) => setDelegate(i, { mun_experience: Number(e.target.value) || 0 })}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Committee preferences</p>
                  {committees.length === 0 ? (
                    <p className="text-xs text-muted">Committees will be announced soon.</p>
                  ) : (
                    PREF_SLOTS.map((slot) => (
                      <Select
                        key={slot}
                        aria-label={`Committee choice ${slot + 1}`}
                        value={d.committee_preferences?.[slot] ?? ""}
                        onChange={(e) => setPref(i, "committee_preferences", slot, e.target.value)}
                      >
                        <option value="">{slot + 1}. choice: no preference</option>
                        {committees.map((c) => (
                          <option key={c.id} value={c.id}>
                            {slot + 1}. choice: {c.abbreviation}, {c.name}
                          </option>
                        ))}
                      </Select>
                    ))
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Country preferences</p>
                  {PREF_SLOTS.map((slot) => (
                    <Input
                      key={slot}
                      aria-label={`Country choice ${slot + 1}`}
                      placeholder={`${slot + 1}. choice (optional)`}
                      value={d.country_preferences?.[slot] ?? ""}
                      onChange={(e) => setPref(i, "country_preferences", slot, e.target.value)}
                    />
                  ))}
                </div>
              </div>

              <Field
                label="Dietary or accessibility needs (optional)"
                htmlFor={`d${i}-notes`}
                error={err("notes")}
              >
                <Input id={`d${i}-notes`} value={d.notes} onChange={(e) => setDelegate(i, { notes: e.target.value })} />
              </Field>
            </Card>
          );
        })}

        {isSchool && form.delegates.length < maxDelegates && (
          <Button
            type="button"
            variant="secondary"
            className="self-start"
            onClick={() => set("delegates", [...form.delegates, emptyDelegate()])}
          >
            + Add delegate
          </Button>
        )}
      </fieldset>

      <Field label="Anything else the secretariat should know? (optional)" htmlFor="motivation" error={errors.motivation}>
        <Textarea id="motivation" value={form.motivation} onChange={(e) => set("motivation", e.target.value)} maxLength={2000} />
      </Field>

      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <FormMessage state={state} />
        <Button type="submit" disabled={pending} className="h-11 self-start px-6">
          {pending ? "Saving…" : isEditing ? "Save changes" : "Submit application"}
        </Button>
        <p className="text-xs text-muted">
          You can edit your application until the secretariat has reviewed it.
        </p>
      </div>
    </form>
  );
}
