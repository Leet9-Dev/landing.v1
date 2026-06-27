# Database Staging and Migration Path

**Phase 14 — decision and migration-path document. Docs-only; no DB, schema,
runtime, or settings change.** This document is the actionable decision record
for Francesco (CTO) and Mattia (CEO/DB owner) on how to safely move from
"one production Neon database, no migration applied" to a state where the
Phase 10 schema exists in production and real platform sync can begin.

> **Status today:** one Neon database (production) · NextAuth tables only ·
> Phase 10 schema defined ✅ · draft migration SQL generated ✅ ·
> dev/staging DB ❌ · migration applied ❌ · real sync blocked ❌

---

## Background: why this decision is urgent

The full ingestion path — from real Steam/PSN API calls to `UserGame` rows that
power Profile, Stats, and Rankings — is blocked by one hard dependency: **the
Phase 10 tables (`PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`,
`GameExternalSource`, `UserGame`) do not exist in the database.** No real sync
can write anything until they do.

The migration is low-risk (additive-only: five `CREATE TABLE` statements, no
`ALTER`, no `DROP`), but **the only database is production**, so it cannot be
applied casually. This document defines the two paths and the gates that must
be passed before any migration or write-path code can be activated.

---

## Option A — Neon dev/staging branch (RECOMMENDED)

Neon's **branching** feature creates an instant, cheap copy of the production
database (schema + data up to the branch point). The branch is an isolated
Postgres endpoint; any migration or destructive operation on the branch cannot
affect production.

### Why Option A is the right choice

| Factor | Option A (Neon branch) | Option B (prod-only) |
|---|---|---|
| Production risk | Zero — branch is isolated | High — one mistake mutates prod |
| Migration history | Generated properly against a real DB | Must be improvised or skipped |
| `prisma migrate dev` usable | Yes | No (shadow-DB will be prod) |
| Rollback | Trivial (delete branch) | Neon restore point required |
| Team confidence | Build + validate before prod | Blind trust in draft SQL |
| Cost | Free on Neon free tier | N/A |
| Time to set up | ~10 minutes (Neon dashboard) | Not applicable |

### How to create the Neon branch (Mattia, ~10 min)

