export default function RankingsLoading() {
  return (
    <div style={{ padding: "36px 32px", fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
      <style>{`@keyframes l9pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
      <div style={{ width: 120, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 10, animation: "l9pulse 1.4s ease infinite" }} />
      <div style={{ width: 280, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.03)", marginBottom: 28, animation: "l9pulse 1.4s ease infinite", animationDelay: "0.1s" }} />
      {/* Tab row */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
        {[90, 72, 60].map((w, i) => (
          <div key={i} style={{
            width: w, height: 36, borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            animation: "l9pulse 1.4s ease infinite",
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
      {/* Ranking rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            height: 52,
            borderRadius: 10,
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            animation: "l9pulse 1.4s ease infinite",
            animationDelay: `${i * 0.06}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
