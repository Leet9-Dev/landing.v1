"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/LoginModal";

const T = {
  bg:      "#06070A",
  card:    "#12151F",
  border:  "rgba(255,255,255,0.08)",
  borderHi:"rgba(255,255,255,0.14)",
  green:   "#C8FF00",
  text:    "#F0F2F8",
  textSec: "#7A8299",
  textMut: "#3A3F52",
};

const FEATURES = [
  {
    icon: "◈",
    title: "L9 Points",
    desc: "Every game you play earns points. Build your score across all platforms.",
  },
  {
    icon: "⊞",
    title: "Universal Profile",
    desc: "One identity across Steam, PlayStation, and more. Your real gaming history, unified.",
  },
  {
    icon: "⋈",
    title: "Compare & Compete",
    desc: "See how you stack up against friends. Real stats, no padding.",
  },
];

export default function Landing() {
  const [showModal, setShowModal] = useState(false);
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green, animation: "pulse 1s ease infinite" }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.3;}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, color: T.text, minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse  { 0%,100% { opacity: 1; }   50% { opacity: 0.3; } }
        @keyframes glow   { 0%,100% { box-shadow: 0 0 24px #C8FF0044; } 50% { box-shadow: 0 0 48px #C8FF0099; } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .cta-btn:hover { filter: brightness(1.1); transform: scale(1.02); }
        .cta-btn { transition: all 0.15s ease; }
        .feature-card:hover { border-color: rgba(200,255,0,0.18) !important; background: #161924 !important; }
        .feature-card { transition: all 0.2s ease; }
      `}</style>

      {/* Nav */}
      <nav style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 40px", borderBottom: `1px solid ${T.border}`,
        position: "sticky", top: 0, background: "rgba(6,7,10,0.88)",
        backdropFilter: "blur(12px)", zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8, background: T.green,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 900, color: "#000",
            fontFamily: "'Rajdhani', sans-serif", animation: "glow 3s ease infinite",
          }}>L9</div>
          <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.05em" }}>
            Leet9
          </span>
        </div>
        <button
          className="cta-btn"
          onClick={() => setShowModal(true)}
          style={{
            padding: "9px 22px", borderRadius: 9, background: T.green,
            color: "#000", fontSize: 13, fontWeight: 700,
            border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          Sign in
        </button>
      </nav>

      {/* Hero */}
      <div style={{
        maxWidth: 720, margin: "0 auto", padding: "100px 40px 80px",
        textAlign: "center", animation: "fadeUp 0.5s ease both",
      }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "5px 14px", borderRadius: 99,
          border: "1px solid rgba(200,255,0,0.25)",
          background: "rgba(200,255,0,0.05)", marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: T.green, display: "inline-block", animation: "pulse 2s ease infinite" }} />
          <span style={{ fontSize: 12, color: T.green, fontWeight: 600, letterSpacing: "0.08em" }}>NOW IN EARLY ACCESS</span>
        </div>

        <h1 style={{
          fontSize: "clamp(40px, 7vw, 70px)", fontWeight: 800,
          fontFamily: "'Rajdhani', sans-serif", letterSpacing: "-0.01em",
          lineHeight: 1.05, marginBottom: 20,
        }}>
          Your gaming identity,<br />
          <span style={{ color: T.green }}>finally visible.</span>
        </h1>

        <p style={{
          fontSize: 18, color: T.textSec, lineHeight: 1.65,
          marginBottom: 40, maxWidth: 500, margin: "0 auto 40px",
        }}>
          Discover games, earn L9 Points, compare with friends, and build the profile that proves how you play.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="cta-btn"
            onClick={() => setShowModal(true)}
            style={{
              padding: "14px 32px", borderRadius: 11, background: T.green,
              color: "#000", fontSize: 15, fontWeight: 700,
              border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
            }}
          >
            Get started — it&apos;s free
          </button>
          <button
            style={{
              padding: "14px 32px", borderRadius: 11, background: "transparent",
              color: T.textSec, fontSize: 15, fontWeight: 600,
              border: `1px solid ${T.border}`, cursor: "not-allowed",
              fontFamily: "'Inter', sans-serif", opacity: 0.5,
            }}
            disabled
          >
            Watch demo — soon
          </button>
        </div>
      </div>

      {/* Stats strip */}
      <div style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "center" }}>
        {[
          { value: "∞",  label: "Games tracked" },
          { value: "2",  label: "Platforms connected" },
          { value: "$0", label: "Cost to join" },
        ].map((s, i) => (
          <div key={i} style={{
            padding: "28px 56px", textAlign: "center",
            borderRight: i < 2 ? `1px solid ${T.border}` : "none",
          }}>
            <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", color: T.green }}>{s.value}</div>
            <div style={{ fontSize: 12, color: T.textSec, marginTop: 5, letterSpacing: "0.06em" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{
        maxWidth: 900, margin: "80px auto 0", padding: "0 40px",
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16,
      }}>
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="feature-card"
            style={{
              background: T.card, border: `1px solid ${T.border}`,
              borderRadius: 16, padding: "28px 24px",
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 14, color: T.green }}>{f.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif", letterSpacing: "0.03em", marginBottom: 8 }}>{f.title}</div>
            <div style={{ fontSize: 14, color: T.textSec, lineHeight: 1.65 }}>{f.desc}</div>
          </div>
        ))}
      </div>

      {/* Footer CTA */}
      <div style={{ textAlign: "center", padding: "80px 40px", marginTop: 80, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'Rajdhani', sans-serif", marginBottom: 10 }}>
          Ready to prove how you play?
        </div>
        <div style={{ fontSize: 14, color: T.textSec, marginBottom: 28 }}>
          Join with your Google or Steam account. Free, always.
        </div>
        <button
          className="cta-btn"
          onClick={() => setShowModal(true)}
          style={{
            padding: "14px 36px", borderRadius: 11, background: T.green,
            color: "#000", fontSize: 15, fontWeight: 700,
            border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif",
          }}
        >
          Create your profile
        </button>
      </div>

      {/* Footer */}
      <div style={{
        padding: "24px 40px", borderTop: `1px solid ${T.border}`,
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ fontSize: 13, color: T.textMut, fontFamily: "'JetBrains Mono', monospace" }}>© 2026 Leet9</div>
        <div style={{ fontSize: 12, color: T.textMut }}>All rights reserved</div>
      </div>

      {showModal && <LoginModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
