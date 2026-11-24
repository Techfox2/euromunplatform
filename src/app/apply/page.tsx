import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ButtonLink, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { formatDate, getCommittees, getCurrentEdition, isRegistrationOpen } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";
import { ApplyForm } from "./apply-form";
import type { ApplicationInput } from "./schema";

export const metadata: Metadata = { title: "Apply" };

export default async function ApplyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/apply");

  const edition = await getCurrentEdition();
  if (!edition || !isRegistrationOpen(edition)) {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <PageHeader title="Registration is closed" description="Applications aren't open right now." />
        <ButtonLink href="/dashboard" variant="secondary">
          Go to dashboard
        </ButtonLink>
      </main>
    );
  }

  const supabase = await createClient();
  const [committees, { data: existing }] = await Promise.all([
    getCommittees(edition.id),
    supabase
      .from("applications")
      .select("*, application_delegates(*)")
      .eq("edition_id", edition.id)
      .eq("applicant_id", user.id)
      .maybeSingle(),
  ]);

  if (existing && existing.status !== "submitted") {
    return (
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <PageHeader
          title="Your application has been reviewed"
          description="It can't be changed any more. You can see the decision on your dashboard."
        />
        <ButtonLink href="/dashboard">Go to dashboard</ButtonLink>
      </main>
    );
  }

  const initial: ApplicationInput | null = existing
    ? {
        kind: existing.kind,
        contact_name: existing.contact_name,
        contact_phone: existing.contact_phone ?? "",
        school_name: existing.school_name ?? "",
        school_city: existing.school_city ?? "",
        school_country: existing.school_country ?? "",
        motivation: existing.motivation ?? "",
        delegates: [...existing.application_delegates]
          .sort((a, b) => a.position - b.position)
          .map((d) => ({
            full_name: d.full_name,
            email: d.email,
            grade: d.grade ?? "",
            mun_experience: d.mun_experience,
            committee_preferences: d.committee_preferences,
            country_preferences: d.country_preferences,
            notes: d.notes ?? "",
          })),
      }
    : null;

  const closes = formatDate(edition.registration_closes_on);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
      <PageHeader
        title={existing ? "Edit your application" : `Apply for ${edition.name}`}
        description={
          <>
            {closes ? `Registration closes on ${closes}. ` : ""}
            Questions? See the{" "}
            <Link href="/faq" className="text-brand hover:underline">
              FAQ
            </Link>
            .
          </>
        }
      />
      <ApplyForm
        committees={committees.map(({ id, name, abbreviation }) => ({ id, name, abbreviation }))}
        initial={initial}
        maxDelegates={edition.max_delegates_per_school}
        userEmail={user.email}
        isEditing={Boolean(existing)}
      />
    </main>
  );
}
