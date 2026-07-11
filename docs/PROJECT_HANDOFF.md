# Leet9 Project Handoff

A closeout checkpoint for anyone taking over the Leet9 web MVP. The core
product shell is complete and mock-backed; real Steam sync is now live
end-to-end on production.

## Repo

- **Repo:** `Leet9-Dev/landing.v1`
- **Local path:** `~/Desktop/landing.v1`
- **Latest main:** `9c881ee feat: real Steam API integration — validate, preview, execute sync (#24)`
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, NextAuth (Google +
  Steam), Prisma + Postgres (Neon). Prisma persists NextAuth tables and all
  platform-sync tables (`PlatformAccount`, `PlatformSyncRun`,
  `PlatformDetectedGame`, `GameExternalSource`, `UserGame`). JavaScript
  (`.js/.jsx`), inline styles.

## Merged phases

| Phase | Title | PR |
| --- | --- | --- |
| 1 | App Shell (auth shell, `/app`, sidebar, topbar, nav) | #4 |
| 2 | Discovery Vertical Slice | #6 |
| 3 | Profile Vertical Slice (Overview + Games) | #7 |
| 4 | Rankings Vertical Slice (Players, Games, Tribes) | #8 |
| 5 | Profile Stats Vertical Slice | #9 |
| 6 | Lightweight Tribe Vertical Slice | #10 |
| 7 | Platform Integration Readiness | #11 |
| 8 | Contract & Data Model Alignment | #13 |
| 9 | Steam Library Sync Preparation (dry-run) | #14 |
| 10 | Platform Sync Persistence Model (Prisma schema; no runtime wiring) | #15 |
| 11 | DB Safety + Migration Readiness (docs/safety; no migration applied) | #16 |
| 12 | Legacy Mobile/Backend Audit (docs-only strategic audit) | #17 |
| 13 | Legacy Steam/PSN Ingestion Extraction (docs-only) | #18 |
| 14 | DB/Staging Decision + Migration Path (docs-only) | #19 |
| 15 | Dev/Staging Migration Artifact (official Prisma migration + P3005 baseline) | #20 |
| 16 | Mobile sidebar fix + BottomNav | #21 |
| 17 | PlatformAccount Write Path (first real DB read/write; manual identity) | #22 |
| 18 | Real Steam API — validate, preview, execute sync (live end-to-end) | #24 |

The product triangle — **Discovery** (what games exist in the community),
**Profile** (who I am as a gamer), **Rankings** (how I compare) — is complete and
mock-backed end to end, plus a lightweight Tribe community layer and
full Steam platform integration live on production.

## Product routes

- `/` — landing page (ENTER → Google / Steam login)
- `/dashboard` — redirects to `/app`
- `/app` — protected; redirects to `/app/discovery`
- `/app/discovery` — Discovery grid (search, platform filter, sort, sections)
- `/app/discovery/[gameId]` — Game Deep Dive (+ Add to Profile mock action)
- `/app/profile` — tabbed: **Overview**, **Games**, **Stats**, **Tribe**
  (Overview includes a live DB-backed Platform Sources section)
- `/app/rankings` — tabbed: **Players**, **Games**, **Tribes**

All `/app/*` routes are protected by the session guard in `app/app/layout.js`.

## API routes

Auth
- `…/api/auth/[...nextauth]` — NextAuth (Google + Steam)

Discovery / Games
- `GET /api/discovery/games` — catalogue; source badges derived from external sources
- `GET /api/games/[gameId]` — game detail + external sources + current user game
- `POST /api/me/games/[gameId]/add` — add to profile (mock)

Current user / Profile (mock-backed)
- `GET /api/me` · `GET /api/me/profile` · `GET /api/me/games` ·
  `GET /api/me/activity` · `GET /api/me/stats`

Rankings (mock-backed)
- `GET /api/rankings/players` · `GET /api/rankings/games` · `GET /api/rankings/tribes`

Tribe (mock-backed)
- `GET /api/me/tribe` · `GET /api/tribes/[tribeId]` · `GET /api/tribes/[tribeId]/members`

