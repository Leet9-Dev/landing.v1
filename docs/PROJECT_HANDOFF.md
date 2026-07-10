# Leet9 Project Handoff

A closeout checkpoint for anyone taking over the Leet9 web MVP. The app is a
modular, mock-backed product shell; no real platform sync or persistent product
data exists yet.

## Repo

- **Repo:** `Leet9-Dev/landing.v1`
- **Local path:** `~/Desktop/landing.v1`
- **Latest main:** `548c8ea feat: add platform account write path (#22)`
  (Phase 17 — Steam Account Validation + Sync Preview — is in its own branch/PR on top of this)
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, NextAuth (Google +
  Steam), Prisma + Postgres (Neon). As of Phase 16, Prisma persists NextAuth
  **and** the first product record (`PlatformAccount`). JavaScript (`.js/.jsx`),
  inline styles.

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
| 16 | PlatformAccount Write Path (first real DB read/write; auth-only) | #22 |
| 17 | Steam Validation + Sync Preview (real Steam API; PlatformSyncRun + PlatformDetectedGame) | pending |

The product triangle — **Discovery** (what games exist in the community),
**Profile** (who I am as a gamer), **Rankings** (how I compare) — is complete and
mock-backed end to end, plus a lightweight Tribe community layer and
platform-integration readiness for Steam + PSN.

## Product routes

- `/` — landing page (ENTER → Google / Steam login)
- `/dashboard` — redirects to `/app`
- `/app` — protected; redirects to `/app/discovery`
- `/app/discovery` — Discovery grid (search, platform filter, sort, sections)
- `/app/discovery/[gameId]` — Game Deep Dive (+ Add to Profile mock action)
- `/app/profile` — tabbed: **Overview**, **Games**, **Stats**, **Tribe**
  (Overview includes a read-only Platform Sources section)
- `/app/rankings` — tabbed: **Players**, **Games**, **Tribes**

All `/app/*` routes are protected by the session guard in `app/app/layout.js`.

## API routes (all mock-backed)

Auth
- `…/api/auth/[...nextauth]` — NextAuth (Google + Steam)

Discovery / Games
- `GET /api/discovery/games` — catalogue; source badges derived from external sources
- `GET /api/games/[gameId]` — game detail + external sources + current user game
- `POST /api/me/games/[gameId]/add` — add to profile (mock)

Current user / Profile
- `GET /api/me` · `GET /api/me/profile` · `GET /api/me/games` ·
  `GET /api/me/activity` · `GET /api/me/stats`

Rankings
- `GET /api/rankings/players` · `GET /api/rankings/games` · `GET /api/rankings/tribes`

Tribe
- `GET /api/me/tribe` · `GET /api/tribes/[tribeId]` · `GET /api/tribes/[tribeId]/members`

Platforms (Phase 7)
- `GET /api/platforms` — **public** provider metadata + capabilities
- `GET /api/platforms/detected-games` — normalized detections + canonical mapping (mock)

Platform accounts (Phase 16 — **first real DB read/write**)
- `GET /api/me/platform-accounts` — current user's `PlatformAccount` rows from the DB (safe DTOs)
- `POST /api/me/platform-accounts` — connect/reconnect from a safe public identifier
  (Steam steamid64 / PSN onlineId); upserts by `userId+provider`, marks `connected`.
  No Steam/PSN API call, no library sync, no NPSSO/token storage.
- `DELETE /api/me/platform-accounts` — **soft-disconnect** (status → `disconnected`,
  keep the row + history; never deletes related sync/detected-game/user-game data).
- All three are authenticated; `userId` is derived from the session, never from the client.

Steam integration (Phase 9 mock + Phase 17 real)
- `GET /api/integrations/steam/sync-preview` — legacy **mock** dry-run plan (no persistence, no real Steam call)
- `POST /api/integrations/steam/validate` — **real** Steam API (`GetPlayerSummaries`);
  validates the user's connected steamID64, stores safe public profile fields
  (persona/avatar/visibility/`lastValidatedAt`) on `PlatformAccount.metadata`. No library.
- `POST /api/integrations/steam/sync-preview` — **real** Steam API (`GetOwnedGames`).
  `mode:"preview"` (default) reads + normalizes in memory, **saves nothing**;
  `mode:"execute"` records a `PlatformSyncRun` and idempotently upserts
  `PlatformDetectedGame` rows (unmatched). No canonical matching, no `UserGame`,
  no Discovery/Profile/Stats/Rankings impact. Requires server `STEAM_API_KEY`
  (else 503 `STEAM_NOT_CONFIGURED`).

All `/api/me/*`, `/api/rankings/*`, `/api/tribes/*`, and
`/api/platforms/detected-games` require a session (return
`UNAUTHENTICATED` / HTTP 401 when signed out). `/api/discovery/*`,
`/api/games/*`, and `/api/platforms` are currently public. Responses use the
`{ ok, data, meta }` envelope from `lib/api/response.js`.

## Mock-backed areas

Everything below is mock data in `lib/mock/*.js`, joined to canonical games by
`gameId` (canonical game data is never duplicated):

