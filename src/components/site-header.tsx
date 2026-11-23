import Link from "next/link";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Euromunplatform
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Suspense fallback={<span className="w-16" />}>
            <AuthNav />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}

async function AuthNav() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <Link href="/login" className="font-medium text-brand hover:underline">
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/dashboard" className="hover:underline">
        Dashboard
      </Link>
      <form action="/auth/signout" method="post">
        <button type="submit" className="text-muted hover:underline">
          Sign out
        </button>
      </form>
    </>
  );
}
