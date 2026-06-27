# Platform Sync Persistence Model

**Phase 10 — persistence modeling only. No real Steam/PSN sync, no runtime DB
wiring.** This phase adds the database models behind the normalized platform
ingestion flow so a later phase can persist real sync results safely and
auditably.

## Purpose

Phases 7–9 built the platform-agnostic contracts, mock data, and a Steam
dry-run planner — all in memory. Before any real sync can run, Leet9 needs
durable, auditable storage for platform connections, sync attempts, detected
games, canonical mappings, and user-game relationships. Phase 10 defines those
models in `prisma/schema.prisma` and documents how the in-memory flow maps onto
them. It changes **no runtime behavior**.

## What was added

### Prisma models (`prisma/schema.prisma`)

| Model | Represents |
|---|---|
| `PlatformAccount` | A user's connected/connectable game-data platform account (Steam, PSN, …) |
| `PlatformSyncRun` | One sync attempt or dry-run (audit/history) |
| `PlatformDetectedGame` | A normalized detected game from a platform account (raw + normalized snapshots) |
| `GameExternalSource` | platform externalId → canonical Leet9 game mapping |
| `UserGame` | A user's relationship to a canonical game (created/updated by real sync later) |

`User` gains two additive back-relations (`platformAccounts`, `userGames`).
NextAuth's `Account`, `Session`, `User`, `VerificationToken` models are
**unchanged**. The new account model is `PlatformAccount` — it intentionally
does **not** reuse NextAuth's `Account`.

### Pure mapping helper (`lib/platforms/persistenceMapping.js`)

Side-effect-free functions that shape normalized data into model payloads
(`toPlatformDetectedGameRecord`, `toUserGameCreate`, `toUserGameUpdatePatch`,
`toGameExternalSourceRecord`, `toSyncRunRecord`, `syncPlanToRunCounters`). No DB
writes, no Prisma client import.

## Why persistence is needed before real Steam sync

- **Auditability:** real sync ingests untrusted third-party data. Every run and
  every raw detection must be recorded so results are explainable and trustable
  — a hard requirement before Rankings or Competitions can rely on synced data.
- **Idempotency:** re-syncing must not create duplicates. Unique constraints
  (below) make re-runs safe.
- **Incremental updates:** `UserGame` create-vs-update logic needs a persisted
  prior state to diff against.
- **Unmatched handling:** detections with no canonical mapping must be parked
  durably (not dropped, not shown in Discovery) until reviewed.

## How the models map to the normalized flow

```
Connected Platform Account        → PlatformAccount
  → Raw Detected Platform Game     → PlatformDetectedGame.raw (audit)
  → Normalized Detected Game       → PlatformDetectedGame.normalized
  → GameExternalSource             → GameExternalSource (externalId → canonicalGameId)
  → Canonical Game                 → canonicalGameId (String; no persisted Game model yet)
  → UserGame                       → UserGame (create/update)
  → Discovery / Profile / Stats / Rankings   (read from Leet9-owned models only)
```

Each `PlatformSyncRun` ties a batch of `PlatformDetectedGame` rows to one
attempt and records the resulting counts.

## Official status vocabulary

Status fields are plain Strings (not Prisma enums) and must use the constants in
`lib/platforms/platforms.js`, so the DB and JS never drift:

- `PlatformAccount.status` — `connected` · `disconnected` · `needs_reauth` ·
  `unavailable` (`PLATFORM_ACCOUNT_STATUS`)
- `PlatformAccount.syncStatus`, `PlatformSyncRun.status` — `idle` · `syncing` ·
  `success` · `failed` · `partial` (`PLATFORM_SYNC_STATUS`)
- `PlatformSyncRun.mode` — `dry_run` · `execute`
- `PlatformDetectedGame.matchStatus` — `matched` · `unmatched` · `ignored`
- `GameExternalSource.status` — `active` · `deprecated` · `review_required`

## dry_run vs execute

`PlatformSyncRun.mode` distinguishes a **`dry_run`** (plan only — what Phase 9's
`/api/integrations/steam/sync-preview` produces; nothing persisted to product
tables) from an **`execute`** run (real sync that creates/updates `UserGame`
rows). Phase 10 only models these; nothing runs in execute mode yet.

## Idempotency rules

- `PlatformAccount` — `@@unique([userId, provider])` (one account per provider per user)
- `PlatformDetectedGame` — `@@unique([platformAccountId, provider, externalGameId])`
  (re-sync upserts the same detection, never duplicates it)
