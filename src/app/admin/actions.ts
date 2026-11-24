"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdminAction } from "@/lib/admin";
import { createClient } from "@/lib/supabase/server";
import { Constants } from "@/lib/database.types";

export type ActionState = { error?: string; success?: string };

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.iso.date().nullable());

// ---------------------------------------------------------------------------
// Edition settings
// ---------------------------------------------------------------------------

const editionSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    phase: z.enum(Constants.public.Enums.edition_phase),
    tagline: optionalText(200),
    location: optionalText(200),
    description: optionalText(5000),
    starts_on: optionalDate,
    ends_on: optionalDate,
    registration_closes_on: optionalDate,
    max_delegates_per_school: z.coerce.number().int().min(1).max(200),
  })
  .refine((v) => !v.starts_on || !v.ends_on || v.ends_on >= v.starts_on, {
    message: "The end date must be on or after the start date.",
  });

export async function updateEdition(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { edition } = await requireAdminAction();
  const parsed = editionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.from("editions").update(parsed.data).eq("id", edition.id);
  if (error) return { error: "Couldn't save the settings. Please try again." };

  revalidatePath("/", "layout");
  return { success: "Settings saved." };
}

// ---------------------------------------------------------------------------
// Committees
// ---------------------------------------------------------------------------

const committeeSchema = z.object({
  id: z.uuid().optional().or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(2, "Enter a committee name").max(120),
  abbreviation: z.string().trim().min(1, "Enter an abbreviation").max(20),
  topics: z
    .string()
    .transform((v) =>
      v
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5),
    ),
  description: optionalText(3000),
  study_guide_url: optionalText(500).pipe(
    z.string().regex(/^https?:\/\//, "The study guide link must start with http:// or https://").nullable(),
  ),
  sort_order: z.coerce.number().int().min(0).max(999),
});

export async function saveCommittee(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { edition } = await requireAdminAction();
  const parsed = committeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const { id, ...values } = parsed.data;
  const supabase = await createClient();
  const { error } = id
    ? await supabase.from("committees").update(values).eq("id", id).eq("edition_id", edition.id)
    : await supabase.from("committees").insert({ ...values, edition_id: edition.id });

  if (error) {
    if (error.code === "23505") return { error: "Another committee already uses that abbreviation." };
    return { error: "Couldn't save the committee. Please try again." };
  }

  revalidatePath("/", "layout");
  return { success: id ? "Committee updated." : "Committee added." };
}

export async function deleteCommittee(formData: FormData): Promise<void> {
  const { edition } = await requireAdminAction();
  const id = z.uuid().parse(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("committees").delete().eq("id", id).eq("edition_id", edition.id);
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Application review
// ---------------------------------------------------------------------------

const reviewSchema = z.object({
  application_id: z.uuid(),
  status: z.enum(["submitted", "accepted", "waitlisted", "rejected"]),
  message: z.string().trim().max(2000),
});

export async function reviewApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdminAction();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("review_application", {
    p_application_id: parsed.data.application_id,
    p_status: parsed.data.status,
    p_message: parsed.data.message,
  });
  if (error) return { error: "Couldn't save the decision. Please try again." };

  revalidatePath("/admin", "layout");
  return { success: "Decision saved. The applicant sees it on their dashboard." };
}
