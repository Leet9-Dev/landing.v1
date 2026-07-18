export default function SettingsLoading() {
  return (
    <div style={{ padding: "36px 32px", fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
      <style>{`@keyframes l9pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
      <div style={{ width: 110, height: 28, borderRadius: 6, background: "rgba(255,255,255,0.06)", marginBottom: 10, animation: "l9pulse 1.4s ease infinite" }} />
      <div style={{ width: 200, height: 14, borderRadius: 4, background: "rgba(255,255,255,0.03)", marginBottom: 32, animation: "l9pulse 1.4s ease infinite", animationDelay: "0.1s" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[180, 100, 140].map((h, i) => (
          <div key={i} style={{
            height: h, borderRadius: 16,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.06)",
            animation: "l9pulse 1.4s ease infinite",
            animationDelay: `${i * 0.12}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
