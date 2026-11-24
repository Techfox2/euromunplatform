import type { Metadata } from "next";
import { PageHeader } from "@/components/ui";
import { requireAdminPage } from "@/lib/admin";
import { SettingsForm } from "./settings-form";

export const metadata: Metadata = { title: "Settings · Admin" };

export default async function AdminSettingsPage() {
  const { edition } = await requireAdminPage();
  return (
    <main>
      <PageHeader
        title="Conference settings"
        description="These details appear on the public site. The phase controls what visitors and applicants can do."
      />
      <SettingsForm edition={edition} />
    </main>
  );
}
