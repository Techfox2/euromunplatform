import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center px-4 py-20">
      <p className="text-sm font-medium uppercase tracking-widest text-brand">
        EUROMUN
      </p>
      <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
        One place for the whole conference.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-muted">
        Registration, committee allocation, resolutions and live committee
        sessions under BERMUN procedure, all on Euromunplatform.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/login"
          className="flex h-11 items-center rounded-md bg-brand px-5 font-medium text-white hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    </main>
  );
}
