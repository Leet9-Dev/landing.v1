import { SectionLabel } from "@/components/profile/sectionPrimitives";
import { RoleBadge } from "@/components/profile/TribeHero";

// Sort order so leadership surfaces first, then by contribution.
const ROLE_ORDER = { founder: 0, council: 1, member: 2 };

export function TribeMembers({ members }) {
  if (!members?.length) return null;

  const sorted = [...members].sort((a, b) => {
    const r = (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9);
    if (r !== 0) return r;
    return b.l9PointsContribution - a.l9PointsContribution;
  });

  return (
    <div style={{ marginBottom: 28 }}>
      <SectionLabel badge={`${members.length}`}>Members</SectionLabel>
      <div style={{
        borderRadius: 14,
        border: "1px solid rgba(255,255,255,0.07)",
        overflow: "hidden",
      }}>
        {sorted.map((m, i) => (
          <div key={m.id} style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 16px",
            background: m.isCurrentUser ? "rgba(200,255,0,0.05)" : "transparent",
            borderTop: i === 0 ? "none" : "1px solid rgba(255,255,255,0.05)",
          }}>
            {/* Avatar */}
            <div style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "linear-gradient(135deg,#16a34a,#7C3AED)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              fontWeight: 800,
              color: "#F1F3F9",
              flexShrink: 0,
              border: m.isCurrentUser ? "2px solid rgba(200,255,0,0.5)" : "2px solid transparent",
            }}>
              {m.avatarInitials}
            </div>

            {/* Identity */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  fontSize: 13,
                  fontWeight: m.isCurrentUser ? 800 : 700,
                  color: m.isCurrentUser ? "#C8FF00" : "#F1F3F9",
                  letterSpacing: "-0.01em",
                }}>
                  {m.gamerTag}
                </span>
                {m.isCurrentUser && (
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#07080F", background: "#C8FF00", padding: "1px 6px", borderRadius: 99 }}>
                    YOU
                  </span>
                )}
                <RoleBadge role={m.role} />
              </div>
              <div style={{ fontSize: 10, color: "rgba(241,243,249,0.35)", marginTop: 2 }}>
                {m.lastPlayedGameTitle ? `Last played ${m.lastPlayedGameTitle}` : "—"} · {m.lastActiveAtLabel}
              </div>
            </div>

            {/* Contribution */}
            <div style={{ textAlign: "right", flexShrink: 0, width: 92 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#F1F3F9", letterSpacing: "-0.01em" }}>
                {m.l9PointsContribution.toLocaleString()}
              </div>
              <div style={{ fontSize: 9, color: "rgba(241,243,249,0.3)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                L9 contributed
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 11, color: "rgba(241,243,249,0.3)", marginTop: 10, lineHeight: 1.6 }}>
        Showing {members.length} of the tribe&apos;s members. Full roster and member profiles come later.
      </div>
    </div>
  );
}
