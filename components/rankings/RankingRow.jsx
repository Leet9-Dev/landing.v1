"use client";

// Shared ranking row shell: rank badge + highlight container + content.
// `leading` renders the identity block (avatar/title); `children` renders stat cells.
export function RankingRow({ rank, highlight, onClick, leading, children }) {
  const clickable = typeof onClick === "function";
  return (
    <div
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        background: highlight ? "rgba(200,255,0,0.05)" : "transparent",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        cursor: clickable ? "pointer" : "default",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (clickable && !highlight) e.currentTarget.style.background = "rgba(255,255,255,0.025)";
      }}
      onMouseLeave={(e) => {
        if (clickable && !highlight) e.currentTarget.style.background = "transparent";
      }}
    >
      <RankBadge rank={rank} />
      <div style={{ flex: 1, minWidth: 0 }}>{leading}</div>
      {children}
    </div>
  );
}

function RankBadge({ rank }) {
  const medal = rank <= 3;
  const colors = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };
  return (
    <div style={{
      width: 32,
      flexShrink: 0,
      textAlign: "center",
      fontSize: medal ? 15 : 13,
      fontWeight: 800,
      color: medal ? colors[rank] : "rgba(241,243,249,0.4)",
      letterSpacing: "-0.02em",
    }}>
      {rank}
    </div>
  );
}
