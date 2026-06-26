import { SectionLabel } from "@/components/profile/sectionPrimitives";

const COLORS = ["#C8FF00", "#7dd3fc", "#c8aaff", "#fbbf24"];

export function PointsBreakdown({ pointsBreakdown }) {
  if (!pointsBreakdown?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>L9 Point Breakdown</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
      }}>
        {/* Stacked composition bar */}
        <div style={{ display: "flex", height: 10, borderRadius: 99, overflow: "hidden", marginBottom: 18 }}>
          {pointsBreakdown.map((p, i) => (
            <div key={p.label} style={{ width: `${p.pct}%`, background: COLORS[i % COLORS.length] }} />
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pointsBreakdown.map((p, i) => (
            <div key={p.label} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: COLORS[i % COLORS.length], marginTop: 4, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#F1F3F9" }}>{p.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(241,243,249,0.6)" }}>{p.pct}%</span>
                </div>
                <div style={{ fontSize: 11, color: "rgba(241,243,249,0.35)", lineHeight: 1.5 }}>
                  Based on {p.basedOn.toLowerCase()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