- `GameExternalSource` — `@@unique([provider, externalGameId])`
- `UserGame` — `@@unique([userId, canonicalGameId])` (no duplicate canonical games per user)

## Audit / history needs

`PlatformSyncRun` records `mode`, `status`, timing, the matched/unmatched/
create/update counts, `warnings`, and `errorCode`/`errorMessage`.
`PlatformDetectedGame` keeps both the untrusted `raw` payload and the
`normalized` snapshot. Together these give a full, debuggable trail for every
sync — required before competition-grade trust.

## Unmatched game handling

A detection whose `(provider, externalGameId)` has no `GameExternalSource`
mapping is stored with `matchStatus = "unmatched"` and `canonicalGameId = null`.
**Unmatched games must never enter Discovery automatically.** They belong in a
future matching review queue, where an operator maps them to an existing
canonical game or creates a new one (which then becomes a `GameExternalSource`).

## GameExternalSource canonical mapping rule

`GameExternalSource` is the single source of truth for canonical matching.
Steam and PSN versions of the same title map to the **same** `canonicalGameId`,
so a game appears once in Discovery with badges for every detected platform.
Canonical game data is never duplicated into this table — only the mapping and
light metadata live here. `canonicalGameId` is a `String` for now because there
is no persisted `Game` model yet (canonical games are still mock-backed).

## UserGame create/update rules

- **Create** when no `UserGame` exists for `(userId, canonicalGameId)`.
- **Update** when one exists — refresh playtime / `lastDetectedAt` first;
  achievements/trophies are a follow-up step (a per-game call, expensive at scale).
- The unique constraint guarantees one row per user per canonical game.

This mirrors the dry-run planner's `plannedUserGameCreates` /
`plannedUserGameUpdates` split (`lib/integrations/steam/steamSyncPlanner.js`).

## Why raw platform data still cannot power product surfaces directly

Discovery, Profile, Stats, Rankings, and future Competitions must read only from
Leet9-owned models (`UserGame`, canonical games via `GameExternalSource`). Raw
platform payloads are untrusted, inconsistent across platforms, and unverified —
they live in `PlatformDetectedGame.raw` for audit only and must pass through
normalization + canonical matching before influencing anything users see or
compete on.

## What was intentionally not built

- No real Steam or PSN API calls; no `STEAM_API_KEY`; no `.env` changes
- No background jobs or real sync execution
- No runtime DB reads/writes — current APIs and UI remain fully mock-backed
- No persisted canonical `Game` model (canonical games stay mock for now)
- No competitions, rewards, wallet/NFT, or game downloads
- No change to the login/auth flow

## Migration notes

`npx prisma format` → success. `npx prisma validate` → **valid** (run with a
placeholder `DATABASE_URL` because none is set in the build/sandbox environment;
validate does not connect to any database).

`npx prisma migrate dev --name platform_sync_persistence --create-only` could
**not** be completed in this environment: it requires a reachable database /
shadow DB and failed with `P1001: Can't reach database server at localhost:5432`.
Per phase rules, this was **not** forced — no `.env` was edited, no production DB
was contacted, and no secrets were added. **A developer with local DB/env access
must generate and commit the migration** (`prisma migrate dev --name
platform_sync_persistence`) against a real/shadow Postgres, then apply it to Neon
through the normal deploy process. The schema changes in this PR are validated
and ready for that step. `npm run build` still passes because it runs
`prisma generate` (which does not require a database connection).

## Future Phase 11/12 recommendations

1. **Phase 11 — Migration + real `PlatformAccount` write path:** generate the
   migration against a real DB, persist Steam connection state on login.
2. **Phase 12 — Real Steam sync execution:** activate `steamClient.js`, run an
   `execute`-mode `PlatformSyncRun`, persist `PlatformDetectedGame` +
   `GameExternalSource` + `UserGame`, route unmatched games to a review queue,
   then recompute Profile/Stats/Rankings from `UserGame`.
3. Add a persisted canonical `Game` model and convert `canonicalGameId` Strings
   into a real relation.

## PSN parity note

PSN must use **this same persistence model** when its data-access path is
validated. `PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`,
`GameExternalSource`, and `UserGame` are all provider-agnostic (`provider`
supports `steam`, `psn`, and future platforms). PSN trophies map onto
`trophiesUnlocked`; nothing in the schema is Steam-specific.
