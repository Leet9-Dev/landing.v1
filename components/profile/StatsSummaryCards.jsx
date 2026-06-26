export function StatsSummaryCards({ stats }) {
  const cards = [
    { label: "Total L9 Points", value: stats.totalL9Points.toLocaleString(), accent: true },
    { label: "Hours Played", value: stats.totalHours.toLocaleString() },
    { label: "Games Tracked", value: stats.gamesTracked },
    { label: "Active Games", value: stats.activeGames },
    { label: "Achievements", value: stats.achievementsUnlocked },
    { label: "Profile Complete", value: `${stats.profileCompletenessPct}%` },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: 12,
      marginBottom: 28,
    }}>
      {cards.map((c) => (
        <div key={c.label} style={{
          borderRadius: 12,
          border: `1px solid ${c.accent ? "rgba(200,255,0,0.15)" : "rgba(255,255,255,0.07)"}`,
          background: c.accent ? "rgba(200,255,0,0.03)" : "rgba(255,255,255,0.02)",
          padding: "16px 16px",
        }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            color: c.accent ? "#C8FF00" : "#F1F3F9",
            letterSpacing: "-0.02em",
            marginBottom: 4,
          }}>
            {c.value}
          </div>
          <div style={{
            fontSize: 10,
            color: "rgba(241,243,249,0.35)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>
            {c.label}
          </div>
        </div>
      ))}
    </div>
  );
}
