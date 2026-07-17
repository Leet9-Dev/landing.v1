"use client";

const PLATFORM_COLORS = {
  steam: "#b9d8f5",
  psn: "#c8aaff",
  google: "rgba(241,243,249,0.4)",
};

const PLATFORM_LABELS = {
  steam: "Steam",
  psn: "PSN",
  google: "Google",
};

function getRankColor(rankTier) {
  if (!rankTier) return "#C8FF00";
  const t = rankTier.toLowerCase();
  if (t.includes("diamond")) return "#a5f3fc";
  if (t.includes("platinum")) return "#67e8f9";
  if (t.includes("gold")) return "#fbbf24";
  if (t.includes("silver")) return "#94a3b8";
  if (t.includes("bronze")) return "#d97706";
  return "#C8FF00";
}

export function ProfileHero({ user }) {
  const rankColor = getRankColor(user.rankTier);
  const platforms = user.platformsConnected || [];

  return (
    <div style={{
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "linear-gradient(135deg, rgba(200,255,0,0.04) 0%, rgba(124,58,237,0.06) 100%)",
      marginBottom: 28,
      overflow: "hidden",
      fontFamily: "'Outfit', sans-serif",
    }}>
      {/* Main content */}
      <div style={{ padding: "24px 28px 20px" }}>
        <div className="l9-hero-top" style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>

          {/* Avatar + level badge */}
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C8FF00, #7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 800,
              color: "#07080F",
              border: "2px solid rgba(200,255,0,0.3)",
            }}>
              {user.avatarUrl
                ? <img src={user.avatarUrl} alt={user.gamerTag} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                : (user.avatarInitials || user.gamerTag?.[0] || "?")}
            </div>
            {user.level != null && (
              <div style={{
                position: "absolute",
                bottom: -2,
                right: -4,
                background: "#07080F",
                border: "1.5px solid rgba(200,255,0,0.5)",
                borderRadius: 7,
                padding: "2px 7px",
                fontSize: 10,
                fontWeight: 800,
                color: "#C8FF00",
                letterSpacing: "0.03em",
                lineHeight: 1.4,
              }}>
                Lv {user.level}
              </div>
            )}
          </div>

          {/* Identity */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Gamer tag + tribe */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 7 }}>
              <h1 style={{
                fontSize: 22,
                fontWeight: 900,
                color: "#F1F3F9",
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1,
              }}>
                {user.gamerTag}
              </h1>
              {user.tribeTag && (
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 5,
                  background: "rgba(124,58,237,0.15)", color: "#a78bfa",
                  border: "1px solid rgba(124,58,237,0.25)", letterSpacing: "0.06em",
                }}>
                  [{user.tribeTag}]
                </span>
              )}
            </div>

            {/* Rank + percentile + archetype */}
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10, flexWrap: "wrap" }}>
              {user.rankTier && (
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "3px 10px", borderRadius: 6,
                  background: `${rankColor}1a`, color: rankColor,
                  border: `1px solid ${rankColor}40`, letterSpacing: "0.04em",
                }}>
                  ◆ {user.rankTier}
                </span>
              )}
              {user.globalPercentile != null && (
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "3px 9px", borderRadius: 6,
                  background: "rgba(200,255,0,0.07)", color: "rgba(200,255,0,0.75)",
                  border: "1px solid rgba(200,255,0,0.18)",
                }}>
                  Top {user.globalPercentile}%
                </span>
              )}
              {user.archetype && (
                <span style={{ fontSize: 11, fontWeight: 500, color: "rgba(241,243,249,0.35)" }}>
                  {user.archetype}
                </span>
              )}
            </div>

            {/* Platform badges */}
            {platforms.length > 0 && (
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {platforms.map((p) => {
                  const color = PLATFORM_COLORS[p] || "rgba(241,243,249,0.5)";
                  return (
                    <span key={p} style={{
                      fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 5,
                      background: "rgba(255,255,255,0.04)",
                      color: color,
                      border: "1px solid rgba(255,255,255,0.1)",
                      letterSpacing: "0.05em",
                    }}>
                      {PLATFORM_LABELS[p] || p.toUpperCase()}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="l9-hero-actions" style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
            <button disabled style={{
              fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 9,
              border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)",
              color: "rgba(241,243,249,0.3)", cursor: "not-allowed", fontFamily: "'Outfit', sans-serif",
              whiteSpace: "nowrap",
            }}>
              Edit Profile · Soon
            </button>
            <button disabled style={{
              fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 9,
              border: "1px solid rgba(200,255,0,0.12)", background: "rgba(200,255,0,0.03)",
              color: "rgba(200,255,0,0.35)", cursor: "not-allowed", fontFamily: "'Outfit', sans-serif",
              whiteSpace: "nowrap",
            }}>
              Share Card · Soon
            </button>
          </div>
        </div>

        {/* L9 Points highlight */}
        <div style={{
          marginTop: 18,
          padding: "10px 16px",
          borderRadius: 10,
          background: "rgba(200,255,0,0.05)",
          border: "1px solid rgba(200,255,0,0.1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: "rgba(200,255,0,0.55)",
            letterSpacing: "0.07em", textTransform: "uppercase",
          }}>
            L9 Points
          </span>
          <span style={{ fontSize: 22, fontWeight: 900, color: "#C8FF00", letterSpacing: "-0.01em" }}>
            {user.l9Points != null ? user.l9Points.toLocaleString() : "—"}
          </span>
        </div>
      </div>

      {/* Rank progress bar — full-width footer, only shown when rank data exists */}
      {user.rankTier && (
        <div style={{
          padding: "0 28px 20px",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          paddingTop: 16,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: rankColor }}>{user.rankTier}</span>
            <span style={{ fontSize: 11, color: "rgba(241,243,249,0.3)" }}>
              {user.pointsToNextRank != null ? `${user.pointsToNextRank.toLocaleString()} pts → ${user.nextRank}` : ""}
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${user.rankProgressPct || 0}%`,
              background: `linear-gradient(90deg, ${rankColor}, ${rankColor}bb)`,
              borderRadius: 99,
            }} />
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .l9-hero-top { flex-wrap: wrap; }
          .l9-hero-actions {
            flex-direction: row !important;
            width: 100%;
          }
          .l9-hero-actions button { flex: 1; }
        }
      `}</style>
    </div>
  );
}
