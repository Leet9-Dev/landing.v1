import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function TribeStats({ tribe }) {
  const stats = [
    { label: "Total L9 Points", value: tribe.totalL9Points.toLocaleString(), accent: true },
    { label: "Members", value: `${tribe.membersCount} / ${tribe.maxMembers}` },
    { label: "Unique Games", value: tribe.uniqueGamesPlayed.toLocaleString() },
    { label: "Achievements", value: tribe.achievementsEarned.toLocaleString() },
  ];

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel badge={tribe.globalRank != null ? `#${tribe.globalRank} global` : undefined}>
        Tribe Stats
      </SectionLabel>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: 12,
      }}>
        {stats.map((s) => (
          <div key={s.label} style={{
            borderRadius: 12,
            border: `1px solid ${s.accent ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.07)"}`,
            background: s.accent ? "rgba(200,255,0,0.03)" : "rgba(255,255,255,0.02)",
            padding: "16px",
          }}>
            <div style={{
              fontSize: 20,
              fontWeight: 800,
              color: s.accent ? "#C8FF00" : "#F1F3F9",
              letterSpacing: "-0.02em",
              marginBottom: 4,
            }}>
              {s.value}
            </div>
            <div style={{
              fontSize: 10,
              color: "rgba(241,243,249,0.35)",
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 10, lineHeight: 1.6 }}>
        Tribe rank is calculated from the combined L9 points of all members. See the full
        standings in the Rankings → Tribes tab.
      </div>
    </div>
  );
}
