# Leet9 QA Checklist

A practical, area-by-area manual QA backlog for the Leet9 web app. Check items
off against a Vercel preview (or production) build with a signed-in user.

## Status

Manual QA is **deferred**. The app has been built and validated with automated
`lint` + `build` and basic unauthenticated API smoke tests only. A full manual
QA pass (owner: Mattia) **must be completed before any public release or real
Steam/PSN data integration**. Until then, treat all data as mock and all stats
as illustrative.

## Environment

- [ ] GitHub `main` branch is the source of truth
- [ ] Tested on Vercel preview deployment
- [ ] Tested on Vercel production deployment
- [ ] Signed in as an authenticated user
- [ ] Google login available
- [ ] Steam login available (if configured)
- [ ] Desktop browser pass first
- [ ] Mobile / responsive pass later

## Landing & Auth

- [ ] Landing page loads
- [ ] Logo is visible
- [ ] ENTER flow works
- [ ] Google login works
- [ ] Steam login works (if configured)
- [ ] Sign out returns to landing
- [ ] Unauthenticated `/app` redirects to landing

## App Shell

- [ ] Sidebar renders
- [ ] TopBar renders
- [ ] Navigation active states work
- [ ] `/app` redirects to `/app/discovery`
- [ ] `/dashboard` redirects to `/app`
- [ ] No blocking console errors

## Discovery

- [ ] Discovery page loads
- [ ] Search works
- [ ] Platform filters work
- [ ] Sort controls work
- [ ] Trending section works
- [ ] Recently detected section works
- [ ] No duplicate canonical games
- [ ] Game cards show source platform badges
- [ ] Game cards open Game Deep Dive
- [ ] Discovery shows at least one Steam-only game (e.g. Hollow Knight)
- [ ] Discovery shows at least one PSN-only game (e.g. God of War Ragnarök)
- [ ] Discovery shows a Steam+PSN game once with both badges (e.g. Elden Ring)

## Game Deep Dive

- [ ] Page loads for valid `gameId`
- [ ] Back to Discovery works
- [ ] Community stats render
- [ ] External sources render
- [ ] User stats render if available
- [ ] Add to Profile mock action shows confirmation
- [ ] Already-in-profile state works

## Profile Overview

- [ ] Overview tab loads
- [ ] Profile hero renders
- [ ] Platform badges render
- [ ] Rank progress renders
- [ ] Signature games render
- [ ] Trophy case renders
- [ ] Recent activity renders
- [ ] Nearby players render
- [ ] Share card placeholder is non-functional by design

## Profile Games

- [ ] Games tab loads
- [ ] Search works
- [ ] Platform filter works
- [ ] Sort works
- [ ] Game cards show L9 / hours / mastery / achievements
- [ ] Game cards link to Game Deep Dive

## Profile Stats

- [ ] Stats tab loads
- [ ] Summary cards render (total L9, hours, games tracked, active games, achievements, profile completeness)
- [ ] L9 point breakdown renders with composition bar
- [ ] Platform confidence renders with per-platform confidence labels
- [ ] Gamer DNA renders with score bars
- [ ] Momentum renders (this month vs last, MoM %, monthly mini-chart, streak)
- [ ] Mastery summary renders (average %, above 80/50 counts, highest game)
- [ ] Rarity breakdown renders
- [ ] Top games by hours render and link to Game Deep Dive
- [ ] Genre distribution renders
- [ ] Explainability copy is visible (each signal says what it is "based on")
- [ ] Confidence language is visible
- [ ] Unauthenticated `/api/me/stats` returns `UNAUTHENTICATED`

## Profile Tribe

- [ ] Tribe tab loads
- [ ] Tribe hero renders (name, tag, motto)
- [ ] Tribe emblem / initials render
- [ ] Current user role renders (Your role badge in hero)
- [ ] Tribe stats render (total L9, members/max, unique games, achievements, global rank)
- [ ] Most-played games render
- [ ] Most-played games link to Game Deep Dive
- [ ] Members list renders
- [ ] Current user member is highlighted (YOU badge + lime row)
- [ ] Role badges render (founder / council / member)
- [ ] Placeholder actions are clearly non-functional (disabled, "not active yet")
- [ ] Unauthenticated `/api/me/tribe` returns `UNAUTHENTICATED`
- [ ] Unauthenticated `/api/tribes/[tribeId]` returns `UNAUTHENTICATED`
- [ ] Unauthenticated `/api/tribes/[tribeId]/members` returns `UNAUTHENTICATED`
- [ ] `/api/tribes/[tribeId]` with an unknown id returns `TRIBE_NOT_FOUND` (404) when signed in

## Rankings

