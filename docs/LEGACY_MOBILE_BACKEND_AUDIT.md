# Legacy Mobile / Backend Audit

**Phase 12 — strategic audit only. Docs-only. No runtime, DB, schema, or
behavior changes.** This document audits the legacy Leet9 mobile app and backend
microservices and decides what should survive into the new web-first Leet9.

> Principle: **the legacy work is product DNA and reference, not an
> implementation to port.** The new web app is the source of truth.

---

## 1. Executive summary

**What the legacy work contributes.** A complete, real (not mock) prior
implementation of the Leet9 idea: an iOS app (+ Android) with Games/Discovery,
My Games, Game Details, Leaderboard, Profile, Profile Stats, and Settings; and a
microservice backend (game, user, shared, blockchain, notification, email, cron,
api-gateway) that **already ingested real Steam and PSN data**, computed an L9
score, maintained levels, and ran a reward/bonus engine. It proves the core
loop (connect platform → detect games/playtime/trophies → score → rank) is
viable and that Leet9 was **platform-agnostic from day one** (Steam *and* PSN).

**What the new web app already preserved.** The product triangle —
**Discovery / Profile / Rankings** — plus a Profile Stats intelligence layer, a
lightweight Tribe community layer, the platform-agnostic normalized ingestion
contracts (`lib/platforms`), a Steam dry-run pipeline (`lib/integrations/steam`),
and a Prisma persistence model (`PlatformAccount`, `PlatformSyncRun`,
`PlatformDetectedGame`, `GameExternalSource`, `UserGame`). The web app already
captures the legacy product surface in cleaner form.

**What still needs extraction.** Concrete reference value (concepts, not code)
from: the L9 scoring inputs (playtime + percentile multipliers, the `L9key`
weights table), the Steam-vs-PSN playtime diffing logic (incremental, anti-
historical-gaming), the `UserRecord` activity/achievement ledger shape, the
trophy/achievement normalization, and the closed-alpha referral-code gating.

**What should NOT be copied blindly.** The reward-driven, game-specific scoring
(hardcoded DOTA/PUBG KPI fetchers; opaque, non-auditable), the editorial/curated
`Game` catalogue (game-of-the-week, `hotGame`, marketing fields) which conflicts
with the new "community-detected, no editorial catalogue" rule, and all
wallet/NFT/`web3`/reward-contract assumptions (woven through `User.wallets`,
`Level.rewardEligibleContracts`, `UserRecord.nftsCount`, `leet9-blockchain-service`).

**Bottom line:** legacy validates the vision and de-risks Steam/PSN ingestion,
but its scoring, catalogue, and rewards/blockchain coupling must be **redesigned
or deferred**, not ported.

---

## 2. Legacy source inventory

### Found (inspected directly)

Location: `~/Desktop/leet9-audit/` (reference only; not part of this repo).

| Area | Artifacts inspected |
|---|---|
| iOS app | `leet9-ios/Leet9/Modules/{Games,Leaderboard,Profile}` — Discovery (Latest/Popular/GamesOfTheWeek/ComingSoon/Filter), MyGames (+ stats views), GameDetails (progress/preview/video), GameStats, Leaderboard (+ filters, profile, achievements, recent games), Profile (Score/Level/Achievements/BadgeCollection/Stats), Settings (KeyPlatform/Wallet/Social) |
| Android app | `leet9-android/` (present, not deep-read) |
| Backend | `leet9-shared-service/src/models/*` (data models), `leet9-game-service/{controllers,services,algorithm,Rewards,repository}`, `leet9-user-service`, `leet9-blockchain-service`, `leet9-notification-service`, `leet9-email-service`, `leet9-cron`, `leet9-api-gateway` |
| Prior audit | `leet9-audit/_audit/{structured,deep_dive}` — pre-extracted scans (shared models, game/user service cores, product/domain scans) |
| Other | `PWA_V1/`, `landing.v1/` (copy), `leet9-product-architecture/` (the architecture docs already used), `leet9-project-status/` |

### Missing / not available

