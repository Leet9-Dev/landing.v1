"use client";

import { useState, useEffect } from "react";

const DISMISS_KEY = (userId) =>
  userId ? `l9_nps_dismissed_v1_${userId}_${yearMonth()}` : null;

function yearMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}`;
}

function scoreLabel(score) {
  if (score === null) return "";
  if (score <= 6) return "Needs improvement";
  if (score <= 8) return "Pretty good";
  return "Love it!";
}

export function NpsModal({ userId }) {
  const [open, setOpen] = useState(false);
  const [score, setScore] = useState(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    // Check if dismissed this month already (localStorage guard).
    const dismissKey = DISMISS_KEY(userId);
    try {
      if (dismissKey && localStorage.getItem(dismissKey) === "1") return;
    } catch {}

    // Check URL for ?nps=1 (email campaign deep-link — bypass session count).
    const forceOpen = typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("nps") === "1";

    if (forceOpen) {
      setOpen(true);
      return;
    }

    // Otherwise check eligibility from API.
    fetch("/api/me/nps")
      .then((r) => r.json())
      .then((json) => {
        if (json?.data?.eligible) setOpen(true);
      })
      .catch(() => {});
  }, [userId]);

  function dismiss() {
    const dismissKey = DISMISS_KEY(userId);
    try {
      if (dismissKey) localStorage.setItem(dismissKey, "1");
    } catch {}
    setOpen(false);
  }

  async function handleSubmit() {
    if (score === null) return;
    setLoading(true);
    try {
      const res = await fetch("/api/me/nps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: comment.trim() || undefined }),
      });
      const json = await res.json();
      if (json?.data?.submitted) {
        setSubmitted(true);
        setTimeout(() => {
          dismiss();
        }, 2000);
      } else {
        // Already answered or other error — just close.
        dismiss();
      }
    } catch {
      dismiss();
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      padding: "0 0 24px",
      pointerEvents: "none",
    }}>
      <div style={{
        background: "#0D0F1A",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "28px 28px 24px",
        width: "100%",
        maxWidth: 440,
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
        pointerEvents: "auto",
        position: "relative",
      }}>
        {/* Close */}
        <button
          onClick={dismiss}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            background: "transparent",
            border: "none",
            color: "rgba(241,243,249,0.35)",
            fontSize: 18,
            cursor: "pointer",
            lineHeight: 1,
            padding: 4,
          }}
          aria-label="Dismiss"
        >
          ×
        </button>

        {submitted ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🎮</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#C8FF00", margin: 0 }}>
              Thanks for the feedback!
            </p>
            <p style={{ fontSize: 13, color: "rgba(241,243,249,0.5)", margin: "8px 0 0" }}>
              It helps us build a better platform.
            </p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#C8FF00", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px" }}>
              Quick question
            </p>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: "#F1F3F9", margin: "0 0 4px", lineHeight: 1.3 }}>
              How likely are you to recommend Leet9?
            </h2>
            <p style={{ fontSize: 12, color: "rgba(241,243,249,0.4)", margin: "0 0 20px" }}>
              0 = not at all, 10 = absolutely
            </p>

            {/* Score buttons */}
            <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setScore(n)}
                  style={{
                    flex: 1,
                    aspectRatio: "1",
                    borderRadius: 8,
                    border: score === n
                      ? "1.5px solid #C8FF00"
                      : "1.5px solid rgba(255,255,255,0.1)",
                    background: score === n ? "rgba(200,255,0,0.12)" : "rgba(255,255,255,0.04)",
                    color: score === n ? "#C8FF00" : "rgba(241,243,249,0.6)",
                    fontSize: 12,
                    fontWeight: score === n ? 800 : 500,
                    cursor: "pointer",
                    transition: "all 0.12s",
                    padding: 0,
                  }}
                >
                  {n}
                </button>
              ))}
            </div>

            {/* Score label */}
            <div style={{
              height: 18,
              fontSize: 11,
              color: "#C8FF00",
              fontWeight: 600,
              marginBottom: 16,
              transition: "opacity 0.15s",
              opacity: score !== null ? 1 : 0,
            }}>
              {scoreLabel(score)}
            </div>

            {/* Optional comment */}
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What could we do better? (optional)"
              maxLength={2000}
              rows={2}
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1.5px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#F1F3F9",
                fontSize: 13,
                padding: "10px 12px",
                resize: "none",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={dismiss}
                style={{
                  background: "transparent",
                  border: "1.5px solid rgba(255,255,255,0.1)",
                  borderRadius: 10,
                  color: "rgba(241,243,249,0.5)",
                  fontSize: 13,
                  fontWeight: 600,
                  padding: "9px 18px",
                  cursor: "pointer",
                }}
              >
                Not now
              </button>
              <button
                onClick={handleSubmit}
                disabled={score === null || loading}
                style={{
                  background: score !== null ? "#C8FF00" : "rgba(200,255,0,0.3)",
                  border: "none",
                  borderRadius: 10,
                  color: "#07080F",
                  fontSize: 13,
                  fontWeight: 800,
                  padding: "9px 22px",
                  cursor: score !== null ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
              >
                {loading ? "Sending…" : "Submit"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
