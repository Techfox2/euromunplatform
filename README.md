# Euromunplatform

The platform for the EUROMUN conference: registration, manual country allocation, resolutions and live committee sessions under BERMUN procedure.

See [`docs/VISION.md`](docs/VISION.md) for the product vision, modules, data model and roadmap.

## Live prototype

- App: https://euromunplatform.techstorm22.workers.dev
- Hosting: Cloudflare Worker `euromunplatform`, built by Cloudflare Workers Builds on every push to the repo's production branch (`claude/determined-goodall-2vmvdo` for now; switch to `main` once it exists).
- Database: Supabase project `Euromunplatform` (ref `vqlcvycgqojngwoztomc`, region Tokyo).

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind CSS 4)
- **Supabase**: Postgres, Auth (magic link), Realtime, Storage
- **Cloudflare Workers** hosting via [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)

## Getting started

Requirements: Node 22+, and Docker if you want to run Supabase locally.

```bash
npm install
cp .env.example .env.local
```

### Option A: local Supabase (recommended for development)

```bash
npm run db:start
```

This starts Postgres, Auth and the other services in Docker, applies `supabase/migrations` and loads `supabase/seed.sql`. It prints an API URL and a publishable key. Put them in `.env.local`. Magic-link emails go to the local inbox at http://127.0.0.1:54324.

### Option B: hosted Supabase project

1. Create a project at supabase.com.
2. Copy the project URL and publishable key (Project Settings → API) into `.env.local`.
3. Apply the migrations: `npx supabase link` then `npx supabase db push`.
4. Under Authentication → URL Configuration, add `http://localhost:3000/auth/callback` (and your deployed URL + `/auth/callback`) to the redirect URLs.

### Run the app

```bash
npm run dev
```

Open http://localhost:3000, sign in with your email, then make yourself platform admin. In the Supabase SQL editor (or `psql`), run:

```sql
update public.profiles set is_superadmin = true where email = 'you@example.com';
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Next.js dev server |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm run preview` | Build for Cloudflare and run it locally in the Workers runtime (port 8787) |
| `npm run deploy` | Build and deploy to Cloudflare Workers |
| `npm run db:start` / `db:stop` | Start / stop local Supabase |
| `npm run db:reset` | Recreate the local database from migrations and seed |
| `npm run db:types` | Regenerate `src/lib/database.types.ts` from the local database |

## Deploying to Cloudflare

Manual: `npx wrangler login`, then `npm run deploy` with the `NEXT_PUBLIC_SUPABASE_*` variables set in your shell or `.env.local` (they're inlined at build time).

Automatic (current setup): Cloudflare Workers Builds is connected to this repo and runs `npx opennextjs-cloudflare build` + `deploy` on every push to the production branch. The `NEXT_PUBLIC_SUPABASE_*` and `NEXT_PUBLIC_SITE_URL` build variables are set in the Worker's build settings in the Cloudflare dashboard.

Alternative: `.github/workflows/deploy.yml` deploys from GitHub Actions on every push to `main`. It's only needed if you move away from Workers Builds, and it needs these repository secrets:

- `CLOUDFLARE_API_TOKEN` (a token with the "Edit Cloudflare Workers" template)
- `CLOUDFLARE_ACCOUNT_ID`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## Project structure

```
src/
  app/                 routes (App Router)
    auth/callback      magic-link landing → session cookie
    auth/signout       POST to sign out
    login/             magic-link sign-in
    dashboard/         signed-in home: profile + roles per edition
  components/          shared UI
  lib/
    auth.ts            getCurrentUser(): user, profile, roles per edition
    supabase/          browser, server and proxy Supabase clients
    database.types.ts  typed schema (regenerate with db:types)
  proxy.ts             refreshes the auth session; guards /dashboard
supabase/
  migrations/          SQL migrations (schema + Row Level Security)
  seed.sql             local dev data
docs/VISION.md         product vision and roadmap
```

## Authorization model

- Every conference year is an **edition**. Users get roles **per edition**: `admin` (secretariat), `advisor`, `chair`, `delegate`.
- `profiles.is_superadmin` marks platform owners, who can create editions and manage everything.
- Access is enforced in the database with Row Level Security, using the helpers `private.is_superadmin()`, `private.has_edition_role(edition, role)` and `private.is_edition_admin(edition)`. They live in the `private` schema so they can't be called through the public API. New tables should use these helpers in their policies.

## Known limitations (prototype)

- Next.js **Cache Components** are turned off because OpenNext on Cloudflare doesn't fully support them yet.
- `proxy.ts` runs on the Node.js runtime, which OpenNext supports on Workers as **experimental**. It works in local Workers previews. If it causes problems in production, fall back to an edge `middleware.ts`.
- `package.json` pins the `cookie` package used by `@opennextjs/aws` to 0.7.2 (via `overrides`). With `cookie@1.x`, OpenNext's Node-middleware bundle crashes on every request that has a cookie (`Cannot read properties of undefined (reading 'parse')`). Remove the override once OpenNext fixes its `cookie` import.
