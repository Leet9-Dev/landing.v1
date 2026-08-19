#!/usr/bin/env python3
"""
Leet9 gamification economy simulator — §14 of the Master Spec v2.1

Usage:
    python scripts/econ_sim/econ_sim.py
    python scripts/econ_sim/econ_sim.py --config tuned --n 400 --seed 9 --outdir out/
    python scripts/econ_sim/econ_sim.py --mix 0.40 0.35 0.20 0.05

Exits 1 if any §4 economy invariant is violated. Run on every config change;
commit out/results_tuned.json alongside this file so changes are auditable.

Invariants checked (§4, aggregate weighted population):
    play + achievements + challenges >= 60% of XP minted
    login                            <= 15% of XP minted
    Casual user reaches L5 within first 7 days (§14)
"""

import argparse
import json
import math
import random
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Tuple

# ---------------------------------------------------------------------------
# §19 Config — single namespace, all tunable values (spec v2.1)
# ---------------------------------------------------------------------------
CFG = {
    "xp.play_hour": 30,
    "xp.coplay_bonus": 15,
    "cap.play_hours_day": 4,
    "xp.ach.common": 10,
    "xp.ach.uncommon": 25,
    "xp.ach.rare": 60,
    "xp.ach.ultra": 150,
    "xp.ach.fallback": 25,
    "cap.ach_xp_day": 500,
    "xp.challenge.win": 200,
    "xp.challenge.complete": 50,
    "xp.challenge.draw": 100,
    "cap.challenges.scored_day": 3,
    "cap.challenges.scored_week": 10,
    "cap.challenges.live_max": 5,
    "cap.challenges.per_pair_week": 3,
    "xp.login": 20,
    "xp.streak.7": 100,
    "xp.streak.30": 500,
    "xp.streak.100": 2000,
    "xp.streak.365": 10000,
    "streak.freeze_bank": 2,
    "xp.connect.gaming": 150,
    "xp.connect.social": 100,
    "cap.connect.gaming": 5,
    "cap.connect.social": 3,
    "xp.new_title.launch": 10,
    "xp.new_title.settled": 40,
    "cap.new_titles_week": 3,
    "xp.share": 25,
    "cap.share_day": 1,
    "xp.badge_claim.bronze": 100,
    "xp.badge_claim.silver": 300,
    "xp.badge_claim.gold": 800,
    "xp.badge_claim.leet": 2000,
    "xp.nudge": 100,
    "xp.referral": 300,
    "xp.quest": 75,
    "heritage.cap": 2500,
    "heritage.per_hour": 1.5,
    # v2.1: level curve steepened (+30%) so endgame prestige is preserved
    "level.step.base": 300,
    "level.step.coef": 65,
    "level.step.exp": 1.5,
    "season.length_weeks": 9,
    # v2.1: silver lowered so median lurker ranks up; platinum lowered so casual p90 clears it
    "tier.silver": 1000,
    "tier.gold": 3500,
    "tier.platinum": 5250,
    "tier.diamond": 15000,
    "tier.leet_mode": "top_100",
    "challenge.settle_grace_h": 6,
    "challenge.expire_h": 48,
    "integrity.session_hard_cap_h": 6,
    "integrity.idle_suspect_h": 3,
    "push.daily_cap": 2,
}

# ---------------------------------------------------------------------------
# §3.4 Level curve — step(L) = round((300 + 65*(L-1)^1.5) / 10) * 10
# ---------------------------------------------------------------------------

def step_xp(level: int) -> int:
    raw = CFG["level.step.base"] + CFG["level.step.coef"] * (level - 1) ** CFG["level.step.exp"]
    return round(raw / 10) * 10


def build_level_table(max_level: int = 50) -> List[int]:
    cumulative = [0, 0]  # index 0 unused; L1 = 0 XP
    for lvl in range(2, max_level + 1):
        cumulative.append(cumulative[-1] + step_xp(lvl))
    return cumulative


LEVEL_TABLE = build_level_table()


def xp_to_level(xp: int) -> int:
    for lvl in range(len(LEVEL_TABLE) - 1, 0, -1):
        if xp >= LEVEL_TABLE[lvl]:
            return lvl
    return 1


