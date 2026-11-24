"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getCurrentEdition, isRegistrationOpen } from "@/lib/edition";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema, issuesToFieldErrors, type ApplyState } from "./schema";

/** Map known database errors to messages people can act on. */
function friendlyDbError(message: string): string {
  if (message.includes("registration is not open")) return "Registration is closed.";
  if (message.includes("can no longer be edited"))
    return "Your application has already been reviewed and can't be changed. Contact the secretariat if something is wrong.";
  if (message.includes("delegation needs between")) return "Your delegation has too many or too few delegates.";
  if (message.includes("unknown committee")) return "One of the committees you picked no longer exists. Please choose again.";
  return "Something went wrong while saving. Please try again.";
}

export async function saveApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Your session has expired. Please sign in again." };

  const edition = await getCurrentEdition();
  if (!edition || !isRegistrationOpen(edition)) return { error: "Registration is closed." };

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { error: "Couldn't read the form. Please reload the page and try again." };
  }

  const parsed = applicationSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: issuesToFieldErrors(parsed.error.issues),
    };
  }
  const v = parsed.data;
  if (v.kind === "school" && v.delegates.length > edition.max_delegates_per_school) {
    return { error: `A school delegation can have at most ${edition.max_delegates_per_school} delegates.` };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("save_application", {
    p_edition_id: edition.id,
    p_kind: v.kind,
    p_contact_name: v.contact_name,
    p_contact_phone: v.contact_phone,
    p_school_name: v.school_name,
    p_school_city: v.school_city,
    p_school_country: v.school_country,
    p_motivation: v.motivation,
    p_delegates: v.delegates.map((d) => ({
      ...d,
      committee_preferences: [...new Set(d.committee_preferences)],
      country_preferences: d.country_preferences.filter(Boolean),
    })),
  });

  if (error) return { error: friendlyDbError(error.message) };

  revalidatePath("/dashboard");
  redirect("/dashboard?saved=1");
}

export async function withdrawApplication(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const edition = await getCurrentEdition();
  if (!user || !edition) redirect("/login");

  const id = String(formData.get("application_id") ?? "");
  const supabase = await createClient();
  // RLS limits this to the user's own application; the trigger only allows
  // the status change to "withdrawn".
  await supabase
    .from("applications")
    .update({ status: "withdrawn" })
    .eq("id", id)
    .eq("applicant_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
