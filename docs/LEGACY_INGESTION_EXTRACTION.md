# Legacy Steam/PSN Ingestion Extraction

**Phase 13 — extraction & mapping only. Docs-first, read-only toward legacy
repos.** No real Steam/PSN calls, no DB writes, no runtime changes. This document
extracts the reusable ingestion knowledge from the legacy Leet9 backend and maps
it onto the new web-first normalized model.

> Product rule: the new web app is the source of truth. Legacy ingestion is a
> **reference implementation**, not something to copy blindly. Steam and PSN must
> both feed the same normalized flow:
> `PlatformAccount → PlatformSyncRun → raw → PlatformDetectedGame →
> GameExternalSource → UserGame → Stats/Rankings`.

---

## 1. Executive summary

- **Can we reuse legacy Steam ingestion?** **Yes, as a reference — adapt, don't
  copy.** The Steam API surface (official Web API: `GetPlayerSummaries`,
  `GetOwnedGames`, `GetPlayerAchievements`) is correct and already mirrored by
  the current dry-run boundary (`lib/integrations/steam/steamClient.js`). The
  legacy *fetch shape* is reusable; its *coupling* (reward-on-ingest, whole-record
  overwrite, N+1 achievement calls) must be dropped.
- **Can we reuse legacy PSN ingestion?** **Partially, and only after
  revalidation.** Legacy PSN used the **unofficial `psn-api` npm library** with
  **NPSSO-token** auth. It works as a *reference for the data shape*, but the
  auth/access path is fragile (manual NPSSO extraction, token expiry, unofficial
  API, ToS risk) and **must be revalidated** before any real build.
- **What should be ported?** Concepts: per-platform playtime normalization
  (Steam minutes vs PSN ISO-8601 duration), the first-connection anti-gaming
  rule, incremental playtime diffing, PSN `category` filtering (games vs apps),
  trophy summary aggregation, and credential-encryption-at-rest.
- **What must be rewritten?** Storage (legacy overwrote a Mongo `UserRecord`;
  new model persists `PlatformSyncRun` + `PlatformDetectedGame` + `UserGame`
  with raw/audit retention), the **separation of ingestion from scoring**, and
  game matching (legacy matched by name/identifier; new uses `GameExternalSource`
  canonical mapping).
- **What must be revalidated?** The entire PSN auth/data path, Steam rate-limit
  behavior at scale (the legacy N+1 achievement fetch would not survive),
  and the Steam `firstPlayed` gap (legacy never computed it).

**Bottom line:** the legacy backend de-risks the *what* (endpoints, fields, edge
cases) but its *how* (coupled, overwrite-based, reward-on-ingest, unofficial PSN
auth) must be redesigned onto the Phase 10 persistence model.

---

## 2. Sources inspected

**Repos (read-only, local clones under `~/Desktop/leet9-audit/`):**

| Repo | Folders/files inspected |
|---|---|
| `leet9-game-service` | `repository/steam.repository.ts`, `repository/psn.repository.ts`, `repository/platform.repository.ts`, `services/platforms.service.ts`, `services/gameplay.service.ts`, `helpers/object.helper.ts`, `helpers/gameplay.helper.ts`, `interfaces/platform.interface.ts`, `scheduler/platform.scheduler.ts`, `middlewares/platform.middleware.ts`, `controllers/platforms.controller.ts`, `algorithm/l9.algorithm.ts` |
| `leet9-shared-service` | `src/models/*` (user, userRecord, game, userGame, userStats, l9key, bonus, level, achievement) |
| `leet9-user-service` | `Rewards/` (structure; reward engine) |
| `leet9-cron` | `index.ts` (processUsers daily/weekly) |

**Current web repo:** `lib/integrations/steam/*`, `lib/platforms/*`,
`prisma/schema.prisma`, `app/api/integrations/steam/sync-preview/route.js`,
`app/api/platforms/detected-games/route.js`, `app/api/me/platform-accounts/route.js`,
and the Phase 9–12 docs.

