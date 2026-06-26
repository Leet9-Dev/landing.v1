"use client";

// Wraps a ranking list with shared loading and empty states, plus the
// bordered container used by all three ranking tabs.
export function RankingPanel({ loading, isEmpty, emptyIcon, emptyTitle, emptyText, children }) {
  if (loading) return <LoadingRows />;
  if (isEmpty) return <EmptyState icon={emptyIcon} title={emptyTitle} text={emptyText} />;

  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
      // The first row's top border collapses into the container border.
      marginTop: -1,
    }}>
      {children}
    </div>
  );
}

function LoadingRows() {
  return (
    <div style={{
      borderRadius: 14,
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{
          height: 56,
          borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
          animation: "pulse 1.4s ease infinite",
          animationDelay: `${i * 0.08}s`,
        }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.5;} }`}</style>
    </div>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <div style={{
      textAlign: "center",
      padding: "64px 40px",
      border: "1px dashed rgba(255,255,255,0.08)",
      borderRadius: 16,
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ fontSize: 30, marginBottom: 12, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(241,243,249,0.5)", marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ fontSize: 13, color: "rgba(241,243,249,0.25)" }}>{text}</div>
    </div>
  );
}
