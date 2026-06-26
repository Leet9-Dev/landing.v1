import { SectionLabel } from "@/components/profile/sectionPrimitives";

const TREND_ICON = { up: "▲", down: "▼", flat: "–" };
const TREND_COLOR = { up: "#C8FF00", down: "#f87171", flat: "rgba(241,243,249,0.3)" };

export function FriendsComparison({ friendsComparison }) {
  if (!friendsComparison?.length) return null;

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel>Nearby Players</SectionLabel>
      <div style={{
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}>
        {friendsComparison.map((f, i) => (
          <div key={f.userId} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            background: f.isCurrentUser ? "rgba(200,255,0,0.05)" : "transparent",
            borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
          }}>
            <div style={{ width: 20, fontSize: 12, fontWeight: 700, color: "rgba(241,243,249,0.4)" }}>
              #{f.rank}
            </div>
            <div style={{ flex: 1, fontSize: 13, fontWeight: f.isCurrentUser ? 700 : 600, color: f.isCurrentUser ? "#C8FF00" : "#F1F3F9" }}>
              {f.gamerTag}{f.isCurrentUser ? " (You)" : ""}
            </div>
            <div style={{ fontSize: 12, color: "rgba(241,243,249,0.45)", width: 90, textAlign: "right" }}>
              {f.l9Points.toLocaleString()} L9
            </div>
            <div style={{ fontSize: 12, color: "rgba(241,243,249,0.3)", width: 80, textAlign: "right" }}>
              {f.achievementsEarned} ach
            </div>
            <div style={{ width: 20, textAlign: "right", fontSize: 11, fontWeight: 700, color: TREND_COLOR[f.trend] }}>
              {TREND_ICON[f.trend]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
