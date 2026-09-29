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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const ogRoute =
    type === "badge"
      ? "/api/og/badge"
      : type === "challenge"
      ? "/api/og/challenge"
      : "/api/og/rank-up";
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries({ username, ...cardParams }).filter(([, v]) => v !== undefined && v !== null))
  ).toString();
  const imageUrl = `${ogRoute}?${qs}`;
  const shareUrl = `${BASE_URL}/app/profile?utm_source=sharecard&utm_medium=social`;

  const shareTitle =
    type === "badge"
      ? `I just unlocked the ${cardParams.badgeName} badge on Leet9!`
      : type === "challenge"
      ? `I beat ${cardParams.opponentName} on Leet9!`
      : `I just hit #${cardParams.rank} globally on Leet9!`;
  const shareText =
    type === "badge"
      ? `I just unlocked the ${cardParams.badgeName} ${cardParams.tier} badge${cardParams.game ? ` in ${cardParams.game}` : ""} on Leet9. Join and challenge me. 🎮`
      : type === "challenge"
      ? `I beat ${cardParams.opponentName} ${cardParams.userScore}–${cardParams.opponentScore}${cardParams.game ? ` in ${cardParams.game}` : ""} on Leet9. Join and challenge me. 🎮`
      : `I just climbed to #${cardParams.rank} globally on Leet9${cardParams.delta ? `, up ${cardParams.delta} places` : ""}. Join and challenge me. 🎮`;

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
          <span style={{ color: "#F1F3F9", fontSize: 15, fontWeight: 700 }}>
            {type === "badge" ? "Badge unlocked" : type === "challenge" ? "You won!" : "Your rank card"}
          </span>
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
        <div style={{ padding: "20px 20px 0", position: "relative" }}>
          {!imgLoaded && !imgError && (
            <div style={{
              width: "100%",
              aspectRatio: "800 / 418",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "rgba(241,243,249,0.25)",
              animation: "pulse 1.4s ease infinite",
            }}>
              <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.4;}}`}</style>
              Generating card…
            </div>
          )}
          {imgError && (
            <div style={{
              width: "100%",
              aspectRatio: "800 / 418",
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 12,
              color: "rgba(241,243,249,0.25)",
            }}>
              Could not load card preview
            </div>
          )}
          <img
            src={imageUrl}
            alt=""
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
            style={{
              width: "100%",
              borderRadius: 12,
              display: imgLoaded ? "block" : "none",
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
            {copied
              ? "Copied to clipboard ✓"
              : type === "badge"
              ? "Share your badge →"
              : type === "challenge"
              ? "Share your win →"
              : "Share your rank →"}
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