Platforms (Phase 7)
- `GET /api/platforms` — **public** provider metadata + capabilities
- `GET /api/platforms/detected-games` — normalized detections + canonical mapping (mock)

Platform accounts (**real DB**)
- `GET /api/me/platform-accounts` — current user's `PlatformAccount` rows (safe DTOs)
- `POST /api/me/platform-accounts` — connect/reconnect; validates steamid64 via
  `GetPlayerSummaries` when `STEAM_API_KEY` is set; stores real persona name
- `DELETE /api/me/platform-accounts` — soft-disconnect (status → `disconnected`,
  row preserved for audit/reconnect)

Steam sync (**real, live**)
- `GET /api/integrations/steam/sync-preview` — dry-run plan using real Steam library
  when `STEAM_API_KEY` + connected account present; fixture fallback otherwise
- `POST /api/integrations/steam/sync-execute` — **execute sync**: fetches real
  Steam library, upserts `PlatformDetectedGame` + `UserGame` idempotently,
  stamps `PlatformSyncRun`; requires `STEAM_API_KEY` + connected account

All `/api/me/*`, `/api/rankings/*`, `/api/tribes/*`, and
`/api/platforms/detected-games` require a session (return
`UNAUTHENTICATED` / HTTP 401 when signed out). `/api/discovery/*`,
`/api/games/*`, and `/api/platforms` are currently public. Responses use the
`{ ok, data, meta }` envelope from `lib/api/response.js`.

## Live vs mock-backed areas

**Live (real DB reads/writes):**
- `PlatformAccount` — connect/disconnect, auto-created on Steam OAuth login
- `PlatformSyncRun` — created + stamped on each execute sync
- `PlatformDetectedGame` — upserted idempotently on execute sync
- `UserGame` — upserted idempotently on execute sync (matched games only)

**Still mock-backed** (`lib/mock/*.js`):
- `currentUser`, `platformDetectedGames` (for mock display)
- `games`, `gameExternalSources` (used for canonical matching in sync)
- `profile` (signature games, friends), `activity`, `achievements`, `statsSummary`
- `rankings` (players), `tribes` (tribe rankings), `tribe` (detail + members)
- Profile → Games, Stats, Rankings still read mock data

Platform contracts live in `lib/platforms/` (`platforms.js`,
`normalization.js`, `canonicalMatching.js`).

## Steam integration (live)

- `STEAM_API_KEY` is set in Vercel (Production + Preview)
- Auto-connect: Steam OAuth login → `PlatformAccount` upserted via `signIn` callback in `lib/auth.js`
- Manual connect: user enters steamid64 in Profile → Platform Sources UI
- Validation: `GetPlayerSummaries` called on connect to verify account + fetch persona name
- Preview sync: `GET /api/integrations/steam/sync-preview` uses real `GetOwnedGames`
- Execute sync: `POST /api/integrations/steam/sync-execute` persists games idempotently
- Canonical matching still uses `MOCK_EXTERNAL_SOURCES` — a future phase seeds `GameExternalSource` from real data

## Database state

**Production (Neon — Leet9 project, production branch):**
- NextAuth tables: `User`, `Account`, `Session`, `VerificationToken` ✅
- Platform-sync tables: `PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`,
  `GameExternalSource`, `UserGame` ✅ (applied via Neon SQL Editor, Jul 11 2026)
- Migration history: both entries recorded in `_prisma_migrations` ✅
- `STEAM_API_KEY`: set in Vercel Production + Preview ✅

**Staging (Neon — Leet9 project, staging branch):**
- Full clone of production at branch time; migration validated here first ✅

**Migration artifacts** (`prisma/migrations/`):
- `20260101000000_existing_production_baseline` — NextAuth schema baseline (mark-applied only on existing DBs)
- `20260627000000_platform_sync_persistence` — 5 platform-sync tables (additive only)
- `migration_lock.toml` + `README.md` with full baseline strategy docs

## Important docs

- `docs/QA_CHECKLIST.md` — area-by-area manual QA backlog (deferred; owner: Mattia)
- `docs/PLATFORM_INTEGRATION_READINESS.md` — platform-agnostic architecture, normalized
  ingestion flow, canonical matching, official status vocabulary, and future steps