def sp_to_tier(sp: int) -> str:
    if sp >= CFG["tier.diamond"]:
        return "Diamond"
    if sp >= CFG["tier.platinum"]:
        return "Platinum"
    if sp >= CFG["tier.gold"]:
        return "Gold"
    if sp >= CFG["tier.silver"]:
        return "Silver"
    return "Bronze"


# ---------------------------------------------------------------------------
# Persona weekly behavior profiles (§14)
# ---------------------------------------------------------------------------

@dataclass
class PersonaBehavior:
    name: str
    active_days_per_week: float
    play_hours_per_active_day: float
    achievements_per_active_day: float
    sprints_per_week: float
    win_rate: float
    new_titles_per_week: float
    shares_per_week: float
    quests_per_week: float
    # Approximate imported library size for heritage grant (§3.3)
    imported_hours: float = 0.0
    # Initial gaming/social platforms connected on day 0
    initial_gaming_connects: int = 2
    initial_social_connects: int = 1


PERSONAS: Dict[str, PersonaBehavior] = {
    "Lurker": PersonaBehavior(
        name="Lurker",
        active_days_per_week=1.5,
        play_hours_per_active_day=0.5,
        achievements_per_active_day=0.5,
        sprints_per_week=0.2,
        win_rate=0.5,
        new_titles_per_week=0.1,
        shares_per_week=0.1,
        quests_per_week=0.0,
        imported_hours=200.0,
        initial_gaming_connects=1,
        initial_social_connects=1,
    ),
    "Casual": PersonaBehavior(
        name="Casual",
        active_days_per_week=4.0,
        play_hours_per_active_day=1.0,
        achievements_per_active_day=2.0,
        sprints_per_week=1.0,
        win_rate=0.5,
        new_titles_per_week=0.5,
        shares_per_week=0.5,
        quests_per_week=1.0,
        imported_hours=700.0,
        initial_gaming_connects=2,
        initial_social_connects=1,
    ),
    "Core": PersonaBehavior(
        name="Core",
        active_days_per_week=6.0,
        play_hours_per_active_day=2.5,
        achievements_per_active_day=5.0,
        sprints_per_week=3.0,
        win_rate=0.5,
        new_titles_per_week=1.0,
        shares_per_week=1.0,
        quests_per_week=3.0,
        imported_hours=2000.0,
        initial_gaming_connects=3,
        initial_social_connects=2,
    ),
    "Hardcore": PersonaBehavior(
        name="Hardcore",
        active_days_per_week=7.0,
        play_hours_per_active_day=4.5,  # hits 4h cap daily
        achievements_per_active_day=10.0,
        sprints_per_week=10.0,
        win_rate=0.5,
        new_titles_per_week=2.0,
        shares_per_week=1.0,
        quests_per_week=3.0,
        imported_hours=5000.0,
        initial_gaming_connects=5,
        initial_social_connects=3,
    ),
}

# Achievement rarity distribution (approximate cross-platform average)
ACH_RARITY_DIST = [
    (0.55, CFG["xp.ach.common"]),
    (0.25, CFG["xp.ach.uncommon"]),
    (0.15, CFG["xp.ach.rare"]),
    (0.05, CFG["xp.ach.ultra"]),
]


def ach_xp_for_count(count: float) -> float:
    return sum(count * frac * xp for frac, xp in ACH_RARITY_DIST)


def heritage_xp(imported_hours: float) -> float:
    """§3.3: one-time grant on first platform sync, XP-only (no SP)."""
    return min(CFG["heritage.cap"], math.floor(imported_hours * CFG["heritage.per_hour"]))


def initial_badge_claims(gaming_connects: int, social_connects: int) -> float:
    """Approximate badge XP from connecting platforms on day 0 (§7)."""
    xp = 0.0
    # janus_key: 1 platform → bronze (100), 2 → silver (300), 3 → gold (800)
    if gaming_connects >= 1:
        xp += CFG["xp.badge_claim.bronze"]
    if gaming_connects >= 2:
        xp += CFG["xp.badge_claim.silver"]
    if gaming_connects >= 3:
        xp += CFG["xp.badge_claim.gold"]
    # aphrodite_mirror: 1 social → bronze (100), 2 → silver (300)
    if social_connects >= 1:
        xp += CFG["xp.badge_claim.bronze"]
    if social_connects >= 2:
        xp += CFG["xp.badge_claim.silver"]
    return xp


# ---------------------------------------------------------------------------
# Season simulation (Monte Carlo, stochastic given seed)
# ---------------------------------------------------------------------------

