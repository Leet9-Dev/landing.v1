# Legacy Ingestion Porting Plan

Implementation-focused companion to `docs/LEGACY_INGESTION_EXTRACTION.md`.
**Nothing here is implemented in Phase 13** — this is the checklist + sequence
for future phases. All steps stay behind dry-run/execute separation and DB-owner
approval.

## Steam port checklist

_Phase 16 = PlatformAccount identity; Phase 17 = validation + owned-games detection._

- [x] Store `steamid64` on `PlatformAccount.externalUserId` (Phase 16, from user-provided identity).
- [x] Read `STEAM_API_KEY` **server-side only** in `lib/integrations/steam/steamApiClient.js`; never committed/exposed/logged (Phase 17). (Canonical name `STEAM_API_KEY`; legacy used `STEAM_APIKEY` — documented.)
- [x] Real `GetOwnedGames/v1` (`include_appinfo=true`) via `POST /sync-preview` execute (Phase 17).
- [x] Store sanitized **raw** per detection in `PlatformDetectedGame.raw` before/with normalizing (Phase 17).
- [x] Normalize: appid→externalGameId, `playtime_forever` min→`playtimeHours`, `rtime_last_played` (0=null)→`lastPlayedAt`, name→externalTitle (Phase 17, pure normalizer).
- [x] Persist `PlatformSyncRun` (status/counts/warnings) + `PlatformDetectedGame` (idempotent upsert) (Phase 17).
- [x] `GetPlayerSummaries` validation + private-profile detection via `POST /validate` (Phase 17).
- [ ] Achievements via `GetPlayerAchievements/v1` as a **batched follow-up** (no N+1). _(deferred)_
- [ ] Match `(steam, appid)` → `GameExternalSource.canonicalGameId`; unmatched → review queue. _(Phase 18)_
- [ ] Add retry/backoff (429/503); currently a single timed request with sanitized error. _(follow-up)_
- [ ] Decide handling for absent Steam `firstPlayed` (legacy never computed it). _(open)_
- [ ] Create/update `UserGame` with first-connection + incremental-delta rules. _(Phase 18+)_
- [x] **No score writes during ingestion** — Phase 17 writes detections only, no scoring.

## PSN port checklist (gated — all to-be-validated)

- [ ] **BLOCKER:** validate PSN access path (official partner API vs unofficial `psn-api`/NPSSO), ToS, token lifecycle.
- [ ] Decide if NPSSO storage is acceptable; if so, encrypt at rest + minimize retention.
- [ ] `onlineId` → `PlatformAccount.externalUserId`; credential in encrypted `metadata`.
- [ ] Fetch library; store raw.
- [ ] Normalize: titleId→externalGameId, ISO-8601 `playDuration`→`playtimeHours`,
      first/last played, trophies→`trophiesUnlocked`; **filter `category` to games**.
- [ ] Match `(psn, titleId)` → canonical; same title as Steam → same canonical game (no dup).
- [ ] Mirror Steam: sync run, detected-game upsert, UserGame, separate scoring, retry, audit.

## Data model mapping (legacy → new)

| Legacy | New |
|---|---|
| `IPlatform` identity + credential | `PlatformAccount` (externalUserId + encrypted credential in metadata) |
| `steam.repository` / `psn.repository` fetch | `lib/integrations/steam/steamClient.js` / future `psnClient.js` |
| `build*PlatformObject` + `gameplay.helper` parsers | `lib/platforms` normalizers → `PlatformDetectedGame.normalized` (+ `raw`) |
| name/identifier matching | `GameExternalSource` `(provider, externalGameId) → canonicalGameId` |
| `UserRecord.platforms[].games[]` (overwrite) | `PlatformDetectedGame` (idempotent upsert) |
| cron fetch+reward+overwrite | `PlatformSyncRun` (dry_run/execute) + separate stats step |
| `L9PointsRewarded` / reward engine | future `UserGame` + transparent StatsCalculation |

## Future PR sequence

1. DB dev/staging + apply Phase 10 migration (gated on Mattia).
2. `PlatformAccount` write path (Steam connection on login).
3. Steam ingestion port (dry-run → execute) → `PlatformSyncRun` + `PlatformDetectedGame`.
4. `UserGame` persistence (first-connection + incremental).
5. Profile Games from DB.
6. Stats from normalized data (transparent).
7. Rankings from normalized data.
8. PSN revalidation, then PSN adapter mirroring Steam.

## Risks

- **PSN access viability** — unofficial API + NPSSO may not survive to production. Validate first.
- **Steam rate limits** — the legacy N+1 achievement fetch would not scale; batch/defer.
- **Reward-on-ingest regression** — must keep ingestion pure; scoring separate.
- **Name-matching regression** — always go through `GameExternalSource`.
- **Credential storage** — encrypt; avoid long-term NPSSO retention.
- **First-sync inflation** — apply the first-connection rule to avoid counting historical playtime.
- **DB safety** — no migration against production without the Phase 11 process.