- `currentUser`, `platformAccounts`, `platformDetectedGames`
- `games`, `gameExternalSources`, `userGames`
- `profile` (signature games, friends), `activity`, `achievements`, `statsSummary`
- `rankings` (players), `tribes` (tribe rankings), `tribe` (detail + members)

Platform contracts live in `lib/platforms/` (`platforms.js`,
`normalization.js`, `canonicalMatching.js`).

**Exception (Phase 16):** `GET/POST/DELETE /api/me/platform-accounts` now read/write
the real `PlatformAccount` table via `lib/prisma.js` — no longer mock. The
Profile → Overview **Platform Sources** section is now DB-backed (connect/disconnect).
Note the transitional inconsistency: Profile → **Stats** "Platform Confidence"
still reads `lib/mock/platformAccounts.js` (Stats-from-DB is a later phase).

## Important docs

- `docs/QA_CHECKLIST.md` — area-by-area manual QA backlog (deferred; owner: Mattia)
- `docs/PLATFORM_INTEGRATION_READINESS.md` — platform-agnostic architecture, normalized
  ingestion flow, canonical matching, official status vocabulary, and future steps
- `docs/STEAM_SYNC_PREPARATION.md` — Phase 9: what was prepared, what must happen before
  real sync, normalized shape, dry-run plan shape, persistence needs, PSN parity note
- `docs/PLATFORM_SYNC_PERSISTENCE_MODEL.md` — Phase 10: the Prisma models behind the
  normalized flow (`PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`,
  `GameExternalSource`, `UserGame`), idempotency rules, dry_run vs execute, migration notes
- `docs/DB_MIGRATION_SAFETY.md` — Phase 11: DB reality (one prod Neon, no dev/staging),
  forbidden commands, the safe production-migration process, rollback considerations
- `docs/MIGRATION_READINESS_CHECKLIST.md` — Phase 11: step-by-step checklist (A–H) for the
  DB owner to take the Phase 10 schema from defined → applied safely
- `docs/LEGACY_MOBILE_BACKEND_AUDIT.md` — Phase 12: audit of the legacy iOS + backend
  microservices; what survives / is redesigned / deferred / discarded into the web-first product
- `docs/LEGACY_AUDIT_ACTION_PLAN.md` — Phase 12: short follow-up checklist (legacy logic to
  inspect deeper, missing design exports to request, open decisions, implementation risks,
  GitHub repo cleanup actions + owner-review checklist)
- `docs/LEGACY_INGESTION_EXTRACTION.md` — Phase 13: extraction of legacy Steam/PSN ingestion
  (endpoints, fields, edge cases, anti-gaming rules) mapped onto the new normalized model;
  Steam = adapt-as-reference, PSN = revalidate before building
- `docs/LEGACY_INGESTION_PORTING_PLAN.md` — Phase 13: Steam/PSN port checklists, data-model
  mapping, future PR sequence, and risks
- `docs/DB_STAGING_AND_MIGRATION_PATH.md` — Phase 14: the two options (Neon branch vs
  prod-only), migration commands policy, the four gates before the `PlatformAccount` write
  path, the recommended phase sequence, and the decision checklist for Francesco/Mattia

## Legacy GitHub repos (Phase 12 inventory)

- Phase 12 included a **read-only GitHub legacy repo inventory and cleanup
  recommendations** (`docs/LEGACY_MOBILE_BACKEND_AUDIT.md` §13–§14): 18 repos
  under `Leet9-Dev`, none archived.
- **Keep active:** `landing.v1`, `leet9-product-architecture`.
- **Keep as reference (preserve until real Steam sync works):** `leet9-game-service`,
  `leet9-shared-service`, `leet9-user-service`, `leet9-ios`, `leet9-android`, `leet9-cron`.
- **Archive candidates:** `leet9-blockchain-service`, `leet9-notification-service`,
  `leet9-email-service`, `leet9-api-gateway`.
- **Deletion candidates:** `demo-repository`, `refactored-funicular-demo-repository`
  (GitHub demo templates), and `PWA_V1` (empty) — owner review.
- **Needs owner review:** `leet9-api-service`, `leet9-common-service` (2023, possibly
  superseded), `leet9-project-status` (public).
- **No repos were deleted, archived, renamed, transferred, or had visibility/settings
  changed.** All repo cleanup decisions **require owner (Francesco/Mattia) approval.**

## Database state

> ⚠️ **Phase 16 production gate.** Phase 16 introduces the first real DB reads/writes
> (`PlatformAccount`). It **must not be merged/deployed to production** until: the
> baseline is marked applied on production, the `20260627000000_platform_sync_persistence`
> migration is applied to production, `prisma migrate status` is clean, and **Mattia
> confirms** — OR the feature is safely gated off production runtime. Staging validation
> already succeeded (baseline marked applied; platform-sync applied; status clean).
> The Phase 16 PR **does not run any migration** and must not be merged before this gate.

- **One Neon database, and it is production.** No dev/staging DB exists yet;
  Mattia controls Neon/Vercel DB access. (A staging/production-clone was used for
  Phase 15 migration validation.)
