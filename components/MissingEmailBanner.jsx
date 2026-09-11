"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

export function MissingEmailBanner() {
  const { data: session, update } = useSession();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  // Only show if the signed-in user has no email
  if (!session?.user || session.user.email || done) return null;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/me/set-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (json.ok) {
        await update({ email });
        setDone(true);
        setOpen(false);
      } else {
        setError(json.error?.message || "Could not save email. Try again.");
      }
    } catch {
      setError("Network error. Try again.");
    }
    setBusy(false);
  }

  return (
    <>
      <div style={{
        background: "rgba(251,191,36,0.08)",
        border: "1px solid rgba(251,191,36,0.25)",
        borderRadius: 10,
        padding: "10px 16px",
        margin: "12px 20px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}>
        <div style={{ fontSize: 12, color: "#fbbf24", lineHeight: 1.5 }}>
          <strong>Add your email</strong> to receive challenge notifications and important updates.
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => setOpen(true)}
            style={{
              fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 7,
              border: "1px solid rgba(251,191,36,0.4)", background: "rgba(251,191,36,0.12)",
              color: "#fbbf24", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            }}
          >
            Add Email
          </button>
          <button
            onClick={() => setDone(true)}
            style={{
              fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 7,
              border: "none", background: "transparent",
              color: "rgba(251,191,36,0.45)", cursor: "pointer", fontFamily: "'Outfit', sans-serif",
            }}
          >
            Dismiss
          </button>
        </div>
      </div>

      {open && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 340, background: "#12151F",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 18, padding: "28px 24px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.9)",
            }}
          >
            <div style={{ fontSize: 16, fontWeight: 700, color: "#F0F2F8", marginBottom: 6 }}>
              Add your email
            </div>
            <div style={{ fontSize: 12, color: "rgba(241,243,249,0.45)", marginBottom: 20, lineHeight: 1.6 }}>
              Used only for challenge notifications and important account alerts. Never shared.
            </div>

            <form onSubmit={submit}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 12px", borderRadius: 8, marginBottom: 10,
                  border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.3)",
                  color: "#F1F3F9", fontSize: 13, fontFamily: "'Outfit', sans-serif", outline: "none",
                }}
              />
              {error && (
                <div style={{ fontSize: 11, color: "#f87171", marginBottom: 10 }}>{error}</div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="submit"
                  disabled={busy}
                  style={{
                    flex: 1, fontSize: 13, fontWeight: 700, padding: "9px 0", borderRadius: 8,
                    border: "none", background: busy ? "rgba(200,255,0,0.5)" : "#C8FF00",
                    color: "#07080F", cursor: busy ? "wait" : "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  {busy ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={{
                    fontSize: 13, fontWeight: 600, padding: "9px 16px", borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)", background: "transparent",
                    color: "rgba(241,243,249,0.5)", cursor: "pointer",
                    fontFamily: "'Outfit', sans-serif",
                  }}
                >
                  Skip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
