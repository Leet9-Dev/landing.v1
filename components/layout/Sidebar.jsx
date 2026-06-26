"use client";
import { AppNav } from "@/components/navigation/AppNav";

export const SIDEBAR_W = 220;

export function Sidebar({ active, onSelect }) {
  return (
    <aside style={{
      width: SIDEBAR_W,
      minWidth: SIDEBAR_W,
      height: "100vh",
      position: "fixed",
      top: 0,
      left: 0,
      background: "#0A0C14",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      display: "flex",
      flexDirection: "column",
      zIndex: 30,
    }}>
      {/* Logo */}
      <div style={{
        padding: "18px 18px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <img
          src="/logo-icon.png"
          alt="L9"
          style={{
            width: 28,
            height: 28,
            objectFit: "contain",
            filter: "invert(1) hue-rotate(180deg)",
            mixBlendMode: "screen",
          }}
        />
        <span style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 16,
          fontWeight: 800,
          color: "#F1F3F9",
          letterSpacing: "-0.02em",
        }}>Leet9</span>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, padding: "16px 8px", overflowY: "auto" }}>
        <div style={{
          fontSize: 9,
          fontWeight: 700,
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          padding: "0 14px",
          marginBottom: 8,
          fontFamily: "'Outfit', sans-serif",
        }}>
          Menu
        </div>
        <AppNav active={active} onSelect={onSelect} />
      </div>

      {/* Footer */}
      <div style={{
        padding: "12px 18px",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        fontSize: 10,
        color: "rgba(255,255,255,0.15)",
        fontFamily: "'Outfit', sans-serif",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}>
        Leet9 · Beta
      </div>
    </aside>
  );
}