1. Open the [Neon Console](https://console.neon.tech) and select the Leet9 project.
2. In the left sidebar, choose **Branches** → **New Branch**.
3. Name it `dev` or `staging`; leave the parent as the production branch.
4. Neon will provide a **connection string** for the new branch. Copy it.
5. **Store it in your local `.env.local` only** — never commit it, never add
   it to Vercel production env vars.

```env
# .env.local  (git-ignored — NEVER COMMIT)
DATABASE_URL="postgresql://…@ep-<branch-id>.us-east-2.aws.neon.tech/neondb"
```

6. Confirm the branch is **not** used by the Vercel production deployment.

### What to do with the Neon branch (Francesco, developer)

Once `.env.local` points at the branch:

```bash
# 1. Validate schema (no DB connection needed — same as today)
npx prisma validate

# 2. Generate the tracked migration against the dev branch
npx prisma migrate dev --name platform_sync_persistence

# 3. Diff the generated migration against the draft
diff prisma/migrations/<ts>_platform_sync_persistence/migration.sql \
     prisma/migrations-draft/0001_platform_sync_persistence.draft.sql

# 4. Build check
npx prisma generate
npm run build
```

The `diff` should be empty (or show only harmless formatting differences).
The generated migration SQL is the **official artifact** that gets committed
and later applied to production.

### Applying to production (Mattia — final gate)

Once the migration is reviewed and the team approves:

```bash
# Ensure DATABASE_URL is the PRODUCTION connection string (Vercel env / local override)
# Confirm a Neon restore point exists first

npx prisma migrate deploy
```

This applies only committed, reviewed migrations from `prisma/migrations/`.
It is safe to run against production as long as:
- No pending `DROP` or destructive statement exists in the migration
- A Neon restore point is confirmed before running

---

## Option B — Production-only migration (NOT RECOMMENDED)

Run the draft SQL directly against production without a dev branch. This means:

- No `prisma migrate dev` (shadow DB would be production → dangerous).
- The draft SQL must be applied as a manual, one-shot `psql` command or via the
  Neon SQL editor.
- `prisma/migrations/` will have no history (Prisma won't know the migration was
  applied unless you create a baseline or use `prisma migrate resolve --applied`).
- No isolated validation — the first time the SQL runs is on production.
- Any typo, constraint error, or conflict is a production incident.

**This path is not recommended.** The Neon branching feature exists precisely to
avoid it. Option B is documented here only for completeness; the team should
choose Option A.

---

## Migration commands policy

### Allowed at any time (no DB connection required)

```bash
npx prisma format            # format schema file
npx prisma validate          # validate schema file (uses placeholder DATABASE_URL)
npx prisma generate          # generate Prisma client
npx prisma migrate diff \    # generate diff SQL offline
  --from-schema-datamodel … \
  --to-schema-datamodel prisma/schema.prisma \
  --script
npm run db:safety-check      # prints DB safety guidance, exits 0
```

### Allowed against the dev/staging Neon branch only

```bash
npx prisma migrate dev --name <name>   # create + apply migration (requires real DB)
npx prisma migrate status              # inspect migration history
npx prisma studio                      # browse data (dev branch only)
```

### Allowed against production — only after explicit approval + restore point

```bash
npx prisma migrate deploy    # apply pending reviewed migrations
```

### Forbidden against production at all times

```bash
prisma migrate dev           # uses shadow DB → would use production
prisma migrate reset         # DROPS and recreates the database
prisma db push               # pushes schema directly, no history, can drop columns
prisma migrate deploy        # only allowed after the approval gate above
# Any ad-hoc SQL: DROP, ALTER … DROP, TRUNCATE, DELETE without WHERE
```

---

## Gates before the `PlatformAccount` write path can be activated

The write path (`PlatformAccount` created/updated on Steam login) is the first
real DB write outside of NextAuth. It cannot be activated until all of the
following are true:

### Gate 1 — Dev/staging DB exists and is reachable

- [ ] Neon dev/staging branch created (Option A)
- [ ] Non-production `DATABASE_URL` stored in `.env.local` only
- [ ] Branch confirmed to be isolated from production Vercel deployment

### Gate 2 — Migration artifact is reviewed and committed

- [ ] `prisma migrate dev --name platform_sync_persistence` run against the dev branch
- [ ] Generated `prisma/migrations/<ts>_platform_sync_persistence/migration.sql`
      reviewed line by line and confirmed additive-only
- [ ] Diff against `prisma/migrations-draft/0001_platform_sync_persistence.draft.sql`
      shows no unexpected differences
- [ ] Migration committed to `main` (inside `prisma/migrations/`, not `migrations-draft/`)
- [ ] `npx prisma validate` and `npm run build` pass

### Gate 3 — Production approval and restore point

- [ ] DB owner (Mattia) has reviewed and approved the migration SQL
- [ ] Approval recorded (who, when, which migration file)
- [ ] Neon production restore point confirmed before applying
- [ ] `prisma migrate deploy` run against production → success

### Gate 4 — Runtime write path code is ready

- [ ] `PlatformAccount` write-path code implemented (Steam connection on login)
- [ ] Write path tested against the dev branch
- [ ] No mock-bypass: the runtime checks for the platform account before syncing
- [ ] No `STEAM_API_KEY` committed; key in Vercel env only
- [ ] `DRY_RUN` flag in `steamClient.js` stays `true` until all gates above are passed

Only after all four gates are cleared should the `PlatformAccount` write path be
deployed to production. Real Steam sync (`DRY_RUN = false`) is a later gate
after the write path is confirmed working.

---

## Recommended phase sequence after this decision

The sequence below assumes Option A (Neon branch) and that Gates 1–3 can be
completed as part of the next working session.

| Phase | Work | Blocked on |
|---|---|---|
| **15 — Dev DB + Migration Artifact** | Create Neon branch; `prisma migrate dev`; review + commit migration | Mattia: create Neon branch (10 min) |
| **16 — `PlatformAccount` Write Path** | Persist Steam `PlatformAccount` on NextAuth Steam login; update sync status | Gates 1–3 above |
| **17 — Real Steam Sync MVP** | Flip `DRY_RUN=false`; add `STEAM_API_KEY` to Vercel; `execute`-mode `PlatformSyncRun`; persist `PlatformDetectedGame` + `UserGame`; route unmatched to review queue | Gate 4 above; Steam login working |
| **18 — Profile/Stats from DB** | Profile Games, Stats, Rankings read from `UserGame` (replace mock) | Phase 17 complete |
| **19 — PSN Revalidation** | Validate PSN auth path; build `psnClient.js` mirroring Steam; PSN adapter | Phase 17 validated in prod |

---

## Decision checklist for Francesco and Mattia

Copy this into the next team sync and tick items off:

### Immediate (before Phase 15 starts)

- [ ] **Who creates the Neon dev branch?** → Mattia (Neon access)
- [ ] **Where is the `DATABASE_URL` for the dev branch stored?** → `.env.local` on
      Francesco's machine; never committed; never in Vercel production
- [ ] **Who reviews the migration SQL?** → Francesco (generates it); Mattia (approves it)
- [ ] **Who runs `prisma migrate deploy` to production?** → Francesco with Mattia's
      explicit approval and a Neon restore point confirmed first
- [ ] **Is the Neon free tier sufficient for branching?** → Yes (free tier supports
      branching); confirm in the Neon console

### Before Phase 16 (`PlatformAccount` write path)

- [ ] Migration applied to production → confirmed
- [ ] `_prisma_migrations` table exists in Neon → confirmed
- [ ] The 5 new tables exist in production, NextAuth tables unchanged → confirmed
- [ ] `npm run build` still passes against production schema

### Before Phase 17 (real Steam sync)

- [ ] `STEAM_API_KEY` added to **Vercel environment variables** (not committed)
- [ ] `DRY_RUN` flag flipped to `false` only in a reviewed PR
- [ ] `PlatformAccount` write path confirmed working in production
- [ ] Steam login working end-to-end (NextAuth Steam JWT provides `steamid64`)
- [ ] Steam profile visibility handling confirmed (private profile → clear UX message)

---

## What Phase 14 does NOT do

- No runtime code changes
- No schema changes
- No migration applied (not even against the dev branch)
- No `.env` files touched
- No Vercel, Neon, or OAuth settings changed
- No real Steam or PSN API calls
- No secrets committed

This phase produces only this document. All actions above are manual steps for
the team to execute in Phase 15 and beyond.

---

## Phase 15 outcome (Dev/Staging Migration Artifact)

**Status: artifact committed. Dev/staging application pending DB owner.**

The official Prisma migration artifact was created at:

```
prisma/migrations/20260627000000_platform_sync_persistence/migration.sql
```

- Generated from the reviewed draft SQL in `prisma/migrations-draft/`
- Content verified: 5 new tables only (`PlatformAccount`, `PlatformSyncRun`,
  `PlatformDetectedGame`, `GameExternalSource`, `UserGame`)
- All additive: `CREATE TABLE`, indexes, unique constraints, FKs only — no `DROP`,
  no `ALTER … DROP`, no destructive operations
- Matches the Prisma schema exactly: column types, defaults, relations, idempotency constraints
- `prisma validate` and `prisma generate` require internet access (Prisma engine
  binary download) — confirmed to work on Vercel; blocked in the cloud sandbox

### Still required before production (DB owner: Mattia)

Run these against **dev/staging only** first (with the dev `DATABASE_URL` in `.env.local`):

```bash
npx prisma migrate status    # should show 1 pending migration
npx prisma migrate deploy    # apply to dev/staging
npx prisma generate          # regenerate client
npm run build                # confirm build passes
```

Then, with a Neon production restore point confirmed and Mattia's explicit approval:

```bash
# Switch DATABASE_URL to production (Vercel env / local override)
npx prisma migrate deploy    # apply to production
```

See `docs/MIGRATION_READINESS_CHECKLIST.md` sections D–H for the full approval gate.