**Confidence:**
- **Steam ingestion: HIGH** — full source inspected; aligns with the existing web boundary.
- **PSN ingestion: MEDIUM** — full source inspected, but it depends on an
  unofficial library + NPSSO auth whose real-world viability is **unverified**.
- **Sources not inspected deeply:** `leet9-ios`/`leet9-android` ingestion (mobile
  consumed the backend APIs; not a separate ingestion path),
  `leet9-blockchain-service` (only to confirm what NOT to reintroduce),
  `leet9-api-gateway`/`leet9-api-service`/`leet9-common-service` (routing/legacy,
  not ingestion). No secret **values** were read; only env var **names** noted.

---

## 3. Legacy Steam ingestion findings

**Relevant files/functions:**
- `repository/steam.repository.ts`: `getUserDetailsFromSteam(steamId)`,
  `getUserGamesFromSteam(steamId)`.
- `services/platforms.service.ts`: `fetchFromSteam(userData, isCronJob)`.
- `helpers/object.helper.ts`: `buildSteamPlatformObject(input, isDailyCron)`.

**Steam API endpoints used (official Steam Web API):**
- `GET https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/` — params `key`, `steamids`.
- `GET http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/` — params `key`, `steamid`, `format=json`, `include_appinfo=true`.
- `GET http://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v0001/` — params `key`, `steamid`, `appid` (**called per game**).
- Plus a per-game `header.jpg` image fetch (`cdn.cloudflare.steamstatic.com/steam/apps/{appid}/header.jpg`).
- Commented-out: `GetSchemaForGame/v2` (achievement schema, deferred).

**Auth / identity model:**
- Identifier = **steamid64** (`IPlatform.identifier`); no supportingIdentifier for Steam.
- API auth = a single server-side **Steam Web API key** (env `STEAM_APIKEY`).
- (Current web boundary names it `STEAM_API_KEY` — see §3 risks: naming differs.)

**Data fields handled (raw → normalized):**
- `appid` → `titleId`; `name` → `name`; `playtime_forever` (minutes, integer) →
  `duration` (kept as minutes); `rtime_last_played` (unix, `0`=never) → `lastPlayed`
  (`'0'` or ISO string); per-OS playtimes and `playtime_disconnected` present but
  unused; achievements filtered to `achieved > 0` → `trophies`; logo = constructed
  CDN URL; `firstPlayed` = **`''` (never computed — known gap)**.

**Matching logic:** by game **name/identifier** into the legacy `Game`/`userGame`
collections — **no canonical external-source mapping** (this is a regression the
new model fixes).

**Storage model:** normalized games written into `UserRecord.platforms[]` (one
entry per platform); on re-sync the **whole platform entry is replaced**
(`$set: platforms.$`). Raw API responses are **not retained**.

**Sync strategy:** `leet9-cron` `processUsers(isWeekly)` iterates all users
daily/weekly, re-fetches, normalizes, **rewards**, and bulk-overwrites.

**Edge cases handled:**
- Per-game `try/catch` (a failed achievements/logo call sets
  `name = 'Error Fetching Name'` and continues).
- Outer `try/catch` returns `{ games: [] }` on total failure.
- `rtime_last_played === 0` → treated as "never played".

**Dependencies / env var names (no values):** `STEAM_APIKEY`, `DB_URL`,
`JWT_SECRET`, `ENCRYPT_SECRET`, `ENCRYPT_IV`, `PORT`, `NOTIFICATION_DOMAIN`
(plus unrelated `PUBG_TOKEN`, `LOL_TOKEN`, `TWITCH_*`, `YOUTUBE_API_KEY` for KPIs).

**Risks:**
- **N+1 API calls** (1 achievements + 1 image per owned game, every sync) →
  rate-limit and latency risk at scale; no backoff/retry.
- **No private-profile gating** — `communityvisibilitystate`/`profilestate` are
  available in the summary but unused; private libraries silently yield empty data.
