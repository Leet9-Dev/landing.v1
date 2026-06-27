# Migration Readiness Checklist

A practical, copy-pasteable checklist for the DB owner (Mattia) to take the
Phase 10 schema from "defined" to "applied" safely. Nothing here has been done
yet — this is the plan. See `docs/DB_MIGRATION_SAFETY.md` for the rationale.

> **Status today:** schema defined ✅ · draft SQL generated ✅ · dev/staging DB ❌ ·
> migration applied ❌. Do not apply to production until A–E below are complete.

## A. Current database inventory

- [ ] Confirm there is still only **one Neon database** (production)
- [ ] Confirm no dev/staging database exists yet
- [ ] Confirm production currently has only NextAuth tables
      (`Account`, `Session`, `User`, `VerificationToken`)
- [ ] Confirm no `_prisma_migrations` table exists (no migration history)
- [ ] Confirm who owns/controls Neon + Vercel DB access (Mattia)

## B. Dev/staging DB readiness

- [ ] Create a **Neon branch** off production (or a separate dev database)
- [ ] Obtain a **non-production** `DATABASE_URL` for it (local/dev only, never committed)
- [ ] Verify the dev DB is reachable from the dev machine
- [ ] Confirm the dev DB is NOT used by production Vercel deployments

## C. Migration artifact readiness

- [ ] Review the draft SQL: `prisma/migrations-draft/0001_platform_sync_persistence.draft.sql`
- [ ] Generate the **tracked** migration against the dev DB:
      `prisma migrate dev --name platform_sync_persistence`
- [ ] Diff the generated `prisma/migrations/<ts>_platform_sync_persistence/migration.sql`
      against the draft — they should match (5 new tables, additive only)
- [ ] Confirm the migration is **additive only** (all `CREATE TABLE` / indexes / FKs; no `DROP`)
- [ ] `npx prisma validate` passes
- [ ] `npx prisma generate` passes
- [ ] `npm run build` passes

## D. Production approval gate

- [ ] DB owner (Mattia) has **reviewed and approved** the migration SQL
- [ ] Approval recorded (who / when / which migration)
- [ ] Maintenance/timing window agreed (if any)
- [ ] Decision recorded that runtime stays mock-backed until a later write-path phase

## E. Validation before migration

- [ ] Production **restore point / backup** confirmed in Neon
- [ ] Correct **production `DATABASE_URL`** confirmed in Vercel env (no secret leakage)
- [ ] No `.env` or secrets committed to the repo
- [ ] Rollback plan written (Neon restore + optional `DROP TABLE` of the 5 new tables)

## F. Validation after migration

- [ ] `prisma migrate deploy` completed without error
- [ ] The 5 new tables exist in production; NextAuth tables unchanged
- [ ] `_prisma_migrations` shows the applied migration
- [ ] `prisma generate` + `npm run build` still pass against production schema

## G. Rollback / recovery plan

- [ ] Primary: **Neon restore / branch** back to the pre-migration point
- [ ] Secondary: forward-fix migration or `DROP TABLE` of the new tables (additive-only makes this safe)
- [ ] Confirm: reverting app code does **not** revert schema — schema rollback is separate
- [ ] Owner knows who runs rollback and how

## H. Post-migration app checks

- [ ] Landing page loads
- [ ] `/app` protected; redirects to `/app/discovery`
- [ ] Discovery, Profile (Overview/Games/Stats/Tribe), Rankings all render
- [ ] `/api/platforms` returns 200
- [ ] `/api/integrations/steam/sync-preview` still dry-run (401 when signed out)
- [ ] No runtime DB write path is active yet (still mock-backed)
- [ ] No console errors that block usage