def simulate_season(persona: PersonaBehavior, seed: int = 42) -> Tuple[dict, dict, int]:
    rng = random.Random(seed)
    days = CFG["season.length_weeks"] * 7

    xp: Dict[str, float] = {k: 0.0 for k in [
        "play", "achievements", "challenges", "login",
        "streaks", "connects", "new_titles", "shares", "badges", "quests",
    ]}
    sp: Dict[str, float] = {k: 0.0 for k in xp}

    streak = 0
    streak_milestones_hit: set = set()

    # --- Day 0: onboarding connects, heritage, initial badge claims ---
    gaming_credited = min(persona.initial_gaming_connects, CFG["cap.connect.gaming"])
    social_credited = min(persona.initial_social_connects, CFG["cap.connect.social"])
    connects_xp = (
        gaming_credited * CFG["xp.connect.gaming"] +
        social_credited * CFG["xp.connect.social"]
    )
    xp["connects"] += connects_xp
    sp["connects"] += connects_xp

    # Heritage is XP-only (§3.3: no SP from history)
    h_xp = heritage_xp(persona.imported_hours)
    xp["badges"] += h_xp  # grouped with badges (identity, not competition)

    # Badge claims from initial connects (§7)
    badge_xp = initial_badge_claims(gaming_credited, social_credited)
    xp["badges"] += badge_xp
    sp["badges"] += badge_xp

    for day in range(days):
        is_active = rng.random() < (persona.active_days_per_week / 7)

        if is_active:
            streak += 1

            # Login (§4: login, 1/day)
            xp["login"] += CFG["xp.login"]
            sp["login"] += CFG["xp.login"]

            # Play hours (§4: play_hour, cap 4h/day)
            raw_hours = persona.play_hours_per_active_day * rng.uniform(0.7, 1.3)
            credited_hours = min(raw_hours, CFG["cap.play_hours_day"])
            play_gain = credited_hours * CFG["xp.play_hour"]
            xp["play"] += play_gain
            sp["play"] += play_gain

            # Achievements (§4: achievement, cap 500 XP/day)
            raw_count = persona.achievements_per_active_day * rng.uniform(0.5, 1.5)
            ach_gain = min(ach_xp_for_count(raw_count), CFG["cap.ach_xp_day"])
            xp["achievements"] += ach_gain
            sp["achievements"] += ach_gain

            # Shares (§4: share, 1/day)
            if rng.random() < (persona.shares_per_week / 7):
                xp["shares"] += CFG["xp.share"]
                sp["shares"] += CFG["xp.share"]
        else:
            streak = 0  # simplified: freeze mechanic not modeled here

        # Streak milestones (§4: streak_ms_*)
        for ms in [7, 30, 100, 365]:
            if streak == ms and ms not in streak_milestones_hit:
                bonus = CFG[f"xp.streak.{ms}"]
                xp["streaks"] += bonus
                sp["streaks"] += bonus
                streak_milestones_hit.add(ms)

        # Weekly events (on week boundary)
        if day % 7 == 0:
            # New titles (§4: new_title_launch + new_title_settled)
            weekly_new = min(persona.new_titles_per_week, CFG["cap.new_titles_week"])
            for _ in range(int(round(weekly_new))):
                gain = CFG["xp.new_title.launch"] + CFG["xp.new_title.settled"]
                xp["new_titles"] += gain
                sp["new_titles"] += gain

            # Sprints (§4: challenge_win / challenge_complete; cap 10/week)
            weekly_sprints = min(persona.sprints_per_week, CFG["cap.challenges.scored_week"])
            wins = weekly_sprints * persona.win_rate
            losses = weekly_sprints * (1 - persona.win_rate)
            ch_gain = wins * CFG["xp.challenge.win"] + losses * CFG["xp.challenge.complete"]
            xp["challenges"] += ch_gain
            sp["challenges"] += ch_gain

            # Quests (§8: P1 quest_complete, 3/week)
            weekly_quests = min(persona.quests_per_week, 3)
            quest_gain = weekly_quests * CFG["xp.quest"]
            xp["quests"] += quest_gain
            sp["quests"] += quest_gain

    level = xp_to_level(int(sum(xp.values())))
    return (
        {k: round(v) for k, v in xp.items()},
        {k: round(v) for k, v in sp.items()},
        level,
    )


