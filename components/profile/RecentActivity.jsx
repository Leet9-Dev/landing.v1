import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function RecentActivity({ recentActivity }) {
  if (!recentActivity?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Recent Activity</SectionLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {recentActivity.map((a) => (
          <div key={a.id} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 12px",
            borderRadius: 9,
            border: "1px solid rgba(255,255,255,0.06)",
            background: "rgba(255,255,255,0.015)",
          }}>
            <div style={{ fontSize: 16, flexShrink: 0 }}>{a.icon}</div>
            <div style={{ flex: 1, fontSize: 12, color: "rgba(241,243,249,0.6)", fontWeight: 500 }}>
              {a.label}
            </div>
            {a.pointsDelta != null && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C8FF00", flexShrink: 0 }}>
                +{a.pointsDelta.toLocaleString()}
              </div>
            )}
            <div style={{ fontSize: 10, color: "rgba(241,243,249,0.25)", flexShrink: 0, minWidth: 70, textAlign: "right" }}>
              {a.occurredAtLabel}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
