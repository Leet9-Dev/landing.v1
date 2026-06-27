# Leet9 Project Handoff

A closeout checkpoint for anyone taking over the Leet9 web MVP. The app is a
modular, mock-backed product shell; no real platform sync or persistent product
data exists yet.

## Repo

- **Repo:** `Leet9-Dev/landing.v1`
- **Local path:** `~/Desktop/landing.v1`
- **Latest main:** `d353520 feat: add platform sync persistence model (#15)`
  (Phase 11 — DB Safety + Migration Readiness — is in its own branch/PR on top of this)
- **Stack:** Next.js 16 (App Router, Turbopack), React 19, NextAuth (Google +
  Steam), Prisma + Postgres (Neon) for auth persistence only. JavaScript
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
| 11 | DB Safety + Migration Readiness (docs/safety; no migration applied) | pending |

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
- `GET /api/me/platform-accounts` — current user's Steam/PSN states
- `GET /api/platforms/detected-games` — normalized detections + canonical mapping

Steam sync dry-run (Phase 9)
- `GET /api/integrations/steam/sync-preview` — dry-run sync plan (no persistence, no real Steam call)

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

## Database state

- **One Neon database, and it is production.** No dev/staging DB exists yet;
  Mattia controls Neon/Vercel DB access.
- Production currently holds only the **NextAuth** tables. The Phase 10 product/
  sync models exist in `prisma/schema.prisma` but **not in the database**.
- **No production migration has been applied.** An inert, Prisma-generated draft
  of the Phase 10 tables is at
  `prisma/migrations-draft/0001_platform_sync_persistence.draft.sql` (outside
  `prisma/migrations/`, so it cannot be auto-deployed).
- Next safe step: create a Neon dev/staging branch and generate the tracked
  migration there (Phase 12) — never `migrate dev`/`db push` against production.

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

- Real Steam sync
- Real PSN sync
- Real database-backed product data — **as of Phase 10 the persistence *models*
  exist in `prisma/schema.prisma`, but no migration is applied and no runtime
  code reads/writes them; all product data is still mock-backed**
- Competitions / competition scoring
- Rewards / marketplace
- Wallet / blockchain / NFT
- Game downloads
- Real tribe management (create / invite / leave / kick / promote / settings)

## Recommended next phase

**Phase 12 — Migration Artifact Generation / Dev DB Setup.**

Phase 9 built the dry-run layer; Phase 10 modeled persistence; Phase 11 added the
DB-safety guardrails and an inert draft migration. The next safe steps (gated by
DB-owner approval — see `docs/DB_MIGRATION_SAFETY.md` and
`docs/MIGRATION_READINESS_CHECKLIST.md`):

1. **Create a Neon dev/staging branch** (non-production `DATABASE_URL`, never committed).
2. Generate the **tracked** Prisma migration there
   (`prisma migrate dev --name platform_sync_persistence`); diff it against
   `prisma/migrations-draft/0001_platform_sync_persistence.draft.sql`.
3. Get **owner approval + a Neon restore point**, then `prisma migrate deploy` to production.
4. **Phase 13:** persist Steam connection state on login (`PlatformAccount` write path).
5. **Phase 14:** add `STEAM_API_KEY` (Vercel only), activate `steamClient.js`, run an
   `execute`-mode sync, persist `PlatformDetectedGame`/`GameExternalSource`/`UserGame`,
   route unmatched games to a review queue, then recompute Profile/Stats/Rankings.

Do not run `migrate dev`/`db push`/`deploy` against production, and do not
activate real sync before the migration is applied and the write path is in place.

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
