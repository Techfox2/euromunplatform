<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Euromunplatform project notes

- Product vision, modules and roadmap: `docs/VISION.md`. Read it before starting a feature.
- Hosting is Cloudflare Workers via `@opennextjs/cloudflare`. Verify changes with `npm run preview` (Workers runtime), not only `next dev`.
- Keep `cacheComponents` off until OpenNext Cloudflare supports it (pages 500 on Workers otherwise).
- Supabase: every schema change is a new file in `supabase/migrations/`. Every table gets RLS enabled, with policies built on `is_superadmin()`, `has_edition_role()` and `is_edition_admin()`. Update `src/lib/database.types.ts` (`npm run db:types`).
- Use `@/lib/supabase/server` in server code and `@/lib/supabase/client` in client components; get the user via `getCurrentUser()` in `@/lib/auth`.
- Every Server Action must check authentication/authorization itself.
- English UI only. Mobile-first.
