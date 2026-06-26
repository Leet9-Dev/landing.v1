import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function GamerDNA({ dna }) {
  if (!dna?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Gamer DNA</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>
        {dna.map((signal) => (
          <div key={signal.label}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9" }}>{signal.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#C8FF00" }}>{signal.score}</span>
            </div>
            <div style={{ height: 6, borderRadius: 99, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 5 }}>
              <div style={{
                height: "100%",
                width: `${signal.score}%`,
                background: "linear-gradient(90deg, #7C3AED, #C8FF00)",
                borderRadius: 99,
              }} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", lineHeight: 1.5 }}>
              Based on {signal.basedOn.toLowerCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
