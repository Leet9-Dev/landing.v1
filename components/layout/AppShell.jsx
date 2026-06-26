"use client";
import { useState } from "react";
import { Sidebar, SIDEBAR_W } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { NAV_ITEMS } from "@/lib/navigation";

export function AppShell({ user }) {
  const [active, setActive] = useState("discovery");
  const section = NAV_ITEMS.find(n => n.id === active);

  return (
    <div style={{
      background: "#07080F",
      minHeight: "100vh",
      color: "#F1F3F9",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
      `}</style>

      <Sidebar active={active} onSelect={setActive} />

      <div style={{
        marginLeft: SIDEBAR_W,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        <TopBar active={active} user={user} />

        <main style={{ flex: 1, padding: "36px 32px" }}>
          <PlaceholderPanel section={section} />
        </main>
      </div>
    </div>
  );
}

function PlaceholderPanel({ section }) {
  if (!section) return null;

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
    }}>
      <div style={{ fontSize: 36, opacity: 0.2 }}>
        {section.icon}
      </div>
      <div style={{
        fontSize: 18,
        fontWeight: 700,
        color: "rgba(241,243,249,0.55)",
        letterSpacing: "-0.01em",
        fontFamily: "'Outfit', sans-serif",
      }}>
        {section.label}
      </div>
      <div style={{
        fontSize: 14,
        color: "rgba(241,243,249,0.28)",
        maxWidth: 380,
        lineHeight: 1.65,
        fontFamily: "'Outfit', sans-serif",
      }}>
        {section.placeholder}
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
        fontFamily: "'Outfit', sans-serif",
      }}>
        Coming soon
      </div>
    </div>
  );
}
