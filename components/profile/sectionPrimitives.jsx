export function SectionLabel({ children, badge }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
      <div style={{
        fontSize: 11,
        fontWeight: 700,
        color: "rgba(241,243,249,0.45)",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
      }}>
        {children}
      </div>
      {badge && (
        <span style={{
          padding: "2px 7px",
          borderRadius: 99,
          background: "rgba(200,255,0,0.08)",
          border: "1px solid rgba(200,255,0,0.2)",
          fontSize: 10,
          fontWeight: 700,
          color: "#C8FF00",
        }}>
          {badge}
        </span>
      )}
      <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.05)" }} />
    </div>
  );
}
