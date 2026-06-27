# Steam Sync Preparation

**Phase 9 — dry-run preparation only. No real Steam API is called.**

## Purpose

Phase 9 prepares the codebase for real Steam library sync without activating it.
The goal is to validate the normalization + canonical matching pipeline against
realistic mock data before any live API key, database migration, or background
job is involved.

## What was prepared

### Integration boundary (`lib/integrations/steam/`)

| File | Purpose |
|---|---|
| `steamClient.js` | Future Steam Web API client. All functions return fixture data in dry-run mode. Includes commented real implementation for reference. |
| `steamNormalizer.js` | Converts raw Steam `GetOwnedGames` game objects into the Leet9 normalized detected-game shape. |
| `steamSyncPlanner.js` | Given normalized Steam games + existing Leet9 data, produces a dry-run sync plan (no writes). |
| `steamFixtures.js` | Realistic mock Steam raw responses covering matched, update, create, and unmatched cases. |
| `README.md` | What must happen before real sync is activated. |

### Dry-run API endpoint

`GET /api/integrations/steam/sync-preview`

- Protected: requires session (returns 401 UNAUTHENTICATED if signed out)
- Uses fixture data (no real Steam API call)
- Returns a full dry-run sync plan
- Persists nothing

### UI

A **Steam Library Sync — PREPARED** card was added to the Platform Sources
section in Profile Overview. It is informational only; the sync button is
disabled and clearly marked "Coming soon".

## What was intentionally not built

- Real Steam API calls
- `STEAM_API_KEY` env var usage
- Database migrations or real persistence
- Background sync jobs
- Achievement sync (deferred; it is a per-game call and is expensive at scale)
- PSN sync (follows the same flow; deferred to a future phase)
- Retry/error handling for live API failures
- Sync history / audit records
- Unmatched game review UI

## Expected Steam raw fields

From `IPlayerService/GetOwnedGames/v1/`:

```json
{
  "appid": 1245620,
  "name": "ELDEN RING",
  "playtime_forever": 17070,
  "playtime_2weeks": 0,
  "img_icon_url": "4f3cb5...",
  "has_community_visible_stats": true,
  "rtime_last_played": 1750024800
}
```

## Leet9 normalized output shape

After `normalizeSteamGame()`:

```json
{
  "platform": "steam",
  "externalId": "1245620",
  "externalTitle": "ELDEN RING",
  "playtimeHours": 284.5,
  "achievementsUnlocked": null,
  "trophiesUnlocked": null,
  "lastPlayedAt": "2025-06-15T20:00:00.000Z",
  "canonicalGameId": null,
  "matched": false
}
```

After `planSteamSync()` resolves `canonicalGameId`:

```json
{
  "platform": "steam",
  "externalId": "1245620",
  "externalTitle": "ELDEN RING",
  "playtimeHours": 284.5,
  "achievementsUnlocked": null,
  "trophiesUnlocked": null,
  "lastPlayedAt": "2025-06-15T20:00:00.000Z",
  "canonicalGameId": "game_elden_ring",
  "matched": true
}
```

## Dry-run sync plan shape

```json
{
  "mode": "dry_run",
  "provider": "steam",
  "summary": {
    "rawGamesDetected": 5,
    "matchedCanonicalGames": 3,
    "unmatchedGames": 2,
    "userGamesToCreate": 1,
    "userGamesToUpdate": 2
  },
  "matchedGames": [...],
  "unmatchedGames": [...],
  "plannedUserGameCreates": [...],
  "plannedUserGameUpdates": [...],
  "externalSourcesKnown": ["1245620", "252950", "367520"],
  "externalSourcesMissing": [
    { "externalId": "2515020", "externalTitle": "Unmatched Indie Prototype" },
    { "externalId": "570", "externalTitle": "Dota 2" }
  ],
  "warnings": ["2 Steam game(s) have no canonical match..."],
  "dryRunNote": "No data was persisted. No real Steam API was called."
}
```

## Persistence needed before real sync

| Record | Purpose |
|---|---|
| `PlatformAccount` | User's Steam connection state, steamId64, last sync time, sync status |
| `PlatformDetectedGame` | Raw + normalized detected game per sync run (for auditability) |
| `PlatformSyncRun` | One sync attempt / dry-run (audit & history) |
| `GameExternalSource` | Steam appId → canonical gameId mapping (currently mocked) |
| `UserGame` | User's relationship to each canonical game (create/update on sync) |

None of these are persisted in this phase (Phase 9).

> **Phase 10 update:** these records are now defined as Prisma models in
> `prisma/schema.prisma` (the audit/raw-detection record is named
> `PlatformDetectedGame`). Still schema-only — no runtime wiring, no real sync.
> See `docs/PLATFORM_SYNC_PERSISTENCE_MODEL.md`.

## Audit / history needs

Each real sync run should record:
- which Steam ID was synced and when
- count of games detected, matched, created, updated, unmatched
- raw API response (for debugging and trust)
- any errors or warnings

This is required before Competitions or Rankings can rely on Steam-sourced data.

## Unmatched game review queue

Steam games with no `GameExternalSource` mapping must NOT enter Discovery
automatically. They belong in an admin review queue where they can be mapped to
an existing canonical game or used to create a new one.

The sync planner already classifies unmatched games separately in
`externalSourcesMissing` and `unmatchedGames`.

## Security and env notes

- `STEAM_API_KEY` must only be added to Vercel env vars. Never commit it.
- Steam IDs (steamid64) are public but should not be exposed in client-facing API responses unnecessarily.
- Raw Steam API responses are untrusted third-party data; validate before persisting.
- Steam profile visibility must be Public for library access. Handle private profiles gracefully.

## PSN parity note

Steam is the first real integration candidate, but Leet9 is platform-agnostic.
PSN must follow the same normalized ingestion flow:

```
Connected PSN Account
  → Raw PSN game/trophy data
  → normalizePsnGame()           [lib/integrations/psn/ — future]
  → matchDetectedGameToCanonical()
  → GameExternalSource lookup
  → Canonical Game
  → UserGame
  → Discovery / Profile / Stats / Rankings
```

A `lib/integrations/psn/` directory should be created in a future phase once
the PSN data access path is validated (to be validated — see
docs/PLATFORM_INTEGRATION_READINESS.md §7).

## Future Steam sync flow (real)

```
1. User connects Steam via NextAuth Steam login
2. JWT contains steamId64
3. Scheduled or on-demand sync job calls fetchSteamOwnedGames(steamId64)
4. Raw games are stored as DetectedGame records (audit)
5. normalizeSteamGames() converts to Leet9 shape
6. matchDetectedGameToCanonical() resolves canonical gameIds
7. Unmatched games routed to review queue
8. Matched games create or update UserGame records
9. Profile, Stats, Rankings recalculate from updated UserGame data
10. Sync result stored on PlatformAccount (lastSyncAt, syncStatus)
```
