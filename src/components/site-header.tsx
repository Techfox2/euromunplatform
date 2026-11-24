import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { isEditionAdmin } from "@/lib/admin";
import { getCurrentEdition, isRegistrationOpen } from "@/lib/edition";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex min-h-14 w-full max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2">
        <Link href="/" className="font-semibold tracking-tight">
          Euromunplatform
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <Link href="/committees" className="hover:underline">
            Committees
          </Link>
          <Link href="/faq" className="hover:underline">
            FAQ
          </Link>
          <Suspense fallback={<span className="w-16" />}>
            <AuthNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function AuthNav() {
  const [user, edition] = await Promise.all([getCurrentUser(), getCurrentEdition()]);
  const applyLink = isRegistrationOpen(edition) && (
    <Link href="/apply" className="hover:underline">
      Apply
    </Link>
  );

  if (!user) {
    return (
      <>
        {applyLink}
        <Link href="/login" className="font-medium text-brand hover:underline">
          Sign in
        </Link>
      </>
    );
  }

  return (
    <>
      {applyLink}
      <Link href="/dashboard" className="hover:underline">
        Dashboard
      </Link>
      {isEditionAdmin(user, edition?.id) && (
        <Link href="/admin" className="font-medium text-brand hover:underline">
          Admin
        </Link>
      )}
      <form action="/auth/signout" method="post">
        <button type="submit" className="text-muted hover:underline">
          Sign out
        </button>
      </form>
    </>
  );
}