- `docs/STEAM_SYNC_PREPARATION.md` — Phase 9: what was prepared, what must happen before
  real sync, normalized shape, dry-run plan shape, persistence needs, PSN parity note
- `docs/PLATFORM_SYNC_PERSISTENCE_MODEL.md` — Phase 10: the Prisma models behind the
  normalized flow, idempotency rules, dry_run vs execute, migration notes
- `docs/DB_MIGRATION_SAFETY.md` — Phase 11: DB reality, forbidden commands, safe
  production-migration process, rollback considerations
- `docs/MIGRATION_READINESS_CHECKLIST.md` — Phase 11: step-by-step checklist (A–H)
- `docs/LEGACY_MOBILE_BACKEND_AUDIT.md` — Phase 12: audit of legacy iOS + backend
- `docs/LEGACY_AUDIT_ACTION_PLAN.md` — Phase 12: follow-up checklist
- `docs/LEGACY_INGESTION_EXTRACTION.md` — Phase 13: Steam/PSN ingestion extraction
- `docs/LEGACY_INGESTION_PORTING_PLAN.md` — Phase 13: Steam/PSN port checklists
- `docs/DB_STAGING_AND_MIGRATION_PATH.md` — Phase 14: decision record, migration
  commands policy, four gates, recommended phase sequence
- `prisma/migrations/README.md` — baseline strategy, P3005 explanation, exact
  staging + production migration commands

## Legacy GitHub repos (Phase 12 inventory)

- **Keep active:** `landing.v1`, `leet9-product-architecture`.
- **Keep as reference:** `leet9-game-service`, `leet9-shared-service`,
  `leet9-user-service`, `leet9-ios`, `leet9-android`, `leet9-cron`.
- **Archive candidates:** `leet9-blockchain-service`, `leet9-notification-service`,
  `leet9-email-service`, `leet9-api-gateway`.
- **Deletion candidates:** `demo-repository`, `refactored-funicular-demo-repository`,
  `PWA_V1` — owner review required.
- **No repos were deleted, archived, or changed.** All cleanup requires owner approval.

## Important product rule

**Leet9 is platform-agnostic. Steam and PSN are first-class game-data sources.**
Raw platform data must be normalized into Leet9-owned models before powering
Discovery, Profile, Stats, Rankings, or future Competitions. The required flow:

```
Connected Platform Account
  → Raw Detected Platform Game
  → Normalized Detected Game
  → GameExternalSource (platform externalId → canonical gameId)
  → Canonical Game
  → UserGame
  → Discovery / Profile / Stats / Rankings
```

Steam and PSN versions of the same title map to **one** canonical Game and appear
**once** in Discovery with badges for every detected platform.

## Not built yet

- Profile / Stats / Rankings from real DB data (still mock-backed)
- Real PSN sync — gated on secure credential handling (no NPSSO stored);
  revalidate access path before building (see `docs/LEGACY_INGESTION_EXTRACTION.md`)
- Competitions / competition scoring
- Rewards / marketplace
- Wallet / blockchain / NFT
- Game downloads
- Real tribe management (create / invite / leave / kick / promote / settings)
- `GameExternalSource` seeded from real data (canonical matching uses mock sources)

## Recommended next phases

| Phase | Work |
|---|---|
| **19 — Profile/Stats from DB** | Replace mock Profile Games, Stats, Rankings with real `UserGame` reads after a sync |
| **20 — PSN Revalidation** | Validate PSN auth path (NPSSO security design); build `psnClient.js` mirroring Steam |
| **21 — GameExternalSource seeding** | Seed `GameExternalSource` from real Steam/PSN data so unmatched games get canonical IDs |

## Deferred QA (owner: Mattia)

- Signed-in full browser QA across all tabs and the core product loop
- Mobile / responsive pass
- Vercel production smoke test
- Steam real login end-to-end + cross-browser pass
- Accessibility pass
- Confirm every protected endpoint returns 401 when signed out

## Validation status

`npm run lint` → 0 errors (5 pre-existing warnings). `npm run build` → succeeds,
all routes registered. Production migration applied. `STEAM_API_KEY` live on Vercel.
No secrets committed.
