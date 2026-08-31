"use client";
import { useState, useEffect } from "react";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem("cookie_consent")) setVisible(true);
    } catch {}
  }, []);

  function accept() {
    try { localStorage.setItem("cookie_consent", "accepted"); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 9999,
      background: "#0D0F1A",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      padding: "16px 24px",
      display: "flex",
      alignItems: "center",
      gap: 16,
      flexWrap: "wrap",
      fontFamily: "'Outfit', sans-serif",
    }}>
      <div style={{ flex: 1, minWidth: 240, fontSize: 13, color: "rgba(241,243,249,0.55)", lineHeight: 1.5 }}>
        We use essential cookies to keep you signed in, and privacy-friendly analytics that do not track individuals.{" "}
        <a href="/privacy" style={{ color: "rgba(200,255,0,0.7)", textDecoration: "none" }}>Privacy Policy</a>
      </div>
      <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
        <button
          onClick={accept}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: "#C8FF00",
            color: "#0A0C14",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Got it
        </button>
        <button
          onClick={accept}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "transparent",
            color: "rgba(241,243,249,0.5)",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "'Outfit', sans-serif",
          }}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
