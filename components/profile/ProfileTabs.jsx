"use client";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "games", label: "Games" },
  { id: "stats", label: "Stats" },
  { id: "tribe", label: "Tribe" },
];

export function ProfileTabs({ active, onChange }) {
  return (
    <div style={{
      display: "flex",
      gap: 6,
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      marginBottom: 28,
    }}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={{
              padding: "12px 18px",
              border: "none",
              borderBottom: `2px solid ${isActive ? "#C8FF00" : "transparent"}`,
              background: "transparent",
              color: isActive ? "#C8FF00" : "rgba(241,243,249,0.45)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              fontWeight: isActive ? 700 : 600,
              letterSpacing: "-0.01em",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
