import { SectionLabel } from "@/components/profile/sectionPrimitives";

const RARITY_COLORS = {
  Common: "rgba(241,243,249,0.5)",
  Rare: "#7dd3fc",
  Epic: "#c8aaff",
  Legendary: "#C8FF00",
  Platinum: "#e5e7eb",
};

export function TrophyCase({ trophyCase }) {
  if (!trophyCase?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel badge={`${trophyCase.length}`}>Trophy Case</SectionLabel>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
        {trophyCase.map((t) => (
          <div key={t.id} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
            padding: "10px 12px",
          }}>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{t.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#F1F3F9", marginBottom: 2 }}>
                {t.name}
              </div>
              <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)" }}>
                {t.gameTitle}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: RARITY_COLORS[t.rarity] || "#F1F3F9" }}>
                {t.rarity}
              </div>
              <div style={{ fontSize: 9, color: "rgba(241,243,249,0.25)" }}>
                {t.rarityPct}% have this
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