The specific **design exports and screenshots** named in the phase brief were
**not found** anywhere in the environment:

- `.pages` exports: `package.json.pages`, `modules_games_*.swift.pages`,
  `module_leaderboard.swift.pages`, `modules_profile*.swift.pages`,
  `leet9rewards.pages`, `leet9algorithm.pages`, `modules_profilestats.swift.pages`
- PNG mockups: `Games (New card v2).png`, `MDA - New.png`,
  `My Achievements - New/Old.png`, `Games - My games (Full).png`,
  `Competitions - Details.png`, `Competitions Main.png`,
  `Celebration Screens.png`, `Achievement Deep Dive.png`,
  `My profile - Settings.png`

(The only PNGs present are app icons/asset catalog images, not these design
comps.) **Competitions:** zero competition code exists in the legacy backend —
competitions were aspirational design only, never implemented.

### Confidence level

- **Backend data models & logic: HIGH** — inspected source directly.
- **iOS product surface & navigation: HIGH** — module/file structure + models inspected.
- **Visual/UX design intent (cards, celebration screens, achievement deep dive,
  competitions screens): LOW** — the named design exports are missing; only code
  remains. A deeper design audit needs those `.pages`/PNG files.

Overall audit confidence: **HIGH for "what the product did and how data flowed",
MEDIUM-LOW for "exact intended visual/UX of unbuilt areas (competitions,
celebration, achievement deep dive)".**

---

## 3. Product surface mapping

| Legacy concept | Current web equivalent | Status | Recommendation |
|---|---|---|---|
| Discovery (Latest, Popular, Games of the Week, Coming Soon, tag filters) | `/app/discovery` (community-detected, source badges, search/sort/filter) | partially preserved | Keep the discovery surface; **redesign the catalogue source** — drop editorial "game of the week / coming soon / hotGame" in favor of community-detected canonical games. |
| My Games (+ container stats) | Profile → Games tab | preserved | Keep. Wire to `UserGame` later. |
| Game Details / Game Stats (progress, KPIs, preview/video) | Game Deep Dive (`/app/discovery/[gameId]`) + Profile Stats | partially preserved | Keep deep dive; revisit per-game KPI stats only with transparent inputs. Media/video tabs deferred. |
| Achievements (Bonus badges + platform trophies, BadgeCollection, "My Achievements") | Profile Stats rarity/trophy-case layer | partially preserved | Keep as a stats layer now; **separate platform trophies (data) from L9 badges (gamification)** later. Achievement Deep Dive needs design audit. |
| Leaderboard (global + game/genre/technology filters, leaderboard profile) | `/app/rankings` (Players/Games/Tribes, scope filters, current-user highlight) | preserved | Keep. Port the **per-game/genre leaderboard filtering** ambition later. |
| Tribe / community | Profile → Tribe (lightweight) | partially preserved | Keep lightweight. Legacy had no real "tribe" model (community was implicit via leaderboard); design tribe fresh. |
| Competitions | (none) | deferred | **Never built in legacy** (0 code). Keep deferred; design from scratch when scoring is trustworthy. |
| Rewards / Bonus engine | (none) | deferred | Defer. Legacy rewards are blockchain-coupled and engagement-gamified; redesign only after engagement is proven. |
| Celebration screens (Level Up notifications, push) | (none) | needs deeper audit | Capture as future engagement/identity polish; needs the missing design exports. |
| Profile Settings (KeyPlatform, Wallet, Social: Discord/Twitch/Twitter/Instagram) | (none; Platform Sources is read-only) | deferred / discarded | Keep platform-connect concept (without wallet); **discard wallet**; social integrations deferred. |
| Score / Level / L9 points | Profile Stats L9 breakdown (explainable) | partially preserved | Keep L9 identity; **redesign the scoring math** to be transparent and auditable. |

---

## 4. Data model / logic extraction

For each legacy concept: **Port / Redesign / Defer / Discard.**

