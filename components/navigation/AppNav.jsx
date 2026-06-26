"use client";
import { NAV_ITEMS } from "@/lib/navigation";

export function AppNav({ active, onSelect }) {
  return (
    <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 14px",
              borderRadius: 9,
              border: "none",
              borderLeft: `2px solid ${isActive ? "#C8FF00" : "transparent"}`,
              background: isActive ? "rgba(200,255,0,0.07)" : "transparent",
              color: isActive ? "#C8FF00" : "rgba(241,243,249,0.4)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: 14,
              fontWeight: isActive ? 700 : 500,
              cursor: "pointer",
              textAlign: "left",
              letterSpacing: 0.1,
              transition: "all 0.15s",
              width: "100%",
            }}
            onMouseEnter={e => {
              if (!isActive) {
                e.currentTarget.style.color = "rgba(241,243,249,0.75)";
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }
            }}
            onMouseLeave={e => {
              if (!isActive) {
                e.currentTarget.style.color = "rgba(241,243,249,0.4)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span style={{ fontSize: 15, width: 20, textAlign: "center", flexShrink: 0, opacity: isActive ? 1 : 0.6 }}>
              {item.icon}
            </span>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
