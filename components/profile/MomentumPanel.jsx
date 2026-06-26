import { SectionLabel } from "@/components/profile/sectionPrimitives";

export function MomentumPanel({ momentum, monthly }) {
  if (!momentum) return null;

  const up = momentum.momChangePct >= 0;
  const maxPoints = Math.max(...(monthly || []).map((m) => m.l9Points), 1);

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Momentum</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.02)",
        padding: 18,
      }}>
        {/* Headline */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 26, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.02em" }}>
            {momentum.pointsThisMonth.toLocaleString()}
          </span>
          <span style={{ fontSize: 12, color: "rgba(241,243,249,0.35)" }}>L9 points this month</span>
          <span style={{
            marginLeft: "auto",
            fontSize: 12,
            fontWeight: 700,
            color: up ? "#C8FF00" : "#f87171",
          }}>
            {up ? "▲" : "▼"} {Math.abs(momentum.momChangePct).toFixed(1)}% MoM
          </span>
        </div>
        <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginBottom: 18 }}>
          vs {momentum.pointsLastMonth.toLocaleString()} last month
          {momentum.mostActiveGameTitle ? ` · most active in ${momentum.mostActiveGameTitle}` : ""}
        </div>

        {/* Monthly mini bar chart */}
        {monthly?.length > 0 && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 72, marginBottom: 16 }}>
            {monthly.map((m) => (
              <div key={m.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: "100%",
                  height: `${Math.round((m.l9Points / maxPoints) * 56)}px`,
                  background: "linear-gradient(180deg, #C8FF00, rgba(200,255,0,0.25))",
                  borderRadius: "4px 4px 0 0",
                  minHeight: 4,
                }} />
                <span style={{ fontSize: 9, color: "rgba(241,243,249,0.3)" }}>{m.month.slice(5)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Sub stats */}
        <div style={{ display: "flex", gap: 18, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <SubStat label="Hours" value={momentum.hoursThisMonth} />
          <SubStat label="Achievements" value={momentum.achievementsThisMonth} />
          <SubStat label="Active Streak" value={`${momentum.activeWeeksStreak} wks`} />
        </div>
      </div>
    </div>
  );
}

function SubStat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 15, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginTop: 2 }}>
        {label}
      </div>
    </div>
  );
}
