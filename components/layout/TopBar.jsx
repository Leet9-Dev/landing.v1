"use client";
import { signOut } from "next-auth/react";
import { NAV_ITEMS } from "@/lib/navigation";

export function TopBar({ active, user }) {
  const section = NAV_ITEMS.find(n => n.id === active);

  return (
    <header style={{
      height: 56,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0 28px",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
      background: "rgba(7,8,15,0.85)",
      backdropFilter: "blur(12px)",
      flexShrink: 0,
    }}>
      {/* Section title */}
      <div style={{
        fontFamily: "'Outfit', sans-serif",
        fontSize: 15,
        fontWeight: 700,
        color: "#F1F3F9",
        letterSpacing: "-0.01em",
      }}>
        {section?.label || ""}
      </div>

      {/* Right: points + avatar + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          padding: "4px 12px",
          borderRadius: 99,
          background: "rgba(200,255,0,0.07)",
          border: "1px solid rgba(200,255,0,0.15)",
          fontFamily: "'Outfit', sans-serif",
          fontSize: 12,
          fontWeight: 700,
          color: "#C8FF00",
          letterSpacing: 0.3,
        }}>
          0 L9
        </div>

        {user?.image
          ? <img
              src={user.image}
              alt={user.name || ""}
              style={{ width: 30, height: 30, borderRadius: "50%", border: "1.5px solid rgba(200,255,0,0.3)" }}
            />
          : <div style={{
              width: 30, height: 30, borderRadius: "50%",
              background: "linear-gradient(135deg,#C8FF00,#7C3AED)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 800, color: "#000",
              fontFamily: "'Outfit', sans-serif", flexShrink: 0,
            }}>
              {user?.name?.[0]?.toUpperCase() || "?"}
            </div>
        }

        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 13,
          fontWeight: 600,
          color: "rgba(241,243,249,0.6)",
        }}>
          {user?.name || "Gamer"}
        </span>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          style={{
            padding: "5px 12px",
            borderRadius: 7,
            border: "1px solid rgba(255,255,255,0.09)",
            background: "transparent",
            color: "rgba(241,243,249,0.35)",
            fontFamily: "'Outfit', sans-serif",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)";
            e.currentTarget.style.color = "rgba(241,243,249,0.75)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
            e.currentTarget.style.color = "rgba(241,243,249,0.35)";
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
