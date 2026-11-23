"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { sendMagicLink, type LoginState } from "./actions";

const initialState: LoginState = { status: "idle" };

export function LoginForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/dashboard";
  const linkError = searchParams.get("error") === "link";
  const [state, formAction, pending] = useActionState(
    sendMagicLink,
    initialState,
  );

  if (state.status === "sent") {
    return (
      <div className="rounded-lg border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Check your inbox</p>
        <p className="mt-1 text-muted">
          We sent a sign-in link to <strong>{state.email}</strong>. Open it on
          this device to continue.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-3">
      {linkError && (
        <p role="alert" className="text-sm text-danger">
          That sign-in link was invalid or expired. Request a new one below.
        </p>
      )}
      <input type="hidden" name="next" value={next} />
      <label htmlFor="email" className="text-sm font-medium">
        Email address
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@school.org"
        className="h-11 rounded-md border border-border bg-background px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/30"
      />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-brand font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Sending…" : "Send sign-in link"}
      </button>
    </form>
  );
}
