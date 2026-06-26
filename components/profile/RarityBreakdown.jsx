import { SectionLabel } from "@/components/profile/sectionPrimitives";

const RARITY_COLORS = {
  Common: "rgba(241,243,249,0.45)",
  Rare: "#7dd3fc",
  Epic: "#c8aaff",
  Legendary: "#C8FF00",
  Platinum: "#e5e7eb",
};

export function RarityBreakdown({ rarityBreakdown }) {
  if (!rarityBreakdown?.length) return null;

  const total = rarityBreakdown.reduce((s, r) => s + r.count, 0) || 1;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Achievements & Rarity</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rarityBreakdown.map((r) => (
            <div key={r.rarity}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: RARITY_COLORS[r.rarity] || "#F1F3F9" }}>{r.rarity}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(241,243,249,0.5)" }}>{r.count}</span>
              </div>
              <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${(r.count / total) * 100}%`,
                  background: RARITY_COLORS[r.rarity] || "#F1F3F9",
                  borderRadius: 99,
                  minWidth: 4,
                }} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: 11, color: "rgba(241,243,249,0.35)", lineHeight: 1.6 }}>
          Rarity reflects how few players have unlocked each achievement. Rarer unlocks contribute more to your L9 points.
        </div>
      </div>
    </div>
  );
}
