export default function DiscoveryLoading() {
  return (
    <div style={{ padding: "36px 32px", fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
      <style>{`@keyframes l9pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
      {/* Header */}
      <div style={{ width: 140, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 10, animation: "l9pulse 1.4s ease infinite" }} />
      <div style={{ width: 260, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.03)", marginBottom: 28, animation: "l9pulse 1.4s ease infinite", animationDelay: "0.1s" }} />
      {/* Filter row */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[180, 80, 60, 90, 80].map((w, i) => (
          <div key={i} style={{
            width: w, height: 34, borderRadius: 99,
            background: "rgba(255,255,255,0.04)",
            animation: "l9pulse 1.4s ease infinite",
            animationDelay: `${i * 0.08}s`,
          }} />
        ))}
      </div>
      {/* Game grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            borderRadius: 12, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
            background: "#0A0C14",
            animation: "l9pulse 1.4s ease infinite",
            animationDelay: `${i * 0.07}s`,
          }}>
            <div style={{ height: 110, background: "rgba(255,255,255,0.04)" }} />
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ height: 13, borderRadius: 4, background: "rgba(255,255,255,0.06)", marginBottom: 6, width: "70%" }} />
              <div style={{ height: 11, borderRadius: 4, background: "rgba(255,255,255,0.04)", width: "45%" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