- **`firstPlayed` never computed** for Steam.
- **Reward + overwrite coupled into ingestion** (see §9).
- **Env name mismatch:** legacy `STEAM_APIKEY` vs web `STEAM_API_KEY`.

**Reusable parts:** endpoint set, raw field mapping, `rtime_last_played`/minute
handling, per-game error isolation, "store raw before normalizing" intent (the
current web boundary already states this).

**Rewrite parts:** matching (→ `GameExternalSource`), storage (→ `PlatformSyncRun`
+ `PlatformDetectedGame` + `UserGame`, retain raw), achievements fetch (batch /
defer, not N+1), add private-profile handling + retry/backoff, compute or accept
absent `firstPlayed`, and remove reward-on-ingest.

---

## 4. Legacy PSN ingestion findings

**Relevant files/functions:**
- `repository/psn.repository.ts`: `getAuthTokenFromPsn(NPSSO)`,
  `getUserDetailsFromPsn(authToken, identifier)`, `getUserGamesDataFromPsn(authToken)`.
- `services/platforms.service.ts`: `fetchFromPSN(userData, isCronJob)`, `haveNewTitles(userId)`.
- `helpers/object.helper.ts`: `buildPlatformObject(input, isDailyCron)`.
- `repository/platform.repository.ts`: `findTitlesOfaUser(userId)` (trophy aggregation).

**Data access / auth path (UNOFFICIAL):**
- Uses the third-party **`psn-api`** npm library.
- Auth chain: `exchangeNpssoForAccessCode(NPSSO)` →
  `exchangeAccessCodeForAuthTokens` → `exchangeRefreshTokenForAuthTokens`.
- The credential is an **NPSSO token** — a value the user extracts manually from
  an authenticated PSN web session. Stored **encrypted** as `supportingIdentifier`.
- Games: `getUserPlayedGames(authToken, "me")`; profile: `getProfileFromUserName`.

**User identifier model:** `identifier` = PSN **onlineId** (username);
`supportingIdentifier` = **NPSSO** (encrypted at rest).

**Fields handled (raw → normalized):** title `name`, `titleId`, `imageUrl` →
`logo`, `category` (filtered to values containing `'game'` — excludes apps),
`playDuration` (**ISO-8601 `PT#H#M#S`**) → `duration`, `firstPlayedDateTime` →
`firstPlayed`, `lastPlayedDateTime` → `lastPlayed`, `trophies`, plus a profile
`trophySummary` (platinum/gold/silver/bronze).

**Matching logic:** same name/identifier approach as Steam — no canonical mapping.

**Storage model:** same `UserRecord.platforms[]` overwrite as Steam; raw not retained.

**Sync strategy:** same daily/weekly cron; on each PSN sync the NPSSO is
**decrypted** to re-auth, then `haveNewTitles` aggregates trophy counts for
rewards.

**Edge cases handled:** `category` game-vs-app filtering; trophy-summary
aggregation across titles; refresh-token exchange for expiring auth.

**Dependencies / env var names (no values):** `psn-api` (npm), `ENCRYPT_SECRET`,
`ENCRYPT_IV` (NPSSO encryption), `DB_URL`. No PSN client-id/secret env (auth is
NPSSO-per-user, not an app credential).

**Risks:**
- **Unofficial API + NPSSO auth** — fragile, undocumented, subject to Sony
  changes/ToS; NPSSO requires manual user extraction (poor UX) and **expires**.
- **Storing NPSSO** (even encrypted) is a standing credential liability.
- ISO-8601 duration parsing is bespoke and easy to get wrong.
- Same reward-on-ingest + overwrite coupling as Steam.

**Reusable parts:** the *data shape* (titleId, ISO duration, trophies,
trophySummary), `category` filtering, ISO-duration parser, trophy aggregation.

**Rewrite parts:** all of storage/matching/scoring (as Steam).

