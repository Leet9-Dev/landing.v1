export function ProfileHero({ user }) {
  return (
    <div style={{
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "linear-gradient(135deg, rgba(200,255,0,0.04), rgba(124,58,237,0.05))",
      padding: 28,
      marginBottom: 28,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 24,
      alignItems: "center",
    }}>
      {/* Avatar */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        color: "#07080F",
        flexShrink: 0,
        border: "2px solid rgba(200,255,0,0.25)",
      }}>
        {user.avatarUrl
          ? <img src={user.avatarUrl} alt={user.gamerTag} style={{ width: "100%", height: "100%", borderRadius: "50%" }} />
          : (user.avatarInitials || user.gamerTag?.[0] || "?")}
      </div>

      {/* Identity */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em" }}>
            {user.gamerTag}
          </h1>
          {user.displayName && (
            <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", fontWeight: 500 }}>
              {user.displayName}
            </span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
          {user.location && (
            <span style={{ fontSize: 12, color: "rgba(241,243,249,0.3)" }}>📍 {user.location}</span>
          )}
          <Badge color="lime">{user.archetype}</Badge>
          {(user.platformsConnected || []).map((p) => (
            <Badge key={p} color="dark">{p === "steam" ? "Steam" : p === "psn" ? "PSN" : "Google"}</Badge>
          ))}
        </div>

        {/* Rank progress */}
        <div style={{ maxWidth: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#C8FF00" }}>{user.rankTier}</span>
            <span style={{ fontSize: 11, color: "rgba(241,243,249,0.3)" }}>
              {user.pointsToNextRank?.toLocaleString()} to {user.nextRank}
            </span>
          </div>
          <div style={{ height: 5, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%",
              width: `${user.rankProgressPct || 0}%`,
              background: "linear-gradient(90deg, #C8FF00, #a3e600)",
              borderRadius: 99,
            }} />
          </div>
        </div>
      </div>

      {/* Stat block */}
      <div style={{ display: "flex", gap: 18, flexShrink: 0 }}>
        <StatColumn label="Level" value={user.level} />
        <StatColumn label="L9 Points" value={user.l9Points?.toLocaleString()} accent />
        <StatColumn label="Top" value={user.globalPercentile != null ? `${user.globalPercentile}%` : "—"} />
        <StatColumn label="Profile" value={user.profileCompletenessPct != null ? `${user.profileCompletenessPct}%` : "—"} />
      </div>
    </div>
  );
}

function StatColumn({ label, value, accent }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: accent ? "#C8FF00" : "#F1F3F9", letterSpacing: "-0.02em" }}>
        {value}
      </div>
      <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}

function Badge({ color, children }) {
  const styles = {
    lime: { background: "rgba(200,255,0,0.1)", border: "1px solid rgba(200,255,0,0.25)", color: "#C8FF00" },
    dark: { background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(241,243,249,0.55)" },
  };
  return (
    <span style={{
      padding: "3px 9px",
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      letterSpacing: "0.02em",
      ...styles[color],
    }}>
      {children}
    </span>
  );
}