- [ ] Rankings page loads
- [ ] Player Rankings tab loads
- [ ] Current user is highlighted
- [ ] Player scope filters work (Global / Friends / Tribe)
- [ ] Game Rankings tab loads
- [ ] Game sort / filter controls work
- [ ] Game rows link to Game Deep Dive
- [ ] Tribe Rankings tab loads
- [ ] Current user tribe is highlighted
- [ ] No tribe management actions exist

## Platform Integration Readiness

Mock-backed platform-agnostic readiness (no real Steam/PSN sync yet).

- [ ] Platform Sources section renders on Profile Overview
- [ ] Steam status renders (connected)
- [ ] PSN status renders (not connected)
- [ ] PSN placeholder connect CTA is clearly non-functional (disabled, "Soon")
- [ ] Each platform shows what it contributes (library / achievements / trophies / playtime)
- [ ] Last sync status renders for connected Steam
- [ ] "Real platform sync coming later" note is visible
- [ ] Discovery shows a Steam-only game
- [ ] Discovery shows a PSN-only game
- [ ] Discovery shows a Steam+PSN game once with both badges
- [ ] No duplicate canonical games appear in Discovery
- [ ] `/api/platforms` returns supported providers and capabilities (200)
- [ ] `/api/platforms/detected-games` (signed in) returns matched + unmatched detections
- [ ] Same game detected on Steam + PSN collapses to one canonical game
- [ ] Unmatched detected game is reported separately (not added to Discovery)
- [ ] Unauthenticated `/api/me/platform-accounts` returns `UNAUTHENTICATED`
- [ ] Unauthenticated `/api/platforms/detected-games` returns `UNAUTHENTICATED`

## API / Auth Smoke Tests

When signed out, each protected endpoint should return HTTP 401 with
`{ ok: false, error: { code: "UNAUTHENTICATED" } }`.

- [ ] Unauthenticated `/api/me` returns 401
- [ ] Unauthenticated `/api/me/profile` returns 401
- [ ] Unauthenticated `/api/me/games` returns 401
- [ ] Unauthenticated `/api/me/activity` returns 401
- [ ] Unauthenticated `/api/me/stats` returns 401
- [ ] Unauthenticated `/api/rankings/players` returns 401
- [ ] Unauthenticated `/api/rankings/games` returns 401
- [ ] Unauthenticated `/api/rankings/tribes` returns 401
- [ ] Unauthenticated `/api/me/tribe` returns 401
- [ ] Unauthenticated `/api/tribes/tribe_neon_wolves` returns 401
- [ ] Unauthenticated `/api/tribes/tribe_neon_wolves/members` returns 401
- [ ] Unauthenticated `/api/me/platform-accounts` returns 401
- [ ] Unauthenticated `/api/platforms/detected-games` returns 401
- [ ] `/api/platforms` returns 200 (public metadata)

## Steam Sync Preparation (Phase 9)

Dry-run only — no real Steam API is called, nothing is persisted.

- [ ] `GET /api/integrations/steam/sync-preview` returns 401 when signed out
- [ ] `GET /api/integrations/steam/sync-preview` (signed in) returns `mode: "dry_run"`
- [ ] Response includes `provider: "steam"`
- [ ] `summary.rawGamesDetected` is > 0
- [ ] `matchedGames` contains games with valid `canonicalGameId`
- [ ] `unmatchedGames` contains games with no canonical mapping
- [ ] `plannedUserGameCreates` and `plannedUserGameUpdates` are clearly separated
- [ ] `warnings` array is present and non-empty
- [ ] `dryRunNote` confirms no data was persisted
- [ ] Platform Sources section shows Steam Library Sync readiness card
- [ ] Steam readiness card shows "PREPARED" badge
- [ ] Steam readiness "Preview sync" button is disabled (not clickable)
- [ ] No real Steam API call is made (no STEAM_API_KEY required)
- [ ] No env vars or secrets are required for the sync preview

## Platform Sync Persistence Model (Phase 10)

Schema/docs/pure-helper only — no runtime DB wiring, no real sync.

- [ ] Prisma schema includes `PlatformAccount`
- [ ] Prisma schema includes `PlatformSyncRun`
- [ ] Prisma schema includes `PlatformDetectedGame`
- [ ] Prisma schema includes `GameExternalSource`
- [ ] Prisma schema includes `UserGame`
- [ ] `PlatformAccount` is distinct from NextAuth's `Account` (NextAuth models unchanged)
- [ ] Platform connection statuses match official vocabulary (connected/disconnected/needs_reauth/unavailable)
- [ ] Sync statuses match official vocabulary (idle/syncing/success/failed/partial)
- [ ] Idempotency constraints present (unique userId+provider, account+provider+externalGameId, provider+externalGameId, userId+canonicalGameId)
- [ ] `npx prisma format` succeeds
- [ ] `npx prisma validate` reports the schema is valid
- [ ] Migration file created OR migration limitation documented (local DB/env unavailable)
- [ ] `lib/platforms/persistenceMapping.js` is pure (no DB writes, no Prisma client import)
- [ ] No runtime DB reads/writes added — current mock product routes still work
- [ ] `/api/integrations/steam/sync-preview` remains dry-run only
- [ ] No real Steam API calls are made
- [ ] No real PSN API calls are made
- [ ] No `.env`/secrets are changed

