# Database Migration Safety

**Phase 11 — safety & readiness only. No migration has been applied. No database
was mutated.** This document defines how Leet9 must handle database migrations
given the current infrastructure, so the Phase 10 schema can be applied later
through a controlled, approved process.

## Current database reality

- There is **exactly one Neon database, and it is production.**
- There is **no separate dev or staging database** yet.
- **Mattia controls Neon and Vercel database access.**
- The production DB currently holds only the **NextAuth** tables (`Account`,
  `Session`, `User`, `VerificationToken`). The Phase 10 product/sync tables are
  defined in `prisma/schema.prisma` but **do not exist in the database**.
- There is **no `prisma/migrations/` history** in the repo and (almost
  certainly) **no `_prisma_migrations` table** in Neon — the NextAuth tables
  were created without a tracked migration history.

Because the only database is production, **any migration command is a
production-mutating command** until a dev/staging database exists.

## Forbidden commands against production

Do **not** run any of these against the live Neon database:

- `prisma migrate dev` — creates/applies migrations and uses a shadow DB
- `prisma migrate reset` — **drops and recreates the database** (destroys data)
- `prisma db push` — pushes schema directly, no migration history, can drop columns
- `prisma migrate deploy` — applies pending migrations to the target DB
- Any ad-hoc destructive SQL (`DROP`, `ALTER ... DROP`, `TRUNCATE`, etc.)
- Any unreviewed migration command

The agent/CI must only ever run read-only/offline Prisma commands:
`prisma format`, `prisma validate`, `prisma generate`, and
`prisma migrate diff` in **datamodel-to-datamodel** mode (no DB connection).

## Correct production migration principle

1. **Generate and review the migration file first** — never mutate a DB before
   the exact SQL has been read and approved.
2. **Production receives only reviewed migrations** — no `db push`, no improvised
   SQL, no "quick fixes" applied directly.
3. **Applying a production migration is a manual, approved step** owned by the DB
   owner (Mattia), not something CI or an agent does automatically.
4. **Use a production-safe deploy process only when approved** — typically
   `prisma migrate deploy` of a reviewed migration, after a restore point exists.

## A draft migration already exists (not applied)

An **offline, Prisma-generated draft** of the Phase 10 tables lives at:

```
prisma/migrations-draft/0001_platform_sync_persistence.draft.sql
```

- It was generated with `prisma migrate diff --from-schema-datamodel … --to-schema-datamodel prisma/schema.prisma --script` — **no database connection**.
- It contains **only the 5 Phase 10 tables** (correct for a DB that already has
  the NextAuth tables).
- It is in `prisma/migrations-draft/` **on purpose**: Prisma ignores that folder,
  so it can never be auto-applied by `prisma migrate deploy`.
- It is a **review aid**, not a tracked migration. The real, tracked migration
  must be produced against a dev/staging DB (see below).

## Recommended setup before applying the Phase 10 migration

1. **Create a Neon dev/staging branch or a separate database** (Neon branching is
   ideal — it forks production cheaply and safely).
2. Point a **non-production** `DATABASE_URL` at that branch (in local/dev env
   only — never commit it).
3. Generate the tracked migration there:
   `prisma migrate dev --name platform_sync_persistence`.
4. **Test** `prisma generate` and `npm run build`.
5. **Review** the generated `migration.sql` diff (compare against the draft).
6. Apply to production **only after explicit approval**, via
   `prisma migrate deploy`, with a restore point in place.

## Fallback if no dev/staging DB exists yet

This is the **current** situation. Until a dev/staging DB is available:

- **Do not apply any migration.**
- **Keep the runtime mock-backed** — no DB reads/writes for product/sync models.
- Use the draft SQL as the **manual migration plan** for review.
- **Schedule DB-owner (Mattia) approval** and dev/staging setup as the next step
  (Phase 12).

## Checklist before a production migration

- [ ] Production **backup or Neon restore point** confirmed
- [ ] Migration file **reviewed** (SQL read line by line; matches the draft)
- [ ] **Vercel env vars** confirmed (correct `DATABASE_URL`, no secrets leaked)
- [ ] **Downtime / rollback expectations** understood and communicated
- [ ] `prisma generate` and `npm run build` **pass**
- [ ] **Owner approval recorded** (who approved, when)

## Rollback / recovery considerations

- **Neon restore / branching** is the primary recovery mechanism — restore to the
  pre-migration point or branch off it. Confirm the restore point before applying.
- **Reverting code is NOT the same as reverting schema.** Rolling back the app
  does not undo `CREATE TABLE`/`ALTER TABLE`. Schema changes need their own
  rollback plan.
- **Migrations need explicit rollback thinking** — for additive-only changes
  (Phase 10 is all `CREATE TABLE`, no drops) rollback is low-risk, but a
  forward-fix or a `DROP TABLE` of the new tables should still be pre-planned
  before applying.

## Next safe phases

- **Phase 12 — Migration Artifact Generation / Dev DB Setup:** create the Neon
  dev/staging branch, generate the tracked Prisma migration, review the diff.
- **Phase 13 — `PlatformAccount` Write Path:** persist Steam connection state on
  login (first real DB write), behind the reviewed migration.
- **Phase 14 — Real Steam Sync MVP:** `execute`-mode sync writing
  `PlatformSyncRun` / `PlatformDetectedGame` / `GameExternalSource` / `UserGame`.

Each step stays gated behind DB-owner approval and the checklists above.
