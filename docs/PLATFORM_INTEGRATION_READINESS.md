# Leet9 Platform Integration Readiness

Status: Phase 7 — architecture readiness only. No real Steam or PSN sync is
implemented. Everything below is mock-backed and prepares the codebase for a
later, real integration.

## 1. Leet9 is platform-agnostic

Leet9 is a gaming data and identity product, not a Steam product or a PSN
product. **Steam and PSN are both first-class game-data sources.** Any game
discovered from either platform enters the same canonical Discovery catalogue.

Google is a login provider only. It is **not** a game-data platform and must not
be treated as one.

## 2. First-class sources: Steam and PSN

- **Steam** can support both **login** and **library/game data**. It is the most
  capable single source today.
- **PSN** must be supported as a **game-data source**. It is represented in the
  data model, mock data, and ingestion logic from this phase onward so the
  product is never accidentally Steam-only.

Per-platform capability assumptions live in `lib/platforms/platforms.js`.
Capabilities marked "to be validated" (e.g. exact PSN playtime/trophy access)
must be confirmed against real platform APIs before production.

## 3. Normalized data flow

Raw platform data must **never** directly power Discovery, Profile, Stats,
Rankings, or future Competitions. It must first be normalized into Leet9-owned
models. The required flow is:

```
Connected Platform Account
  → Raw Detected Platform Game      (whatever the platform API returns)
  → Normalized Detected Game        (lib/platforms/normalization.js)
  → GameExternalSource              (platform externalId → canonical gameId)
  → Canonical Game
  → UserGame
  → Discovery / Profile / Stats / Rankings
```

### Why normalize first?

- Platform titles, IDs, and stat shapes differ; raw values are inconsistent and
  untrustworthy for scoring.
- Competitions and rankings require auditable, Leet9-owned numbers, not raw
  third-party fields.
- Normalizing decouples the UI and scoring from any single platform's API.

## 4. Canonical game matching rule

**Steam and PSN versions of the same title map to one canonical Leet9 Game.**

Matching is performed against `GameExternalSource` records, which map a
`(platform, externalId)` pair to a canonical `gameId`:

- Steam `appId` → canonical `gameId`
- PSN `titleId` → canonical `gameId`
- The same title on both platforms resolves to the **same** `gameId`.

Helpers: `lib/platforms/canonicalMatching.js`
(`matchDetectedGameToCanonical`, `deriveSourcePlatforms`,
`buildSourcePlatformMap`, `uniqueCanonicalGameIds`).

A detected game with no matching external source is **unmatched**. It must not
enter Discovery; it belongs in a future matching review queue.

## 5. Discovery rules

- Games detected from **Steam or PSN** enter Discovery.
- The **same game from multiple platforms appears once** (one canonical entry).
- **Source badges show all detected platforms.** A game's `sourcePlatforms` is
  derived from its `GameExternalSource` records, not hardcoded — see
  `app/api/discovery/games/route.js`.
- Concretely, the catalogue includes:
  - Steam-only games (e.g. Hollow Knight)
  - PSN-only games (e.g. God of War Ragnarök, Spider-Man 2)
  - Steam+PSN games shown once with both badges (e.g. Elden Ring)

## 6. Steam implementation note

Steam can support both login and library data. A real Steam library sync is the
natural first real integration: it can import owned games, playtime, and
achievements, which then flow through normalization → external sources →
canonical games.

## 7. PSN implementation note

PSN must be supported as a game-data source. The **safest real integration path
is to be validated** before any production use — including authentication
approach, data access scope, and rate/usage constraints. Until validated, PSN
remains mock-backed and its connect action is intentionally non-functional in
the UI.

## 8. Future implementation steps

1. Real Steam library sync (owned games, playtime, achievements).
2. PSN feasibility validation (auth + data access path, to be validated).
3. Real platform account records (persisted connection + sync state).
4. Real external-source table (`GameExternalSource`) backing canonical matching.
5. Canonical matching review queue for unmatched detections.
6. Sync history / audit records for traceability and competition trust.

None of the above is implemented in this phase.

> **Update (Phase 10):** steps 3–6 are now **modeled** in `prisma/schema.prisma`
> (`PlatformAccount`, `PlatformSyncRun`, `PlatformDetectedGame`,
> `GameExternalSource`, `UserGame`) — schema and docs only, no runtime wiring or
> real sync. See `docs/PLATFORM_SYNC_PERSISTENCE_MODEL.md`.

## 9. Official platform status vocabulary

All platform-related code must use these values. The constants live in
`lib/platforms/platforms.js` and are the single source of truth.

### Connection status (`status` field on a platform account)

Describes whether the platform account is connected.

| Value | Meaning |
|---|---|
| `connected` | Account is linked and active |
| `disconnected` | Not connected / never linked |
| `needs_reauth` | Was connected but requires re-authentication |
| `unavailable` | Platform integration temporarily unavailable |

### Sync status (`syncStatus` field on a platform account)

Describes the outcome of the latest data sync attempt.

| Value | Meaning |
|---|---|
| `idle` | Never synced (connected but no sync run yet) |
| `syncing` | Sync currently in progress |
| `success` | Last sync completed successfully |
| `failed` | Last sync failed |
| `partial` | Last sync completed with partial data only |

### Key distinction

- **connection status** — is the platform account linked?
- **sync status** — did the last data import succeed?

Example:

```json
{ "provider": "steam",  "status": "connected",    "syncStatus": "success" }
{ "provider": "psn",    "status": "disconnected",  "syncStatus": "idle"    }
```

## 10. Relevant code

- `lib/platforms/platforms.js` — providers, capabilities, all official status constants
- `lib/platforms/normalization.js` — normalized detected-game / external-source shapes
- `lib/platforms/canonicalMatching.js` — canonical matching + source derivation
- `lib/mock/platformDetectedGames.js` — raw Steam/PSN detected games (mock)
- `lib/mock/platformAccounts.js` — Steam connected / PSN disconnected (mock)
- `lib/mock/gameExternalSources.js` — externalId → canonical gameId mapping (mock)
- `app/api/platforms` — public platform metadata (providers + status vocabularies)
- `app/api/me/platform-accounts` — current user's platform states (auth)
- `app/api/platforms/detected-games` — normalized detected games (auth)
