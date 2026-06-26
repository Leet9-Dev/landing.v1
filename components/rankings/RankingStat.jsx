// A compact label/value cell used inside ranking rows.
export function RankingStat({ label, value, accent, width = 78 }) {
  return (
    <div style={{ width, textAlign: "right", flexShrink: 0 }}>
      <div style={{
        fontSize: 13,
        fontWeight: 800,
        color: accent ? "#C8FF00" : "#F1F3F9",
        letterSpacing: "-0.01em",
      }}>
        {value}
      </div>
      <div style={{
        fontSize: 9,
        color: "rgba(241,243,249,0.3)",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        marginTop: 1,
      }}>
        {label}
      </div>
    </div>
  );
}
