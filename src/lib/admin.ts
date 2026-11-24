import "server-only";
import { redirect } from "next/navigation";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import { getCurrentEdition } from "@/lib/edition";
import type { Edition } from "@/lib/database.types";

export function isEditionAdmin(user: CurrentUser | null, editionId: string | undefined): boolean {
  if (!user || !editionId) return false;
  if (user.isSuperadmin) return true;
  return user.memberships.some(
    (m) => m.editionId === editionId && m.roles.includes("admin"),
  );
}

/**
 * For admin pages: returns the user and current edition, or redirects.
 * The database enforces the same rule with RLS; this is for a clean UX.
 */
export async function requireAdminPage(): Promise<{ user: CurrentUser; edition: Edition }> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  const edition = await getCurrentEdition();
  if (!edition || !isEditionAdmin(user, edition.id)) redirect("/dashboard");
  return { user, edition };
}

/** For admin Server Actions: returns the edition or throws. */
export async function requireAdminAction(): Promise<{ user: CurrentUser; edition: Edition }> {
  const user = await getCurrentUser();
  const edition = await getCurrentEdition();
  if (!user || !edition || !isEditionAdmin(user, edition.id)) {
    throw new Error("Not authorized");
  }
  return { user, edition };
}
