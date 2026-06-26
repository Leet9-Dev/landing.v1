const ROLE_STYLES = {
  founder: { label: "Founder", bg: "rgba(200,255,0,0.12)", border: "rgba(200,255,0,0.3)", color: "#C8FF00" },
  council: { label: "Council", bg: "rgba(124,58,237,0.18)", border: "rgba(124,58,237,0.4)", color: "#c8aaff" },
  member: { label: "Member", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.12)", color: "rgba(241,243,249,0.55)" },
};

const ACCESS_LABEL = { open: "Open", invite_only: "Invite only", closed: "Closed" };

export function TribeHero({ tribe, currentRole }) {
  return (
    <div style={{
      borderRadius: 18,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "linear-gradient(135deg, rgba(22,163,74,0.06), rgba(124,58,237,0.05))",
      padding: 28,
      marginBottom: 24,
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 22,
      alignItems: "center",
    }}>
      {/* Emblem */}
      <div style={{
        width: 72,
        height: 72,
        borderRadius: 16,
        background: tribe.emblem?.gradient || "linear-gradient(135deg,#C8FF00,#7C3AED)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 24,
        fontWeight: 800,
        color: "#F1F3F9",
        flexShrink: 0,
        border: "2px solid rgba(255,255,255,0.1)",
      }}>
        {tribe.emblem?.initials}
      </div>

      {/* Identity */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: "#F1F3F9", letterSpacing: "-0.02em" }}>
            {tribe.name}
          </h1>
          <span style={{ fontSize: 13, color: "rgba(241,243,249,0.4)", fontWeight: 700 }}>[{tribe.tag}]</span>
        </div>
        {tribe.motto && (
          <div style={{ fontSize: 13, color: "rgba(241,243,249,0.5)", fontStyle: "italic", marginBottom: 10 }}>
            &ldquo;{tribe.motto}&rdquo;
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          {currentRole && <RoleBadge role={currentRole} prefix="Your role: " />}
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: "rgba(241,243,249,0.4)",
            padding: "3px 9px",
            borderRadius: 6,
            background: "rgba(0,0,0,0.3)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            {ACCESS_LABEL[tribe.access] || tribe.access}
          </span>
        </div>
      </div>

      {/* Headline rank + points */}
      <div style={{ display: "flex", gap: 22, flexShrink: 0 }}>
        <HeadlineStat label="Global Rank" value={tribe.globalRank != null ? `#${tribe.globalRank}` : "—"} accent />
        <HeadlineStat label="Total L9" value={formatCompact(tribe.totalL9Points)} />
        <HeadlineStat label="Members" value={`${tribe.membersCount}/${tribe.maxMembers}`} />
      </div>
    </div>
  );
}

export function RoleBadge({ role, prefix }) {
  const s = ROLE_STYLES[role] || ROLE_STYLES.member;
  return (
    <span style={{
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.04em",
      padding: "3px 9px",
      borderRadius: 6,
      background: s.bg,
      border: `1px solid ${s.border}`,
      color: s.color,
    }}>
      {prefix}{s.label}
    </span>
  );
}

function HeadlineStat({ label, value, accent }) {
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

function formatCompact(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
  return `${n}`;
}
