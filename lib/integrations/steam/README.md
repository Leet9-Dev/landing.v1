# Steam Integration — Dry-Run Preparation Layer

**Status: Phase 9 — preparation only. No real Steam API is called.**

This directory contains the Steam integration boundary for Leet9. Everything
here is a dry-run preparation layer. Real Steam sync is not yet active.

## What this layer does

- `steamFixtures.js` — realistic mock Steam raw API responses for dry-run testing
- `steamClient.js` — the future Steam Web API client interface (all functions return fixture data or throw)
- `steamNormalizer.js` — converts raw Steam game objects into the Leet9 normalized detected-game shape
- `steamSyncPlanner.js` — produces a dry-run sync plan: what would be created/updated on a real sync

## What must happen before real sync

### 1. Environment / API key

- Add `STEAM_API_KEY` to Vercel environment variables. Never commit it.
- The key is obtained from https://steamcommunity.com/dev/apikey (requires a Steam account with a valid domain).
- In `steamClient.js`, flip `DRY_RUN = false` and uncomment the real fetch calls only after the key is set.

### 2. Steam ID resolution

- Steam login via NextAuth (already available) provides a `steamid64` in the JWT token.
- For users who did not log in via Steam, a vanity URL lookup or manual entry will be needed.
- Profile visibility must be public for the library to be accessible.

### 3. Profile visibility handling

- Steam's `GetOwnedGames` returns an empty list (or 403) for private profiles.
- The client must detect this and surface a clear message: "Your Steam profile must be set to Public."
- This is a known UX issue for Steam integrations.

### 4. Persistence model

Before real sync, the following database tables/records are needed:
- `PlatformAccount` — stores the user's Steam connection + sync state
- `DetectedGame` — stores raw detected games per sync run (for audit)
- `GameExternalSource` — maps Steam appId → canonical gameId (already mocked in lib/mock/gameExternalSources.js)
- `UserGame` — stores the user's relationship to each canonical game

None of these are persisted in this phase. The sync planner only plans; it does not write.

### 5. Sync audit trail

Each sync run should be recorded:
- which Steam ID was synced
- when the sync started and finished
- how many games were detected, matched, created, updated
- which games were unmatched (for the review queue)
- raw API response (for debugging)

### 6. Retry and error handling

- Steam API can return 429 (rate limit) or 503. Implement exponential backoff.
- Store partial results if sync is interrupted.
- Surface sync errors to the user clearly.

### 7. Unmatched game review queue

- Steam games with no canonical match must NOT enter Discovery automatically.
- They should enter a review queue where an admin (or future ML matcher) can map them.
- The sync planner already classifies unmatched games separately.

### 8. Achievement sync

- `GetPlayerAchievements` is a per-game call and is expensive at scale.
- It should be a follow-up step after owned-game sync, prioritized by playtime.
- `steamClient.js` has a placeholder `fetchSteamAchievements` for this.

### 9. PSN parity

Steam is the first real integration candidate, but Leet9 is platform-agnostic.
PSN must follow the same normalized ingestion flow (raw detected games →
normalization → canonical matching → UserGame) once the Steam path is validated.
A `lib/integrations/psn/` directory should be created in a future phase.

## Normalized ingestion flow

```
Connected Steam Account
  → Raw Steam Game (from GetOwnedGames)
  → normalizeSteamGame()         [steamNormalizer.js]
  → matchDetectedGameToCanonical() [lib/platforms/canonicalMatching.js]
  → GameExternalSource lookup
  → Canonical Game
  → UserGame (create or update)
  → Discovery / Profile / Stats / Rankings
```

## Security notes

- Never log or expose `STEAM_API_KEY` in responses, errors, or client-side code.
- Steam IDs (steamid64) are public but should not be exposed unnecessarily.
- Treat raw Steam API responses as untrusted third-party data; validate before persisting.
