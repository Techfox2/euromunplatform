"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Select, Textarea } from "@/components/ui";
import type { ApplicationStatus } from "@/lib/database.types";
import { reviewApplication, type ActionState } from "../../actions";

const OPTIONS: { value: Exclude<ApplicationStatus, "withdrawn">; label: string }[] = [
  { value: "accepted", label: "Accept" },
  { value: "waitlisted", label: "Waitlist" },
  { value: "rejected", label: "Don't accept" },
  { value: "submitted", label: "Back to “submitted” (undecided)" },
];

export function ReviewForm({
  applicationId,
  status,
  message,
}: {
  applicationId: string;
  status: ApplicationStatus;
  message: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(reviewApplication, {});

  if (status === "withdrawn") {
    return <p className="text-sm text-muted">The applicant withdrew this application.</p>;
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="application_id" value={applicationId} />
      <Field label="Decision" htmlFor="status">
        <Select id="status" name="status" defaultValue={status === "submitted" ? "accepted" : status}>
          {OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Message to the applicant (optional)"
        htmlFor="message"
        hint="Shown on their dashboard with the decision."
      >
        <Textarea id="message" name="message" defaultValue={message ?? ""} maxLength={2000} rows={4} />
      </Field>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save decision"}
      </Button>
      <p className="text-xs text-muted">
        Accepting gives the applicant a role in this conference: faculty advisor for a school, delegate for an
        individual.
      </p>
    </form>
  );
}
