"use client";
import { Sidebar, SIDEBAR_W } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export function AppShell({ user, children }) {
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

      <Sidebar />

      <div style={{
        marginLeft: SIDEBAR_W,
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}>
        <TopBar user={user} />

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
