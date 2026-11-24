import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type {
  ApplicationStatus,
  Committee,
  Edition,
  EditionPhase,
} from "@/lib/database.types";

export const PHASE_LABELS: Record<EditionPhase, string> = {
  setup: "Setup",
  registration: "Registration open",
  allocation: "Allocation",
  preparation: "Preparation",
  conference: "Conference",
  wrap_up: "Wrap-up",
  archived: "Archived",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  accepted: "Accepted",
  waitlisted: "Waitlisted",
  rejected: "Not accepted",
  withdrawn: "Withdrawn",
};

/**
 * The edition marked as current. Visitors only see it once it is out of
 * setup (RLS); edition admins also see it during setup.
 */
export const getCurrentEdition = cache(async (): Promise<Edition | null> => {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("editions")
    .select("*")
    .eq("is_current", true)
    .maybeSingle();
  return data;
});

export const getCommittees = cache(
  async (editionId: string): Promise<Committee[]> => {
    const supabase = await createClient();
    const { data } = await supabase
      .from("committees")
      .select("*")
      .eq("edition_id", editionId)
      .order("sort_order")
      .order("name");
    return data ?? [];
  },
);

export function isRegistrationOpen(edition: Edition | null): boolean {
  return edition?.phase === "registration";
}

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

/** "14–17 May 2027" style range from ISO dates (YYYY-MM-DD). */
export function formatDateRange(start: string | null, end: string | null): string | null {
  if (!start) return null;
  const s = new Date(`${start}T00:00:00Z`);
  if (!end || end === start) return dateFmt.format(s);
  const e = new Date(`${end}T00:00:00Z`);
  return dateFmt.formatRange(s, e);
}

export function formatDate(date: string | null): string | null {
  if (!date) return null;
  return dateFmt.format(new Date(date.length === 10 ? `${date}T00:00:00Z` : date));
}
