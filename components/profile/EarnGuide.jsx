"use client";
import { useState, useEffect } from "react";

const TIER_COLORS  = { bronze: "#d97706", silver: "#94a3b8", gold: "#fbbf24" };
const TIER_LABELS  = { bronze: "Bronze", silver: "Silver", gold: "Gold" };
const TIER_ORDER   = ["bronze", "silver", "gold"];

function TierPip({ tier, unlocked }) {
  const color = unlocked ? (TIER_COLORS[tier] ?? "#C8FF00") : "rgba(255,255,255,0.1)";
  return (
    <div style={{
      width: 8, height: 8, borderRadius: "50%",
      background: color,
      boxShadow: unlocked ? `0 0 6px ${color}80` : "none",
    }} />
  );
}

function ActionRow({ action }) {
  const active = action.active !== false;
  const loopLabel = action.loopFrequency ? ` · repeats ${action.loopFrequency}` : "";
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12,
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      opacity: active ? 1 : 0.45,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: active ? "#F1F3F9" : "rgba(241,243,249,0.5)" }}>
            {action.label}
          </span>
          {!active && (
            <span style={{
              fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
              background: "rgba(255,255,255,0.05)", color: "rgba(241,243,249,0.3)",
              letterSpacing: "0.05em", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              🔒 Coming Soon
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: "rgba(241,243,249,0.4)", marginTop: 2, lineHeight: 1.5 }}>
          {action.description}{loopLabel}
        </div>
      </div>
      {action.points != null && active && (
        <div style={{
          flexShrink: 0, fontSize: 13, fontWeight: 800, color: "#C8FF00",
          letterSpacing: "-0.01em", whiteSpace: "nowrap",
        }}>
          +{action.points.toLocaleString()} XP
        </div>
      )}
    </div>
  );
}

function FamilyCard({ family, isOwn }) {
  const [open, setOpen] = useState(false);
  const { brandedName, label, description, actions, progress } = family;

  const unlockedSet = new Set(
    isOwn && progress
      ? (progress.currentTier ? TIER_ORDER.slice(0, TIER_ORDER.indexOf(progress.currentTier) + 1) : [])
      : (family.unlockedTiers ?? [])
  );
  const hasBadge = family.hasBadge ?? (family.unlockedTiers?.length >= 0);
  const allUnlocked = isOwn && progress?.nextTier === null && progress?.currentTier === "gold";

  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(255,255,255,0.02)",
      overflow: "hidden",
    }}>
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", textAlign: "left", background: "none", border: "none",
          padding: "18px 20px", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
          display: "flex", alignItems: "center", gap: 14,
        }}
      >
        {/* Badge tier pips */}
        {hasBadge && (
          <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
            {TIER_ORDER.map((tier) => (
              <TierPip key={tier} tier={tier} unlocked={unlockedSet.has(tier)} />
            ))}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
            {label}
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(241,243,249,0.3)", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 2 }}>
            #{brandedName}
          </div>
        </div>

        {/* Progress info (own profile only) */}
        {isOwn && progress && !allUnlocked && (
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: TIER_COLORS[progress.nextTier] ?? "#C8FF00" }}>
              {TIER_LABELS[progress.nextTier]} · {progress.progressPct}%
            </div>
            <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", marginTop: 1 }}>
              {progress.xpToNext.toLocaleString()} XP to go
            </div>
          </div>
        )}
        {isOwn && allUnlocked && (
          <span style={{ fontSize: 11, fontWeight: 800, color: TIER_COLORS.gold, flexShrink: 0 }}>
            ✓ Max Tier
          </span>
        )}
        {/* Public profile: show highest unlocked tier */}
        {!isOwn && (family.unlockedTiers ?? []).length > 0 && (() => {
          const highest = TIER_ORDER.slice().reverse().find((t) => (family.unlockedTiers ?? []).find((u) => u.tier === t));
          return highest ? (
            <span style={{
              fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 5,
              background: `${TIER_COLORS[highest]}18`, color: TIER_COLORS[highest],
              border: `1px solid ${TIER_COLORS[highest]}35`, letterSpacing: "0.05em",
              textTransform: "uppercase", flexShrink: 0,
            }}>
              {TIER_LABELS[highest]}
            </span>
          ) : null;
        })()}

        <span style={{ fontSize: 16, color: "rgba(241,243,249,0.3)", flexShrink: 0, transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>
          ›
        </span>
      </button>

      {/* Progress bar (own profile only) */}
      {isOwn && progress && !allUnlocked && (
        <div style={{ height: 3, background: "rgba(255,255,255,0.05)", margin: "0 20px" }}>
          <div style={{
            height: "100%",
            width: `${progress.progressPct}%`,
            background: `linear-gradient(90deg, ${TIER_COLORS[progress.nextTier] ?? "#C8FF00"}, ${TIER_COLORS[progress.nextTier] ?? "#C8FF00"}cc)`,
            borderRadius: 99,
            transition: "width 0.4s ease",
          }} />
        </div>
      )}

      {/* Expanded actions */}
      {open && (
        <div style={{ padding: "4px 20px 16px" }}>
          {description && (
            <div style={{ fontSize: 12, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, margin: "12px 0 8px", paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              {description}
            </div>
          )}
          {isOwn && actions ? (
            actions.map((a) => <ActionRow key={a.id} action={a} />)
          ) : (
            <div style={{ paddingTop: 10, fontSize: 13, color: "rgba(241,243,249,0.35)" }}>
              {(family.unlockedTiers ?? []).length > 0
                ? (family.unlockedTiers ?? []).map((u) => (
                    <div key={u.tier} style={{ marginBottom: 4 }}>
                      <span style={{ color: TIER_COLORS[u.tier] ?? "#C8FF00", fontWeight: 700 }}>
                        ◆ {TIER_LABELS[u.tier]}
                      </span>
                      <span style={{ marginLeft: 8 }}>
                        unlocked {new Date(u.unlockedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                : <span>No badges unlocked yet.</span>
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function EarnGuide({ isOwn, userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = isOwn ? "/api/me/earn" : `/api/users/${userId}/badges`;
    fetch(url)
      .then((r) => r.json())
      .then((json) => { if (json.ok) setData(json.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isOwn, userId]);

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 64, borderRadius: 14, background: "rgba(255,255,255,0.03)", animation: "pulse 1.4s ease infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
    </div>
  );

  const families = isOwn ? (data?.families ?? []) : (data?.families ?? []);

  if (!families.length) return (
    <div style={{ padding: "40px 0", textAlign: "center", color: "rgba(241,243,249,0.3)", fontSize: 13 }}>
      {isOwn ? "No XP families found." : "No badges unlocked yet."}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {isOwn && (
        <div style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", lineHeight: 1.6, marginBottom: 8 }}>
          Earn XP across every category to level up, climb the ranks, and unlock badge tiers. Tap any category to see what actions count.
        </div>
      )}
      {families.map((family) => (
        <FamilyCard key={family.brandedName} family={family} isOwn={isOwn} />
      ))}
    </div>
  );
}
