import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function MasterySummary({ mastery }) {
  if (!mastery) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Mastery Summary</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
      }}>
        {/* Average ring-style headline */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: `conic-gradient(#C8FF00 ${mastery.averagePct * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <div style={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: "#0A0C14",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 800,
              color: "#C8FF00",
            }}>
              {mastery.averagePct.toFixed(0)}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9", marginBottom: 3 }}>
              Average mastery across tracked games
            </div>
            <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", lineHeight: 1.5 }}>
              {mastery.highestGameTitle
                ? `Highest: ${mastery.highestGameTitle} at ${mastery.highestPct.toFixed(0)}%`
                : "Based on achievements unlocked vs. available per game"}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <Pill label="Above 80%" value={mastery.above80Count} />
          <Pill label="Above 50%" value={mastery.above50Count} />
        </div>
      </div>
    </div>
  );
}

function Pill({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
