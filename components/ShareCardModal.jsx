"use client";
import { useState } from "react";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://leet9.com";

/**
 * Share Card modal — shows a rank-up share card with a dominant Share button
 * and a secondary Download button.
 *
 * Props:
 *   type       "rank-up" | "badge" | "challenge"
 *   cardParams object with query params for the OG image route
 *   username   current user's display name or handle
 *   onClose    called when the modal is dismissed
 */
export function ShareCardModal({ type = "rank-up", cardParams = {}, username, onClose }) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const ogRoute = type === "rank-up" ? "/api/og/rank-up" : "/api/og/rank-up";
  const qs = new URLSearchParams({ username, ...cardParams }).toString();
  const imageUrl = `${BASE_URL}${ogRoute}?${qs}`;
  const shareUrl = `${BASE_URL}/app/profile?utm_source=sharecard&utm_medium=social`;

  const shareTitle =
    type === "rank-up"
      ? `I just hit #${cardParams.rank} globally on Leet9!`
      : "Check my Leet9 stats!";
  const shareText =
    type === "rank-up"
      ? `I just climbed to #${cardParams.rank} globally on Leet9${cardParams.delta ? `, up ${cardParams.delta} places` : ""}. Come compete. 🎮`
      : "Track your gaming stats on Leet9.";

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
      } catch {
        // User cancelled — no-op
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `leet9-${type}-card.png`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      // Fallback: open image in new tab
      window.open(imageUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(7,8,15,0.88)",
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Outfit', sans-serif",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          background: "#0D0F1A",
          borderRadius: 20,
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span style={{ color: "#F1F3F9", fontSize: 15, fontWeight: 700 }}>Your card</span>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "rgba(241,243,249,0.4)",
              fontSize: 20,
              cursor: "pointer",
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Card image */}
        <div style={{ padding: "20px 20px 0" }}>
          <img
            src={imageUrl}
            alt="Share card"
            style={{
              width: "100%",
              borderRadius: 12,
              display: "block",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ padding: "16px 20px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
          {/* Primary: Share */}
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              padding: "15px 24px",
              background: "#C8FF00",
              color: "#07080F",
              border: "none",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 800,
              cursor: "pointer",
              fontFamily: "'Outfit', sans-serif",
              letterSpacing: "-0.01em",
            }}
          >
            {copied ? "Copied to clipboard ✓" : "Share your rank →"}
          </button>

          {/* Secondary: Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            style={{
              width: "100%",
              padding: "12px 24px",
              background: "rgba(255,255,255,0.04)",
              color: "rgba(241,243,249,0.6)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              fontSize: 14,
              fontWeight: 700,
              cursor: downloading ? "wait" : "pointer",
              fontFamily: "'Outfit', sans-serif",
            }}
          >
            {downloading ? "Saving…" : "Save image"}
          </button>
        </div>
      </div>
    </div>
  );
}