## DB Safety + Migration Readiness (Phase 11)

Docs/safety only — no production migration, no DB mutation.

- [ ] `docs/DB_MIGRATION_SAFETY.md` exists
- [ ] `docs/MIGRATION_READINESS_CHECKLIST.md` exists
- [ ] Inert draft SQL exists at `prisma/migrations-draft/0001_platform_sync_persistence.draft.sql`
- [ ] `prisma/migrations/` (real, auto-applied) directory does NOT exist
- [ ] No production migration was run (no `migrate dev`/`deploy`/`db push`/`reset`)
- [ ] No database was mutated; no DB connection was made
- [ ] No `.env`/secrets changed; no `STEAM_API_KEY` added
- [ ] No runtime DB write path added (current routes still mock-backed)
- [ ] `/api/integrations/steam/sync-preview` remains dry-run only
- [ ] `npx prisma validate` still passes
- [ ] `npm run build` still passes
- [ ] No real Steam/PSN API calls
- [ ] `npm run db:safety-check` runs, prints guidance, exits 0 (no DB connection)

## Legacy Mobile/Backend Audit (Phase 12)

Docs-only strategic audit — no runtime, DB, schema, or behavior change.

- [ ] `docs/LEGACY_MOBILE_BACKEND_AUDIT.md` exists
- [ ] `docs/LEGACY_AUDIT_ACTION_PLAN.md` exists
- [ ] Legacy source inventory included (found + missing + confidence level)
- [ ] Current web product mapping included (legacy → web equivalent)
- [ ] Keep / redesign / defer / discard decisions included (decision log)
- [ ] Open strategic questions for Francesco/Mattia listed
- [ ] No runtime behavior changed
- [ ] No DB/schema changes
- [ ] No migrations run
- [ ] No secrets/env/settings touched
- [ ] GitHub repo inventory included (`LEGACY_MOBILE_BACKEND_AUDIT.md` §13)
- [ ] Archive/deletion candidates clearly marked
- [ ] Deletion risk levels (low/medium/high) included
- [ ] No repo deletion/archive/rename/transfer/visibility/settings changes performed
- [ ] Owner (Francesco/Mattia) review required before any repo cleanup
- [ ] Current Leet9 web repo (`landing.v1`) remains the only modified repo

## Legacy Ingestion Extraction (Phase 13)

Docs-only extraction/mapping — no real Steam/PSN calls, no runtime/DB changes.

- [ ] `docs/LEGACY_INGESTION_EXTRACTION.md` exists
- [ ] `docs/LEGACY_INGESTION_PORTING_PLAN.md` exists
- [ ] Legacy Steam ingestion inspected (files/functions/endpoints listed)
- [ ] Legacy PSN ingestion inspected (auth path, library, fields listed)
- [ ] Source files listed (game-service repository/services/helpers, cron, shared models)
- [ ] Env var **names** listed without values (e.g. `STEAM_APIKEY`, `ENCRYPT_SECRET`, `ENCRYPT_IV`)
- [ ] Reusable pieces identified (endpoints, parsers, anti-gaming rules)
- [ ] Rewrite/defer/discard decisions made (storage, matching, scoring separation)
- [ ] Mapping to `PlatformAccount` / `PlatformSyncRun` / `PlatformDetectedGame` / `GameExternalSource` / `UserGame` included
- [ ] PSN marked as needs-revalidation (unofficial API + NPSSO)
- [ ] No runtime code changed
- [ ] No DB/schema/migration changes
- [ ] No secrets/env/settings changed
- [ ] No real Steam/PSN API calls made

## Platform Status Vocabulary Consistency

Before any real Steam/PSN integration, verify the official vocabulary is used
everywhere. Constants live in `lib/platforms/platforms.js`.

Connection status values (must be one of):
- `connected` · `disconnected` · `needs_reauth` · `unavailable`

Sync status values (must be one of):
- `idle` · `syncing` · `success` · `failed` · `partial`