- **Game ownership** — *Port (concept).* Legacy stored owned games per platform in
  `UserRecord.platforms[].games[]` (name, titleId, lastPlayed, firstPlayed,
  duration, trophies, `L9PointsRewarded`). Maps cleanly to the new
  `PlatformDetectedGame` → `UserGame`. Reuse the *shape ideas*, not the schema.

- **Playtime** — *Port (logic concept).* `calculateTodayPlayTime` /
  `calculateWeeklyGameplayHours` diff new vs. previous duration, normalize Steam
  (minutes) vs. PSN (ISO-8601 duration), and **skip rewarding historical
  playtime on first connection** (anti-gaming). This incremental-diff + first-
  connection rule is a concrete, valuable insight for the real sync write path.

- **Achievements / trophies** — *Redesign.* Legacy conflates two things:
  platform **trophies** (real data in `UserRecord.platforms[].games[].trophies`)
  and L9 **badges** (`Bonus`/`Achievement` gamification with `maxScore`). The new
  model should keep these **separate**: trophies normalize like games; badges are
  a later engagement layer.

- **Leaderboard scoring** — *Redesign.* Legacy leaderboard sorts users by
  `points` (a reward-accumulated number). Keep the *ambition* (global + per-
  game/genre filters) but compute from normalized `UserGame` data, not reward
  accumulation.

- **L9 score / algorithm** — *Redesign (inspiration only).* `L9Points` =
  playtime points scaled by a game-size percentile multiplier
  (`qualitativeGame`) plus per-stat percentile-weighted KPI points
  (`qualitativeKpis`), with weights in the `L9key` collection
  (`percentile → multiplier[]`). **Problems:** game-specific (hardcoded
  DOTA/PUBG KPI fetchers), opaque, reward-driven, not auditable. **Keep the
  ideas** (percentile normalization, playtime base, data-driven weights);
  **redesign** for transparency and platform-agnostic generality.

- **Profile stats** — *Port (concept).* `userStats` (per-game percentile stats),
  `ProfileStats`, `ScoreLevel` map to the current explainable Stats tab. The web
  Stats layer is already cleaner; legacy informs which signals matter.

- **Gamer identity / DNA** — *Port (concept).* Legacy had Score/Level/percentile
  identity; the web "Gamer DNA" is a stronger, explainable evolution. Keep web.

- **Competitions** — *Defer.* No legacy implementation. Design later, only on
  auditable scoring.

- **Rewards** — *Defer/Redesign.* Legacy reward engine
  (`daily_gameplay_bonus`, `weekly_gameplay_bonus`, `play_new_game_bonus`,
  `connect_steam/psn`) is engagement gamification tied to blockchain contracts.
  Defer; if revived, decouple from wallet/NFT.

- **Tribes / social** — *Defer.* No real tribe model in legacy; social was
  Discord/Twitch/Twitter/Instagram links + a leaderboard. Design tribe fresh;
  defer social graph.

- **Celebration / notification logic** — *Defer (capture intent).* Level-up push
  notifications + celebration screens are good engagement DNA; defer to closed-
  alpha polish. Needs the missing design exports.

- **Blockchain / wallet / NFT / web3** — *Discard (for now).* `User.wallets[]`,
  `Level.rewardEligibleContracts`, `UserRecord.nftsCount`, `Game.web3`,
  `leet9-blockchain-service`. Out of scope per current product rules.

- **Closed-alpha gating** — *Port (concept).* `referralCodes` +
  `referralApplication` gated the alpha. Relevant to closed-alpha readiness.

---

## 5. Alignment with current architecture

Legacy raw platform logic must **not** bypass the new normalized model. Map the
legacy flow onto the current one:

```
Legacy:  register-platform → fetchFromSteam/fetchFromPSN → buildPlatformObject
         → UserRecord.platforms[].games[] → reward engine → User.score/points → leaderboard

New:     Connected Platform Account (PlatformAccount)
         → PlatformSyncRun
         → Raw platform response            (PlatformDetectedGame.raw)
         → Normalized PlatformDetectedGame  (PlatformDetectedGame.normalized)
         → GameExternalSource canonical match
         → UserGame (create/update)
         → Stats / Rankings / Tribe / Future Competitions
```

