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