- [ ] `lib/mock/platformAccounts.js` uses only official `status` values
- [ ] `lib/mock/platformAccounts.js` uses only official `syncStatus` values
- [ ] `/api/me/platform-accounts` response includes `statusLabel` and `syncStatusLabel`
- [ ] `/api/platforms` response includes `connectionStatuses` and `syncStatuses`
- [ ] No code references old/unofficial status strings (`not_connected`, `expired`, `sync_failed`, `revoked`)
- [ ] `docs/PLATFORM_INTEGRATION_READINESS.md` vocabulary tables match `lib/platforms/platforms.js`

## Dev/Staging Migration Artifact (Phase 15)

Official migration artifact committed — dev/staging application and production
application are manual steps for the DB owner.

- [ ] `prisma/migrations/20260627000000_platform_sync_persistence/migration.sql` exists
- [ ] Migration is under `prisma/migrations/` (not `migrations-draft/`)
- [ ] Draft at `prisma/migrations-draft/0001_platform_sync_persistence.draft.sql` still present as reference
- [ ] Migration SQL is additive only: 5 `CREATE TABLE` + indexes + FKs, no `DROP`
- [ ] Tables: `PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`, `GameExternalSource`, `UserGame`
- [ ] Unique constraints: `userId+provider`, `platformAccountId+provider+externalGameId`, `provider+externalGameId`, `userId+canonicalGameId`
- [ ] FK cascade rules match schema (`ON DELETE CASCADE` / `SET NULL`)
- [ ] No runtime code changes in this phase
- [ ] No Prisma schema changes in this phase
- [ ] No secrets/env/settings changed
- [ ] No real Steam/PSN API calls
- [ ] Vercel preview build passes (Vercel can run `prisma generate`; sandbox cannot)
- [ ] `npm run lint` passes (0 errors, 5 pre-existing warnings)

### Phase 15 revision — P3005 baseline (this PR update)

Staging `migrate deploy` failed with `P3005 (database schema is not empty)` — the
non-empty staging clone has no Prisma migration history. Fixed by baselining.

- [ ] `prisma/migrations/migration_lock.toml` exists (`provider = "postgresql"`)
- [ ] Baseline migration `prisma/migrations/20260101000000_existing_production_baseline/migration.sql` exists
- [ ] Baseline SQL = existing NextAuth schema (`Account`, `Session`, `User`, `VerificationToken`)
- [ ] Baseline timestamp is earlier than the platform-sync migration
- [ ] Baseline + platform-sync compose to the current `prisma/schema.prisma` (verified offline via `prisma migrate diff`)
- [ ] `prisma/migrations/README.md` documents P3005 + baseline strategy + exact commands
- [ ] `prisma validate` passes (placeholder `DATABASE_URL`, no DB connection)
- [ ] No production DB mutated; no `migrate resolve`/`deploy`/`db push`/`reset` run by the agent
- [ ] **Pending (DB owner, staging clone ONLY):** `prisma migrate resolve --applied 20260101000000_existing_production_baseline`
- [ ] **Pending (DB owner, staging clone ONLY):** `prisma migrate deploy` → then `migrate status` shows no pending
- [ ] **Pending (Mattia approval):** same baseline+deploy sequence against production with restore point confirmed
- [ ] **PR #20 stays blocked** until baseline + deploy succeed cleanly on the staging clone

## DB Staging and Migration Path (Phase 14)

Docs-only decision record — no runtime, DB, schema, or settings change.

- [ ] `docs/DB_STAGING_AND_MIGRATION_PATH.md` exists
- [ ] Option A (Neon branch, recommended) and Option B (prod-only, not recommended) documented
- [ ] Migration commands policy table present (allowed anytime / dev only / prod with approval / forbidden)
- [ ] Four gates before `PlatformAccount` write path documented
- [ ] Decision checklist for Francesco/Mattia present
- [ ] Recommended phase sequence (Phase 15–19) included
- [ ] No runtime code changed
- [ ] No DB/schema/migration changes
- [ ] No secrets/env/settings changed
- [ ] No real Steam/PSN API calls made
- [ ] `docs/PROJECT_HANDOFF.md` updated with Phase 14 entry
- [ ] `docs/QA_CHECKLIST.md` updated with Phase 14 section

## Regression Before Real Data

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No secrets committed
- [ ] No `.env` changes
- [ ] Main pages work after refresh
- [ ] Protected routes behave correctly
- [ ] Core product loop works:
      login → Discovery → Game Deep Dive → Add to Profile → Profile Games → Rankings

## Known Deferred QA

Not manually tested yet:

- [ ] Signed-in full browser QA
- [ ] Mobile responsiveness
- [ ] Vercel production smoke test
- [ ] Steam provider real login (if not configured)
- [ ] Cross-browser pass
- [ ] Accessibility pass
- [ ] Tribe management/admin (create, invite, leave, kick, promote, role transfer, settings) — deferred, not built
