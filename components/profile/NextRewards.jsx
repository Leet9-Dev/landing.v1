"use client";
import { useState, useEffect } from "react";

const TIER_COLORS = { bronze: "#d97706", silver: "#94a3b8", gold: "#fbbf24" };
const TIER_LABELS = { bronze: "Bronze", silver: "Silver", gold: "Gold" };

function RewardCard({ family, mode }) {
  const { label, brandedName, progress } = family;
  if (!progress) return null;

  const tierColor = TIER_COLORS[progress.nextTier] ?? "#C8FF00";
  const pct = progress.progressPct ?? 0;

  const xpDisplay = progress.xpToNext > 0
    ? `${progress.xpToNext.toLocaleString()} XP to go`
    : "Almost there!";

  return (
    <div style={{
      flex: "1 1 200px",
      minWidth: 0,
      padding: "16px 18px",
      borderRadius: 12,
      background: "rgba(255,255,255,0.025)",
      border: `1px solid rgba(255,255,255,0.07)`,
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
            {label}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 2 }}>
            #{brandedName}
          </div>
        </div>
        <span style={{
          flexShrink: 0,
          fontSize: 10, fontWeight: 800,
          padding: "3px 8px", borderRadius: 5,
          background: `${tierColor}18`,
          color: tierColor,
          border: `1px solid ${tierColor}35`,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}>
          {TIER_LABELS[progress.nextTier]}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${tierColor}, ${tierColor}cc)`,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </div>
        <div style={{ marginTop: 5, fontSize: 11, color: "rgba(241,243,249,0.35)", display: "flex", justifyContent: "space-between" }}>
          <span>{pct}%</span>
          <span>{xpDisplay}</span>
        </div>
      </div>
    </div>
  );
}

export function NextRewards({ onSeeAll }) {
  const [data, setData] = useState(null);
  const [mode, setMode] = useState("closest"); // "closest" | "highestXp"

  useEffect(() => {
    fetch("/api/me/earn")
      .then((r) => r.json())
      .then((json) => { if (json.ok) setData(json.data); })
      .catch(() => {});
  }, []);

  if (!data) return null;

  const rewards = mode === "closest" ? data.nextRewards.closest : data.nextRewards.highestXp;
  if (!rewards || rewards.length === 0) return null;

  return (
    <div style={{ marginBottom: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "rgba(241,243,249,0.4)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
            ⚡ Next Rewards
          </span>
          {/* Toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: 2, gap: 2 }}>
            {[["closest", "Closest"], ["highestXp", "Max XP"]].map(([key, lbl]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                style={{
                  padding: "4px 10px", borderRadius: 5, border: "none",
                  background: mode === key ? "rgba(255,255,255,0.1)" : "transparent",
                  color: mode === key ? "#F1F3F9" : "rgba(241,243,249,0.4)",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  fontFamily: "'Outfit', sans-serif",
                  transition: "all 0.15s",
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={onSeeAll}
          style={{
            background: "none", border: "none", padding: 0,
            color: "rgba(200,255,0,0.6)", fontSize: 12, fontWeight: 700,
            cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          See all ways to earn →
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {rewards.map((family) => (
          <RewardCard key={family.brandedName} family={family} mode={mode} />
        ))}
      </div>
    </div>
  );
}