**Revalidation needs (BLOCKER before any PSN build):** confirm a viable,
durable, ToS-acceptable PSN data-access method (official partner API vs the
`psn-api`/NPSSO approach), token lifecycle/refresh, and whether NPSSO storage is
acceptable. Until validated, PSN stays mock-only.

---

## 5. Legacy → new architecture mapping

| Legacy concept / file / model | New web equivalent | Reuse level | Rationale |
|---|---|---|---|
| `IPlatform` (name, identifier, supportingIdentifier) | `PlatformAccount` (provider, externalUserId, encrypted credential in `metadata`) | adapt | Identity + credential; keep credential encrypted, prefer not to store NPSSO long-term. |
| `steam.repository.ts` fetch fns | `lib/integrations/steam/steamClient.js` (`fetchSteamOwnedGames`, `fetchSteamAchievements`) | reference only | Web boundary already exists (v1 endpoints, DRY_RUN). |
| `psn.repository.ts` fetch fns | future `lib/integrations/psn/psnClient.js` | reference only + revalidate | Build behind a validated access path. |
| `buildSteamPlatformObject` / `buildPlatformObject` | `lib/platforms/normalization.js` + per-platform normalizers | adapt | Normalize into `PlatformDetectedGame.normalized`; keep `raw`. |
| `gameplay.helper.ts` (ISO/minute parsing) | per-platform normalizers (Steam minutes, PSN ISO) | direct port (pure fns) | Pure, well-scoped; move into normalizers. |
| name/identifier game matching | `GameExternalSource` (`provider`+`externalGameId` → `canonicalGameId`) | discard → replace | Canonical mapping is the core improvement. |
| `UserRecord.platforms[].games[]` (overwrite) | `PlatformDetectedGame` (idempotent upsert, raw+normalized) | rewrite | Auditable, idempotent, no overwrite. |
| cron `processUsers` (fetch+reward+overwrite) | `PlatformSyncRun` (mode `dry_run`/`execute`) + a separate scoring step | rewrite | Separate ingestion from scoring; record each run. |
| `UserRecord.platforms[].games[].L9PointsRewarded` | future `UserGame` + separate stats calc | rewrite | No reward-on-ingest. |
| `findTitlesOfaUser` trophy aggregation | future `UserGame.trophiesUnlocked` / stats | adapt | Aggregate from normalized data. |
| `l9.algorithm.ts`, `L9key`, `Rewards/` | future StatsCalculation (transparent) | reference only | Inspiration; redesign for auditability (see audit §4). |
| `leet9-shared-service` `User` | NextAuth `User` (+ `PlatformAccount`, `UserGame`) | adapt | Split identity from platform/game data. |
| `crypt.helper` (encrypt/decrypt) | server-only credential encryption util (if needed) | adapt | Encrypt any stored credential; avoid storing NPSSO if possible. |
| wallet/NFT/blockchain fields | — | discard | Out of scope (audit §7). |
| notification/cron reward triggers | — | discard for now | No reward-on-ingest. |

---

## 6. Steam porting plan (future implementation — not this phase)

1. **Server-only env:** read `STEAM_API_KEY` server-side only (reconcile the
   legacy `STEAM_APIKEY` name); never expose to client; never commit.
2. **Steam identity mapping:** resolve `steamid64` from the NextAuth Steam login
   JWT; persist on `PlatformAccount.externalUserId`. No user-entered IDs.
3. **Fetch owned games:** `GetOwnedGames/v1` (`include_appinfo=true`). Store the
   **raw** response (`PlatformDetectedGame.raw` / run metadata) before normalizing.
4. **Normalize → PlatformDetectedGame:** appid→externalGameId, name→externalTitle,
   `playtime_forever` minutes→`playtimeHours`, `rtime_last_played`→`lastPlayedAt`
   (`0`=null). Achievements via `GetPlayerAchievements/v1` as a **batched follow-up**,
   not N+1 inline.
5. **Match GameExternalSource:** `(steam, appid)` → `canonicalGameId`; unmatched →
   `matchStatus="unmatched"` (review queue), never auto-into Discovery.