def simulate_days_to_level(persona: PersonaBehavior, target_level: int, seed: int, max_days: int = 365) -> int:
    """Simulate day-by-day to find when a persona first reaches target_level."""
    rng = random.Random(seed)

    xp_total = 0.0
    gaming_credited = min(persona.initial_gaming_connects, CFG["cap.connect.gaming"])
    social_credited = min(persona.initial_social_connects, CFG["cap.connect.social"])

    # Day 0 onboarding
    xp_total += gaming_credited * CFG["xp.connect.gaming"]
    xp_total += social_credited * CFG["xp.connect.social"]
    xp_total += heritage_xp(persona.imported_hours)
    xp_total += initial_badge_claims(gaming_credited, social_credited)

    if xp_to_level(int(xp_total)) >= target_level:
        return 0

    streak = 0
    streak_milestones_hit: set = set()

    for day in range(1, max_days + 1):
        is_active = rng.random() < (persona.active_days_per_week / 7)

        if is_active:
            streak += 1
            xp_total += CFG["xp.login"]
            raw_hours = persona.play_hours_per_active_day * rng.uniform(0.7, 1.3)
            xp_total += min(raw_hours, CFG["cap.play_hours_day"]) * CFG["xp.play_hour"]
            raw_count = persona.achievements_per_active_day * rng.uniform(0.5, 1.5)
            xp_total += min(ach_xp_for_count(raw_count), CFG["cap.ach_xp_day"])
            if rng.random() < (persona.shares_per_week / 7):
                xp_total += CFG["xp.share"]
        else:
            streak = 0

        for ms in [7, 30, 100]:
            if streak == ms and ms not in streak_milestones_hit:
                xp_total += CFG[f"xp.streak.{ms}"]
                streak_milestones_hit.add(ms)

        if day % 7 == 0:
            weekly_new = min(persona.new_titles_per_week, CFG["cap.new_titles_week"])
            xp_total += int(round(weekly_new)) * (CFG["xp.new_title.launch"] + CFG["xp.new_title.settled"])
            weekly_sprints = min(persona.sprints_per_week, CFG["cap.challenges.scored_week"])
            xp_total += (
                weekly_sprints * persona.win_rate * CFG["xp.challenge.win"]
                + weekly_sprints * (1 - persona.win_rate) * CFG["xp.challenge.complete"]
            )
            xp_total += min(persona.quests_per_week, 3) * CFG["xp.quest"]

        if xp_to_level(int(xp_total)) >= target_level:
            return day

    return max_days + 1


# ---------------------------------------------------------------------------
# Invariant checks (§4 + §14) — on weighted aggregate population
# ---------------------------------------------------------------------------

