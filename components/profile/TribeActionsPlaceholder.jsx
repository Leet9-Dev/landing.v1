import { SectionLabel } from "@/components/profile/sectionPrimitives";

// Lightweight, intentionally non-functional action area. Tribe management
// (invite, leave, roles, admin) is deferred to a later phase.
const ACTIONS = [
  { label: "Invite Members", note: "Invites open in a later phase" },
  { label: "Manage Roles", note: "Founder & council tools coming later" },
  { label: "Tribe Settings", note: "Editing not active yet" },
  { label: "Leave Tribe", note: "Not active yet" },
];

export function TribeActionsPlaceholder() {
  return (
    <div style={{ marginBottom: 8 }}>
      <SectionLabel>Tribe Actions</SectionLabel>
      <div style={{
        borderRadius: 14,
        border: "1px dashed rgba(255,255,255,0.1)",
        background: "rgba(255,255,255,0.012)",
        padding: 18,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 10,
          marginBottom: 14,
        }}>
          {ACTIONS.map((a) => (
            <button
              key={a.label}
              disabled
              title="Not active yet"
              style={{
                textAlign: "left",
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                cursor: "not-allowed",
                fontFamily: "'Outfit', sans-serif",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(241,243,249,0.5)", marginBottom: 3 }}>
                {a.label}
              </div>
              <div style={{ fontSize: 10, color: "rgba(241,243,249,0.3)" }}>{a.note}</div>
            </button>
          ))}
        </div>
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontSize: 10,
          fontWeight: 700,
          color: "rgba(200,255,0,0.4)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          padding: "4px 12px",
          borderRadius: 99,
          border: "1px solid rgba(200,255,0,0.12)",
          background: "rgba(200,255,0,0.03)",
        }}>
          Coming soon · actions are not functional yet
        </div>
      </div>
    </div>
  );
}
