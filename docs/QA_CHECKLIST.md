# Leet9 QA Checklist

A practical, area-by-area manual QA backlog for the Leet9 web app. Check items
off against a Vercel preview (or production) build with a signed-in user.

## Status

Manual QA is **deferred**. The app has been built and validated with automated
`lint` + `build` and basic unauthenticated API smoke tests only. A full manual
QA pass (owner: Mattia) **must be completed before any public release or real
Steam/PSN data integration**. Until then, treat all data as mock and all stats
as illustrative.

## Environment

- [ ] GitHub `main` branch is the source of truth
- [ ] Tested on Vercel preview deployment
- [ ] Tested on Vercel production deployment
- [ ] Signed in as an authenticated user
- [ ] Google login available
- [ ] Steam login available (if configured)
- [ ] Desktop browser pass first
- [ ] Mobile / responsive pass later

## Landing & Auth

- [ ] Landing page loads
- [ ] Logo is visible
- [ ] ENTER flow works
- [ ] Google login works
- [ ] Steam login works (if configured)
- [ ] Sign out returns to landing
- [ ] Unauthenticated `/app` redirects to landing

## App Shell

- [ ] Sidebar renders
- [ ] TopBar renders
- [ ] Navigation active states work
- [ ] `/app` redirects to `/app/discovery`
- [ ] `/dashboard` redirects to `/app`
- [ ] No blocking console errors

## Discovery

- [ ] Discovery page loads
- [ ] Search works
- [ ] Platform filters work
- [ ] Sort controls work
- [ ] Trending section works
- [ ] Recently detected section works
- [ ] No duplicate canonical games
- [ ] Game cards show source platform badges
- [ ] Game cards open Game Deep Dive

## Game Deep Dive

- [ ] Page loads for valid `gameId`
- [ ] Back to Discovery works
- [ ] Community stats render
- [ ] External sources render
- [ ] User stats render if available
- [ ] Add to Profile mock action shows confirmation
- [ ] Already-in-profile state works

## Profile Overview

- [ ] Overview tab loads
- [ ] Profile hero renders
- [ ] Platform badges render
- [ ] Rank progress renders
- [ ] Signature games render
- [ ] Trophy case renders
- [ ] Recent activity renders
- [ ] Nearby players render
- [ ] Share card placeholder is non-functional by design

## Profile Games

- [ ] Games tab loads
- [ ] Search works
- [ ] Platform filter works
- [ ] Sort works
- [ ] Game cards show L9 / hours / mastery / achievements
- [ ] Game cards link to Game Deep Dive

## Profile Stats

- [ ] Stats tab loads
- [ ] Summary cards render (total L9, hours, games tracked, active games, achievements, profile completeness)
- [ ] L9 point breakdown renders with composition bar
- [ ] Platform confidence renders with per-platform confidence labels
- [ ] Gamer DNA renders with score bars
- [ ] Momentum renders (this month vs last, MoM %, monthly mini-chart, streak)
- [ ] Mastery summary renders (average %, above 80/50 counts, highest game)
- [ ] Rarity breakdown renders
- [ ] Top games by hours render and link to Game Deep Dive
- [ ] Genre distribution renders
- [ ] Explainability copy is visible (each signal says what it is "based on")
- [ ] Confidence language is visible
- [ ] Unauthenticated `/api/me/stats` returns `UNAUTHENTICATED`

## Profile Tribe Placeholder

- [ ] Tribe tab loads
- [ ] Placeholder text is intentional
- [ ] No broken actions

## Rankings

- [ ] Rankings page loads
- [ ] Player Rankings tab loads
- [ ] Current user is highlighted
- [ ] Player scope filters work (Global / Friends / Tribe)
- [ ] Game Rankings tab loads
- [ ] Game sort / filter controls work
- [ ] Game rows link to Game Deep Dive
- [ ] Tribe Rankings tab loads
- [ ] Current user tribe is highlighted
- [ ] No tribe management actions exist

## API / Auth Smoke Tests

When signed out, each protected endpoint should return HTTP 401 with
`{ ok: false, error: { code: "UNAUTHENTICATED" } }`.

- [ ] Unauthenticated `/api/me` returns 401
- [ ] Unauthenticated `/api/me/profile` returns 401
- [ ] Unauthenticated `/api/me/games` returns 401
- [ ] Unauthenticated `/api/me/activity` returns 401
- [ ] Unauthenticated `/api/me/stats` returns 401
- [ ] Unauthenticated `/api/rankings/players` returns 401
- [ ] Unauthenticated `/api/rankings/games` returns 401
- [ ] Unauthenticated `/api/rankings/tribes` returns 401

## Regression Before Real Data

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] No secrets committed
- [ ] No `.env` changes
- [ ] Main pages work after refresh
- [ ] Protected routes behave correctly
- [ ] Core product loop works:
      login → Discovery → Game Deep Dive → Add to Profile → Profile Games → Rankings

## Known Deferred QA

Not manually tested yet:

- [ ] Signed-in full browser QA
- [ ] Mobile responsiveness
- [ ] Vercel production smoke test
- [ ] Steam provider real login (if not configured)
- [ ] Cross-browser pass
- [ ] Accessibility pass
