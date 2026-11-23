import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 mb-6 text-sm text-muted">
        Enter your email and we&apos;ll send you a link to sign in. No password
        needed.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
