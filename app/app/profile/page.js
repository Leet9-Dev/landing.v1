export default function ProfilePage() {
  return (
    <div style={{ padding: "36px 32px" }}>
      <PlaceholderPanel
        icon="◉"
        label="Profile"
        description="Your Leet9 identity, games, stats, and tribe will appear here."
      />
    </div>
  );
}

function PlaceholderPanel({ icon, label, description }) {
  return (
    <div style={{
      border: "1px dashed rgba(255,255,255,0.09)",
      borderRadius: 16,
      padding: "72px 40px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
      minHeight: 340,
      background: "rgba(255,255,255,0.012)",
      textAlign: "center",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ fontSize: 36, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "rgba(241,243,249,0.55)", letterSpacing: "-0.01em" }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: "rgba(241,243,249,0.28)", maxWidth: 380, lineHeight: 1.65 }}>
        {description}
      </div>
      <div style={{
        marginTop: 6,
        fontSize: 10,
        fontWeight: 700,
        color: "rgba(200,255,0,0.3)",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        padding: "4px 12px",
        borderRadius: 99,
        border: "1px solid rgba(200,255,0,0.12)",
        background: "rgba(200,255,0,0.03)",
      }}>
        Coming soon
      </div>
    </div>
  );
}
