# Legacy Audit — Action Plan

A short, actionable follow-up to `docs/LEGACY_MOBILE_BACKEND_AUDIT.md`. Nothing
here is implemented in Phase 12; this is the to-do/decision list.

## Legacy logic to inspect deeper (when the relevant phase starts)

- [ ] `leet9-game-service/algorithm/l9.algorithm.ts` — full scoring pipeline
      (`qualitativeGame`, `qualitativeKpis`, `userPercentileCalc`,
      `gamePercentileCalculator`, `l9PointAssignment`) before redesigning scoring.
- [ ] `leet9-game-service/services/gameplay.service.ts` — `calculateTodayPlayTime`
      / `calculateWeeklyGameplayHours` (incremental diff, first-connection rule)
      before the `UserGame` write path.
- [ ] `leet9-game-service/repository/{steam,psn}.repository.ts` — real Steam/PSN
      fetch calls before the real sync MVP (Steam) and PSN revalidation.
- [ ] `leet9-shared-service/src/models/{userRecord,l9key,bonus,level}.ts` —
      activity/achievement ledger + weighting + reward/level rules as reference.
- [ ] `leet9-shared-service/src/models/{referralCodes,referralApplication}.ts` —
      closed-alpha gating before alpha.

## Design exports to review (currently MISSING — request from Francesco)

- [ ] `.pages` exports: `modules_games_*.swift.pages`, `module_leaderboard.swift.pages`,
      `modules_profile*.swift.pages`, `leet9rewards.pages`, `leet9algorithm.pages`,
      `modules_profilestats.swift.pages`
- [ ] PNG mockups: `Games (New card v2).png`, `MDA - New.png`,
      `My Achievements - New/Old.png`, `Games - My games (Full).png`,
      `Competitions - Details.png`, `Competitions Main.png`,
      `Celebration Screens.png`, `Achievement Deep Dive.png`,
      `My profile - Settings.png`
- [ ] These are needed for a **design** audit of competitions, celebration
      screens, and achievement deep dive (LOW-confidence areas in this audit).

## Files needed for a deeper audit

- [ ] The missing `.pages`/PNG design exports above.
- [ ] Any product spec for the original L9 scoring weights (the `L9key` data, not
      just the schema).
- [ ] Confirmation of which legacy KPIs were intended to generalize beyond
      DOTA/PUBG.

## Next decisions (owner: Francesco / Mattia)

- [ ] L9 scoring = source of truth or inspiration only? (recommend: inspiration)
- [ ] Competitions in V1 or post-alpha? (no legacy code exists)
- [ ] Rewards central or deferred; decoupled from wallet/NFT if revived?
- [ ] Achievements: primary differentiator vs secondary stats layer?
- [ ] Web as source of truth vs mobile parity later?
- [ ] Tribe = identity/community vs future team-competition?
- [ ] Referral-code gating for closed alpha — yes/no?
- [ ] Confirm fully dropping editorial Discovery (game-of-the-week/hotGame)?

## Implementation risks to watch

- **Reintroducing reward/score on ingest.** Keep ingestion separate from scoring
  (legacy wrote score directly during platform fetch — do not repeat).
- **Name-based game matching.** Legacy matched by name/identifier; the new
  `GameExternalSource` canonical mapping must not regress to this.
- **Blockchain coupling creep.** Wallet/NFT/contract fields were woven through
  user/level/record models — keep them out of the critical path.
- **Steam-only or PSN-only assumptions.** Preserve provider-agnostic models;
  legacy handled both but with platform-specific duration parsing (minutes vs
  ISO) that must live in the normalizers.
- **Trusting legacy PSN path blindly.** Revalidate PSN auth/data access before
  relying on it.
- **Historical-playtime over-counting.** Port the first-connection rule or risk
  inflated stats on initial sync.

## GitHub repo cleanup actions (owner approval required)

See `docs/LEGACY_MOBILE_BACKEND_AUDIT.md` §13–§14 for the full inventory. **No
repo action was taken in this phase.**

- [ ] **Confirm `PWA_V1` is empty/abandoned** (currently 0 files) → archive or delete.
- [ ] **Confirm the two `*demo*` repos are GitHub onboarding artifacts** → delete
      (`demo-repository`, `refactored-funicular-demo-repository`).
- [ ] **Confirm `leet9-api-service` / `leet9-common-service` (2023) are superseded**
      by `game`/`user`/`shared` services → archive.
- [ ] **Confirm `leet9-project-status` intended visibility** (currently public).
- [ ] Archive (read-only, do not develop): `leet9-blockchain-service`,
      `leet9-notification-service`, `leet9-email-service`, `leet9-api-gateway`.
- [ ] **Preserve until real Steam sync works:** `leet9-game-service`,
      `leet9-shared-service`, `leet9-user-service`, `leet9-ios`, `leet9-android`,
      `leet9-cron`.

## Owner-review checklist before ANY repo deletion/archive

- [ ] Owner (Francesco/Mattia) has explicitly approved the specific action.
- [ ] No unique code/docs/assets/issues/PRs/releases/wikis exist only in that repo.
- [ ] No live deployment depends on it (Vercel / Render / other hosting).
- [ ] No Neon DB, OAuth app, webhook, or GitHub Action references it.
- [ ] No other repo imports it as a package/submodule.
- [ ] A backup/export was taken (clone pushed to backup or archive downloaded).
- [ ] Prefer **archive** over **delete** if any box is unchecked.

## Repos that need deeper inspection (before cleanup)

- [ ] `leet9-api-service`, `leet9-common-service` — confirm superseded vs still wired.
- [ ] `leet9-api-gateway` — confirm whether it still fronts any live service.
- [ ] `leet9-blockchain-service` — confirm no live wallet/contract dependency.

## Repos to preserve until real Steam sync is working

- [ ] `leet9-game-service`, `leet9-shared-service`, `leet9-user-service`,
      `leet9-cron` (ingestion/scoring/scheduling reference) — do not delete until
      the new normalized Steam sync is validated end-to-end.
