import Link from "next/link";
import { requireAdminPage } from "@/lib/admin";
import { PHASE_LABELS } from "@/lib/edition";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/applications", label: "Applications" },
  { href: "/admin/committees", label: "Committees" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const { edition } = await requireAdminPage();

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 border-b border-border pb-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-muted">
            Secretariat · <span className="font-medium text-foreground">{edition.name}</span>
          </p>
          <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-medium text-brand">
            {PHASE_LABELS[edition.phase]}
          </span>
        </div>
        <nav className="-mx-1 flex gap-1 overflow-x-auto text-sm">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-md px-3 py-1.5 hover:bg-surface"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
