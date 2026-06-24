"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";

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

const PROVIDERS = [
  {
    id: "google",
    label: "Continue with Google",
    bg: "#18191F",
    border: "rgba(255,255,255,0.13)",
    hoverBorder: "rgba(255,255,255,0.28)",
    icon: (
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
    ),
  },
  {
    id: "steam",
    label: "Continue with Steam",
    bg: "#1B2838",
    border: "rgba(102,192,244,0.25)",
    hoverBorder: "rgba(102,192,244,0.6)",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
        <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.188.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.605 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.497 1.009 2.453-.397.957-1.494 1.41-2.455 1.014zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
      </svg>
    ),
  },
  {
    id: "psn",
    label: "PlayStation Network",
    bg: "#0a0a1a",
    border: "rgba(255,255,255,0.06)",
    hoverBorder: "rgba(255,255,255,0.1)",
    disabled: true,
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="rgba(255,255,255,0.3)">
        <path d="M8.985 2.596v17.548l3.915 1.261V6.688c0-.69.304-1.151.794-.991.636.18.76.814.76 1.501v5.39c2.319 1.057 4.065-.12 4.065-3.113 0-3.07-1.056-4.485-4.108-5.485C12.36 3.394 10.472 2.94 8.985 2.596zm7.641 16.025c-1.748.49-3.576.24-5.072-.6v2.452c1.716.885 3.913 1.097 5.929.42 2.387-.82 3.964-2.96 3.964-5.431 0-2.468-1.4-4.022-4.292-5.035v2.417c1.648.612 2.43 1.502 2.43 2.698.001 1.208-.739 2.56-2.959 3.079zM3 20.165l4.305 1.164v-2.48L3 17.69v2.475z"/>
      </svg>
    ),
  },
];

export default function LoginModal({ onClose }) {
  const [hoveredId, setHoveredId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const handleLogin = async (provider) => {
    if (provider.disabled) return;
    setLoadingId(provider.id);
    await signIn(provider.id, { callbackUrl: "/dashboard" });
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 360, background: T.card,
          border: `1px solid ${T.borderHi}`,
          borderRadius: 20, padding: "32px 28px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
          animation: "fadeUp 0.25s ease both",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 10, background: T.green,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 17, fontWeight: 900, color: "#000",
            fontFamily: "'Rajdhani',sans-serif",
            boxShadow: `0 0 24px ${T.green}55`, marginBottom: 14,
          }}>L9</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.text, fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.04em" }}>
            Join Leet9
          </div>
          <div style={{ fontSize: 13, color: T.textSec, marginTop: 5, fontFamily: "'Inter',sans-serif" }}>
            Build your gaming identity
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onMouseEnter={() => setHoveredId(p.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => handleLogin(p)}
              disabled={!!loadingId || p.disabled}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                width: "100%", padding: "13px 16px", borderRadius: 11,
                cursor: p.disabled ? "not-allowed" : loadingId ? "wait" : "pointer",
                background: p.disabled ? p.bg : hoveredId === p.id ? `${p.bg}ee` : p.bg,
                border: `1px solid ${hoveredId === p.id && !p.disabled ? p.hoverBorder : p.border}`,
                color: p.disabled ? "rgba(255,255,255,0.25)" : "#fff",
                fontSize: 14, fontWeight: 600,
                fontFamily: "'Inter',sans-serif",
                transform: hoveredId === p.id && !p.disabled ? "scale(1.015)" : "scale(1)",
                transition: "all 0.15s ease",
                opacity: loadingId && loadingId !== p.id ? 0.4 : 1,
                position: "relative",
              }}
            >
              <span style={{ flexShrink: 0, display: "flex", alignItems: "center" }}>
                {loadingId === p.id
                  ? <span style={{ width: 20, height: 20, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
                  : p.icon}
              </span>
              <span style={{ flex: 1, textAlign: "left" }}>{p.label}</span>
              {p.disabled && (
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)", fontFamily: "'JetBrains Mono',monospace" }}>
                  soon
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{
          marginTop: 20, paddingTop: 16,
          borderTop: `1px solid ${T.border}`,
          fontSize: 11, color: T.textMut, textAlign: "center",
          fontFamily: "'Inter',sans-serif", lineHeight: 1.6,
        }}>
          By continuing you agree to our Terms of Service<br />and Privacy Policy.
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