6. **Persist PlatformSyncRun:** record mode (`dry_run`/`execute`), counts,
   warnings, timing, status (official sync-status vocabulary).
7. **Persist PlatformDetectedGame:** idempotent upsert on
   `(platformAccountId, provider, externalGameId)`.
8. **Create/update UserGame:** first-connection vs incremental (see §8); update
   playtime/lastPlayed; achievements as a follow-up.
9. **Keep scoring separate:** a distinct, auditable stats step reads `UserGame` —
   **no reward writes during ingestion**.
10. **Failure/retry:** exponential backoff for `429`/`503`; handle private
    profiles (empty/403) and surface to the user; per-game error isolation.
11. **Audit logs:** retain raw + run records for trust (required before rankings/competitions).
12. **dry-run/execute separation:** keep the existing `DRY_RUN` boundary; only an
    approved migration + write path flips `execute`.

## 7. PSN porting plan (future — gated on revalidation)

> ⚠️ **Do not build until the PSN access path is validated.** Mark every step below
> as **to-be-validated**.

1. **Validate access first (BLOCKER):** decide official partner API vs unofficial
   `psn-api`/NPSSO; confirm ToS, token lifecycle, and whether NPSSO storage is
   acceptable. *(to be validated)*
2. **Server-only credentials:** if NPSSO is used, encrypt at rest and minimize
   retention; prefer short-lived tokens. *(to be validated)*
3. **PSN identity mapping:** `onlineId` → `PlatformAccount.externalUserId`;
   credential in encrypted `metadata`. *(to be validated)*
4. **Fetch library:** `getUserPlayedGames` (or official equivalent); store raw.
5. **Normalize → PlatformDetectedGame:** titleId→externalGameId, ISO-8601
   `playDuration`→`playtimeHours`, `firstPlayedDateTime`/`lastPlayedDateTime`,
   trophies→`trophiesUnlocked`; **filter `category` to games** (exclude apps).
6. **Match GameExternalSource:** `(psn, titleId)` → `canonicalGameId`; same
   title as Steam must resolve to the **same** canonical game (no duplicates).
7–12. Same as Steam (sync run, detected-game upsert, UserGame, separate scoring,
   retry, audit, dry-run/execute) — all **to be validated** against the real PSN path.

---

## 8. Edge cases and anti-gaming rules

Ported from legacy (`gameplay.service.ts`, `gameplay.helper.ts`,
`platform.repository.ts`) into the new, scoring-separated model:

- **First-connection treatment:** on a platform's *first* sync, do **not** count
  historical playtime toward score (legacy `isFirstConnection` skip). Detect via
  absence of a prior `PlatformSyncRun`/`UserGame` for that account.
- **Retroactive playtime:** only reward the **incremental delta** between syncs
  (`newDuration - oldDuration`), never the cumulative total. (Legacy also capped a
  session at 180 min/day — keep some cap to bound abuse.)
- **Private profiles:** Steam private libraries return empty/403 — surface a
  clear state, do not treat as "zero games"; PSN permission failures likewise.
- **Missing achievements/trophies:** a game with no stats must not error the
  whole sync (legacy per-game try/catch); treat as `null`, not `0`.
- **Duplicate platform games:** the same title on Steam + PSN must collapse to
  one canonical `UserGame` via `GameExternalSource`.
- **Platform title mismatch:** rely on canonical `externalGameId` mapping, not
  fuzzy name matching; unmatched → review queue.
- **Incremental sync:** store last-synced durations to diff; idempotent upserts
  prevent double counting on re-runs.
- **Suspicious changes:** large/implausible playtime jumps or duration decreases
  should be flagged (not silently scored) — a new safeguard beyond legacy.
- **Reward/scoring abuse prevention:** ingestion must never write score; scoring
  runs separately on validated `UserGame` data, making abuse auditable.

---

## 9. What NOT to port

- **Wallet / blockchain / NFT coupling** (`User.wallets`, `Level.rewardEligibleContracts`,
  `UserRecord.nftsCount`, `leet9-blockchain-service`).