Key alignment rules carried forward from the audit:

- Legacy `buildPlatformObject` / `buildSteamPlatformObject` ≈ the new
  **normalization** step — but output must land in `PlatformDetectedGame`
  (auditable, raw + normalized) before touching `UserGame`.
- Legacy wrote rewards/score **directly** onto the user during ingestion. The new
  model must **separate ingestion from scoring**: ingest → normalize → persist
  `UserGame`; compute stats/score in a distinct, auditable step.
- Legacy `GameExternalSource`-equivalent did not exist (games were matched by
  name/identifier). The new `GameExternalSource` canonical mapping is a genuine
  improvement — **do not regress to name matching.**
- Steam-vs-PSN duration normalization (minutes vs ISO duration) is a real
  ingestion concern to port into the normalizers.

---

## 6. What survives (strongly)

- **Discovery as a community-driven game catalogue** (surface yes; editorial
  source no).
- **My Games / Profile Games.**
- **Achievement depth** (trophies + future badges).
- **Ranking / leaderboard ambition**, including per-game/genre filtering.
- **L9 score / identity layer** (the *idea* of a single gamer identity number).
- **Tribe / community layer** (lightweight now).
- **Platform-agnostic Steam + PSN ingestion** (legacy proves both are feasible).
- **Celebration moments** (future engagement polish).
- **Future competitions & rewards** (as deferred north-star, not legacy code).

---

## 7. What should be redesigned (not copied 1:1)

- **L9 scoring** — game-specific, opaque, reward-driven → make transparent,
  auditable, platform-agnostic, explainable (the web Stats layer already leans
  this way).
- **Reward logic** — decouple from gameplay-bonus-on-ingest and from blockchain.
- **Editorial catalogue** — `Game` model's marketing/curation fields
  (game-of-the-week, hotGame, banners, KPIs, web3) → replace with community-
  detected canonical games + `GameExternalSource`.
- **Any blockchain/wallet assumptions** — remove from the critical path.
- **Old leaderboard scoring** — recompute from normalized `UserGame`, not from
  accumulated reward `points`.
- **Mobile-specific navigation/UI patterns** — web IA already redesigned; don't
  port tab/segmented-controller patterns wholesale.
- **Platform-specific assumptions** — nothing should make Leet9 Steam-only or
  PSN-only; keep the provider-agnostic models.

---

## 8. What should remain deferred

Explicitly deferred (unless this audit surfaces a compelling reason — it does
not):

- Competitions
- Rewards
- Wallet / blockchain / NFT / web3
- Game downloads
- Full mobile parity
- Advanced tribe management
- Social graph / friends (Discord/Twitch/Twitter/Instagram integrations)
- Notifications (push)
- Public profiles

The audit found **no** reason to pull any of these earlier. (Closed-alpha
referral gating is the one adjacent concept worth scheduling sooner, but as new
work, not a legacy port.)

---

## 9. Implications for upcoming phases

