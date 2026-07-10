# Prisma migrations — baseline strategy

This project adopted Prisma Migrate **after** a database already existed. The
Neon database (and its staging/production clone) already contained the NextAuth
Auth/User tables, created historically **without** a tracked Prisma migration
history (no `_prisma_migrations` table). This README documents how the migrations
here are structured and the exact, safe commands to apply them.

> **Safety:** never run migrations against production without explicit owner
> approval and a restore point. Never run `prisma migrate reset` or
> `prisma db push` against a shared DB. See `docs/DB_MIGRATION_SAFETY.md`.

## Why `prisma migrate deploy` failed with P3005

`P3005: The database schema is not empty.`

`prisma migrate deploy` refuses to apply migrations to a database that **already
contains tables** but has **no migration history** it recognizes. It cannot tell
whether the existing objects were created by known migrations, so it stops rather
than risk conflicting with them. This is expected when adopting Prisma Migrate on
an existing (non-empty) database — the fix is to **baseline** the existing schema.

## Migrations in this directory

| Order | Migration | Represents | On an EXISTING db | On a FRESH/empty db |
|---|---|---|---|---|
| 1 | `20260101000000_existing_production_baseline` | The pre-existing NextAuth Auth/User schema (`Account`, `Session`, `User`, `VerificationToken`) | **marked applied** (SQL NOT run — tables already exist) | executed first to create the Auth schema |
| 2 | `20260627000000_platform_sync_persistence` | The Phase 10 platform-sync tables (`PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`, `GameExternalSource`, `UserGame`) — has FKs to `User` | executed by `migrate deploy` | executed after the baseline |

The baseline exists so migration #2 (which has foreign keys to `User`) has a
recorded predecessor. Composing both migrations reproduces the current
`prisma/schema.prisma` exactly (verified offline with `prisma migrate diff`).

### How the baseline SQL was produced

Generated **offline, with no database connection**, from the NextAuth models in
`prisma/schema.prisma`:

```bash
# datamodel → empty diff; does NOT connect to any database
prisma migrate diff --from-empty --to-schema-datamodel <nextauth-only-schema> --script
```

Because the baseline is **marked applied (never executed)** on the existing
staging/production database, small differences between this schema-derived SQL
and the physical tables are harmless there — the SQL only ever runs on a fresh
empty database. If you require the baseline to byte-match the *actual* database
(e.g. it was created by `db push` with non-default options), regenerate it from
the live schema **on the staging clone only** (see the optional step below).

## Staging validation sequence (staging / production-clone ONLY)

Run against the **staging/production-clone** `DATABASE_URL` — never production.
Do not print or paste the connection string.

```bash
# 0. (optional) regenerate the baseline SQL from the ACTUAL staging schema if an
#    exact physical match is required. Overwrite the baseline migration.sql with:
#    prisma migrate diff --from-empty --to-url "$DATABASE_URL" --script
#    (reads staging read-only; prints only SQL, never the URL)

# 1. Mark the baseline as already-applied WITHOUT running its SQL
#    (the Auth tables already exist on this DB):
npx prisma migrate resolve --applied 20260101000000_existing_production_baseline

# 2. Apply the pending platform-sync migration:
npx prisma migrate deploy

# 3. Confirm history is clean (no pending migrations):
npx prisma migrate status

# 4. Regenerate the client:
npx prisma generate
```

Expected after step 3: both migrations shown as applied, **no pending
migrations**, and the 5 platform-sync tables present alongside the untouched
NextAuth tables.

## Production rollout (LATER — only with explicit owner approval)

Same shape as staging, gated on a confirmed Neon restore point and DB-owner
(Mattia) approval:

```bash
# Against production DATABASE_URL, only after approval + restore point:
npx prisma migrate resolve --applied 20260101000000_existing_production_baseline
npx prisma migrate deploy
npx prisma migrate status
npx prisma generate
```

`migrate resolve --applied` writes only a row into `_prisma_migrations` (no schema
change). `migrate deploy` then creates only the 5 new platform-sync tables
(additive — all `CREATE TABLE`; no `DROP`). Rollback = Neon restore, or drop the
5 new tables (see `docs/MIGRATION_READINESS_CHECKLIST.md`).