- **Reward-on-ingest side effects** — legacy `fetchFrom*` and the cron wrote
  score during sync (`gameplayRewarder`, `connect_steam/psn` bonuses). Keep
  ingestion pure.
- **Opaque/game-specific scoring** (`l9.algorithm.ts` DOTA/PUBG KPI fetchers,
  `L9key` as source of truth) — inspiration only.
- **Name-only game matching** — replaced by `GameExternalSource`.
- **Direct raw-platform → ranking/score calculations** — must pass through
  normalization + canonical matching.
- **Whole-record overwrite storage** (`$set: platforms.$`) — replaced by
  idempotent `PlatformDetectedGame` upserts with raw retention.
- **N+1 per-game achievement/image fetches** — batch/defer instead.
- **Legacy microservice boundaries** (separate game/user/shared/cron services) —
  unnecessary for the web app; keep ingestion in `lib/integrations/*` + server routes.
- **Production secret/env patterns** — do not copy `.env` layouts; use Vercel env
  server-side only; never store secrets in the repo.
- **Storing PSN NPSSO long-term** — avoid unless revalidation proves it necessary
  and safe.

---

## 10. Recommended next implementation phases

1. **DB / dev-staging decision** (gated on Mattia) — Neon dev branch; apply the
   Phase 10 migration there first (`docs/DB_MIGRATION_SAFETY.md`).
2. **`PlatformAccount` write path** — persist Steam connection (steamid64) on login.
3. **Steam ingestion port (dry-run → execute)** — implement `steamClient` real
   path behind `DRY_RUN`; land results in `PlatformSyncRun` + `PlatformDetectedGame`.
4. **`UserGame` persistence** — create/update from matched detections (first-connection rule).
5. **Profile Games from DB** — read `UserGame` instead of mock.
6. **Stats from normalized data** — transparent stats calc over `UserGame`.
7. **Rankings from normalized data** — recompute from `UserGame`/stats.
8. **PSN revalidation + adapter** — only after the access path is validated; then
   mirror the Steam pipeline.

(Steps 3–8 each stay behind dry-run/execute separation and DB-owner approval.)

---

## 11. Open strategic questions

1. **Steam ingestion: implementation source or reference?** (Recommend: reference
   — adapt the fetch shape onto the new persistence model.)
2. **PSN ingestion: trust legacy or fully revalidate?** (Recommend: **fully
   revalidate** the auth/data path before any build.)
3. **First-connection historical playtime toward L9 score?** (Recommend: **no** —
   port the first-connection skip.)
4. **Port the old anti-gaming rules** (incremental delta, session cap, first-
   connection)? (Recommend: yes, adapted into the separated scoring step.)
5. **Keep rewards fully decoupled until after closed alpha?** (Recommend: yes.)
6. **L9 scoring: seed from legacy `L9key` weights, or redesign from scratch?**
   (Recommend: redesign transparent scoring; legacy weights as optional seed only.)

---

## 12. Final CTO recommendation

- **Reuse (adapt):** the Steam Web API endpoint set and field mapping (already
  mirrored by `steamClient.js`), the pure duration/`lastPlayed` parsers, the
  first-connection + incremental-delta anti-gaming rules, PSN `category` filtering
  and trophy aggregation, and credential-encryption-at-rest.
- **Rewrite:** storage (onto `PlatformSyncRun` + `PlatformDetectedGame` +
  `UserGame` with raw retention), canonical matching (`GameExternalSource`), and
  the strict **separation of ingestion from scoring**.
- **Defer:** PSN implementation (until revalidated), all scoring/rewards
  (decoupled, post-alpha), competitions, wallet/NFT.
- **Validate before coding:** the PSN access path (blocker), Steam rate-limit
  strategy (no N+1), the `firstPlayed` gap, and the DB dev/staging path.

See `docs/LEGACY_INGESTION_PORTING_PLAN.md` for the implementation checklist and
PR sequence.