| Upcoming phase | Legacy insight that should influence it |
|---|---|
| DB / dev-staging decision | Legacy used MongoDB; new uses Postgres/Prisma. No port — confirms a clean break. Decision is infra-only (see `docs/DB_MIGRATION_SAFETY.md`). |
| Migration artifact / application | None specific; keep additive, reviewed (Phase 11 rules). |
| `PlatformAccount` write path | Port the **first-connection rule** (don't reward/over-count historical playtime); capture `externalUserId` (steamid64 / PSN account id) and connection status. |
| Real Steam sync MVP | Reuse legacy Steam ingestion *concepts* (`getUserGamesFromSteam`, playtime in minutes, last-played); land results in `PlatformDetectedGame`, not directly on the user. |
| `UserGame` persistence | Port the create-vs-update + incremental-duration diff logic into the normalized write path. |
| Profile Games from DB | Mirror legacy "My Games" fields (hours, last played, trophies) from `UserGame`. |
| Stats from normalized data | Use legacy `L9key` percentile-weighting as **inspiration**; require explainability ("based on"). |
| Rankings from normalized data | Keep per-game/genre filtering ambition; compute from `UserGame`. |
| PSN feasibility | Legacy already integrated PSN (`getAuthTokenFromPsn`, `getUserGamesDataFromPsn`, ISO-duration parsing) — a concrete reference, but **revalidate the auth/data path** before trusting it. |
| QA / closed-alpha readiness | Port the **referral-code gating** concept for a closed alpha. |

---

## 10. Decision log

| Item | Decision | Note |
|---|---|---|
| Discovery surface | **Keep** | Community-detected, not editorial. |
| Editorial catalogue (game-of-the-week, hotGame, banners, web3) | **Discard** | Conflicts with product rule. |
| My Games / Profile Games | **Keep** | Wire to `UserGame` later. |
| Game Deep Dive | **Keep** | Media/video deferred. |
| Platform trophies (data) | **Keep / Redesign** | Normalize like games; separate from badges. |
| L9 badges / Bonus engine | **Defer / Redesign** | Decouple from blockchain. |
| Leaderboard / Rankings | **Keep** | Recompute from normalized data; add per-game/genre filters later. |
| L9 scoring algorithm | **Redesign** | Inspiration only; must be transparent/auditable. |
| `L9key` percentile weights | **Keep (as inspiration)** | Data-driven weighting idea is sound. |
| Steam ingestion | **Port (concept)** | Into normalized flow. |
| PSN ingestion | **Port (concept) + Revalidate** | Auth/data path needs validation. |
| First-connection / incremental playtime rule | **Keep** | Real anti-gaming + idempotency insight. |
| Wallet / NFT / web3 / blockchain-service | **Discard** | Out of scope. |
| Competitions | **Defer** | No legacy code; design later. |
| Rewards | **Defer** | After engagement proven. |
| Celebration / push notifications | **Defer** | Needs design exports. |
| Social integrations (Discord/Twitch/Twitter/Instagram) | **Defer** | Social graph later. |
| Referral-code closed-alpha gating | **Needs more evidence / schedule** | Useful for alpha; new work. |
| Mobile UI/navigation patterns | **Discard (port nothing 1:1)** | Web IA redesigned. |
| Competition/celebration/achievement-deep-dive **visual design** | **Needs more evidence** | Missing `.pages`/PNG exports. |

---

## 11. Open questions for Francesco / Mattia

1. **L9 scoring:** is the legacy L9 algorithm a **source of truth** or
   **inspiration only**? (Audit recommends inspiration only — it is game-specific
   and not auditable.)
2. **Competitions:** still wanted in **V1**, or **post-alpha**? (No legacy code
   exists; this is greenfield.)
3. **Rewards:** still central, or stay **deferred** until engagement is proven?
   And if revived, must they be **decoupled from wallet/NFT**?
4. **Achievements:** a **primary differentiator** or a **secondary stats layer**?
   Should platform trophies and L9 badges be modeled separately?
5. **Mobile parity:** is **web now the source of truth** with mobile later, or do
   we need iOS/Android parity sooner?
6. **Tribe:** an **identity/community** layer, or a future **team-competition**
   layer? (Affects how much to invest now.)
7. **Celebration screens:** part of **closed-alpha polish**, or later? (Needs the
   missing design exports to scope.)
8. **PSN:** trust the legacy PSN integration as a reference, or **revalidate**
   the auth/data path from scratch before relying on it?
9. **Closed alpha:** do we want **referral-code gating** (legacy had it) for the
   first alpha?
10. **Editorial vs community Discovery:** confirm we are fully dropping editorial
    curation (game-of-the-week/hotGame) in favor of community-detected only?

---

## 12. Final recommendation

**Should influence the next real-data phases:** the normalized ingestion
concepts proven in legacy (Steam + PSN owned-games, playtime, trophies), the
**first-connection / incremental-duration** anti-gaming rule, the separation of
**ingestion from scoring**, the `L9key` data-driven percentile weighting as
inspiration, and referral-code gating for a closed alpha.

**Should be ignored for now:** the editorial `Game` catalogue, the reward/bonus
engine, all wallet/NFT/web3/blockchain coupling, push notifications, social
integrations, and the game-specific (DOTA/PUBG) KPI scoring.

**Must be reviewed with Francesco/Mattia before implementation:** whether legacy
L9 scoring is truth vs. inspiration (Q1), competitions/rewards timing (Q2/Q3),
the achievements model (Q4), and PSN revalidation (Q8). These decisions gate the
scoring and competition phases and should not be assumed.

See `docs/LEGACY_AUDIT_ACTION_PLAN.md` for the short actionable follow-up list.

---

## 13. GitHub Legacy Repo Inventory

**Read-only inventory** of all repositories under the `Leet9-Dev` GitHub org
(via `gh repo list`, authenticated as `BaGitGiolo`). **18 repos total; none are
archived.** Nothing in GitHub was modified — this is an inventory only.

Inspection note: the `leet9-*` repos and `PWA_V1` were inspected from local
clones under `~/Desktop/leet9-audit/` (and `~/Desktop/leet9-product-architecture`,
`~/Desktop/leet9-project-status`); the two `*demo*` repos were inspected via the
read-only GitHub contents API. Backend services `game`/`shared`/`user` were read
deeply in §2–§4; others were inspected at structure level.

| Repo | Vis | Lang | Last push | Inspected | Appears to contain | Relevance | Recommendation | Del. risk |
|---|---|---|---|---|---|---|---|---|
| `landing.v1` | public | JS | 2026-06 | yes (this repo) | The current web MVP (source of truth) | **Critical — active** | **Keep active** | high |
| `leet9-product-architecture` | private | docs | 2026-06 | yes | Product/architecture docs (UX ref, data model, API contract, build plan) | **Critical — active reference** | **Keep active** | high |
| `leet9-game-service` | private | TS | 2025-09 | yes (deep) | Steam+PSN ingestion, L9 scoring algorithm, leaderboard, rewards, cron sync | Highest-value legacy logic reference | Keep as archive/reference | high |
| `leet9-shared-service` | private | TS | 2025-09 | yes (deep) | Core Mongoose models (User, UserRecord, Game, L9key, Bonus, Level, achievements) | Data-model DNA reference | Keep as archive/reference | high |
| `leet9-user-service` | private | TS | 2026-05 | yes | User logic + rewards (`Rewards/`, gameplay mock) | Scoring/reward reference | Keep as archive/reference | medium |
| `leet9-ios` | private | Swift | 2025-09 | yes | iOS app: Games/Discovery, MyGames, Details/Stats, Leaderboard, Profile, Settings | Product/UX DNA reference | Keep as archive/reference | medium |
| `leet9-android` | private | Kotlin | 2025-06 | yes (structure) | Android app | Secondary product DNA | Keep as archive/reference | medium |
| `leet9-cron` | private | TS | 2023-08 | yes (structure) | Scheduled gameplay/reward sync (daily/weekly) | Future sync-scheduling reference | Keep as archive/reference | medium |
| `leet9-blockchain-service` | private | TS | 2025-09 | yes (structure) | Wallet/NFT/blockchain reward logic | Deferred/out-of-scope domain | Archive candidate | medium |
| `leet9-notification-service` | private | TS | 2025-07 | yes (structure) | Push/notification service | Deferred domain | Archive candidate | low-medium |
| `leet9-email-service` | private | TS | 2025-05 | yes (structure) | Transactional email | Deferred domain | Archive candidate | low-medium |
| `leet9-api-gateway` | private | — | 2025-05 | yes (structure) | API gateway/routing config | Deploy/routing reference | Archive candidate | medium |
| `leet9-api-service` | private | — | 2023-10 | yes (structure) | Older API service (pre-microservice split?) | Possibly superseded | Needs owner review | medium |
| `leet9-common-service` | private | — | 2023-07 | yes (structure) | Oldest shared/common service | Possibly superseded | Needs owner review | medium |
| `leet9-project-status` | public | docs | 2026-06 | yes | Tiny status README (~13 lines) | Low; public visibility unclear | Needs owner review (visibility) | low |
| `PWA_V1` | private | — | 2026-05 | yes | **Empty** (0 files, no default branch) | None (superseded by `landing.v1`) | Needs owner review → likely delete | low |
| `demo-repository` | private | HTML | 2026-05 | yes (API) | GitHub default "demo" template (README/index.html/package.json) | None — not a Leet9 project | Deletion candidate | low |
| `refactored-funicular-demo-repository` | private | HTML | 2026-05 | yes (API) | Byte-identical copy of the GitHub demo template | None — not a Leet9 project | Deletion candidate | low |

Useful concepts found (by repo), beyond §3–§4:

- `leet9-game-service` / `leet9-shared-service`: the entire normalized-ingestion +
  scoring DNA (see §4). Preserve until the new real Steam sync is proven.
- `leet9-cron`: daily/weekly gameplay sync scheduling — reference for future sync
  jobs (not built in the web app yet).
- `leet9-ios`: discovery sections, achievement/badge collection, profile
  score/level — design/UX intent (partial; the named design exports are still
  missing — see §2).

Risks / obsolete assumptions found:

- Blockchain/wallet/NFT coupling concentrated in `leet9-blockchain-service` and
  woven into shared/user models — out of scope per current product rules.
- `leet9-api-service` and `leet9-common-service` are from 2023 and may be
  superseded by the later `game`/`user`/`shared` services — ownership/superseding
  status is unclear and must be confirmed.
- Two `*demo*` repos are GitHub onboarding artifacts, not Leet9 work.

## 14. Repo Cleanup Recommendations

> **No repository was deleted, archived, renamed, transferred, or had its
> visibility/settings changed in this phase.** These are recommendations only and
> require owner (Francesco/Mattia) approval before any action.

### 1. Keep active (current source of truth)
- `landing.v1` — the web MVP.
- `leet9-product-architecture` — product/architecture docs.

### 2. Keep as archive/reference (useful legacy knowledge; do not develop further)
Preserve **at least until the real Steam sync MVP is working and validated**:
- `leet9-game-service` (ingestion + L9 algorithm + leaderboard + rewards)
- `leet9-shared-service` (core data models)
- `leet9-user-service` (user/reward logic)
- `leet9-ios` (product/UX DNA)
- `leet9-android` (secondary product DNA)
- `leet9-cron` (sync scheduling reference)

### 3. Archive candidates (likely superseded; preserve read-only)
- `leet9-blockchain-service` (deferred/out-of-scope domain)
- `leet9-notification-service`
- `leet9-email-service`
- `leet9-api-gateway`

### 4. Deletion candidates (no unique Leet9 value, duplicated/templated)
- `demo-repository` — GitHub default demo template.
- `refactored-funicular-demo-repository` — byte-identical demo template.
- `PWA_V1` — **only if confirmed empty/intentionally abandoned** (currently 0
  files); otherwise owner review.

(Even these require owner approval — see safety rules below.)

### 5. Needs owner review (unclear context/ownership/supersession/visibility)
- `leet9-api-service` (2023; superseded?)
- `leet9-common-service` (2023; superseded?)
- `leet9-project-status` (public; intended visibility?)
- `PWA_V1` (empty; intended placeholder vs abandoned?)

### Deletion safety rules

- **No repo may be deleted without explicit owner approval.**
- **Prefer archiving over deletion** whenever there is any uncertainty.
- Before deleting any repo, verify it has **no unique code, docs, assets, issues,
  PRs, releases, wikis, or deployments** that exist nowhere else.
- Check **Vercel, Neon, OAuth apps, GitHub Actions/workflows, webhooks, and
  cross-repo package references** before deleting — a repo may back a live
  deployment or integration.
- **Export/backup** (clone + push to backup, or download archive) before any
  deletion.
- Treat deletion as **irreversible** — it is a product/engineering decision, not
  a cleanup task. When in doubt, archive.
