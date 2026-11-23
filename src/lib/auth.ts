import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AppRole, EditionPhase } from "@/lib/database.types";

export type EditionMembership = {
  editionId: string;
  editionName: string;
  phase: EditionPhase;
  roles: AppRole[];
};

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string | null;
  isSuperadmin: boolean;
  memberships: EditionMembership[];
};

/**
 * The signed-in user with their profile and roles per edition, or null.
 * Cached per request, so it can be called from several components.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return null;

  const [{ data: profile }, { data: roles }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, full_name, is_superadmin")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("edition_roles")
      .select("role, edition:editions(id, name, phase)")
      .eq("user_id", userId),
  ]);

  const byEdition = new Map<string, EditionMembership>();
  for (const row of roles ?? []) {
    if (!row.edition) continue;
    const existing = byEdition.get(row.edition.id);
    if (existing) {
      existing.roles.push(row.role);
    } else {
      byEdition.set(row.edition.id, {
        editionId: row.edition.id,
        editionName: row.edition.name,
        phase: row.edition.phase,
        roles: [row.role],
      });
    }
  }

  return {
    id: userId,
    email: profile?.email ?? String(claimsData.claims.email ?? ""),
    fullName: profile?.full_name ?? null,
    isSuperadmin: profile?.is_superadmin ?? false,
    memberships: [...byEdition.values()],
  };
});