- Production currently holds only the **NextAuth** tables. The Phase 10 product/
  sync models exist in `prisma/schema.prisma` but **not yet in production** (applied
  to the staging clone only).
- **No production migration has been applied.** The tracked migration artifact
  now lives in `prisma/migrations/` (Phase 15, PR #20): an
  `20260101000000_existing_production_baseline` (the existing NextAuth schema) +
  `20260627000000_platform_sync_persistence` (the 5 new tables) + `migration_lock.toml`.
- **Phase 15 revision — P3005.** A staging `migrate deploy` failed with
  `P3005 (database schema is not empty)`: the staging/production-clone already has
  the NextAuth tables but **no Prisma migration history**. Fix = the **baseline
  migration** above, marked applied via
  `prisma migrate resolve --applied 20260101000000_existing_production_baseline`
  (SQL not executed on existing DBs), then `migrate deploy` for the platform-sync
  migration. Full sequence in `prisma/migrations/README.md` and
  `docs/DB_STAGING_AND_MIGRATION_PATH.md`. **PR #20 stays blocked until baseline +
  deploy succeed on the staging clone.**
- Next safe step: run the baseline `resolve` + `migrate deploy` against the Neon
  **staging/production-clone only** — never `migrate dev`/`db push`/`reset` against production.
- **DB work is paused** pending Mattia's action on Neon dev/staging setup.
  **Phases 12–14 were docs-only phases during this pause** — they change no
  runtime behavior, DB, schema, or settings. Phase 14 (`docs/DB_STAGING_AND_MIGRATION_PATH.md`)
  documents the decision: Option A (Neon branch, recommended) vs Option B
  (prod-only, not recommended), the four gates before the `PlatformAccount`
  write path, and the decision checklist for Francesco/Mattia.
  The next *technical* phase (migration artifact → `PlatformAccount` write path →
  real Steam sync) still depends on Mattia creating the Neon dev branch.

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

## Deferred QA (owner: Mattia)

Manual QA is intentionally deferred and must be completed before any public
release or real-data integration. See `docs/QA_CHECKLIST.md`. Outstanding:

- Signed-in full browser QA across all tabs and the core product loop
  (login → Discovery → Game Deep Dive → Add to Profile → Profile Games → Rankings)
- Mobile / responsive pass
- Vercel production smoke test
- Steam real login (if not configured) and cross-browser pass
- Accessibility pass
- Confirm every protected endpoint returns 401 when signed out

## Not built yet

- Steam **achievements** sync (Phase 17 syncs owned games only) and canonical
  matching (`GameExternalSource`) / `UserGame` creation — Phase 17 stores raw
  `PlatformDetectedGame` detections (unmatched) only
- Real PSN sync (library/trophies) — gated on secure credential handling; only an
  onlineId identity record is stored, no NPSSO/token
- Real database-backed **product** data — **as of Phase 17, `PlatformAccount`,
  `PlatformSyncRun`, and `PlatformDetectedGame` have live write paths, but
  Discovery, Profile, Games, Stats, Rankings, and Tribe are still mock-backed**
  (detected games do not yet flow into any product surface)
- Competitions / competition scoring
- Rewards / marketplace
- Wallet / blockchain / NFT
- Game downloads
- Real tribe management (create / invite / leave / kick / promote / settings)

## Required environment variables (Phase 17)

- `STEAM_API_KEY` — **server-only** Steam Web API key, set in **Vercel env vars**
  (never `NEXT_PUBLIC_*`, never committed). Without it, the Steam validate/sync
  endpoints return a controlled `503 STEAM_NOT_CONFIGURED` and the UI shows an
  admin/config message. The key is never logged or returned.

## Recommended next phase

**Phase 18 — Steam Canonical Game Matching.**

Phase 17 persists raw Steam detections (`PlatformDetectedGame`, `matchStatus:
"unmatched"`). The next step is the canonical-matching layer:

1. Match `PlatformDetectedGame (steam, appid)` → `GameExternalSource` → canonical
   `Game`; set `matchStatus`/`canonicalGameId`; route unmatched to a review queue.
2. Draft the `UserGame` create/update path from matched detections (behind review).
3. **Still** do not power Discovery/Profile/Stats/Rankings from synced data, and do
   not build scoring/rewards/competitions.
4. **PSN remains gated** on a secure encrypted-credential design (no NPSSO stored) —
   revalidate the access path before building PSN sync
   (`docs/LEGACY_INGESTION_EXTRACTION.md`).

**Prerequisite for running Phase 17 in production:** the platform-sync migration
must be applied to production (baseline `resolve` + `deploy`, gated on Mattia +
restore point — `prisma/migrations/README.md`) and `STEAM_API_KEY` set in Vercel.

Do not run `migrate dev`/`db push`/`deploy` against production without owner
approval.

## Suggested next commands (for Mattia)

```bash
git checkout main
git pull origin main
npm run lint
npm run build
```

## Validation status at handoff

`npm run lint` → 0 errors (5 pre-existing warnings). `npm run build` → succeeds,
all routes registered. No `.env`, OAuth, Vercel, or Neon settings were changed
across any phase; no secrets are committed.
