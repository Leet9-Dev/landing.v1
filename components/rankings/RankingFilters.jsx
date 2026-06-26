"use client";

// Generic chip filter row. `groups` is an array of:
//   { value, onChange, options: [{ id, label }] }
// Groups are separated by a subtle divider.
export function RankingFilters({ groups }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap", alignItems: "center" }}>
      {groups.map((group, gi) => (
        <FilterGroup key={gi} group={group} showDivider={gi < groups.length - 1} />
      ))}
    </div>
  );
}

function FilterGroup({ group, showDivider }) {
  return (
    <>
      {group.options.map((opt) => (
        <FilterChip
          key={opt.id}
          active={group.value === opt.id}
          onClick={() => group.onChange(opt.id)}
        >
          {opt.label}
        </FilterChip>
      ))}
      {showDivider && (
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.08)" }} />
      )}
    </>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 99,
        border: `1px solid ${active ? "rgba(200,255,0,0.4)" : "rgba(255,255,255,0.09)"}`,
        background: active ? "rgba(200,255,0,0.08)" : "transparent",
        color: active ? "#C8FF00" : "rgba(241,243,249,0.45)",
        fontFamily: "'Outfit', sans-serif",
        fontSize: 12,
        fontWeight: active ? 700 : 500,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}
