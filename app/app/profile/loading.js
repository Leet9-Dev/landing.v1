export default function ProfileLoading() {
  return (
    <div style={{ padding: "36px 32px", fontFamily: "var(--font-outfit, 'Outfit', sans-serif)" }}>
      <style>{`@keyframes l9pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }`}</style>
      {/* Hero skeleton */}
      <div style={{
        height: 220, borderRadius: 18,
        background: "rgba(255,255,255,0.03)",
        marginBottom: 28,
        animation: "l9pulse 1.4s ease infinite",
      }} />
      {/* Tabs skeleton */}
      <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
        {[80, 64, 56, 64].map((w, i) => (
          <div key={i} style={{
            width: w, height: 34, borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            animation: `l9pulse 1.4s ease infinite`,
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {[110, 80, 80].map((h, i) => (
          <div key={i} style={{
            height: h, borderRadius: 14,
            background: "rgba(255,255,255,0.03)",
            animation: "l9pulse 1.4s ease infinite",
            animationDelay: `${i * 0.12}s`,
          }} />
        ))}
      </div>
    </div>
  );
}