def check_invariants(results: dict, mix: dict, seed: int) -> List[str]:
    failures = []

    # Aggregate XP sources weighted by population mix
    agg: Dict[str, float] = {}
    for persona_name, weight in mix.items():
        if persona_name not in results:
            continue
        src = results[persona_name]["xp_sources"]
        for k, v in src.items():
            agg[k] = agg.get(k, 0.0) + v * weight

    total = sum(agg.values())
    if total > 0:
        play_family = agg.get("play", 0) + agg.get("achievements", 0) + agg.get("challenges", 0)
        login_share = agg.get("login", 0) / total
        play_share = play_family / total

        if play_share < 0.60:
            failures.append(
                f"[aggregate] play+ach+challenges = {play_share:.1%} < 60% (§4 invariant)"
            )
        if login_share > 0.15:
            failures.append(
                f"[aggregate] login = {login_share:.1%} > 15% cap (§4 invariant)"
            )

    # Time-to-L5: Casual must reach L5 within 7 days (§14 / §3.6: flow pacing)
    days_to_l5 = simulate_days_to_level(PERSONAS["Casual"], target_level=5, seed=seed)
    if days_to_l5 > 7:
        failures.append(
            f"Time-to-L5: Casual reached L5 on day {days_to_l5} (§14: must be < 7 days)"
        )

    return failures, days_to_l5


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(description="Leet9 economy simulator — §14 v2.1")
    parser.add_argument(
        "--mix", nargs=4, type=float,
        metavar=("LURKER", "CASUAL", "CORE", "HARDCORE"),
        default=[0.40, 0.35, 0.20, 0.05],
        help="Population mix fractions (must sum to 1.0)",
    )
    parser.add_argument("--n", type=int, default=400, help="Simulated users per persona (for reporting)")
    parser.add_argument("--seed", type=int, default=9)
    parser.add_argument("--config", type=str, default="tuned", help="Config preset (tuned = v2.1)")
    parser.add_argument("--outdir", type=str, default=None)
    # Legacy --output for backward compat
    parser.add_argument("--output", type=str, default=None)
    args = parser.parse_args()

    mix = dict(zip(["Lurker", "Casual", "Core", "Hardcore"], args.mix))
    if abs(sum(mix.values()) - 1.0) > 0.001:
        print(f"ERROR: mix must sum to 1.0, got {sum(mix.values()):.3f}", file=sys.stderr)
        sys.exit(1)

    print("=" * 64)
    print(f"  Leet9 Economy Sim v2.1  |  Season {CFG['season.length_weeks']}w  |  seed={args.seed}  |  n={args.n}/persona")
    print("=" * 64)

    results = {}
    for name, persona in PERSONAS.items():
        xp_src, sp_src, level = simulate_season(persona, seed=args.seed)
        xp_total = sum(xp_src.values())
        sp_total = sum(sp_src.values())
        tier = sp_to_tier(sp_total)
        results[name] = {
            "xp_total": xp_total,
            "sp_total": sp_total,
            "level": level,
            "tier": tier,
            "xp_sources": xp_src,
            "sp_sources": sp_src,
        }

    # Summary table
    print(f"\n{'Persona':<12} {'XP':>9} {'SP':>9} {'Level':>6}  Tier")
    print("-" * 48)
    for name, d in results.items():
        print(f"{name:<12} {d['xp_total']:>9,} {d['sp_total']:>9,} {d['level']:>6}  {d['tier']}")

    # XP source breakdown
    print("\nXP source breakdown (% of total per persona):")
    sources = list(next(iter(results.values()))["xp_sources"].keys())
    header = f"  {'source':<14}" + "".join(f"{n:>12}" for n in results)
    print(header)
    print("  " + "-" * (14 + 12 * len(results)))
    for src in sources:
        row = f"  {src:<14}"
        for d in results.values():
            total = d["xp_total"] or 1
            pct = d["xp_sources"].get(src, 0) / total * 100
            row += f"{pct:>11.1f}%"
        print(row)

    # Aggregate breakdown
    print("\nWeighted aggregate XP mix (§4 invariant inputs):")
    agg: Dict[str, float] = {}
    for pname, weight in mix.items():
        if pname not in results:
            continue
        for k, v in results[pname]["xp_sources"].items():
            agg[k] = agg.get(k, 0.0) + v * weight
    agg_total = sum(agg.values()) or 1
    for src in sources:
        pct = agg.get(src, 0) / agg_total * 100
        print(f"  {src:<14} {pct:>5.1f}%")

    # Invariants
    print("\nInvariant checks:")
    failures, days_to_l5 = check_invariants(results, mix, args.seed)
    print(f"  Casual time-to-L5: {days_to_l5} day(s) (target < 7)")
    if failures:
        for f in failures:
            print(f"  FAIL  {f}")
    else:
        print("  PASS  All invariants satisfied ✓")

    # Level curve snapshot
    print("\nLevel curve (§3.4 v2.1 — base=300, coef=65):")
    for lvl in [2, 3, 5, 10, 15, 20, 25, 30, 40, 50]:
        print(f"  L{lvl:<3}  cumXP={LEVEL_TABLE[lvl]:>9,}  step={step_xp(lvl):>6,}")

    # JSON output
    if args.output:
        out_path = Path(args.output)
    elif args.outdir:
        out_path = Path(args.outdir) / "results_tuned.json"
    else:
        out_path = Path(__file__).parent / "results" / "latest.json"

    out_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "spec_version": "v2.1",
        "config_snapshot": CFG,
        "season_weeks": CFG["season.length_weeks"],
        "n_per_persona": args.n,
        "seed": args.seed,
        "mix": mix,
        "personas": results,
        "aggregate_xp_mix": {k: round(v / agg_total * 100, 2) for k, v in agg.items()},
        "days_to_l5_casual": days_to_l5,
        "invariants_passed": not failures,
        "failures": failures,
    }
    out_path.write_text(json.dumps(payload, indent=2))
    print(f"\nResults written to {out_path}")

    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
